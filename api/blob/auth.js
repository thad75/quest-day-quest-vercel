// Using standard Web API types instead of Next.js
import { list } from '@vercel/blob';

console.log('API: auth.js loaded successfully');

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
    const { password } = body;

    if (!password) {
      return new Response(
        JSON.stringify({ error: 'Password is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get the main config file
    const { blobs } = await list({
      token: blobToken,
      prefix: primaryPath
    });

    const mainConfigBlob = blobs.find(blob => blob.pathname === primaryPath);

    if (!mainConfigBlob) {
      // Default password for new installations
      return new Response(
        JSON.stringify({
          isValid: password === 'admin123'
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
    const storedPassword = config.adminPassword || 'admin123';

    return new Response(
      JSON.stringify({
        isValid: password === storedPassword
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('API: Error verifying password:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to verify password' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}