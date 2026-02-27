const crypto = require("crypto");

const DEFAULT_DIMENSIONS = parseInt(process.env.EMBEDDING_DIM || "384", 10);
const OPENAI_MODEL = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";

function normalizeVector(vector) {
  const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0)) || 1;
  return vector.map((val) => val / norm);
}

function hashToIndex(token, dimensions) {
  const hash = crypto.createHash("sha256").update(token).digest();
  const value = hash.readUInt16LE(0);
  return value % dimensions;
}

function localEmbed(text, dimensions = DEFAULT_DIMENSIONS) {
  const tokens = (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  const vector = new Array(dimensions).fill(0);

  for (const token of tokens) {
    const index = hashToIndex(token, dimensions);
    vector[index] += 1;
  }

  return normalizeVector(vector);
}

async function openAiEmbed(text) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      input: text,
      model: OPENAI_MODEL,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI embeddings failed: ${response.status} ${errorBody}`);
  }

  const data = await response.json();
  const embedding = data?.data?.[0]?.embedding;

  if (!Array.isArray(embedding)) {
    throw new Error("OpenAI embeddings missing from response");
  }

  return { vector: embedding, model: OPENAI_MODEL, dimensions: embedding.length };
}

async function embedText(text) {
  if (process.env.OPENAI_API_KEY) {
    return openAiEmbed(text);
  }

  const vector = localEmbed(text);
  return { vector, model: "local-hash-v1", dimensions: vector.length };
}

function chunkText(text, maxChars = 900) {
  if (!text) return [];
  const paragraphs = text.split(/\n+/).map((p) => p.trim()).filter(Boolean);
  const chunks = [];

  for (const paragraph of paragraphs) {
    if (paragraph.length <= maxChars) {
      chunks.push(paragraph);
      continue;
    }

    for (let i = 0; i < paragraph.length; i += maxChars) {
      chunks.push(paragraph.slice(i, i + maxChars));
    }
  }

  return chunks;
}

module.exports = {
  embedText,
  chunkText,
  localEmbed,
};
