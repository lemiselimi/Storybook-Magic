// Print-provider dispatcher. Routes fulfillment to Gelato or Prodigi based on
// the PRINT_PROVIDER env var (default "gelato" for backwards compatibility).
// All callers should import submitPrintFromKV / sendPrintFailureAlert from here
// rather than a specific provider so switching is a one-env-var change.
import * as gelato from "@/lib/gelato";
import * as prodigi from "@/lib/prodigi";

export const PRINT_PROVIDER = (process.env.PRINT_PROVIDER || "gelato").toLowerCase();
const impl = PRINT_PROVIDER === "prodigi" ? prodigi : gelato;

export async function submitPrintFromKV(ref, opts = {}) {
  const res = await impl.submitPrintFromKV(ref, opts);
  // Normalize the order id across providers so callers are provider-agnostic.
  return { ...res, orderId: res.orderId ?? res.gelatoOrderId ?? res.prodigiOrderId, provider: PRINT_PROVIDER };
}

// Admin failure-alert email is provider-agnostic; reuse the existing one.
export { sendPrintFailureAlert } from "@/lib/gelato";
