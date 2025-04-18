/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { OpenAI } from "openai";
import { list } from "@vercel/blob";

interface Embedding {
  content: string;
  embedding: number[];
  type: "cv" | "url";
  source?: string;
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const BLOB_PATH = "embeddings.json";

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const normA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const normB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (normA * normB);
}

export async function POST(request: Request) {
  try {
    const { query } = await request.json();
    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Invalid query" }, { status: 400 });
    }

    // Read embeddings from Blob
    let embeddings: Embedding[] = [];
    try {
      const { blobs } = await list({ prefix: BLOB_PATH });
      const blob = blobs.find((b) => b.pathname === BLOB_PATH);

      if (blob) {
        const token = process.env.BLOB_READ_WRITE_TOKEN;
        if (!token) throw new Error("BLOB_READ_WRITE_TOKEN is not set");

        const response = await fetch(blob.url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch blob content: ${response.statusText}`);
        }

        const data = await response.text();
        embeddings = JSON.parse(data);
      }
    } catch {
      return NextResponse.json({
        message: "**No portfolio data available.** Please ask about my portfolio later.",
      });
    }

    // Generate embedding for the query
    const queryEmbeddingResponse = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: query,
    });
    const queryEmbedding = queryEmbeddingResponse.data[0].embedding;

    // Pre-filter embeddings by keywords
    const queryKeywords = query.toLowerCase().split(/\s+/).filter((word) => word.length > 3);
    const filteredEmbeddings = embeddings.filter((embedding) =>
      queryKeywords.some((keyword) =>
        embedding.content.toLowerCase().includes(keyword)
      )
    );

    // Compute similarities for filtered embeddings (or all if none match)
    const targetEmbeddings = filteredEmbeddings.length ? filteredEmbeddings : embeddings;
    const similarities = targetEmbeddings.map((embedding) =>
      cosineSimilarity(queryEmbedding, embedding.embedding)
    );

    // Dynamic threshold (top 25th percentile or fallback)
    const sortedSimilarities = similarities.slice().sort((a, b) => b - a);
    const dynamicThreshold = sortedSimilarities[Math.floor(sortedSimilarities.length * 0.25)] || 0.75;

    // Find top 3 relevant embeddings
    const relevantEmbeddings: { content: string; similarity: number }[] = [];
    for (let i = 0; i < targetEmbeddings.length; i++) {
      const similarity = similarities[i];
      if (similarity >= dynamicThreshold) {
        relevantEmbeddings.push({ content: targetEmbeddings[i].content, similarity });
      }
    }
    relevantEmbeddings.sort((a, b) => b.similarity - a.similarity);
    const topRelevantContent = relevantEmbeddings
      .slice(0, 3)
      .map((e) => e.content)
      .join("\n\n")
      .slice(0, 8000);

    // Check if any relevant content was found
    if (!topRelevantContent) {
      return NextResponse.json({
        message: "**I'm here to help with portfolio-related questions!** Please ask about my experience, projects, or skills.",
      });
    }

    // Define system message with markdown instruction
    const systemMessage: OpenAI.ChatCompletionSystemMessageParam = {
      role: "system",
      content: `You are Martijn's portfolio assistant, designed to showcase the professional expertise and achievements of Martijn, Martijn van Halen, or Martin. Answer only questions directly related to the provided portfolio context, which includes public information such as Martijn's CV, project details, and professional bio. Share only this public portfolio-related information, avoiding any sensitive or unrelated personal details. Do not provide general knowledge or answers outside the context, even if the query seems tangentially related. If the query is irrelevant or the context is insufficient, politely refuse to answer with a brief markdown-formatted message. Format all responses in markdown for clarity, using:
      - **Headings** (##) for main topics or questions.
      - **Lists** (-) for multiple items or points.
      - **Bold** (**) for emphasis (e.g., roles, key terms).
      - **Links** ([text](url)) for URLs mentioned in the context.
      Keep responses concise, under 150 tokens, prioritizing key details. If the query is ambiguous, ask for clarification within the portfolio context. Context (Martijn's portfolio):\n${topRelevantContent}`,  
    };

    // Generate response
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        systemMessage,
        { role: "user", content: query } as OpenAI.ChatCompletionUserMessageParam,
      ],
      max_tokens: 150,
    });

    const message = completion.choices[0].message.content;
    return NextResponse.json({ message });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json({
      message: "**Error:** Failed to process your request. Please try again later.",
    }, { status: 500 });
  }
}