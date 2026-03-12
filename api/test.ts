import { GoogleGenAI, Type } from "@google/genai";

export default function handler(req: any, res: any) {
  res.json({ ok: true, hasType: typeof Type, hasGoogleGenAI: typeof GoogleGenAI });
}
