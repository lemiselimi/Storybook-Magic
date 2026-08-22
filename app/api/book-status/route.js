import { kv } from "@/lib/kv";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ref = searchParams.get("ref");
  if (!ref) return Response.json({ error: "ref required" }, { status: 400 });

  try {
    const result = await kv.get(`result:${ref}`);
    if (!result) return Response.json({ status: "not_found" }, { status: 404 });

    // Proxy image URLs through /api/proxy so CORS + caching work correctly
    const proxied = (url) => url ? `/api/proxy?url=${encodeURIComponent(url)}` : null;

    return Response.json({
      status:         result.status,
      childName:      result.childName,
      story:          result.story,
      plan:           result.plan,
      coverUrl:       proxied(result.images?.cover),
      pageUrls:       [0,1,2,3,4,5].map(i => proxied(result.images?.[i])),
      interiorPdfUrl: result.interiorPdfUrl ?? null,
      completedAt:    result.completedAt ?? null,
      printApproval:  result.printApproval ?? null,
    });
  } catch (err) {
    console.error("book-status error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
