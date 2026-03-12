import { analyzeHandler } from '../lib/handlers';

export default async function handler(req: any, res: any) {
  try {
    // Test if the import worked
    if (typeof analyzeHandler !== 'function') {
      return res.status(500).json({ ok: false, error: 'analyzeHandler is not a function', type: typeof analyzeHandler });
    }
    res.json({ ok: true, message: 'import from lib/handlers works' });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
}
