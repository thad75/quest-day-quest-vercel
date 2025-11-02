import { NextApiRequest, NextApiResponse } from 'next';

// Vercel KV API route for clearing quest data
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid userId parameter'
      });
    }

    // In a real implementation, this would use Vercel KV
    // import { kv } from '@vercel/kv';

    // Delete user's quest data
    // await kv.del(`quest_data_${userId}`);

    // Also delete any backup data
    // const keys = await kv.keys(`backup_*_${userId}`);
    // if (keys.length > 0) {
    //   await kv.del(...keys);
    // }

    console.log('Clearing quest data for user:', userId);

    return res.status(200).json({
      success: true,
      message: 'Quest data cleared successfully',
      userId
    });

  } catch (error) {
    console.error('Clear API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}