import { fal } from "@fal-ai/client";

export const maxDuration = 30;

export async function POST(request) {
  fal.config({ credentials: process.env.FAL_API_KEY });
  try {
    const { jobId } = await request.json();
    if (!jobId) return Response.json({ error: "jobId required" }, { status: 400 });

    const statusResult = await fal.queue.status("fal-ai/flux-lora", {
      requestId: jobId,
      logs: false,
    });

    if (statusResult.status === "COMPLETED") {
      const result = await fal.queue.result("fal-ai/flux-lora", { requestId: jobId });
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
