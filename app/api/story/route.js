import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request) {
  try {
    const body = await request.json();
    const { childName, childAge, theme } = body;

    console.log("Story API called with:", { childName, childAge, theme });
    console.log("API Key exists:", !!process.env.ANTHROPIC_API_KEY);

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: `Create a children's book for ${childName || "a child"}, age ${childAge || 5}, theme: ${theme}. 
        
Respond ONLY with this exact JSON structure, no markdown:
{"title":"Book Title","dedication":"Sweet dedication","pages":[{"pageNum":1,"text":"Page text here","illustration":"Scene description"},{"pageNum":2,"text":"Page text here","illustration":"Scene description"},{"pageNum":3,"text":"Page text here","illustration":"Scene description"},{"pageNum":4,"text":"Page text here","illustration":"Scene description"},{"pageNum":5,"text":"Page text here","illustration":"Scene description"},{"pageNum":6,"text":"Page text here","illustration":"Scene description"}]}`
      }]
    });

    const text = response.content[0].text;
    console.log("Raw response:", text.substring(0, 200));
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    console.log("Parsed successfully, pages:", parsed.pages?.length);
    return Response.json(parsed);
  } catch (err) {
    console.error("Story API error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}