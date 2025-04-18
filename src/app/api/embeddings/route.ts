import { NextResponse } from "next/server";
import { OpenAI } from "openai";
import { put, list } from "@vercel/blob";
import * as cheerio from "cheerio";
import axios from "axios";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const BLOB_PATH = "embeddings.json";

export async function GET() {
  try {
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
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    console.error("Blob read error:", error);
    return NextResponse.json({ error: "Failed to read embeddings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { cvText, urls } = await request.json();

    // Read existing embeddings from Blob
    let existingEmbeddings: any[] = [];
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

    // Process CV text
    const newEmbeddings: any[] = [];
    if (cvText) {
      const embedding = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: cvText,
      });
      newEmbeddings.push({
        content: cvText,
        embedding: embedding.data[0].embedding,
        type: "cv",
      });
    }

    // Process URLs
    for (const url of urls || []) {
      try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const text = $("body").text().replace(/\s+/g, " ").trim();
        const embedding = await openai.embeddings.create({
          model: "text-embedding-ada-002",
          input: text.slice(0, 8000),
        });
        newEmbeddings.push({
          content: text.slice(0, 8000),
          embedding: embedding.data[0].embedding,
          type: "url",
          source: url,
        });
      } catch (error) {
        console.error(`Failed to crawl ${url}:`, error);
      }
    }

    // Save updated embeddings to Blob
    const updatedEmbeddings = [...existingEmbeddings, ...newEmbeddings];
    await put(BLOB_PATH, JSON.stringify(updatedEmbeddings, null, 2), {
      access: "public",
      allowOverwrite: true
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Embeddings error:", error);
    return NextResponse.json({ error: "Failed to save embeddings" }, { status: 500 });
  }
}