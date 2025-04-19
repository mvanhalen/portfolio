// lib/cache.ts
import { list } from "@vercel/blob";

const BLOB_PATH = "embeddings.json";

export interface Embedding {
  content: string;
  embedding: number[];
  type: "cv" | "url";
  parentType?: "cv" | "url";
  chunkIndex?: number;
  source?: string;
}

// In-memory cache for embeddings
let cachedEmbeddings: Embedding[] | null = null;

// Load embeddings from Vercel Blob
export async function loadEmbeddings(): Promise<Embedding[]> {
  try {
    console.log("Fetching embeddings from Vercel Blob...");
    const { blobs } = await list({ prefix: BLOB_PATH });
    const blob = blobs.find((b) => b.pathname === BLOB_PATH);

    if (!blob) {
      console.warn("No embeddings blob found at path:", BLOB_PATH);
      return [];
    }

    console.log("Found blob:", blob.url);
    const response = await fetch(blob.url, {
      headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch blob content: ${response.statusText}`);
    }

    const data = await response.text();
    if (!data.trim()) {
      console.warn("Embeddings blob is empty");
      return [];
    }

    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) {
      console.warn("Embeddings blob is not a valid array");
      return [];
    }

    console.log("Loaded embeddings count:", parsed.length);
    return parsed;
  } catch (error) {
    console.error("Load embeddings error:", error);
    return [];
  }
}

// Preload embeddings when module is loaded
async function preloadEmbeddings() {
  try {
    console.log("Preloading embeddings from Vercel Blob...");
    cachedEmbeddings = await loadEmbeddings();
    console.log("Embeddings preloaded successfully, count:", cachedEmbeddings.length);
  } catch (error) {
    console.error("Preload embeddings error:", error);
    cachedEmbeddings = [];
  }
}

// Execute preload immediately
preloadEmbeddings().catch((error) => {
  console.error("Failed to preload embeddings:", error);
});

// Get cached embeddings
export function getCachedEmbeddings(): Embedding[] {
  console.log("Cache state:", !!cachedEmbeddings, "Count:", cachedEmbeddings?.length || 0);
  return cachedEmbeddings || [];
}

// Set cached embeddings (e.g., after updating embeddings)
export function setCachedEmbeddings(embeddings: Embedding[] | null) {
  cachedEmbeddings = embeddings || [];
  console.log("Cache updated, count:", cachedEmbeddings.length);
}