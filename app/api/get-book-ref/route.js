import { kv } from "@vercel/kv";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ref = searchParams.get("ref");
  if (!ref) return Response.json({ error: "ref required" }, { status: 400 });

  try {
    const data = await kv.get(`book:${ref}`);
    if (!data) return Response.json({ error: "not found" }, { status: 404 });
    return Response.json({ ok: true, data });
  } catch (err) {
    console.error("get-book-ref error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
