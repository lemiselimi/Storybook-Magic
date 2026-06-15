import { fal } from "@fal-ai/client";

export const maxDuration = 30;

export async function POST(request) {
  fal.config({ credentials: process.env.FAL_API_KEY });
  try {
    const { jobId, model } = await request.json();
    if (!jobId) return Response.json({ error: "jobId required" }, { status: 400 });

    // Poll the queue that produced this job — PuLID or the legacy LoRA model.
    const endpoint = model === "pulid" ? "fal-ai/flux-pulid" : "fal-ai/flux-lora";

    const statusResult = await fal.queue.status(endpoint, {
      requestId: jobId,
      logs: false,
    });

    if (statusResult.status === "COMPLETED") {
      const result = await fal.queue.result(endpoint, { requestId: jobId });
      const url = result.data?.images?.[0]?.url ?? null;
      console.log("Scene complete:", url?.substring(0, 80));
      return Response.json({ status: "COMPLETED", url });
    }

    console.log("Scene status:", statusResult.status);
    return Response.json({ status: statusResult.status, url: null });
  } catch (err) {
    console.error("Check scene error:", err.message);
    return Response.json({ error: err.message, status: "FAILED" }, { status: 500 });
  }
}
