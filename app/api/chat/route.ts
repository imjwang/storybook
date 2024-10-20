import OpenAI from "openai";
import { NextRequest } from "next/server";
// import { Block, Response } from '../../components/ChatBlock';

const openai = new OpenAI();

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const { messages, blocks } = await req.json();
  // console.log(blocks)
  if (blocks.length < 2) {
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
  // Map blocks to a string format
  const mappedBlocks = blocks.map((block: any) => {
if (block.responses.length < 1) return ''
return `Title:
${block.title}
Content:
${block.responses.map((response: any) => response.content).join('\n')}
  `}).join('\n');

    const sysPrompt = "You are given a set of Documents. You are an assistant the infers higher level interests based on provided documents. Assume that the user is already interested in all the Documents."
  const userPrompt = `I have the following documents.

Documents:
${mappedBlocks}

Please extract interest from the documents in a short list.`

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: sysPrompt },
      { role: "user", content: userPrompt }
    ],
    stream: false
  })

  const extractedAims = res.choices[0]?.message?.content || "";
  console.log("Non-streaming response content:", extractedAims);

  // Get the last message from the messages array
  const lastMessage = messages[messages.length - 1];
  const lastMessageContent = lastMessage.content
  const newSysPrompt = `Consider the provided information to generate a response that is deeply insightful and relevant. You make connections between the current content.`
  const newContent = `\
Current Content:
${extractedAims}

${lastMessageContent}

Please generate an insightful response and draw connections to existing content.`
  
  const stream = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: newSysPrompt },
      { role: "user", content: newContent }
    ],
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