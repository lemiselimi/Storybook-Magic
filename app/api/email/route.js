import { Resend } from "resend";

const esc = (s) => String(s || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");

// Simple in-memory rate limit: max 5 requests per IP per 10 minutes
const rateLimitMap = new Map();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;

function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip) || { count: 0, start: now };
  if (now - entry.start > RATE_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, start: now });
    return false;
  }
  if (entry.count >= RATE_LIMIT) return true;
  entry.count++;
  rateLimitMap.set(ip, entry);
  return false;
}

const FROM_DOMAIN = "hello@mytinytales.studio";
const FROM_NOREPLY = "My Tiny Tales <hello@mytinytales.studio>";

export async function POST(request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip)) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { type, email, name, subject, message, shareUrl } = body;

    if (!email) return Response.json({ error: "Email required" }, { status: 400 });

    console.log("Email API called, type:", type, "email:", email);

    if (!process.env.RESEND_API_KEY) {
      console.warn("RESEND_API_KEY not set — email not sent");
      return Response.json({ ok: true });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    if (type === "preview_lead") {
      await resend.emails.send({
        from: FROM_NOREPLY,
        to: email,
        subject: "Your My Tiny Tales preview link ✨",
        html: `
          <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#fffef7;border-radius:16px;overflow:hidden;">
            <div style="background:linear-gradient(135deg,#1a0a2e,#2d1b4e);padding:32px;text-align:center;">
              <div style="font-size:36px;margin-bottom:8px;">✨</div>
              <h1 style="color:white;font-size:22px;margin:0;">Your storybook preview is ready!</h1>
            </div>
            <div style="padding:32px;">
              <p style="color:#3d2b1f;font-size:15px;line-height:1.7;">Hi there! Here's your personalised storybook preview link:</p>
              <a href="${shareUrl || "#"}" style="display:block;margin:20px 0;padding:14px 28px;background:linear-gradient(135deg,#f4c430,#ffb347);color:#1a0a2e;font-weight:700;font-size:15px;text-decoration:none;border-radius:50px;text-align:center;">
                View My Book Preview →
              </a>
              <p style="color:#8a6d5a;font-size:13px;">Love what you see? Download the full print-ready PDF for just $17.99, or order a beautiful printed copy delivered to your door.</p>
            </div>
            <div style="background:#1a0a2e;padding:20px;text-align:center;">
              <p style="color:rgba(255,255,255,0.35);font-size:11px;margin:0;">© ${new Date().getFullYear()} My Tiny Tales · <a href="https://mytinytales.studio/privacy" style="color:rgba(255,255,255,0.35);">Privacy Policy</a></p>
            </div>
          </div>
        `,
      });
    } else if (type === "contact") {
      await Promise.all([
        // Forward to us
        resend.emails.send({
          from: FROM_NOREPLY,
          to: FROM_DOMAIN,
          replyTo: email,
          subject: `Contact form: ${esc(subject) || "New message"} — from ${esc(name) || esc(email)}`,
          html: `
            <p><strong>From:</strong> ${esc(name) || "—"} (${esc(email)})</p>
            <p><strong>Subject:</strong> ${esc(subject) || "—"}</p>
            <p><strong>Message:</strong></p>
            <p style="white-space:pre-wrap;">${esc(message) || "—"}</p>
          `,
        }),
        // Confirmation to user
        resend.emails.send({
          from: FROM_NOREPLY,
          to: email,
          subject: "We got your message — My Tiny Tales",
          html: `
            <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;">
              <div style="background:#1a0a2e;padding:28px;text-align:center;">
                <span style="font-size:30px;">✨</span>
                <h2 style="color:white;margin:8px 0 0;">Thanks for reaching out!</h2>
              </div>
              <div style="padding:28px;">
                <p style="color:#3d2b1f;">Hi ${esc(name) || "there"},</p>
                <p style="color:#3d2b1f;">We've received your message and will reply within one business day.</p>
                <p style="color:#8a6d5a;font-size:13px;">— The My Tiny Tales team</p>
              </div>
              <div style="background:#1a0a2e;padding:20px;text-align:center;">
                <p style="color:rgba(255,255,255,0.35);font-size:11px;margin:0;">© ${new Date().getFullYear()} My Tiny Tales · <a href="https://mytinytales.studio/privacy" style="color:rgba(255,255,255,0.35);">Privacy Policy</a></p>
              </div>
            </div>
          `,
        }),
      ]);
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error("Email API error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
