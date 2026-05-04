// content.js — Content Script
// Runs in the context of the webpage.
// Responsibilities: extract readable content, apply/remove highlights.

(() => {
  // Prevent double-injection
  if (window.__aiSummarizerInjected) return;
  window.__aiSummarizerInjected = true;

  // ─── Message Listener ────────────────────────────────────────────────────────
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === "EXTRACT_CONTENT") {
      try {
        const result = extractContent();
        sendResponse({ success: true, data: result });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
      return true;
    }

    if (message.type === "HIGHLIGHT") {
      try {
        const count = applyHighlights(message.payload?.phrases || []);
        sendResponse({ success: true, count });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
      return true;
    }

    if (message.type === "CLEAR_HIGHLIGHTS") {
      clearHighlights();
      sendResponse({ success: true });
      return true;
    }
  });

  // ─── Content Extraction ──────────────────────────────────────────────────────
  function extractContent() {
    // Priority order for main content selectors
    const CONTENT_SELECTORS = [
      "article",
      '[role="main"]',
      "main",
      ".article-body",
      ".post-content",
      ".entry-content",
      ".article-content",
      ".story-body",
      ".content-body",
      "#article-body",
      "#main-content",
      ".main-content",
    ];

    // Elements to strip (noise)
    const NOISE_SELECTORS = [
      "nav", "header", "footer", "aside", ".sidebar", ".advertisement",
      ".ads", ".ad", "[class*='comment']", ".share", ".social",
      ".newsletter", ".popup", ".modal", ".cookie", ".banner",
      "script", "style", "noscript", "iframe", "form",
      '[role="navigation"]', '[role="banner"]', '[role="complementary"]',
      '[aria-label="advertisement"]',
    ];

    // Clone document to safely manipulate without affecting the page
    const clone = document.cloneNode(true);

    // Remove noise elements from clone
    NOISE_SELECTORS.forEach((sel) => {
      clone.querySelectorAll(sel).forEach((el) => el.remove());
    });

    // Try content selectors in priority order
    let contentEl = null;
    for (const sel of CONTENT_SELECTORS) {
      const el = clone.querySelector(sel);
      if (el && el.innerText?.trim().length > 200) {
        contentEl = el;
        break;
      }
    }

    // Fallback: largest text block heuristic
    if (!contentEl) {
      contentEl = findLargestTextBlock(clone);
    }

    // Final fallback: body
    if (!contentEl) {
      contentEl = clone.body;
    }

    const rawText = contentEl?.innerText || contentEl?.textContent || "";
    const cleaned = cleanText(rawText);

    return {
      content: cleaned,
      title: document.title || "",
      url: window.location.href,
      wordCount: cleaned.split(/\s+/).filter(Boolean).length,
    };
  }

  // Find the element with the most meaningful text content
  function findLargestTextBlock(root) {
    const candidates = root.querySelectorAll(
      "div, section, article, main, .content, #content"
    );
    let best = null;
    let bestScore = 0;

    candidates.forEach((el) => {
      const text = el.innerText || el.textContent || "";
      const words = text.trim().split(/\s+/).length;
      const paragraphs = el.querySelectorAll("p").length;
      // Score favors text density + paragraph structure
      const score = words + paragraphs * 20;
      if (score > bestScore && words > 100) {
        bestScore = score;
        best = el;
      }
    });

    return best;
  }

  // Normalize and clean extracted text
  function cleanText(text) {
    return text
      .replace(/\t/g, " ")
      .replace(/[ ]{3,}/g, " ")      // collapse spaces
      .replace(/\n{3,}/g, "\n\n")    // collapse blank lines
      .replace(/^\s+|\s+$/gm, "")    // trim each line
      .trim();
  }

  // ─── Highlight Utilities ─────────────────────────────────────────────────────
  const HIGHLIGHT_CLASS = "ai-summarizer-highlight";
  const HIGHLIGHT_STYLE_ID = "ai-summarizer-styles";

  function injectHighlightStyles() {
    if (document.getElementById(HIGHLIGHT_STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = HIGHLIGHT_STYLE_ID;
    style.textContent = `
      .${HIGHLIGHT_CLASS} {
        background: linear-gradient(120deg, #ffd60a55 0%, #ffd60a88 100%);
        border-radius: 2px;
        padding: 0 2px;
        box-decoration-break: clone;
        -webkit-box-decoration-break: clone;
        transition: background 0.3s ease;
      }
      .${HIGHLIGHT_CLASS}:hover {
        background: linear-gradient(120deg, #ffd60a99 0%, #ffd60acc 100%);
      }
    `;
    document.head.appendChild(style);
  }

  function applyHighlights(phrases) {
    clearHighlights();
    if (!phrases?.length) return 0;

    injectHighlightStyles();

    let count = 0;
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          // Skip invisible or script/style nodes
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          const tag = parent.tagName?.toLowerCase();
          if (["script", "style", "noscript"].includes(tag)) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        },
      }
    );

    const textNodes = [];
    let node;
    while ((node = walker.nextNode())) {
      textNodes.push(node);
    }

    phrases.forEach((phrase) => {
      if (!phrase || phrase.length < 3) return;
      // Escape regex special chars
      const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(${escaped})`, "gi");

      textNodes.forEach((textNode) => {
        if (!textNode.parentNode || !textNode.textContent?.includes(phrase.slice(0, 4))) return;
        const match = regex.exec(textNode.textContent);
        if (!match) return;

        try {
          const range = document.createRange();
          range.setStart(textNode, match.index);
          range.setEnd(textNode, match.index + match[0].length);

          const mark = document.createElement("mark");
          mark.className = HIGHLIGHT_CLASS;
          mark.setAttribute("aria-label", "AI highlighted passage");
          range.surroundContents(mark);
          count++;
        } catch {
          // Ignore nodes that can't be surrounded (e.g. crosses element boundaries)
        }
      });
    });

    return count;
  }

  function clearHighlights() {
    document.querySelectorAll(`.${HIGHLIGHT_CLASS}`).forEach((el) => {
      const parent = el.parentNode;
      if (!parent) return;
      while (el.firstChild) parent.insertBefore(el.firstChild, el);
      parent.removeChild(el);
      parent.normalize();
    });
  }
})();
