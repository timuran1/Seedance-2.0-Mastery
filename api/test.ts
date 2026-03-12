import { analyzeHandler } from '../lib/handlers.js';

export default function handler(req: any, res: any) {
  res.json({ ok: true, hasAnalyzeHandler: typeof analyzeHandler });
}
