const express = require("express");
const router = express.Router();
const { chatCompletion } = require("../lib/llm");

/**
 * ArXiv API proxy – searches the arXiv Atom feed and returns
 * a clean JSON array of papers.
 *
 * GET /api/arxiv/search?q=<query>&max=<n>
 */
router.get("/search", async (req, res) => {
  try {
    const query = (req.query.q || "").trim();
    const max = Math.min(parseInt(req.query.max, 10) || 8, 20);

    if (!query) return res.json({ papers: [] });

    const searchQuery = encodeURIComponent(query);
    const url = `http://export.arxiv.org/api/query?search_query=all:${searchQuery}&start=0&max_results=${max}&sortBy=relevance&sortOrder=descending`;

    const response = await fetch(url, {
      headers: { "User-Agent": "Synthesis/1.0" },
    });

    if (!response.ok) {
      console.error("ArXiv API error:", response.status);
      return res.json({ papers: [] });
    }

    const xml = await response.text();
    const papers = parseAtomFeed(xml);

    res.json({ papers });
  } catch (err) {
    console.error("ArXiv search error:", err.message);
    res.json({ papers: [] });
  }
});

/**
 * Lightweight Atom/XML parser – no dependencies.
 * Extracts id, title, summary, authors, published, links from ArXiv feed.
 */
function parseAtomFeed(xml) {
  const entries = xml.split("<entry>").slice(1); // skip the feed header

  return entries.map((entry) => {
    const get = (tag) => {
      const match = entry.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
      return match ? match[1].trim().replace(/\s+/g, " ") : "";
    };

    const id = get("id");
    const title = get("title");
    const summary = get("summary");
    const published = get("published");

    // Authors
    const authorMatches = [...entry.matchAll(/<author>\s*<name>([^<]+)<\/name>/g)];
    const authors = authorMatches.map((m) => m[1].trim());

    // PDF link
    const pdfMatch = entry.match(/href="([^"]*)"[^>]*title="pdf"/);
    const pdfUrl = pdfMatch ? pdfMatch[1] : "";

    // Abstract page link
    const absUrl = id.replace("http://", "https://");

    // Categories
    const categoryMatches = [...entry.matchAll(/category[^>]*term="([^"]+)"/g)];
    const categories = categoryMatches.map((m) => m[1]);

    return {
      id,
      title,
      summary,
      summaryShort: summary.length > 300 ? summary.slice(0, 300) + "…" : summary,
      authors: authors.slice(0, 4),
      published: published.slice(0, 10),
      pdfUrl,
      absUrl,
      categories: categories.slice(0, 3),
    };
  });
}

module.exports = router;

// ─── AI text transform (bubble menu actions) ────────────────────────────────

const TRANSFORM_PROMPTS = {
  elaborate: {
    instruction: "Elaborate on the following text. Expand the ideas with more detail, examples, and nuance while keeping the same tone. Return only the expanded text, no preamble.",
  },
  explore: {
    instruction: "Explore the ideas in the following text further. Go deeper into the implications, connections, and related concepts. Return only the expanded exploration, no preamble.",
  },
  simplify: {
    instruction: "Simplify the following text. Make it clearer and easier to understand while preserving the core meaning. Return only the simplified text, no preamble.",
  },
  shorten: {
    instruction: "Condense the following text to be more concise. Remove redundancy and tighten the prose while keeping the key points. Return only the shortened text, no preamble.",
  },
  academic: {
    instruction: "Rewrite the following text in a formal academic tone suitable for a research paper. Return only the rewritten text, no preamble.",
  },
  counterargument: {
    instruction: "Generate a thoughtful counterargument or alternative perspective to the ideas in the following text. Return only the counterargument, no preamble.",
  },
};

/**
 * POST /api/arxiv/transform
 * Body: { text: string, action: string, context?: string }
 * Returns: { result: string }
 */
