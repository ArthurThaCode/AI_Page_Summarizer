// popup.js — Popup Controller
// Orchestrates all UI state, user interactions, and message passing.

"use strict";

// DOM References *********************************************************
const $ = (id) => document.getElementById(id);

const settingsToggle = $("settingsToggle");
const settingsPanel = $("settingsPanel");
const clearCacheBtn = $("clearCacheBtn");
const pageTitle = $("pageTitle");
const topicBadge = $("topicBadge");
const pageMeta = $("pageMeta");
const wordCountBadge = $("wordCountBadge");
const readTimeBadge = $("readTimeBadge");
const summarizeBtn = $("summarizeBtn");
const modeFullBtn = $("modeFullBtn");
const modeBriefBtn = $("modeBriefBtn");
const loadingState = $("loadingState");
const loadingText = $("loadingText");
const errorState = $("errorState");
const errorMsg = $("errorMsg");
const retryBtn = $("retryBtn");
const summaryOutput = $("summaryOutput");
const cacheBadge = $("cacheBadge");
const summaryList = $("summaryList");
const insightList = $("insightList");
const insightsSection = $("insightsSection");
const highlightBtn = $("highlightBtn");
const copyBtn = $("copyBtn");
const clearBtn = $("clearBtn");
const emptyState = $("emptyState");

// State *********************************************************
let currentMode = "full";
let currentSummary = null;
let highlightsActive = false;
let currentTab = null;

// Init *********************************************************
document.addEventListener("DOMContentLoaded", async () => {
  await loadCurrentTab();
  showState("empty");
});

// Load tab info *********************************************************
async function loadCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tab;
  if (tab?.title) {
    pageTitle.textContent = tab.title.slice(0, 100);
  } else {
    pageTitle.textContent = "Unknown page";
  }
}

// Settings *********************************************************

settingsToggle.addEventListener("click", () => {
  const isHidden = settingsPanel.hidden;
  settingsPanel.hidden = !isHidden;
  settingsToggle.setAttribute("aria-expanded", String(isHidden));
});

// Clear Cache *********************************************************
clearCacheBtn.addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "CLEAR_CACHE", payload: { url: currentTab?.url } }, () => {
    clearCacheBtn.textContent = "Cleared ✓";
    setTimeout(() => (clearCacheBtn.textContent = "Clear cache"), 1500);
  });
});

// Mode Toggle *********************************************************
modeFullBtn.addEventListener("click", () => setMode("full"));
modeBriefBtn.addEventListener("click", () => setMode("brief"));

function setMode(mode) {
  currentMode = mode;
  modeFullBtn.classList.toggle("active", mode === "full");
  modeBriefBtn.classList.toggle("active", mode === "brief");
}

// Summarize Flow *********************************************************
summarizeBtn.addEventListener("click", runSummarize);
retryBtn.addEventListener("click", runSummarize);

async function runSummarize() {
  showState("loading");
  setLoadingText("Extracting page content…");
  summarizeBtn.disabled = true;

  try {
    // 2. Extract content from the page via content script
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Inject content script if not already present
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"],
    }).catch(() => { }); // may already be injected

    const extracted = await sendToTab(tab.id, { type: "EXTRACT_CONTENT" });

    if (!extracted?.success) {
      throw new Error(extracted?.error || "Could not extract page content.");
    }

    const { content, title, url, wordCount } = extracted.data;

    // Update page meta
    wordCountBadge.textContent = `${wordCount.toLocaleString()} words`;

    setLoadingText("Sending to AI…");

    // 3. Send to background worker for AI processing
    const response = await chrome.runtime.sendMessage({
      type: "SUMMARIZE",
      payload: {
        url,
        title,
        content,
        mode: currentMode,
      },
    });

    if (!response?.success) {
      throw new Error(response?.error || "Unknown error from background.");
    }

    // 4. Render result
    currentSummary = response.data;
    renderSummary(response.data, wordCount);

  } catch (err) {
    showError(sanitize(err.message));
  } finally {
    summarizeBtn.disabled = false;
  }
}

