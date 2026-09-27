export const GENERATION_STALE_MS = 10 * 60 * 1000;

export function missingImageSlots(result) {
  return ["cover", ...(result.story?.pages || []).map((_, i) => String(i))]
    .filter(slot => !result.images?.[slot]);
}

export function canRetryGeneration(result, now = Date.now()) {
  if (!result.sessionId || !missingImageSlots(result).length) return false;
  if (["ready", "pdf_generating"].includes(result.status)) return false;
  if ((result.generationRetries || 0) >= 2) return false;
  const started = Date.parse(result.lastGenerationAttemptAt || result.createdAt || "");
  return result.status === "failed" || (Number.isFinite(started) && now - started >= GENERATION_STALE_MS);
}

// Keep the scene description consistent with the already specified diving outfit.
// Provider safety settings stay unchanged.
export function consistentSceneOutfit(prompt) {
  if (!/wetsuit/i.test(prompt)) return prompt;
  return prompt.replace(/\bswimsuit\b/gi, "long-sleeved full-length diving wetsuit");
}