router.post("/transform", async (req, res) => {
  try {
    const { text, action, context } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: "text is required" });

    const prompt = TRANSFORM_PROMPTS[action];
    if (!prompt) return res.status(400).json({ error: `Unknown action: ${action}` });

    const messages = [
      {
        role: "system",
        content: `You are a writing assistant in a tool called Synthesis. ${prompt.instruction}`,
      },
    ];

    if (context) {
      messages.push({
        role: "user",
        content: `Here is the broader document context:\n\n${context.slice(0, 2000)}\n\nNow, transform this selected text:\n\n${text}`,
      });
    } else {
      messages.push({ role: "user", content: text });
    }

    const result = await chatCompletion(messages, { temperature: 0.6, maxTokens: 1500 });
    res.json({ result });
  } catch (err) {
    console.error("Transform error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Generate doc from topic ─────────────────────────────────────────────────

/**
 * POST /api/arxiv/generate
 * Body: { topic: string }
 * Returns: { title: string, content: string }
 */
router.post("/generate", async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic?.trim()) {
      return res.status(400).json({ error: "topic is required" });
    }

    const messages = [
      {
        role: "system",
        content: `You are a research writing assistant in a tool called Synthesis. Given a topic, generate a well-structured starter document that the user can continue editing. Output HTML suitable for a Tiptap rich-text editor (use <h1>, <h2>, <p>, <ul>/<li>, <blockquote>, <strong>, <em> tags). Also return a concise title. Respond ONLY with valid JSON: { "title": "...", "content": "<html string>" }. No markdown fences.`,
      },
      {
        role: "user",
        content: `Generate a starter research document about: ${topic.trim()}`,
      },
    ];

    const raw = await chatCompletion(messages, { temperature: 0.7, maxTokens: 2048 });

    // Parse JSON from LLM response
    let parsed;
    try {
      // Strip markdown fences if the model adds them anyway
      const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      // Fallback: use raw text as content
      parsed = { title: topic.trim(), content: `<p>${raw}</p>` };
    }

    res.json({ title: parsed.title, content: parsed.content });
  } catch (err) {
    console.error("Generate doc error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Paper analysis: suggestions for applying to user's writing ──────────────

/**
 * POST /api/arxiv/analyze
 * Body: { paper: { title, summary, authors }, userText: string }
 * Returns: { suggestions: string }
 */
router.post("/analyze", async (req, res) => {
  try {
    const { paper, userText } = req.body;
    if (!paper?.title || !paper?.summary) {
      return res.status(400).json({ error: "paper.title and paper.summary are required" });
    }

    const messages = [
      {
        role: "system",
        content: `You are a research assistant embedded in a writing tool called Synthesis. The user is writing a document and has found a relevant research paper. Analyze the paper and suggest concrete ways its findings, methods, or ideas could be applied to or improve the user's writing. Be specific, actionable, and concise. Use markdown formatting. Provide 3-5 suggestions as bullet points, each with a brief explanation.`,
      },
      {
        role: "user",
        content: `## Paper
**Title:** ${paper.title}
**Authors:** ${(paper.authors || []).join(", ")}
**Abstract:** ${paper.summary}

## My current writing
${userText ? userText.slice(0, 3000) : "(No content yet — give general suggestions for how this paper's ideas could be explored.)"}

Give me specific suggestions for how ideas from this paper could be applied to or enrich my writing.`,
      },
    ];

    const suggestions = await chatCompletion(messages, { temperature: 0.6, maxTokens: 1024 });
    res.json({ suggestions });
  } catch (err) {
    console.error("Paper analyze error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Paper chat: ask follow-up questions about a paper ──────────────────────

/**
 * POST /api/arxiv/chat
 * Body: { paper: { title, summary, authors }, history: [{ role, content }], message: string }
 * Returns: { reply: string }
 */
router.post("/chat", async (req, res) => {
  try {
    const { paper, history = [], message } = req.body;
    if (!paper?.title || !message) {
      return res.status(400).json({ error: "paper and message are required" });
    }

    const messages = [
      {
        role: "system",
        content: `You are a knowledgeable research assistant. The user is reading a research paper and wants to ask questions about it. Answer clearly and concisely using the paper's information. Use markdown formatting when helpful. If you don't know something that isn't in the abstract, say so honestly.

Paper context:
- Title: ${paper.title}
- Authors: ${(paper.authors || []).join(", ")}
- Abstract: ${paper.summary}`,
      },
      // Include conversation history (capped to last 10 turns)
      ...history.slice(-10),
      { role: "user", content: message },
    ];

    const reply = await chatCompletion(messages, { temperature: 0.5, maxTokens: 1024 });
    res.json({ reply });
  } catch (err) {
    console.error("Paper chat error:", err.message);
    res.status(500).json({ error: err.message });
  }
});
