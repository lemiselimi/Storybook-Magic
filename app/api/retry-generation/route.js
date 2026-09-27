import Stripe from "stripe";
import { kv } from "@/lib/kv";
import { hasAccessToken, internalAuthorization } from "@/lib/security";
import { canRetryGeneration, missingImageSlots } from "@/lib/generation-recovery";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(request) {
  const body = await request.json().catch(() => null);
  const ref = body?.ref;
  if (typeof ref !== "string" || (!body.accessToken && !body.sessionId)) {
    return Response.json({ error: "Book access required" }, { status: 401 });
  }
  let lock;
  const lockKey = `generation-retry:${ref}`;
  try {
    let result = await kv.get(`result:${ref}`);
    if (!result) return Response.json({ error: "Book not found" }, { status: 404 });
    let authorized = hasAccessToken(body.accessToken, result.accessToken);
    if (!authorized && body.sessionId === result.sessionId && process.env.STRIPE_SECRET_KEY) {
      const session = await new Stripe(process.env.STRIPE_SECRET_KEY).checkout.sessions.retrieve(body.sessionId);
      authorized = session.payment_status === "paid" && session.metadata?.ref === ref;
    }
    if (!authorized) return Response.json({ error: "Unauthorized" }, { status: 403 });
    lock = crypto.randomUUID();
    if (!await kv.set(lockKey, lock, { nx: true, ex: 90 })) {
      lock = null;
      return Response.json({ error: "Recovery is already running. Please wait." }, { status: 409 });
    }
    result = await kv.get(`result:${ref}`);
    if (!canRetryGeneration(result)) return Response.json({ error: "This book cannot be retried now. Please contact hello@mytinytales.studio." }, { status: 409 });
    const book = await kv.get(`book:${ref}`);
    const slots = missingImageSlots(result);
    if (!book?.referenceUrl || slots.some(slot => !(slot === "cover" ? book.coverPrompt : book.scenePrompts?.[slot]))) {
      return Response.json({ error: "The source artwork is unavailable. Please contact hello@mytinytales.studio." }, { status: 409 });
    }
    // Never regenerate completed images, create a checkout, or submit a print order.
    await kv.set(`result:${ref}`, { ...result, status: "generating", error: null,
      generationRetries: (result.generationRetries || 0) + 1,
      lastGenerationAttemptAt: new Date().toISOString() }, { ex: 2_592_000 });
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mytinytales.studio";
    await Promise.all(slots.map(async slot => {
      const response = await fetch(`${siteUrl}/api/generate-scene`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: internalAuthorization() },
        body: JSON.stringify({ referenceImageUrl: book.referenceUrl,
          prompt: slot === "cover" ? book.coverPrompt : book.scenePrompts[slot], seed: book.seed }),
        signal: AbortSignal.timeout(25_000),
      });
      const submitted = await response.json();
      if (!response.ok || !submitted.jobId) throw new Error("Illustration retry submission failed");
      await kv.set(`job:${submitted.jobId}`, { ref, slot, model: submitted.model }, { ex: 86_400 });
    }));
    return Response.json({ ok: true, retried: slots.length });
  } catch (error) {
    console.error("retry-generation:", error.message);
    return Response.json({ error: "Recovery could not finish. Your completed pages are saved. Please try again later." }, { status: 503 });
  } finally {
    if (lock) await kv.eval("if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end", [lockKey], [lock]).catch(() => {});
  }
}
