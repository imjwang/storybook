import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  const { content } = await req.json();

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful assistant that generates key insights based on conversation content." },
        { role: "user", content: `Based on the following conversation content, provide a brief key insight or new idea: ${content}` }
      ],
      max_tokens: 50,
    });

    const insight = completion.choices[0].message.content;
    return NextResponse.json({ insight });
  } catch (error) {
    console.error('Error generating insight:', error);
    return NextResponse.json({ error: 'Failed to generate insight' }, { status: 500 });
  }
}