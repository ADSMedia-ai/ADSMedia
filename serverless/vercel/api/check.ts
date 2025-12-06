import type { VercelRequest, VercelResponse } from '@vercel/node';

const API_BASE_URL = 'https://api.adsmedia.live/v1';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ADSMEDIA_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const email = req.query.email as string;

    if (!email) {
      return res.status(400).json({ error: 'Email parameter required' });
    }

    const response = await fetch(
      `${API_BASE_URL}/suppressions/check?email=${encodeURIComponent(email)}`,
      { headers: { 'Authorization': `Bearer ${apiKey}` } }
    );

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

