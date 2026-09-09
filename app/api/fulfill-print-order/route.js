// Fulfilment is intentionally performed only from the signed Stripe webhook
// and the access-token-protected approval route. The former browser-facing
// endpoint accepted arbitrary print assets and a paid session id.
export async function POST() {
  return Response.json({ error: "This legacy endpoint is no longer available." }, { status: 410 });
}

