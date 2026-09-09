import { kv } from "@/lib/kv";
import { hasAccessToken } from "@/lib/security";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ref = searchParams.get("ref");
  const accessToken = searchParams.get("access_token");
  if (!ref || !accessToken) return Response.json({ error: "Book access token required" }, { status: 401 });

  try {
    const data = await kv.get(`book:${ref}`);
    if (!data) return Response.json({ error: "not found" }, { status: 404 });
    if (!hasAccessToken(accessToken, data.accessToken)) return Response.json({ error: "Unauthorized" }, { status: 403 });
    delete data.accessToken;
    return Response.json({ ok: true, data });
  } catch (err) {
    console.error("get-book-ref error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

