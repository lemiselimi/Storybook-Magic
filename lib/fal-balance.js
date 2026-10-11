// Official API: https://fal.ai/docs/platform-apis/v1/account/billing
// Use a separate key with billing:usage:read; never expose it to the browser.
export async function checkFalBalance({ key, threshold = 20, fetcher = fetch } = {}) {
  const checkedAt = new Date().toISOString();
  if (!key) return { status: "not_configured", checkedAt, needsAttention: false };
  const limit = Number(threshold);
  if (!Number.isFinite(limit) || limit <= 0) return { status: "unavailable", checkedAt, needsAttention: true, issue: "fal.ai balance alert threshold is invalid." };
  try {
    const response = await fetcher("https://api.fal.ai/v1/account/billing?expand=credits", {
      headers: { Authorization: `Key ${key}` }, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error("Balance request failed");
    const data = await response.json();
    const balance = data?.credits?.current_balance;
    if (typeof balance !== "number" || !Number.isFinite(balance) || data?.credits?.currency !== "USD") throw new Error("Invalid balance response");
    const low = balance <= limit;
    return { status: low ? "low" : "healthy", balance, currency: "USD", threshold: limit, checkedAt, needsAttention: low,
      ...(low ? { issue: `fal.ai credits are at or below the $${limit} alert threshold. Check billing before accepting more orders.` } : {}) };
  } catch {
    return { status: "unavailable", checkedAt, needsAttention: true, issue: "fal.ai credit balance could not be checked. Verify billing access; available credits are unknown." };
  }
}
