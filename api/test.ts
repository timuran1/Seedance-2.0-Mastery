export default function handler(req: any, res: any) {
  res.json({
    hasApiKey: !!process.env.GEMINI_API_KEY,
    nodeVersion: process.version,
    env: process.env.NODE_ENV
  });
}
