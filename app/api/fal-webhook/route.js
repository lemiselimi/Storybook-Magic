import { kv } from "@/lib/kv";
import { internalAuthorization, isInternalWebhook } from "@/lib/security";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(request) {
  if (!isInternalWebhook(request)) return new Response("Unauthorized", { status: 401 });
  let payload;
  try { payload = await request.json(); }
  catch { return new Response("ok"); }

  const jobId = payload.request_id;
  if (!jobId) return new Response("ok");

  // Look up which order/slot this job belongs to
  const jobInfo = await kv.get(`job:${jobId}`);
  if (!jobInfo) {
    console.warn("fal-webhook: unknown job", jobId);
    return new Response("Job mapping not ready", { status: 503 });
  }

  const { ref, slot } = jobInfo;
  const imageUrl = payload.payload?.images?.[0]?.url ?? null;

  // Merge each callback atomically: simultaneous scenes must not overwrite one another.
  const succeeded = payload.status === "OK" && !!imageUrl;
  const outcome = await kv.eval(`
    local raw = redis.call('get', KEYS[1])
    if not raw then return '' end
    local result = cjson.decode(raw)
    if result.status == 'ready' or result.status == 'pdf_generating' then return '' end
    local slot = ARGV[1]
    result.images = result.images or {}
    local allDone = false
    if ARGV[2] == '' then
      if not result.images[slot] or result.images[slot] == cjson.null then
        result.status = 'failed'
        result.error = 'An illustration could not be completed. Your completed pages are saved.'
      end
    else
      result.images[slot] = ARGV[2]
      local count = 0
      for _, url in pairs(result.images) do
        if url ~= cjson.null and url ~= '' then count = count + 1 end
      end
      allDone = count >= result.totalJobs
      if allDone then result.status = 'pdf_generating' end
    end
    redis.call('set', KEYS[1], cjson.encode(result), 'EX', 2592000)
    return cjson.encode({result = result, allDone = allDone})
  `, [`result:${ref}`], [String(slot), succeeded ? imageUrl : ""]);
  if (!outcome) return new Response("ok");
  const { result, allDone } = typeof outcome === "string" ? JSON.parse(outcome) : outcome;
  if (!succeeded) {
    console.error(`fal-webhook: job ${jobId} failed (ref=${ref} slot=${slot})`);
    return new Response("ok");
  }
  const updatedImages = result.images;
  const completedCount = Object.values(updatedImages).filter(Boolean).length;
  console.log(`fal-webhook: ref=${ref} slot=${slot} (${completedCount}/${result.totalJobs})`);
  if (!allDone) return new Response("ok");

  // All images ready — generate PDFs, email customer, submit print if needed
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mytinytales.studio";

  try {
    // Scene slots are 0..(totalJobs-2) — every job except the "cover" slot.
    const sceneCount = Math.max((result.totalJobs || 1) - 1, 0);
    const pageUrls = Array.from({ length: sceneCount }, (_, i) => updatedImages[i] ?? null);

    // Generate print-ready PDFs
    const pdfRes = await fetch(`${siteUrl}/api/generate-book-pdf`, {
      method:  "POST",
      headers: { "Content-Type": "application/json", "Authorization": internalAuthorization() },
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

    const { coverPdfUrl, interiorPdfUrl, interiorPageCount, preflight } = await pdfRes.json();

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
      preflight,
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
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from:    "My Tiny Tales <hello@mytinytales.studio>",
          to:      ["hello@mytinytales.studio"],
          subject: `⚠️ Book completion failed — ref: ${ref}`,
          html:    `<p><strong>Error:</strong> ${err.message}</p><p><strong>Ref:</strong> ${ref}</p><p>Use the protected operations workflow to retry this order.</p>`,
        }),
      }).catch(() => {});
    }
  }

  return new Response("ok");
}
