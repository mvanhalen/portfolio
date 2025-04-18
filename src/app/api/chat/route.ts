import { NextResponse } from "next/server";
import { OpenAI } from "openai";
import { list } from "@vercel/blob";

// Define the Embedding interface to replace `any`
interface Embedding {
  content: string;
  embedding: number[];
  type: "cv" | "url";
  source?: string;
}

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const BLOB_PATH = "embeddings.json";

// Compute cosine similarity
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
        const response = await fetch(blob.url, {
          headers: {
            Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch blob content");
        }

        const data = await response.text();
        embeddings = JSON.parse(data);
      }
    } catch {
      return NextResponse.json({
        message: "No portfolio data available. Please ask about my portfolio later.",
      });
    }

    // Generate embedding for the query
    const queryEmbeddingResponse = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: query,
    });
    const queryEmbedding = queryEmbeddingResponse.data[0].embedding;

    // Find the most relevant embedding
    let maxSimilarity = -1;
    let mostRelevantContent = "";
    for (const embedding of embeddings) {
      const similarity = cosineSimilarity(queryEmbedding, embedding.embedding);
      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
        mostRelevantContent = embedding.content;
      }
    }

    // Relevance threshold
    const relevanceThreshold = 0.75;
    if (maxSimilarity < relevanceThreshold) {
      return NextResponse.json({
        message: "I'm here to help with portfolio-related questions! Please ask about my experience, projects, or skills.",
      });
    }

    // Define system message with explicit type
    const systemMessage: OpenAI.ChatCompletionSystemMessageParam = {
      role: "system",
      content: `You are a helpful assistant that only answers questions related to the provided portfolio context. Do not provide general knowledge or answers unrelated to the context. If the query is not relevant, politely refuse to answer. Context:\n${mostRelevantContent.slice(0, 8000)}`,
    };

    // Generate response based on relevant content
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
    return NextResponse.json({ error: "Failed to process chat" }, { status: 500 });
  }
}