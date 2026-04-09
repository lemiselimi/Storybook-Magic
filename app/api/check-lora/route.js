import { fal } from "@fal-ai/client";

export const maxDuration = 30;

export async function POST(request) {
  fal.config({ credentials: process.env.FAL_API_KEY });
  try {
    const { jobId } = await request.json();
    if (!jobId) return Response.json({ error: "jobId required" }, { status: 400 });

    const statusResult = await fal.queue.status("fal-ai/flux-lora-fast-training", {
      requestId: jobId,
      logs: false,
    });

    if (statusResult.status === "COMPLETED") {
      const result = await fal.queue.result("fal-ai/flux-lora-fast-training", {
        requestId: jobId,
      });
      const loraUrl = result.data.diffusers_lora_file?.url;
      console.log("LoRA complete, url:", loraUrl);
      return Response.json({ status: "COMPLETED", loraUrl: loraUrl ?? null });
    }

    console.log("LoRA status:", statusResult.status);
    return Response.json({ status: statusResult.status, loraUrl: null });
  } catch (err) {
    console.error("Check LoRA error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
