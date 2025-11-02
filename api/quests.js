import { put, list } from '@vercel/blob';

export async function GET(request) {
  try {
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    const primaryPath = process.env.BLOB_STORE_PRIMARY_PATH || 'quest-app/data/main-config.json';

    if (!blobToken) {
      return new Response(
        JSON.stringify({ error: 'Blob Store token not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get the main config file
    const { blobs } = await list({
      token: blobToken,
      prefix: primaryPath
    });

    const mainConfigBlob = blobs.find(blob => blob.pathname === primaryPath);

    if (!mainConfigBlob) {
      // Return default quests if file doesn't exist
      const defaultQuests = {
        '1': {
          id: '1',
          title: 'Boire 2L d\'eau',
          description: 'Boire 2 litres d\'eau au cours de la journée',
          category: 'santé',
          xp: 10,
          difficulty: 'facile',
          icon: '💧',
          tags: ['hydratation', 'santé'],
          requirements: []
        }
      };

      return new Response(
        JSON.stringify(defaultQuests),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch the configuration
    const response = await fetch(mainConfigBlob.url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const config = await response.json();
    return new Response(
      JSON.stringify(config.quests || {}),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('API: Error fetching quests:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch quests from Blob Store' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function POST(request) {
  try {
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    const primaryPath = process.env.BLOB_STORE_PRIMARY_PATH || 'quest-app/data/main-config.json';

    if (!blobToken) {
      return new Response(
        JSON.stringify({ error: 'Blob Store token not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { quests } = body;

    // Get current config
    const { blobs } = await list({
      token: blobToken,
      prefix: primaryPath
    });

    const mainConfigBlob = blobs.find(blob => blob.pathname === primaryPath);

    let currentConfig = {};
    if (mainConfigBlob) {
      const response = await fetch(mainConfigBlob.url);
      if (response.ok) {
        currentConfig = await response.json();
      }
    }

    // Update config
    const updatedConfig = {
      ...currentConfig,
      quests: quests || {},
      lastUpdated: new Date().toISOString(),
      version: '1.0'
    };

    // Upload updated configuration
    const blob = await put(primaryPath, JSON.stringify(updatedConfig, null, 2), {
      access: 'public',
      token: blobToken,
      contentType: 'application/json'
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Quests updated successfully in Blob Store',
        url: blob.url
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('API: Error updating quests:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update quests in Blob Store' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}