// Render *********************************************************
function renderSummary(data, wordCount) {
  const { summary, insights, readingTime, topic, fromCache } = data;

  // Topic badge
  if (topic) {
    topicBadge.textContent = topic;
    topicBadge.hidden = false;
  }

  // Meta row
  readTimeBadge.textContent = `~${readingTime} min read`;
  if (wordCount) {
    wordCountBadge.textContent = `${Number(wordCount).toLocaleString()} words`;
  }
  pageMeta.hidden = false;

  // Cache badge
  cacheBadge.hidden = !fromCache;

  // Summary bullets
  summaryList.innerHTML = "";
  summary.forEach((point, i) => {
    const li = document.createElement("li");
    li.textContent = sanitize(point);
    li.style.animationDelay = `${i * 60}ms`;
    summaryList.appendChild(li);
  });

  // Key insights
  if (insights?.length) {
    insightList.innerHTML = "";
    insights.forEach((ins, i) => {
      const li = document.createElement("li");
      li.textContent = sanitize(ins);
      li.style.animationDelay = `${i * 60}ms`;
      insightList.appendChild(li);
    });
    insightsSection.hidden = false;
  } else {
    insightsSection.hidden = true;
  }

  highlightsActive = false;
  highlightBtn.setAttribute("aria-pressed", "false");

  showState("summary");
}

// Highlight Toggle *********************************************************
highlightBtn.addEventListener("click", async () => {
  if (!currentSummary?.highlights?.length) return;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (highlightsActive) {
    await sendToTab(tab.id, { type: "CLEAR_HIGHLIGHTS" });
    highlightsActive = false;
    highlightBtn.setAttribute("aria-pressed", "false");
    highlightBtn.querySelector("svg").style.stroke = "";
  } else {
    const res = await sendToTab(tab.id, {
      type: "HIGHLIGHT",
      payload: { phrases: currentSummary.highlights },
    });
    if (res?.success) {
      highlightsActive = true;
      highlightBtn.setAttribute("aria-pressed", "true");
    }
  }
});

//   Copy *********************************************************
copyBtn.addEventListener("click", async () => {
  if (!currentSummary) return;

  const text = [
    `📄 Summary — ${currentTab?.title || ""}`,
    "",
    "KEY POINTS:",
    ...(currentSummary.summary || []).map((b) => `• ${b}`),
    "",
    "INSIGHTS:",
    ...(currentSummary.insights || []).map((i) => `→ ${i}`),
    "",
    `⏱ Reading time: ~${currentSummary.readingTime} min`,
  ].join("\n");

  try {
    await navigator.clipboard.writeText(text);
    copyBtn.textContent = "Copied ✓";
    setTimeout(() => {
      copyBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy`;
    }, 1500);
  } catch {
    copyBtn.textContent = "Failed";
  }
});

// Clear *********************************************************
clearBtn.addEventListener("click", async () => {
  currentSummary = null;
  highlightsActive = false;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  await sendToTab(tab.id, { type: "CLEAR_HIGHLIGHTS" }).catch(() => { });

  topicBadge.hidden = true;
  pageMeta.hidden = true;
  pageTitle.textContent = currentTab?.title?.slice(0, 100) || "Unknown page";
  showState("empty");
});

//  State Machine *********************************************************
function showState(state) {
  loadingState.hidden = state !== "loading";
  errorState.hidden = state !== "error";
  summaryOutput.hidden = state !== "summary";
  emptyState.hidden = state !== "empty";
}

function showError(msg) {
  errorMsg.textContent = msg;
  showState("error");
}

function setLoadingText(msg) {
  loadingText.textContent = msg;
}

// Helpers *********************************************************

function sendToTab(tabId, message) {
  return new Promise((resolve) => {
    try {
      chrome.tabs.sendMessage(tabId, message, (response) => {
        if (chrome.runtime.lastError) {
          resolve({ success: false, error: chrome.runtime.lastError.message });
        } else {
          resolve(response);
        }
      });
    } catch (err) {
      resolve({ success: false, error: err.message });
    }
  });
}

// XSS-safe text sanitization — plain text only, no HTML
function sanitize(str) {
  return String(str || "").replace(/[<>&"']/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

function flashBorder(el, color) {
  if (!el) return;
  el.style.borderColor = color;
  setTimeout(() => (el.style.borderColor = ""), 1000);
}
