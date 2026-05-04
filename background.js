// background.js — Service Worker (Manifest V3)
// Handles all AI API communication securely, away from the frontend.

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const PROXY_URL = "https://ai-page-summarizer-chi.vercel.app/api/summarize";

// Message Router***********************************************************
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SUMMARIZE") {
    handleSummarize(message.payload)
      .then((result) => sendResponse({ success: true, data: result }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true; // keep channel open for async response
  }

  if (message.type === "HIGHLIGHT") {
    forwardToContentScript(message, sender, sendResponse);
    return true;
  }

  if (message.type === "CLEAR_CACHE") {
    clearCache(message.payload?.url).then(() =>
      sendResponse({ success: true })
    );
    return true;
  }
});

// Main Summarize Handler*********************************************
async function handleSummarize({ url, title, content, mode }) {
  // 1. Validate inputs
  if (!content || content.trim().length < 100) {
    throw new Error("Not enough readable content on this page.");
  }

  // 2. Check cache
  const cacheKey = `summary_${hashString(url)}_${mode}`;
  const cached = await getCached(cacheKey);
  if (cached) return { ...cached, fromCache: true };

  // 3. Truncate content to avoid token limits (~12k chars ≈ ~3k tokens)
  const truncated = content.trim().slice(0, 12000);

  // 4. Build prompt based on mode
  const prompt = buildPrompt(title, truncated, mode);

  // 5. Call Proxy API
  const summary = await callProxyAPI(prompt);

  // 6. Parse the structured response
  const parsed = parseResponse(summary);

  // 7. Cache result
  await setCached(cacheKey, parsed);

  return { ...parsed, fromCache: false };
}

// Proxy API Call *********************************************************
async function callProxyAPI(prompt) {
  const targetModel = "gemini-flash-latest"; // Standardized model
  try {
    const response = await fetch(PROXY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt, model: targetModel }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error || `Proxy error (${response.status})`);
    }

    const data = await response.json();
    return data.text;
  } catch (err) {
    throw new Error(`Proxy connection failed: ${err.message}`);
  }
}

// Prompt Builder ************************************************************
function buildPrompt(title, content, mode) {
  const brevity =
    mode === "brief"
      ? "Provide exactly 3 bullet points max. Be ultra-concise."
      : "Provide 5–8 bullet points.";

  return `You are an expert content analyst. Analyze this webpage and respond ONLY with a valid JSON object — no markdown, no extra text.

Page title: "${title}"

Content:
"""
${content}
"""

${brevity}

Respond with this exact JSON structure:
{
  "summary": ["bullet point 1", "bullet point 2", "bullet point 3"],
  "insights": ["key insight 1", "key insight 2"],
  "readingTime": 4,
  "highlights": ["exact short phrase from text to highlight 1", "exact short phrase 2"],
  "topic": "one-line topic label"
}

Rules:
- "summary": array of concise bullet strings (no dashes/bullets in the string itself)
- "insights": array of 2–3 deeper takeaways
- "readingTime": integer minutes (estimate based on content length)
- "highlights": array of 2–4 short exact phrases (under 8 words each) that exist verbatim in the source text
- "topic": single short label like "Technology / AI" or "Politics / Climate"
- All values must be plain text, no HTML`;
}

// Response Parser ************************************************************
function parseResponse(raw) {
  try {
    // Strip any accidental markdown fences
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      summary: Array.isArray(parsed.summary) ? parsed.summary : [],
      insights: Array.isArray(parsed.insights) ? parsed.insights : [],
      readingTime: parseInt(parsed.readingTime) || 1,
      highlights: Array.isArray(parsed.highlights) ? parsed.highlights : [],
      topic: parsed.topic || "General",
    };
  } catch {
    // Fallback: treat raw text as single summary bullet
    return {
      summary: [raw.slice(0, 300)],
      insights: [],
      readingTime: 1,
      highlights: [],
      topic: "Unknown",
    };
  }
}

// Content Script Forwarding ************************************************************
async function forwardToContentScript(message, _sender, sendResponse) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    sendResponse({ success: false, error: "No active tab found." });
    return;
  }
  chrome.tabs.sendMessage(tab.id, message, (response) => {
    sendResponse(response || { success: false, error: "Content script not ready." });
  });
}

// Cache Utilities ***********************************************************************
async function getCached(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (result) => {
      const entry = result[key];
      if (!entry) return resolve(null);
      if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
        chrome.storage.local.remove(key);
        return resolve(null);
      }
      resolve(entry.data);
    });
  });
}

async function setCached(key, data) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: { data, timestamp: Date.now() } }, resolve);
  });
}

async function clearCache(url) {
  if (!url) {
    return new Promise((resolve) => chrome.storage.local.clear(resolve));
  }
  const key = `summary_${hashString(url)}`;
  return new Promise((resolve) =>
    chrome.storage.local.remove([key + "_full", key + "_brief"], resolve)
  );
}

// Hash Helper ******************************************************************
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}
