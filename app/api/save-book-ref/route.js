import { kv } from "@/lib/kv";

export async function POST(request) {
  try {
    const body = await request.json();
    const { ref, ...bookData } = body;
    if (!ref) return Response.json({ error: "ref required" }, { status: 400 });

    // TTL: 48 hours — plenty of time to complete checkout and generate book
    await kv.set(`book:${ref}`, bookData, { ex: 172_800 });

    return Response.json({ ok: true });
  } catch (err) {
    console.error("save-book-ref error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
