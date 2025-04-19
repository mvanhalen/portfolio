import { NextResponse } from "next/server";
import { OpenAI } from "openai";
import { getCachedEmbeddings } from "@/lib/cache";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

    // Load embeddings from cache
    const embeddings = getCachedEmbeddings() || [];
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

    // Relaxed keyword pre-filtering
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

    // Relaxed dynamic threshold (50th percentile, minimum 0.7)
    const sortedSimilarities = similarities.slice().sort((a, b) => b - a);
    const dynamicThreshold = Math.max(
      sortedSimilarities[Math.floor(sortedSimilarities.length * 0.5)] || 0.7,
      0.7
    );

    // Find relevant embeddings
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

    // Sort by similarity, then chunkIndex
    relevantEmbeddings.sort((a, b) => {
      if (a.source === b.source) {
        return (a.chunkIndex || 0) - (b.chunkIndex || 0);
      }
      return b.similarity - a.similarity;
    });

    // Combine top 3 embeddings
    const topRelevantContent = relevantEmbeddings
      .slice(0, 3)
      .map((e) => e.content)
      .join("\n\n")
      .slice(0, 8000);

    // Check for relevant content
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
      max_tokens: 150,
    });

    let message = completion.choices[0].message.content;
    // Override vague OpenAI responses
    if (
      message?.toLowerCase().includes("need more context") ||
      message?.toLowerCase().includes("more information")
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