const ALLOWED_HOSTS = [
  "v3b.fal.media",
  "fal.media",
  "storage.googleapis.com",
  "cdn.fal.ai",
  "fal-cdn.anthropic.com",
];

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get("url");

  if (!imageUrl) return new Response("No URL", { status: 400 });

  let parsed;
  try {
    parsed = new URL(imageUrl);
  } catch {
    return new Response("Invalid URL", { status: 400 });
  }

  const host = parsed.hostname.toLowerCase();
  const allowed = ALLOWED_HOSTS.some(h => host === h || host.endsWith("." + h));
  if (!allowed) {
    return new Response("Forbidden", { status: 403 });
  }

  const response = await fetch(imageUrl);
  const buffer = await response.arrayBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type": response.headers.get("Content-Type") || "image/jpeg",
      "Cache-Control": "public, max-age=31536000",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
