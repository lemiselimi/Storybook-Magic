import { fal } from "@fal-ai/client";
import { isAllowedFalAsset, isInternalRequest } from "@/lib/security";
import { DEFAULT_INTERIOR_PAGE_COUNT, preflightBook } from "@/lib/book-layout";
import { renderBookPdf } from "@/lib/book-pdf";
export const maxDuration = 60;
async function fetchBytes(url) {
  if (!url || url === "__failed__" || !isAllowedFalAsset(url)) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(20_000), redirect: "error" });
    if (!res.ok || !res.headers.get("content-type")?.startsWith("image/")) return null;
    if (Number(res.headers.get("content-length") || 0) > 20 * 1024 * 1024) return null;
    return new Uint8Array(await res.arrayBuffer());
  } catch {
    return null;
  }
}


export async function POST(request) {
  if (!isInternalRequest(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  let body;
  try { body = await request.json(); }
  catch { return Response.json({ error: "Invalid request body" }, { status: 400 }); }
  const { coverFalUrl, pageFalUrls, story, childName } = body;
  if (!isAllowedFalAsset(coverFalUrl) || !Array.isArray(pageFalUrls) || pageFalUrls.length !== 8 || pageFalUrls.some(url => !isAllowedFalAsset(url))) {
    return Response.json({ error: "Invalid book assets" }, { status: 400 });
  }
  const configured = Number(process.env.PRINT_MIN_PAGES);
  const minimumPages = Number.isFinite(configured) ? Math.max(DEFAULT_INTERIOR_PAGE_COUNT, configured) : DEFAULT_INTERIOR_PAGE_COUNT;
  const inputCheck = preflightBook({ story, childName, coverImage: coverFalUrl, sceneImages: pageFalUrls, minimumPages });
  if (!inputCheck.ok) return Response.json({ error: "Book failed print preflight.", preflight: inputCheck }, { status: 422 });
  try {
    const [coverBytes, ...sceneBytes] = await Promise.all([coverFalUrl, ...pageFalUrls].map(fetchBytes));
    const result = await renderBookPdf({ story, childName, coverBytes, sceneBytes, minimumPages });
    fal.config({ credentials: process.env.FAL_API_KEY });
    const [coverPdfUrl, interiorPdfUrl] = await Promise.all([
      fal.storage.upload(new File([result.coverPdfBytes], "cover.pdf", { type: "application/pdf" })),
      fal.storage.upload(new File([result.interiorPdfBytes], "interior.pdf", { type: "application/pdf" })),
    ]);
    return Response.json({ coverPdfUrl, interiorPdfUrl, interiorPageCount: result.pagePlan.length, preflight: result.preflight });
  } catch (error) {
    console.error("generate-book-pdf error:", error.message);
    return Response.json({ error: "Book failed print preflight.", preflight: { ok: false, errors: [{ code: "render_failed", message: error.message }] } }, { status: 422 });
  }
}
