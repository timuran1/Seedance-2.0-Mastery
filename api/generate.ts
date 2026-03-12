export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.MUAPI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'MUAPI_API_KEY not configured' });

  const { model, ...params } = req.body || {};
  if (!model) return res.status(400).json({ error: 'model required' });

  try {
    const response = await fetch(`https://api.muapi.ai/api/v1/${model}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    console.error('generate error:', error);
    res.status(500).json({ error: error.message });
  }
}
