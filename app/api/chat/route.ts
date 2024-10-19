import OpenAI from "openai";
import { NextRequest } from "next/server";

const openai = new OpenAI();

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  const stream = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    stream: true,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        controller.enqueue(encoder.encode(content));
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}