# 🎬 Script Guide for Demo Video (2-5 min)

Ce guide vous aide à structurer votre présentation. Les actions sont expliquées en français, mais le texte à dire (**Script**) est en anglais pour votre présentation.

---

## 🕒 Structure de la vidéo

### 1. Introduction (30 secondes)
*   **Action** : Affichez votre navigateur avec une page d'article ouverte.
*   **Script** : "Hello everyone, I am [Your Name]. Today, I'm excited to present **AI Page Summarizer**, a production-grade Chrome Extension built with Manifest V3 that leverages Google Gemini AI to extract and summarize any webpage in seconds."

### 2. Installation & Configuration (45 secondes)
*   **Action** : Allez sur `chrome://extensions`, activez le mode développeur et montrez le bouton "Load unpacked".
*   **Action** : Cliquez sur l'icône de l'extension, ouvrez les **Settings (⚙)** et montrez le champ de la clé API.
*   **Script** : "Installation is straightforward as an unpacked extension. Once installed, you simply head to the settings panel to securely save your Google Gemini API key. Rest assured, your key is stored locally using `chrome.storage` and is never exposed to the frontend."

### 3. Demo: Full Summarization (1 minute)
*   **Action** : Allez sur un article complexe (ex: Wikipedia). Cliquez sur **Summarize**.
*   **Action** : Pointez du curseur les éléments qui apparaissent (points clés, insights, temps de lecture).
*   **Script** : "Let's see it in action. By clicking 'Summarize', the extension injects a content script to extract only the main article text, filtering out ads and menus. Notice the premium skeleton loading state while Gemini processes the data. Here we have a structured summary, key insights, and an estimated reading time."

### 4. Advanced Features: Highlights & Modes (1 minute)
*   **Action** : Changez le mode en **"3-point"** et relancez le résumé.
*   **Action** : Cliquez sur le bouton **Highlight**. Montrez les passages surlignés dans l'article.
*   **Action** : Cliquez sur **Copy** et montrez le message "Copied ✓".
*   **Script** : "We can also switch to '3-point' mode for ultra-concise summaries. My favorite feature is 'Highlight', which visually pinpoints the AI's findings directly on the live page using the Range API. You can also quickly copy the formatted summary to your clipboard with one click."

### 5. Caching & Performance (30 secondes)
*   **Action** : Cliquez sur **Clear**, puis recliquez immédiatement sur **Summarize**. Montrez le badge "Cached".
*   **Script** : "To ensure performance and cost-efficiency, the extension includes a smart caching system. Re-summarizing the same page is instant and doesn't require a new API call, as shown by this 'Cached' badge."

### 6. Conclusion (15 secondes)
*   **Action** : Revenez sur la vue d'ensemble de l'extension.
*   **Script** : "Thank you for watching. This extension delivers a secure, accessible, and high-performance solution for modern web reading. I'm looking forward to your feedback!"

---

## 💡 Conseils pour réussir
1.  **Parlez clairement** : Prenez votre temps pour chaque phrase.
2.  **Curseur visible** : Utilisez votre souris pour guider l'œil de l'évaluateur vers ce que vous décrivez.
3.  **Article réel** : Utilisez un article avec beaucoup de texte pour bien montrer la puissance de l'extraction.

---
**Good luck with your submission! 🚀**
