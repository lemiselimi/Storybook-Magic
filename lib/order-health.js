// Operational rules are deliberately deterministic; no model decides whether an order succeeded.
export function orderHealth(order, result, printFailure, now = Date.now()) {
  const issues = [];
  const since = Date.parse(result?.lastGenerationAttemptAt || result?.createdAt || order.paidAt || "");
  const stalled = Number.isFinite(since) && now - since >= 15 * 60_000;
  let stage = "Payment received";
  if (!result) {
    if (stalled) issues.push("Payment received but book generation has not started");
  } else if (result.status === "failed") {
    issues.push(result.interiorPdfUrl ? "Book processing failed" : "Illustration or PDF generation failed");
    stage = "Needs recovery";
  } else if (result.status === "generating") {
    stage = "Illustrating";
    if (stalled) issues.push("Illustrations have been running for more than 15 minutes");
  } else if (result.status === "pdf_generating") {
    stage = "Preparing PDF";
    if (stalled) issues.push("PDF preparation needs attention");
  } else if (result.status === "ready") {
    stage = "PDF ready";
    if (!result.interiorPdfUrl) issues.push("Book is marked ready but its PDF is missing");
    if (order.plan === "print" || result.plan === "print") {
      stage = result.printApproval === "submitted" || order.status === "fulfilled" ? "Submitted to printer" : "Waiting for print approval";
      if (result.printApproval === "requires_attention") issues.push("Print file needs repair before submission");
      const readyAt = Date.parse(result.printReadyAt || "");
      if (stage === "Waiting for print approval" && Number.isFinite(readyAt) && now - readyAt > 4 * 86_400_000) issues.push("Print order is overdue for submission");
    }
  } else {
    stage = "Status unknown";
    issues.push("Unrecognized book status; check the order");
  }
  if (printFailure && result?.printApproval !== "submitted" && order.status !== "fulfilled") issues.push("Print submission failed; review before retrying");
  return { stage, issues, needsAttention: issues.length > 0 };
}

export const EMAIL_PROBLEMS = new Set(["email.bounced", "email.complained", "email.failed", "email.suppressed", "email.delivery_delayed", "send_failed"]);

export function emailLabel(type) {
  return ({ "email.sent": "Accepted by email provider", "email.delivered": "Delivered to receiving mail server",
    "email.bounced": "Bounced", "email.complained": "Spam complaint", "email.failed": "Delivery failed",
    "email.suppressed": "Recipient suppressed", "email.delivery_delayed": "Delivery delayed",
    send_failed: "Email could not be sent" })[type] || "Delivery not yet confirmed";
}
