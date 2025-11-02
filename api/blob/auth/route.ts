import { NextRequest, NextResponse } from 'next/server';
import { list } from '@vercel/blob';

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
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
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
      return NextResponse.json({
        isValid: password === 'admin123'
      });
    }

    // Fetch the configuration
    const response = await fetch(mainConfigBlob.url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const config = await response.json();
    const storedPassword = config.adminPassword || 'admin123';

    return NextResponse.json({
      isValid: password === storedPassword
    });

  } catch (error) {
    console.error('API: Error verifying password:', error);
    return NextResponse.json(
      { error: 'Failed to verify password' },
      { status: 500 }
    );
  }
}