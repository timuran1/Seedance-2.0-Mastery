import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: 'Say "OK" in one word.'
    });
    res.json({ ok: true, response: response.text });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message, stack: error.stack?.split('\n').slice(0, 3) });
  }
}
