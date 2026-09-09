import { kv } from "@/lib/kv";
import { newAccessToken, rateLimit } from "@/lib/security";

export async function POST(request) {
  try {
    const limit = await rateLimit(request, "save-book", 10, 60 * 60);
    if (!limit.allowed) return Response.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });
    const body = await request.json();
    const { ref, ...bookData } = body;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(ref || "")) {
      return Response.json({ error: "Invalid book reference" }, { status: 400 });
    }

    const accessToken = newAccessToken();

    // TTL: 48 hours — plenty of time to complete checkout and generate book
    await kv.set(`book:${ref}`, { ...bookData, accessToken }, { ex: 172_800 });

    return Response.json({ ok: true, accessToken });
  } catch (err) {
    console.error("save-book-ref error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

