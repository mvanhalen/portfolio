import { NextResponse } from "next/server";
import { OpenAI } from "openai";
import { put, list } from "@vercel/blob";
import * as cheerio from "cheerio";
import axios from "axios";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const BLOB_PATH = "embeddings.json";

// In-memory cache for embeddings (shared with chat route)
export let cachedEmbeddings: Embedding[] | null = null;

interface Embedding {
  content: string;
  embedding: number[];
  type: "cv" | "url";
  parentType: "cv" | "url";
  chunkIndex: number;
  source?: string;
}

// Chunk content into smaller pieces
function chunkContent(content: string, chunkSize: number = 500): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < content.length; i += chunkSize) {
    chunks.push(content.slice(i, i + chunkSize));
  }
  return chunks;
}

export async function GET() {
  try {
    // Return cached embeddings if available
    if (cachedEmbeddings) {
      return NextResponse.json(cachedEmbeddings);
    }

    // List blobs to find embeddings.json
    const { blobs } = await list({ prefix: BLOB_PATH });
    const blob = blobs.find((b) => b.pathname === BLOB_PATH);

    if (!blob) {
      return NextResponse.json([]);
    }

    // Fetch blob content
    const response = await fetch(blob.url, {
      headers: {
        Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch blob content");
    }

    const data = await response.text();
    cachedEmbeddings = JSON.parse(data);
    return NextResponse.json(cachedEmbeddings);
  } catch (error) {
    console.error("Blob read error:", error);
    return NextResponse.json({ error: "Failed to read embeddings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { cvText, urls } = await request.json();

    // Read existing embeddings from Blob
    let existingEmbeddings: Embedding[] = [];
    try {
      const { blobs } = await list({ prefix: BLOB_PATH });
      const blob = blobs.find((b) => b.pathname === BLOB_PATH);

      if (blob) {
        const response = await fetch(blob.url, {
          headers: {
            Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
          },
        });

        if (response.ok) {
          const data = await response.text();
          existingEmbeddings = JSON.parse(data);
        }
      }
    } catch {}

    // Process CV text as chunks
    const newEmbeddings: Embedding[] = [];
    if (cvText) {
      const chunks = chunkContent(cvText, 500);
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embedding = await openai.embeddings.create({
          model: "text-embedding-ada-002",
          input: chunk,
        });
        newEmbeddings.push({
          content: chunk,
          embedding: embedding.data[0].embedding,
          type: "cv",
          parentType: "cv",
          chunkIndex: i,
        });
      }
    }

    // Process URLs as chunks
    for (const url of urls || []) {
      try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const text = $("body").text().replace(/\s+/g, " ").trim();
        const chunks = chunkContent(text.slice(0, 8000), 500);
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          const embedding = await openai.embeddings.create({
            model: "text-embedding-ada-002",
            input: chunk,
          });
          newEmbeddings.push({
            content: chunk,
            embedding: embedding.data[0].embedding,
            type: "url",
            parentType: "url",
            chunkIndex: i,
            source: url,
          });
        }
      } catch (error) {
        console.error(`Failed to crawl ${url}:`, error);
      }
    }

    // Save updated embeddings to Blob
    const updatedEmbeddings = [...existingEmbeddings, ...newEmbeddings];
    await put(BLOB_PATH, JSON.stringify(updatedEmbeddings, null, 2), {
      access: "public",
      allowOverwrite: true,
    });

    // Update cache
    cachedEmbeddings = updatedEmbeddings;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Embeddings error:", error);
    return NextResponse.json({ error: "Failed to save embeddings" }, { status: 500 });
  }
}