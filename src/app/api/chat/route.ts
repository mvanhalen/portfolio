import { NextResponse } from "next/server";
import { OpenAI } from "openai";
import { list } from "@vercel/blob";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const BLOB_PATH = "embeddings.json";

// In-memory cache for embeddings
let cachedEmbeddings: Embedding[] | null = null;

interface Embedding {
  content: string;
  embedding: number[];
  type: "cv" | "url";
  parentType?: "cv" | "url";
  chunkIndex?: number;
  source?: string;
}

// Preload embeddings when module is loaded
async function preloadEmbeddings() {
  try {
    console.log("Preloading embeddings from Vercel Blob...");
    const { blobs } = await list({ prefix: BLOB_PATH });
    const blob = blobs.find((b) => b.pathname === BLOB_PATH);

    if (!blob) {
      console.warn("No embeddings blob found during preload");
      cachedEmbeddings = [];
      return;
    }

    const response = await fetch(blob.url, {
      headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch blob content: ${response.statusText}`);
    }

    const data = await response.text();
    cachedEmbeddings = JSON.parse(data);
    console.log("Embeddings preloaded successfully");
  } catch (error) {
    console.error("Preload embeddings error:", error);
    cachedEmbeddings = [];
  }
}

// Execute preload immediately
preloadEmbeddings().catch((error) => {
  console.error("Failed to preload embeddings:", error);
});

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const normA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const normB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (normA * normB);
}

// Load embeddings from cache or Vercel Blob
async function loadEmbeddings(): Promise<Embedding[]> {
  try {
    if (cachedEmbeddings !== null) {
      console.log("Using cached embeddings");
      return cachedEmbeddings;
    }

    console.log("Fetching embeddings from Vercel Blob...");
    const { blobs } = await list({ prefix: BLOB_PATH });
    const blob = blobs.find((b) => b.pathname === BLOB_PATH);

    if (!blob) {
      console.warn("No embeddings blob found");
      return [];
    }

    const response = await fetch(blob.url, {
      headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch blob content: ${response.statusText}`);
    }

    const data = await response.text();
    cachedEmbeddings = JSON.parse(data);
    return cachedEmbeddings || [];
  } catch (error) {
    console.error("Load embeddings error:", error);
    return [];
  }
}

export async function POST(request: Request) {
  try {
    const { query } = await request.json();
    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Invalid query" }, { status: 400 });
    }

    // Load embeddings
    const embeddings = await loadEmbeddings();
    if (!embeddings.length) {
      return NextResponse.json({
        message: "**No portfolio data available.** Please ask about Martijn's experience, projects, or skills later.",
      });
    }

    // Generate embedding for the query
    const queryEmbeddingResponse = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: query,
    });
    const queryEmbedding = queryEmbeddingResponse.data[0].embedding;

    // Relaxed keyword pre-filtering (lower length threshold)
    const queryKeywords = query.toLowerCase().split(/\s+/).filter((word) => word.length > 2);
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

    // Relaxed dynamic threshold (top 50th percentile, minimum 0.7)
    const sortedSimilarities = similarities.slice().sort((a, b) => b - a);
    const dynamicThreshold = Math.max(
      sortedSimilarities[Math.floor(sortedSimilarities.length * 0.5)] || 0.7,
      0.7
    );

    // Find relevant embeddings, grouping by source/parentType
    const relevantEmbeddings: { content: string; similarity: number; source?: string; chunkIndex?: number }[] = [];
    for (let i = 0; i < targetEmbeddings.length; i++) {
      const similarity = similarities[i];
      if (similarity >= dynamicThreshold) {
        relevantEmbeddings.push({
          content: targetEmbeddings[i].content,
          similarity,
          source: targetEmbeddings[i].source,
          chunkIndex: targetEmbeddings[i].chunkIndex,
        });
      }
    }

    // Sort by similarity, then chunkIndex for continuity
    relevantEmbeddings.sort((a, b) => {
      if (a.source === b.source) {
        return (a.chunkIndex || 0) - (b.chunkIndex || 0);
      }
      return b.similarity - a.similarity;
    });

    // Combine top 3 embeddings, respecting chunk order
    const topRelevantContent = relevantEmbeddings
      .slice(0, 3)
      .map((e) => e.content)
      .join("\n\n")
      .slice(0, 8000);

    // Check if any relevant content was found
    if (!topRelevantContent) {
      return NextResponse.json({
        message: "**Please ask a specific question about Martijn's portfolio.** For example, ask about his experience, projects, or skills.",
      });
    }

    // Define system message
    const systemMessage: OpenAI.ChatCompletionSystemMessageParam = {
      role: "system",
      content: `You are Martijn's portfolio assistant, designed to highlight the professional expertise and achievements of Martijn, Martijn van Halen, or Martin. Answer only questions directly related to the provided portfolio context (Martijn's CV, project details, and professional bio). Share only public portfolio-related information, avoiding sensitive or unrelated details. Do not provide general knowledge or answers outside the context. If the query is irrelevant or lacks sufficient context, respond with: "**Please ask a specific question about Martijn's portfolio.** For example, ask about his experience, projects, or skills." Format all responses in markdown using:
- **Headings** (##) for main topics.
- **Lists** (-) for multiple points.
- **Bold** (**) for emphasis (e.g., roles, key terms).
- **Links** ([text](url)) for URLs.
Keep responses concise, under 150 tokens. Context:\n${topRelevantContent}`,
    };

    // Generate response
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        systemMessage,
        { role: "user", content: query } as OpenAI.ChatCompletionUserMessageParam,
      ],
      max_tokens: 500,
    });

    let message = completion.choices[0].message.content;
    // Ensure fallback response is used if OpenAI returns a vague message
    if (
      message!.toLowerCase().includes("need more context") ||
      message!.toLowerCase().includes("more information")
    ) {
      message = "**Please ask a specific question about Martijn's portfolio.** For example, ask about his experience, projects, or skills.";
    }

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      {
        message: "**Error:** Failed to process your request. Please try again later.",
      },
      { status: 500 }
    );
  }
}