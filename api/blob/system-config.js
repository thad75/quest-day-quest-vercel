// System configuration API
import { put, list } from '@vercel/blob';

console.log('API: system-config.js loaded successfully');

export async function GET(request) {
  try {
    console.log('API: system-config GET called');
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

    if (!blobToken) {
      return new Response(
        JSON.stringify({ error: 'Blob Store token not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const configPath = 'quest-app/config/system-config.json';
    const { blobs } = await list({
      token: blobToken,
      prefix: configPath
    });

    const configBlob = blobs.find(blob => blob.pathname === configPath);

    if (configBlob) {
      const response = await fetch(configBlob.url);
      if (response.ok) {
        const config = await response.json();
        return new Response(
          JSON.stringify(config),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Return default config if none exists
    const defaultConfig = {
      adminPassword: 'admin123',
      systemSettings: {
        maxUsersPerLevel: 50,
        defaultQuestCount: 3,
        levelUpXP: 100,
        dailyResetTime: '00:00'
      },
      questSettings: {
        categories: ['santé', 'apprentissage', 'personnel', 'professionnel'],
        difficulties: ['facile', 'moyen', 'difficile'],
        xpRewards: {
          facile: 10,
          moyen: 20,
          difficile: 30
        }
      },
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    return new Response(
      JSON.stringify(defaultConfig),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('API: Error fetching system config:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch system config' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function POST(request) {
  try {
    console.log('API: system-config POST called');
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

    if (!blobToken) {
      return new Response(
        JSON.stringify({ error: 'Blob Store token not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const configPath = 'quest-app/config/system-config.json';

    const updatedConfig = {
      ...body,
      lastUpdated: new Date().toISOString()
    };

    const blob = await put(configPath, JSON.stringify(updatedConfig, null, 2), {
      access: 'public',
      token: blobToken,
      contentType: 'application/json',
      allowOverwrite: true
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'System configuration updated successfully',
        url: blob.url
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('API: Error updating system config:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update system config' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}