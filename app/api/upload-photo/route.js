import { fal } from "@fal-ai/client";
import sharp from "sharp";

export const maxDuration = 30;

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

// In-memory rate limiter — 5 uploads per IP per hour
const uploadRateMap = new Map();
const UPLOAD_RATE_LIMIT  = 5;
const UPLOAD_RATE_WINDOW = 60 * 60 * 1000;

function checkUploadRate(ip) {
  const now = Date.now();
  const entry = uploadRateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    uploadRateMap.set(ip, { count: 1, resetAt: now + UPLOAD_RATE_WINDOW });
    return true;
  }
  if (entry.count >= UPLOAD_RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// Validate file type by magic bytes — never trust extension or declared MIME
function detectMimeType(buf) {
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  // WebP: RIFF????WEBP
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) return "image/webp";
  // HEIC/HEIF: ....ftyp[heic|heis|mif1|msf1|heix|hevc]
  if (buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70) {
    const brand = String.fromCharCode(buf[8], buf[9], buf[10], buf[11]);
    if (["heic", "heis", "mif1", "msf1", "heix", "hevc"].includes(brand)) return "image/heic";
  }
  return null;
}

export async function POST(request) {
  fal.config({ credentials: process.env.FAL_API_KEY });

  // Rate limit by IP
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkUploadRate(ip)) {
    return Response.json(
      { error: "rate_limited", message: "Too many uploads. Please wait before trying again." },
      { status: 429, headers: { "Retry-After": "3600" } }
    );
  }

  try {
    const { photoBase64 } = await request.json();
    if (!photoBase64) return Response.json({ error: "photoBase64 required" }, { status: 400 });

    const base64Data = photoBase64.replace(/^data:[^;]+;base64,/, "");
    const rawBuffer  = Buffer.from(base64Data, "base64");

    // 1 — Size check
    if (rawBuffer.length > MAX_BYTES) {
      return Response.json({ error: "File too large. Maximum size is 10 MB." }, { status: 400 });
    }

    // 2 — Magic byte validation (rejects non-images regardless of declared type)
    const mime = detectMimeType(rawBuffer);
    if (!mime) {
      return Response.json(
        { error: "Unsupported file type. Please upload a JPEG, PNG, WebP, or HEIC photo." },
        { status: 400 }
      );
    }

    // 3 — Decode with sharp, check for animated/multi-frame images, strip EXIF (including GPS)
    const img      = sharp(rawBuffer);
    const metadata = await img.metadata();

    if ((metadata.pages && metadata.pages > 1) || metadata.delay) {
      return Response.json(
        { error: "Animated images are not supported. Please upload a still photo." },
        { status: 400 }
      );
    }

    // .rotate() applies the EXIF orientation transform so the image renders upright after stripping.
    // Not calling .withMetadata() means sharp strips ALL metadata by default (including GPS EXIF).
    const cleanBuffer = await img
      .rotate()
      .jpeg({ quality: 92, mozjpeg: false })
      .toBuffer();

    // 4 — Upload clean (EXIF-free) image to fal.ai storage
    const blob = new Blob([cleanBuffer], { type: "image/jpeg" });
    const file = new File([blob], "reference.jpg", { type: "image/jpeg" });
    const url  = await fal.storage.upload(file);

    return Response.json({ url });
  } catch (err) {
    console.error("Upload photo error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
