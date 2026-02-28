const express = require("express");
const multer = require("multer");
const prisma = require("../lib/prisma");
const { authenticate } = require("../middleware/auth");
const { embedText, chunkText } = require("../lib/embeddings");
const { cosineSimilarity } = require("../lib/vector");
const { chatCompletion } = require("../lib/llm");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(authenticate);

async function getWorkspaceForUser(workspaceId, userId) {
  return prisma.workspace.findFirst({
    where: {
      id: workspaceId,
      OR: [
        { ownerId: userId },
        { members: { some: { userId } } },
      ],
    },
  });
}

router.get("/", async (req, res) => {
  try {
    const userId = req.user.userId;
    const workspaces = await prisma.workspace.findMany({
      where: {
        OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      },
      include: {
        _count: {
          select: {
            items: true,
            members: true,
            embeddings: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return res.json({ workspaces });
  } catch (err) {
    console.error("Workspaces list error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Workspace name is required" });
    }

    const workspace = await prisma.workspace.create({
      data: {
        name,
        description,
        ownerId: userId,
        members: {
          create: {
            userId,
            role: "owner",
          },
        },
      },
    });

    return res.status(201).json({ workspace });
  } catch (err) {
    console.error("Workspace create error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:workspaceId", async (req, res) => {
  try {
    const userId = req.user.userId;
    const { workspaceId } = req.params;

    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      },
      include: {
        _count: {
          select: {
            items: true,
            members: true,
            embeddings: true,
          },
        },
      },
    });

    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    return res.json({ workspace });
  } catch (err) {
    console.error("Workspace get error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:workspaceId/items", async (req, res) => {
  try {
    const userId = req.user.userId;
    const { workspaceId } = req.params;
    const { type } = req.query;

    const workspace = await getWorkspaceForUser(workspaceId, userId);
    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    const items = await prisma.workspaceItem.findMany({
      where: {
        workspaceId,
        ...(type ? { type } : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ items });
  } catch (err) {
    console.error("Workspace items list error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:workspaceId/items", async (req, res) => {
  try {
    const userId = req.user.userId;
    const { workspaceId } = req.params;
    const {
      type,
      title,
      content,
      url,
      metadata,
      autoEmbed = true,
    } = req.body;

    if (!type) {
      return res.status(400).json({ error: "Item type is required" });
    }

    const workspace = await getWorkspaceForUser(workspaceId, userId);
    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    const item = await prisma.workspaceItem.create({
      data: {
        workspaceId,
        type,
        title,
        content,
        url,
        metadata,
      },
    });

    let embeddingsCreated = 0;

    if (autoEmbed && (content || title)) {
      const chunks = chunkText(content || title);
      for (const chunk of chunks) {
        const { vector, model, dimensions } = await embedText(chunk);
        await prisma.embedding.create({
          data: {
            workspaceId,
            itemId: item.id,
            content: chunk,
            vector,
            model,
            dimensions,
          },
        });
        embeddingsCreated += 1;
      }
    }

    return res.status(201).json({ item, embeddingsCreated });
  } catch (err) {
    console.error("Workspace item create error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/workspaces/:workspaceId/items/:itemId
router.patch("/:workspaceId/items/:itemId", async (req, res) => {
  try {
    const userId = req.user.userId;
    const { workspaceId, itemId } = req.params;
    const { title, content, url, metadata } = req.body;

    const workspace = await getWorkspaceForUser(workspaceId, userId);
    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    const existing = await prisma.workspaceItem.findFirst({
      where: { id: itemId, workspaceId },
    });
    if (!existing) {
      return res.status(404).json({ error: "Item not found" });
    }

    const data = {};
    if (title !== undefined) data.title = title;
    if (content !== undefined) data.content = content;
    if (url !== undefined) data.url = url;
    if (metadata !== undefined) data.metadata = metadata;

    const item = await prisma.workspaceItem.update({
      where: { id: itemId },
      data,
    });

    // Auto-embed on content change (fire-and-forget)
    if (content !== undefined && content) {
      embedItemInBackground(workspaceId, itemId, content).catch(() => {});
    }

    return res.json({ item });
  } catch (err) {
    console.error("Workspace item update error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Re-embeds a workspace item. Deletes old embeddings, creates new ones.
 */
async function embedItemInBackground(workspaceId, itemId, content) {
  try {
    // Strip HTML tags for embedding
    const plainText = content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (!plainText || plainText.length < 20) return;

    // Delete old embeddings for this item
    await prisma.embedding.deleteMany({ where: { itemId } });

    const chunks = chunkText(plainText);
    for (const chunk of chunks) {
      const { vector, model, dimensions } = await embedText(chunk);
      await prisma.embedding.create({
        data: { workspaceId, itemId, content: chunk, vector, model, dimensions },
      });
    }
  } catch (err) {
    console.error("Background embed error:", err.message);
  }
}

// DELETE /api/workspaces/:workspaceId/items/:itemId
router.delete("/:workspaceId/items/:itemId", async (req, res) => {
  try {
    const userId = req.user.userId;
    const { workspaceId, itemId } = req.params;

    const workspace = await getWorkspaceForUser(workspaceId, userId);
    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    const existing = await prisma.workspaceItem.findFirst({
      where: { id: itemId, workspaceId },
    });
    if (!existing) {
      return res.status(404).json({ error: "Item not found" });
    }

    await prisma.workspaceItem.delete({ where: { id: itemId } });

    return res.json({ deleted: true });
  } catch (err) {
    console.error("Workspace item delete error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:workspaceId/items/:itemId/embeddings", async (req, res) => {
  try {
    const userId = req.user.userId;
    const { workspaceId, itemId } = req.params;
    const { content } = req.body;

    const workspace = await getWorkspaceForUser(workspaceId, userId);
    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    const item = await prisma.workspaceItem.findFirst({
      where: { id: itemId, workspaceId },
    });

    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    const text = content || item.content || item.title;
    if (!text) {
      return res.status(400).json({ error: "No content provided to embed" });
    }

    const chunks = chunkText(text);
    let embeddingsCreated = 0;

    for (const chunk of chunks) {
      const { vector, model, dimensions } = await embedText(chunk);
      await prisma.embedding.create({
        data: {
          workspaceId,
          itemId: item.id,
          content: chunk,
          vector,
          model,
          dimensions,
        },
      });
      embeddingsCreated += 1;
    }

    return res.json({ embeddingsCreated });
  } catch (err) {
    console.error("Item embed error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:workspaceId/search", async (req, res) => {
  try {
    const userId = req.user.userId;
    const { workspaceId } = req.params;
    const { query, limit = 6, threshold = 0 } = req.body;

    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    const workspace = await getWorkspaceForUser(workspaceId, userId);
    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    const { vector: queryVector, model, dimensions } = await embedText(query);
    const embeddings = await prisma.embedding.findMany({
      where: { workspaceId },
      include: { item: true },
    });

    const results = embeddings
      .filter((embedding) => embedding.dimensions === dimensions)
      .map((embedding) => ({
        score: cosineSimilarity(queryVector, embedding.vector),
        embeddingId: embedding.id,
        item: embedding.item,
        content: embedding.content,
      }))
      .filter((result) => result.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return res.json({
      query,
      model,
      dimensions,
      results,
    });
  } catch (err) {
    console.error("Workspace search error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;

// ─── File upload ─────────────────────────────────────────────────────────────

/**
 * POST /api/workspaces/:workspaceId/upload
 * Multipart form: file (required), title (optional)
 * Supports: CSV, JSON, TXT, MD, TSV, XML and other text-based files.
 * Stores file content as a workspace item of type "file" and auto-embeds.
 */
router.post("/:workspaceId/upload", upload.single("file"), async (req, res) => {
  try {
    const userId = req.user.userId;
    const { workspaceId } = req.params;

    const workspace = await getWorkspaceForUser(workspaceId, userId);
    if (!workspace) return res.status(404).json({ error: "Workspace not found" });

    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const fileName = req.file.originalname || "Uploaded file";
    const mimeType = req.file.mimetype || "text/plain";
    const fileContent = req.file.buffer.toString("utf-8");
    const fileTitle = req.body.title || fileName;
    const fileSize = req.file.size;

    // Determine item type from extension
    const ext = fileName.split(".").pop().toLowerCase();
    const typeMap = {
      csv: "dataset", tsv: "dataset", json: "dataset", xml: "dataset",
      txt: "reference", md: "reference", tex: "reference", bib: "reference",
    };
    const itemType = typeMap[ext] || "file";

    const item = await prisma.workspaceItem.create({
      data: {
        workspaceId,
        type: itemType,
        title: fileTitle,
        content: fileContent,
        metadata: { fileName, mimeType, fileSize, extension: ext },
      },
    });

    // Auto-embed in background
    embedItemInBackground(workspaceId, item.id, fileContent).catch(() => {});

    return res.status(201).json({ item });
  } catch (err) {
    console.error("File upload error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Genie: AI research assistant with RAG ──────────────────────────────────

/**
 * POST /api/workspaces/:workspaceId/genie
 * Body: { message: string, history?: [{ role, content }] }
 * Uses vector search over workspace items for context, then LLM.
 * Can also generate data files when asked.
 */
router.post("/:workspaceId/genie", async (req, res) => {
  try {
    const userId = req.user.userId;
    const { workspaceId } = req.params;
    const { message, history = [] } = req.body;

    if (!message?.trim()) return res.status(400).json({ error: "message is required" });

    const workspace = await getWorkspaceForUser(workspaceId, userId);
    if (!workspace) return res.status(404).json({ error: "Workspace not found" });

    // RAG: search workspace embeddings for relevant context
    let contextChunks = [];
    try {
      const { vector: queryVector, dimensions } = await embedText(message);
      const embeddings = await prisma.embedding.findMany({
        where: { workspaceId },
        include: { item: { select: { id: true, title: true, type: true } } },
      });

      contextChunks = embeddings
        .filter((e) => e.dimensions === dimensions)
        .map((e) => ({
          score: cosineSimilarity(queryVector, e.vector),
          content: e.content,
          itemTitle: e.item?.title,
          itemType: e.item?.type,
        }))
        .filter((r) => r.score > 0.1)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8);
    } catch {
      // If embedding fails, continue without context
    }

    const contextBlock = contextChunks.length > 0
      ? `\n\nRelevant workspace content:\n${contextChunks.map((c, i) =>
          `[${c.itemType}: ${c.itemTitle}] ${c.content}`
        ).join("\n\n")}`
      : "";

    const messages = [
      {
        role: "system",
        content: `You are Genie, an AI research assistant inside a workspace called "${workspace.name}" in Synthesis. You have access to the workspace's documents, datasets, and references through semantic search.

Your capabilities:
1. Answer questions about workspace content using the context provided
2. Find connections between documents and data
3. When asked to find or generate example data, respond with a special JSON block that will create a file in the workspace

When creating data files, wrap them in a tagged block like this:
\`\`\`genie-file
{"title": "filename.csv", "type": "dataset", "content": "col1,col2\\nval1,val2\\n..."}
\`\`\`

Use markdown formatting in your responses. Be concise and helpful.${contextBlock}`,
      },
      ...history.slice(-10),
      { role: "user", content: message },
    ];

    const reply = await chatCompletion(messages, { temperature: 0.5, maxTokens: 2048 });

    // Parse any genie-file blocks from the response
    const fileBlocks = [];
    const fileRegex = /```genie-file\s*\n([\s\S]*?)```/g;
    let match;
    while ((match = fileRegex.exec(reply)) !== null) {
      try {
        const fileData = JSON.parse(match[1].trim());
        if (fileData.title && fileData.content) {
          fileBlocks.push(fileData);
        }
      } catch {
        // skip malformed blocks
      }
    }

    // Create any files Genie generated
    const createdItems = [];
    for (const fileData of fileBlocks) {
      try {
        const item = await prisma.workspaceItem.create({
          data: {
            workspaceId,
            type: fileData.type || "dataset",
            title: fileData.title,
            content: fileData.content,
            metadata: { createdBy: "genie" },
          },
        });
        createdItems.push(item);
        // Auto-embed
        embedItemInBackground(workspaceId, item.id, fileData.content).catch(() => {});
      } catch {
        // skip
      }
    }

    // Clean up the reply - replace file blocks with a cleaner reference
    let cleanReply = reply;
    for (const fileData of fileBlocks) {
      cleanReply = cleanReply.replace(
        /```genie-file\s*\n[\s\S]*?```/,
        `📎 Created file: **${fileData.title}**`
      );
    }

    res.json({ reply: cleanReply, createdItems });
  } catch (err) {
    console.error("Genie error:", err.message);
    res.status(500).json({ error: err.message });
  }
});
