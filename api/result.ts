export default async function handler(req: any, res: any) {
  const { id } = req.query || {};
  if (!id) return res.status(400).json({ error: 'id required' });

  const apiKey = process.env.MUAPI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'MUAPI_API_KEY not configured' });

  try {
    const response = await fetch(`https://api.muapi.ai/api/v1/predictions/${id}/result`, {
      headers: { 'x-api-key': apiKey },
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    console.error('result error:', error);
    res.status(500).json({ error: error.message });
  }
}
