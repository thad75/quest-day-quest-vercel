import { NextRequest, NextResponse } from 'next/server';
import { put, list } from '@vercel/blob';

export async function GET(request: NextRequest) {
  try {
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    const primaryPath = process.env.BLOB_STORE_PRIMARY_PATH || 'quest-app/data/main-config.json';

    if (!blobToken) {
      return NextResponse.json(
        { error: 'Blob Store token not configured' },
        { status: 500 }
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

      return NextResponse.json(defaultQuests);
    }

    // Fetch the configuration
    const response = await fetch(mainConfigBlob.url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const config = await response.json();
    return NextResponse.json(config.quests || {});

  } catch (error) {
    console.error('API: Error fetching quests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quests from Blob Store' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    const primaryPath = process.env.BLOB_STORE_PRIMARY_PATH || 'quest-app/data/main-config.json';

    if (!blobToken) {
      return NextResponse.json(
        { error: 'Blob Store token not configured' },
        { status: 500 }
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

    return NextResponse.json({
      success: true,
      message: 'Quests updated successfully in Blob Store',
      url: blob.url
    });

  } catch (error) {
    console.error('API: Error updating quests:', error);
    return NextResponse.json(
      { error: 'Failed to update quests in Blob Store' },
      { status: 500 }
    );
  }
}