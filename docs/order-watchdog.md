# Order watchdog

Private dashboard: `/operations`. It has no customer data in its HTML. The data and recovery endpoints require a separate operations key, passed in a header and held only in tab memory. Do not reuse payment, email, or cron credentials as this key.

## Activate

1. Set `WATCHDOG_ADMIN_KEY` in Vercel to a cryptographically random key of at least 32 characters. Store it in the owner's password manager. Existing KV and Stripe credentials are reused.
2. Verify `CRON_SECRET` is configured. The daily Vercel fallback calls `/api/cron/order-watchdog`; Hobby cannot run ten-minute Vercel crons.
3. For ten-minute checks, set GitHub Actions secret `WATCHDOG_CRON_SECRET` to that same cron secret, then set repository variable `WATCHDOG_ENABLED=true`. The schedule runs from the default branch. Run the workflow manually once and confirm a successful heartbeat in the dashboard. GitHub schedules can be delayed, and public-repository schedules can be disabled after inactivity; a stale heartbeat is visibly flagged. This is not a guaranteed ten-minute SLA or an independent outage pager.
4. Add a Resend webhook at `https://mytinytales.studio/api/resend-webhook` and set its signing secret as `RESEND_WEBHOOK_SECRET`. Select `email.sent`, `email.delivered`, `email.delivery_delayed`, `email.bounced`, `email.complained`, `email.failed`, and `email.suppressed`. Redeploy after setting variables. Signature verification rejects forged events; older events cannot overwrite newer state.
5. Only after the owner chooses the recipient, set `WATCHDOG_ALERT_EMAIL`. Leave it unset for dashboard-only monitoring. Alerts use the existing Resend key and contain references and issue summaries, not customer addresses, child photos, or private book access links.
6. Open the dashboard, run a check, verify the heartbeat, and verify a signed test email event. Do not send live customer test emails or submit print orders as a monitoring test.

## Behavior and boundaries

- Scans existing order records and reconciles Stripe paid checkout sessions from the past 30 days, including missed payment webhooks. Each check processes one Redis scan page and one Stripe page (100 requested items). Cursors continue on the next run; completeness is visible in the dashboard.
- Flags paid orders without generation after 15 minutes, failed/stalled illustration or PDF work, missing PDFs, print preflight/submission failures, and approval holds overdue by more than four days. Waiting for ordinary customer print approval is not a failure.
- The owner can retry missing illustrations through the existing lock and two-retry limit. Retries may incur the existing image-provider cost but never charge the customer or submit a print order. No automatic recovery is enabled.
- Tracks existing contact and preview email sends, plus signed events from Resend. Provider acceptance is distinct from delivery to the receiving server; delivery does not prove reading or inbox placement. It does not read the support inbox, monitor Stripe receipts, or add a new book-ready customer email.
- Print status ends at successful submission. This version does not poll Prodigi shipment/delivery status. The existing print workflow and three-day auto-submit rule are unchanged.
- Alerts are sent only when the visible issue list changes; failure to send leaves the alert eligible for the next run. Alert failures and stale/failed monitor runs are shown in the dashboard. No independent alert is possible during a complete platform outage.
- Retains operational records for 30 days. Shows the most recent 100 orders, up to 100 attention items, and 100 email events. No historical totals are implied. At higher volume, expand paging and move alerts to a per-incident queue before relying on this view for every issue.

## Verification

Run `node --test test/*.test.mjs`, scoped ESLint, and `npm run build`. Tests use fake providers and do not generate images, send email, charge cards, or order books. A successful local test/build is not proof that the deployed schedule or webhook credentials are connected.

## fal.ai credit monitoring

Official reference: https://fal.ai/docs/platform-apis/v1/account/billing (verified 2026-10-11).
Set FAL_BILLING_KEY to a separate key with billing:usage:read permission. Do not broaden or replace the image-generation key. FAL_LOW_CREDIT_USD is optional and defaults to 20 USD. Each monitor run requests GET https://api.fal.ai/v1/account/billing?expand=credits, with an eight-second timeout and no redirects. No automatic top-ups are made.

Low/zero/negative balance and unavailable balance are different attention states. Failed requests never imply sufficient credit. Alerts use stable issue text so every cent of spending does not send another email; recovery clears the fingerprint and a later low-credit incident can alert again. A missing billing key is explicitly shown as not connected. The dashboard timestamp and monitor stale warning must be checked before relying on the balance.

Activation remains incomplete until a real authenticated read, scheduled heartbeat, and operator email delivery are verified. The production billing key, GitHub scheduler secret, and Resend webhook signing secret require account access/owner credential handoff; never paste them into chat.
