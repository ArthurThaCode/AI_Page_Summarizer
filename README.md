# ⬡ AI Page Summarizer

A production-grade Chrome Extension (Manifest V3) that delivers instant webpage summaries using **Google Gemini AI**. Featuring a premium UI with real-time highlights and estimated reading time.

---

## 📦 Quick Installation

1. **Clone** this repository: `git clone https://github.com/ArthurThaCode/AI_Page_Summarizer.git`
2. **Open Chrome** and navigate to `chrome://extensions`.
3. Enable **Developer Mode** (top-right toggle).
4. Click **Load unpacked** and select the project folder.
5. **Set up API Access**:
   - **Option A (Proxy - Recommended)**: The extension now supports a remote proxy. If the developer has configured a `PROXY_URL` in `background.js`, the extension works out-of-the-box for graders and users.
   - **Option B (Direct)**: Open the extension **Settings (⚙)**, paste your [Google Gemini API key](https://aistudio.google.com/app/apikey), and click **Save**. This will override the proxy.

---

## 🏗 Architecture & Data Flow

The extension follows a secure, unidirectional data flow:

1. **Popup (UI)**: User triggers the summarization process.
2. **Content Script**: Extracts readable text using a semantic selector waterfall (article, main, etc.) while stripping ads and navigation clutter.
3. **Background Worker**: The only component authorized to make external requests. It handles:
   - **Caching** (chrome.storage.local) to prevent redundant API calls.
   - **Content Truncation** (~12k chars) to stay within token limits.
   - **Hybrid API Calling**: If a local API key is provided, it calls Gemini directly. Otherwise, it routes requests through a secure **Remote Proxy** (Vercel Serverless Function).
4. **Remote Proxy (Vercel)**: Receives the prompt from the extension, injects the secret `GOOGLE_API_KEY` from environment variables, and returns the AI response.
5. **Popup (UI)**: Receives structured JSON and renders the summary with fluid animations.

---

## 🔐 Security & Privacy

- **Secrets Management**: For graders and casual users, API keys are managed via the remote proxy, keeping secrets hidden. Advanced users can still provide a local key stored via `chrome.storage.local`.
- **XSS Prevention**: All AI-generated content is injected using `.textContent` or safe DOM methods, preventing malicious code execution.
- **Minimal Permissions**: The extension uses `activeTab` to ensure it only accesses the specific page you choose to summarize.

---

## ⚖️ Technical Choices & Trade-offs

| Decision | Rationale | Trade-off |
| :--- | :--- | :--- |
| **Gemini 1.5 Flash** | Extreme speed and generous free tier. | Best for rapid summarization. |
| **Remote Proxy** | Hides API keys and simplifies grading/testing. | Requires a Vercel deployment. |
| **Local Caching** | Saves API quota and reduces latency. | Summaries may stay cached for 30 min. |
| **DOM Heuristics** | Lightweight extraction without heavy dependencies. | May miss content on non-standard HTML. |

---

## 🗂 Project Structure

```
AI_Page_Summarizer/
├── api/              # Vercel Serverless Functions (Proxy)
├── background.js     # Service worker (API routing, Caching)
├── content.js        # Content extraction & Highlight logic
├── popup/            # User interface (HTML, CSS, JS)
├── icons/            # Extension branding
├── manifest.json     # Extension manifest (v3)
└── package.json      # Backend dependencies
```

### 🚀 Proxy Deployment (Vercel)

1.  Connect your repo to **Vercel**.
2.  Add `GOOGLE_API_KEY` to **Environment Variables**.
3.  Deploy and copy your app URL.
4.  Update `PROXY_URL` in `background.js` with your URL (e.g., `https://your-app.vercel.app/api/summarize`).

---

## 🛠 Development Notes

- **Debugging**: Inspect the popup for UI issues or the "Service Worker" link in the extensions manager for API logs.
- **Model**: Fully configurable via the Settings panel (defaults to `gemini-flash-latest`).

---
**MIT License** — Built for HNG Stage 4A.