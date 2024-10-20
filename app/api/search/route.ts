import { NextResponse } from 'next/server';
import Exa from 'exa-js';
import OpenAI from "openai";

export const runtime = "edge";

const openai = new OpenAI();

export async function POST(req: Request) {
try {
  const exa = new Exa(process.env.EXA_API_KEY);
  const { blocks } = await req.json();
  const mappedBlocks = blocks.map(block => {
    if (block.responses.length < 1) return ''
    return `Title:
    ${block.title}
    Content:
    ${block.responses.map(response => response.content).join('\n')}
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

    const query = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "user", content: `Please generate a one sentence search query for the following interests:\n${extractedAims}\nGenerate a one sentence search query.` }
      ],
      stream: false
    })
    

  const searchRes = await exa.searchAndContents(
    query.choices[0]?.message?.content || "",
    {
      useAutoprompt: true,
      text: true,
      highlights: true,
      numResults: 10
    }
  );

  const formattedResultsArray = searchRes.results.map(({text, title, highlights}) => {
    return `Title:
    ${title}
    Content:
    ${text}
    Highlights:
    ${highlights.join(", ")}`
  })

  const tangentRec = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: `You are an expert at creating 3 tangeantial topics to the ones given. Select the 3 most impactful topics. You are very succinct. Topics:\n${extractedAims}` },
      { role: "user", content: `Please generate 3 tangeantial topics to the ones given using the following documents:\n${formattedResultsArray.join("\n")}` }
    ],
    stream: false
  })
  

  const evidenceExtraction = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: `You are an expert at extracting evidence from documents. The evidence should support the following topics.\Topics:\n${extractedAims}` },
      { role: "user", content: `Generate a short paragraph of evidence supporting the topics. If the evidence is not precise, DO NOT INCLUDE! Documents:\n${formattedResultsArray.join("\n")} Please only extract meaningful numbers to back up any ideas given.` }
    ],
    stream: false
  })
  
  return NextResponse.json({ success: true, evidenceExtraction: evidenceExtraction.choices[0]?.message?.content, tangentRec: tangentRec.choices[0]?.message?.content });
  
  } catch (error) {
    console.error('Error processing blocks:', error);
    return NextResponse.json({ error: 'Failed to process blocks' }, { status: 500 });
  }
}
