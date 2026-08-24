import { kv } from "@/lib/kv";
import { submitPrintFromKV } from "@/lib/gelato";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

// Admin-only: re-submit a failed print order using data already stored in KV.
// Usage: GET /api/retry-print?ref=<bookRef>&key=<ADMIN_RETRY_KEY>[&rebuild=1][&dry=1][&force=1]
//   rebuild=1 — regenerate the interior/cover PDFs from the already-generated
//               images (free, no new AI cost) so they pick up the current
//               page-count settings before submitting. Use this after a
//               page-count fix so an existing book doesn't need regenerating.
//   dry=1     — validate the full order against Gelato as a draft (checks the
//               page count etc.) WITHOUT placing a real, billable order.
//   force=1   — resubmit even if an order was already marked fulfilled.
export async function GET(request) {
  const adminKey = process.env.ADMIN_RETRY_KEY;
  if (!adminKey) {
    return Response.json({ error: "ADMIN_RETRY_KEY not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  if (searchParams.get("key") !== adminKey) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ref     = searchParams.get("ref");
  const force   = searchParams.get("force") === "1";
  const rebuild = searchParams.get("rebuild") === "1";
  const dryRun  = searchParams.get("dry") === "1";
  if (!ref) return Response.json({ error: "ref required" }, { status: 400 });

  try {
    const result = await kv.get(`result:${ref}`);
    if (!result) return Response.json({ error: `No book found for ref ${ref}` }, { status: 404 });
    if (!result.sessionId) {
      return Response.json({ error: "Book has no Stripe session attached" }, { status: 400 });
    }

    // Refuse double-submission unless forced.
    const existingOrder = await kv.get(`order:${result.sessionId}`);
    if (existingOrder?.status === "fulfilled" && !force) {
      return Response.json({
        ok:            false,
        error:         "Order already fulfilled — add &force=1 to resubmit anyway",
        gelatoOrderId: existingOrder.gelatoOrderId,
        fulfilledAt:   existingOrder.fulfilledAt,
      }, { status: 409 });
    }

    // Rebuild the PDFs from the stored images when asked, or when they're
    // missing. This reuses the already-generated illustrations (no new AI cost)
    // and picks up the current page-count / layout settings.
    if (rebuild || !result.coverPdfUrl || !result.interiorPdfUrl) {
      const images = result.images || {};
      if (!images["cover"]) {
        return Response.json({ error: "No images stored — cannot rebuild PDFs" }, { status: 400 });
      }
      // Scene slots are 0..(totalJobs-2); fall back to whatever numeric slots exist.
      const sceneCount = result.totalJobs
        ? Math.max(result.totalJobs - 1, 0)
        : Object.keys(images).filter(k => /^\d+$/.test(k)).length;
      const pageFalUrls = Array.from({ length: sceneCount }, (_, i) => images[i] ?? null);

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mytinytales.studio";
      const pdfRes = await fetch(`${siteUrl}/api/generate-book-pdf`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          coverFalUrl: images["cover"],
          pageFalUrls,
          story:       result.story,
          childName:   result.childName,
        }),
      });
      if (!pdfRes.ok) {
        const err = await pdfRes.json().catch(() => ({}));
        throw new Error(`PDF generation failed: ${err.error || pdfRes.status}`);
      }
      const { coverPdfUrl, interiorPdfUrl, interiorPageCount } = await pdfRes.json();

      await kv.set(`result:${ref}`, {
        ...result, coverPdfUrl, interiorPdfUrl, interiorPageCount, status: "ready",
      }, { ex: 2_592_000 }).catch(() => {});
    }

    // Single source of truth for the Gelato submission (uses the stored
    // interiorPageCount, correct address, and idempotency). dryRun validates
    // the payload as a draft without placing a real order.
    const submitRes = await submitPrintFromKV(ref, { dryRun });
    console.log("retry-print: ref", ref, dryRun ? "(dry-run validated)" : `order ${submitRes.gelatoOrderId}`);
    return Response.json({ ok: true, ...submitRes, ref, rebuilt: rebuild });

  } catch (err) {
    console.error("retry-print error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
