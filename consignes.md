Frontend Wizards — Stage 4A Build an AI Page Summarizer Chrome Extension Objective Build a Chrome Extension (Manifest V3) that:

* Extracts content from the current webpage
* Sends it to an AI API
* Displays a structured summary
* Optionally highlights key points on the page
This must be a real, installable, useful Chrome Extension. What the Extension Should Do When a user clicks the extension icon:

1. It extracts meaningful content from the current page
2. Sends it to an AI provider (OpenAI, Gemini, etc.)
3. Displays:
   * Bullet-point summary
   * Key insights
   * Estimated reading time
4. Optionally:
   * Highlight important sections in-page
 Required Features Manifest V3 Setup Must include:

* manifest.json
* Background service worker
* Popup UI
* Content script
* Proper permissions
No deprecated Manifest V2. Popup UI The popup must include:

* Page title
* “Summarize Page” button
* Loading state
* Summary output area
* Clear/reset button
UX expectations:

* Responsive
* Clean layout
* No clutter
* Keyboard accessible
* Visible focus states
 Content Script The extension must:

* Extract readable page content
* Avoid navigation/sidebar clutter
* Prefer main article content if possible
Bonus:

* Use heuristic filtering
* Or integrate a readability parser
 AI Integration Must:

* Call AI securely
* Never expose API key in frontend
* Use background script or proxy server
You must NOT:

* Hardcode API keys in content script
* Commit secrets to repo
 Background Service Worker Responsible for:

* Receiving message from popup
* Making AI API request
* Returning summary
* Handling errors
* Managing rate limiting (optional)
 Storage Use [chrome.storage](http://chrome.storage) to:

* Cache summaries per URL
* Prevent duplicate API calls
* Save user settings (optional)
 Technical Requirements

* Manifest V3
* Clean file structure
* Modular code
* No console errors
* Graceful error handling
* Minimal required permissions
 Security Requirements

* No exposed secrets
* API calls must be secure
* Minimal permissions
* Validate message passing
* Prevent XSS injection
* Sanitize injected content
 UI/UX Expectations The popup must:

* Show loading spinner while summarizing
* Show error message if API fails
* Display formatted summary (bullets, spacing)
* Handle long summaries gracefully
* Scroll if needed
Optional:

* Dark/light mode
* Copy summary button
* Word count
* “Summarize in 3 bullet points” option
 Acceptance Criteria You will be graded on:

* Extension installs correctly
* Works on most article pages
* Extracts meaningful content
* Summary generated correctly
* No exposed API keys
* Clean architecture
* Proper Chrome messaging
* Good UX polish
* Performance impact is minimal
 Submission Requirements

* GitHub repository
* README including:
   * Setup instructions
   * Architecture explanation
   * AI integration explanation
   * Security decisions
   * Trade-offs
* Short demo video (2–5 minutes recommended)
Note on Installation This is a local extension and is not to be uploaded to the Google Chrome Extension Store. Include steps to download and use your extension in the README section. Submission Form

* Slack Display Name (Must be unique)
* Deadline: 5th May, 2026
* [SUBMISSION LINK HERE](https://docs.google.com/forms/d/e/1FAIpQLSfwkOeNFu2L-vn6VB9ctH8OFiQkFcTujxs-nwpDhG6C84WZqA/viewform?usp=publish-editor)