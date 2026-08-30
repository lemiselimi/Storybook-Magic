import { kv } from "@/lib/kv";
import { submitPrintFromKV } from "@/lib/print";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

// Pre-flight print check. Rebuilds the interior/cover PDFs from the already-
// generated images (free — no new AI cost) so they pick up the current page-
// count logic and the declared pageCount matches the file, then validates the
// order against Gelato as a DRAFT — no charge, no real order, nothing printed.
//
// Gated by the book ref, which is the same capability already required to view
// and approve the book (see approve-print). It never places a real order, so it
// is strictly weaker than approve-print. Returns Gelato's exact response so a
// book can be confirmed to pass prepress before a real order is placed.
export async function POST(request) {
  let body;
  try { body = await request.json(); }
  catch { return Response.json({ error: "Invalid request body" }, { status: 400 }); }

  const ref = body?.ref;
  if (!ref) return Response.json({ error: "ref required" }, { status: 400 });

  try {
    const result = await kv.get(`result:${ref}`);
    if (!result) return Response.json({ error: "Book not found" }, { status: 404 });

    const images = result.images || {};
    if (!images["cover"]) return Response.json({ error: "No images stored — cannot rebuild" }, { status: 400 });

    // Scene slots are 0..(totalJobs-2); fall back to counting numeric image keys.
    const sceneCount = result.totalJobs
      ? Math.max(result.totalJobs - 1, 0)
      : Object.keys(images).filter(k => /^\d+$/.test(k)).length;
    const pageFalUrls = Array.from({ length: sceneCount }, (_, i) => images[i] ?? null);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mytinytales.studio";
    const pdfRes = await fetch(`${siteUrl}/api/generate-book-pdf`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ coverFalUrl: images["cover"], pageFalUrls, story: result.story, childName: result.childName }),
    });
    if (!pdfRes.ok) {
      const err = await pdfRes.json().catch(() => ({}));
      return Response.json({ error: `PDF generation failed: ${err.error || pdfRes.status}` }, { status: 500 });
    }
    const { coverPdfUrl, interiorPdfUrl, interiorPageCount } = await pdfRes.json();

    // Persist the corrected PDFs + matching page count (fixes any stale desync).
    await kv.set(`result:${ref}`, {
      ...result, coverPdfUrl, interiorPdfUrl, interiorPageCount, status: "ready",
    }, { ex: 2_592_000 }).catch(() => {});

    // Ask Gelato to validate the full order as a draft — no charge, no printing.
    try {
      const gelato = await submitPrintFromKV(ref, { dryRun: true });
      return Response.json({ ok: true, validated: true, interiorPageCount, declaredPageCount: interiorPageCount, gelato });
    } catch (err) {
      return Response.json({ ok: false, validated: false, interiorPageCount, gelatoError: err.message }, { status: 200 });
    }
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
