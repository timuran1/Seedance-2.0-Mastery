export default function handler(req: any, res: any) {
  import('../lib/handlers').then((mod) => {
    res.json({ ok: true, exports: Object.keys(mod) });
  }).catch((err) => {
    res.status(500).json({ ok: false, error: err.message, stack: err.stack?.split('\n').slice(0,4) });
  });
}
