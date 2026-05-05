import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, model } = req.body;
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: 'Backend API key not configured. Please set GOOGLE_API_KEY in environment variables.'
    });
  }

  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt in request body' });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Use the model provided by extension
    const targetModel = model || "gemini-flash-latest";
    const genModel = genAI.getGenerativeModel({ model: targetModel });

    const result = await genModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new Error("Empty response from AI model.");
    }

    return res.status(200).json({ text });
  } catch (error) {
    console.error('Gemini Proxy Error:', error);

    // Attempt to parse safety ratings or other specific Gemini errors
    const errorMessage = error.message || 'Error communicating with Gemini API';
    return res.status(500).json({ error: errorMessage });
  }
}
