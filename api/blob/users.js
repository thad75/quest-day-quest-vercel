// Using standard Web API types instead of Next.js
import { put, list } from '@vercel/blob';

console.log('API: users.js loaded successfully');

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
      // Return empty config if file doesn't exist
      return new Response(
        JSON.stringify({
          users: {},
          commonQuests: [],
          isBlobStore: true
        }),
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
      JSON.stringify({
        users: config.users || {},
        commonQuests: config.commonQuests || [],
        isBlobStore: true
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('API: Error fetching users:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch users from Blob Store' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function POST(request) {
  try {
    console.log('API: users POST called');
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    console.log('API: blobToken exists:', !!blobToken);
    const primaryPath = process.env.BLOB_STORE_PRIMARY_PATH || 'quest-app/data/main-config.json';

    if (!blobToken) {
      return new Response(
        JSON.stringify({ error: 'Blob Store token not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { users, commonQuests } = body;

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
      users: users || {},
      commonQuests: commonQuests || [],
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
        message: 'Users updated successfully in Blob Store',
        url: blob.url
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('API: Error updating users:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update users in Blob Store' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}