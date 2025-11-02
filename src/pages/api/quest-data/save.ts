import { NextApiRequest, NextApiResponse } from 'next';

// Vercel KV API route for saving quest data
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { key, data } = req.body;

    if (!key || !data) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: key, data'
      });
    }

    // Validate data structure
    if (!data.questSystemState || !data.playerProgress || !data.userProfile) {
      return res.status(400).json({
        success: false,
        error: 'Invalid data structure'
      });
    }

    // In a real implementation, this would use Vercel KV
    // For now, we'll simulate the storage with a simple in-memory store
    // or fallback to a database

    // Simulate KV storage (in production, use @vercel/kv)
    const kvData = {
      key,
      data: JSON.stringify(data),
      timestamp: new Date().toISOString()
    };

    // Mock successful save
    console.log('Saving to KV:', { key: kvData.key, timestamp: kvData.timestamp });

    // You would implement actual KV storage here:
    // import { kv } from '@vercel/kv';
    // await kv.set(key, JSON.stringify(data));
    // await kv.expire(key, 60 * 60 * 24 * 30); // 30 days expiration

    return res.status(200).json({
      success: true,
      message: 'Data saved successfully',
      timestamp: kvData.timestamp
    });

  } catch (error) {
    console.error('Save API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}