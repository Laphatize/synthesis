const express = require("express");
const prisma = require("../lib/prisma");
const { authenticate } = require("../middleware/auth");
const { embedText, chunkText } = require("../lib/embeddings");
const { cosineSimilarity } = require("../lib/vector");

const router = express.Router();

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

    return res.json({ item });
  } catch (err) {
    console.error("Workspace item update error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

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
