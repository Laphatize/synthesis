"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { apiFetch } from "./api";

/**
 * Extracts meaningful keywords from editor plain text.
 * Strips very short / common words, returns top terms by frequency.
 */
function extractQuery(text, maxWords = 6) {
  const stop = new Set([
    "the", "a", "an", "and", "or", "but", "is", "are", "was", "were",
    "be", "been", "being", "have", "has", "had", "do", "does", "did",
    "will", "would", "shall", "should", "may", "might", "must", "can",
    "could", "to", "of", "in", "for", "on", "with", "at", "by", "from",
    "as", "into", "through", "during", "before", "after", "above",
    "below", "between", "out", "off", "over", "under", "again", "further",
    "then", "once", "here", "there", "when", "where", "why", "how", "all",
    "each", "every", "both", "few", "more", "most", "other", "some",
    "such", "no", "nor", "not", "only", "own", "same", "so", "than",
    "too", "very", "just", "because", "if", "about", "up", "its", "it",
    "this", "that", "these", "those", "i", "we", "you", "he", "she",
    "they", "me", "him", "her", "us", "them", "my", "your", "his",
    "our", "their", "what", "which", "who", "whom", "while", "also",
    "new", "one", "two", "like", "get", "make", "go", "know", "take",
    "see", "come", "think", "look", "want", "give", "use", "find",
    "tell", "ask", "work", "seem", "feel", "try", "leave", "call",
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stop.has(w));

  // Frequency count
  const freq = {};
  for (const w of words) {
    freq[w] = (freq[w] || 0) + 1;
  }

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxWords)
    .map(([w]) => w)
    .join(" ");
}

/**
 * Hook: watches editor plain text, debounces, queries ArXiv.
 * Returns { papers, loading, query }
 */
export function useArxivSuggestions(plainText, { delay = 2000, minLength = 30 } = {}) {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const timerRef = useRef(null);
  const lastQueryRef = useRef("");
  const abortRef = useRef(null);

  const search = useCallback(async (q) => {
    if (!q || q === lastQueryRef.current) return;
    lastQueryRef.current = q;
    setQuery(q);
    setLoading(true);

    // Abort any in-flight request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const data = await apiFetch(`/api/arxiv/search?q=${encodeURIComponent(q)}&max=6`);
      if (!controller.signal.aborted) {
        setPapers(data.papers || []);
      }
    } catch {
      if (!controller.signal.aborted) setPapers([]);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(timerRef.current);

    if (!plainText || plainText.length < minLength) {
      setPapers([]);
      setQuery("");
      return;
    }

    timerRef.current = setTimeout(() => {
      const q = extractQuery(plainText);
      if (q.trim()) search(q);
    }, delay);

    return () => clearTimeout(timerRef.current);
  }, [plainText, delay, minLength, search]);

  return { papers, loading, query };
}
