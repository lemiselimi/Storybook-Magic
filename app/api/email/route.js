import { Resend } from "resend";

export async function POST(request) {
  try {
    const body = await request.json();
    const { type, email, name, subject, message, shareUrl } = body;

    console.log("Email API called, type:", type, "email:", email);

    if (!email) return Response.json({ error: "Email required" }, { status: 400 });

    // Always log the lead even if Resend not configured
    console.log("Lead captured:", { type, email, name });

    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);

      if (type === "preview_lead") {
        // Send preview link to the user
        await resend.emails.send({
          from: "My Tiny Tales <onboarding@resend.dev>",
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
                <p style="color:#8a6d5a;font-size:13px;">Love what you see? Unlock all 6 pages for just $17.99.</p>
              </div>
              <div style="background:#1a0a2e;padding:20px;text-align:center;">
                <p style="color:rgba(255,255,255,0.35);font-size:11px;margin:0;">© ${new Date().getFullYear()} My Tiny Tales · <a href="https://mytinytales.studio/privacy" style="color:rgba(255,255,255,0.35);">Privacy Policy</a></p>
              </div>
            </div>
          `,
        });
      } else if (type === "contact") {
        // Forward contact form to us
        await resend.emails.send({
          from: "My Tiny Tales Contact <onboarding@resend.dev>",
          to: "hello@mytinytales.studio",
          replyTo: email,
          subject: `Contact form: ${subject || "New message"} — from ${name || email}`,
          html: `
            <p><strong>From:</strong> ${name || "—"} (${email})</p>
            <p><strong>Subject:</strong> ${subject || "—"}</p>
            <p><strong>Message:</strong></p>
            <p style="white-space:pre-wrap;">${message || "—"}</p>
          `,
        });

        // Send confirmation to the user
        await resend.emails.send({
          from: "My Tiny Tales <onboarding@resend.dev>",
          to: email,
          subject: "We got your message — My Tiny Tales",
          html: `
            <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;">
              <div style="background:#1a0a2e;padding:28px;text-align:center;">
                <span style="font-size:30px;">✨</span>
                <h2 style="color:white;margin:8px 0 0;">Thanks for reaching out!</h2>
              </div>
              <div style="padding:28px;">
                <p style="color:#3d2b1f;">Hi ${name || "there"},</p>
                <p style="color:#3d2b1f;">We've received your message and will reply within one business day.</p>
                <p style="color:#8a6d5a;font-size:13px;">— The My Tiny Tales team</p>
              </div>
            </div>
          `,
        });
      }
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error("Email API error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
