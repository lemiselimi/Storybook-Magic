import { kv } from "@/lib/kv";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(request) {
  let payload;
  try { payload = await request.json(); }
  catch { return new Response("ok"); }

  const jobId = payload.request_id;
  if (!jobId) return new Response("ok");

  // Look up which order/slot this job belongs to
  const jobInfo = await kv.get(`job:${jobId}`);
  if (!jobInfo) {
    console.warn("fal-webhook: unknown job", jobId);
    return new Response("ok");
  }

  const { ref, slot } = jobInfo;
  const imageUrl = payload.payload?.images?.[0]?.url ?? null;

  if (payload.status !== "OK" || !imageUrl) {
    console.error(`fal-webhook: job ${jobId} failed (ref=${ref} slot=${slot})`);
    return new Response("ok");
  }

  // Read current result, update image slot
  const result = await kv.get(`result:${ref}`);
  if (!result || result.status === "ready" || result.status === "pdf_generating") {
    return new Response("ok"); // already processed
  }

  const updatedImages = { ...result.images, [slot]: imageUrl };
  const completedCount = Object.values(updatedImages).filter(Boolean).length;
  const allDone = completedCount >= result.totalJobs;

  await kv.set(`result:${ref}`, {
    ...result,
    images:  updatedImages,
    status:  allDone ? "pdf_generating" : "generating",
  }, { ex: 2_592_000 });

  console.log(`fal-webhook: ref=${ref} slot=${slot} (${completedCount}/${result.totalJobs})`);

  if (!allDone) return new Response("ok");

  // All images ready — generate PDFs, email customer, submit print if needed
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mytinytales.studio";

  try {
    const pageUrls = [0, 1, 2, 3, 4, 5].map(i => updatedImages[i] ?? null);

    // Generate print-ready PDFs
    const pdfRes = await fetch(`${siteUrl}/api/generate-book-pdf`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        coverFalUrl:  updatedImages["cover"],
        pageFalUrls:  pageUrls,
        story:        result.story,
        childName:    result.childName,
      }),
    });

    if (!pdfRes.ok) {
      const err = await pdfRes.json().catch(() => ({}));
      throw new Error(`PDF generation failed: ${err.error || pdfRes.status}`);
    }

    const { coverPdfUrl, interiorPdfUrl, interiorPageCount } = await pdfRes.json();

    // Mark book as ready. Print orders are held for customer approval on
    // /book/[ref]; a daily cron auto-submits anything unapproved after 3 days.
    const isPrint = result.plan === "print" && result.sessionId;
    await kv.set(`result:${ref}`, {
      ...result,
      images:         updatedImages,
      status:         "ready",
      coverPdfUrl,
      interiorPdfUrl,
      interiorPageCount,
      completedAt:    new Date().toISOString(),
      ...(isPrint ? { printApproval: "pending", printReadyAt: new Date().toISOString() } : {}),
    }, { ex: 2_592_000 });

    console.log("fal-webhook: book ready for ref", ref);

    // Print orders wait for the customer to review the book and press
    // "Approve & Send to Print" on /book/[ref] (see /api/approve-print).
    if (isPrint) {
      await kv.sadd("pending-prints", ref).catch(() => {});
      console.log("fal-webhook: print order held for customer approval, ref", ref);
    }

  } catch (err) {
    console.error("fal-webhook: post-completion error:", err.message);
    await kv.set(`result:${ref}`, {
      ...result,
      images:  updatedImages,
      status:  "failed",
      error:   err.message,
    }, { ex: 2_592_000 }).catch(() => {});

    if (process.env.RESEND_API_KEY) {
      const retryLink = result.plan === "print" && process.env.ADMIN_RETRY_KEY
        ? `<p><a href="${siteUrl}/api/retry-print?ref=${ref}&key=${process.env.ADMIN_RETRY_KEY}">Click here to retry the print order</a></p>`
        : "";
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from:    "My Tiny Tales <hello@mytinytales.studio>",
          to:      ["hello@mytinytales.studio"],
          subject: `⚠️ Book completion failed — ref: ${ref}`,
          html:    `<p><strong>Error:</strong> ${err.message}</p><p><strong>Ref:</strong> ${ref}</p>${retryLink}`,
        }),
      }).catch(() => {});
    }
  }

  return new Response("ok");
}
