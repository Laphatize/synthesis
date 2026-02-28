/**
 * Thin OpenAI chat-completion wrapper.
 * Requires OPENAI_API_KEY in env.
 */

const MODEL = process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini";

async function chatCompletion(messages, { temperature = 0.7, maxTokens = 1024 } = {}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

module.exports = { chatCompletion };
