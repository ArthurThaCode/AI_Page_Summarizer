# ⬡ AI Page Summarizer

A production-grade Chrome Extension (Manifest V3) that delivers instant webpage summaries using **Google Gemini AI**. Featuring a premium UI with real-time highlights and estimated reading time.

---

## 📦 Quick Installation

1. **Clone** this repository: `git clone https://github.com/ArthurThaCode/AI_Page_Summarizer.git`
2. **Open Chrome** and navigate to `chrome://extensions`.
3. Enable **Developer Mode** (top-right toggle).
4. Click **Load unpacked** and select the project folder.
5. Open the extension **Settings (⚙)**, paste your [Google Gemini API key](https://aistudio.google.com/app/apikey), and click **Save**.

---

## 🏗 Architecture & Data Flow

The extension follows a secure, unidirectional data flow:

1. **Popup (UI)**: User triggers the summarization process.
2. **Content Script**: Extracts readable text using a semantic selector waterfall (article, main, etc.) while stripping ads and navigation clutter.
3. **Background Worker**: The only component authorized to make external requests. It handles:
   - **Caching** (chrome.storage.local) to prevent redundant API calls.
   - **Content Truncation** (~12k chars) to stay within token limits.
   - **Secure HTTPS** requests to the Google AI API.
4. **Popup (UI)**: Receives structured JSON and renders the summary with fluid animations.

---

## 🔐 Security & Privacy

- **Secrets Management**: Your API key is stored locally via `chrome.storage.local`. It is never hardcoded or exposed to the webpage context.
- **XSS Prevention**: All AI-generated content is injected using `.textContent` or safe DOM methods, preventing malicious code execution.
- **Minimal Permissions**: The extension uses `activeTab` to ensure it only accesses the specific page you choose to summarize.

---

## ⚖️ Technical Choices & Trade-offs

| Decision | Rationale | Trade-off |
| :--- | :--- | :--- |
| **Gemini 1.5 Flash** | Extreme speed and generous free tier. | Requires a personal Google AI Studio key. |
| **Local Caching** | Saves API quota and reduces latency. | Summaries may stay cached for 30 min even if page content updates. |
| **DOM Heuristics** | Lightweight extraction without heavy dependencies. | May miss content on extremely non-standard HTML structures. |
| **Serverless** | Zero infrastructure cost and easy deployment. | Security logic resides entirely within the extension client. |

---

## 🗂 Project Structure

```
AI_Page_Summarizer/
├── background.js     # Service worker (API logic, Caching)
├── content.js        # Content extraction & Highlight logic
├── popup/            # User interface (HTML, CSS, JS)
├── icons/            # Extension branding
└── manifest.json     # Extension manifest (v3)
```

---

## 🛠 Development Notes

- **Debugging**: Inspect the popup for UI issues or the "Service Worker" link in the extensions manager for API logs.
- **Model**: Fully configurable via the Settings panel (defaults to `gemini-flash-latest`).

---
**MIT License** — Built for HNG Stage 4A.