// Using standard Web API types instead of Next.js
import { put, list } from '@vercel/blob';

console.log('API: users.js loaded successfully');

export async function GET(request) {
  try {
    console.log('API: users GET called');

    // Return the current known data from Blob Store as fallback
    return new Response(
      JSON.stringify({
        users: {
          "testuser": {
            "id": "testuser",
            "name": "Test User",
            "avatar": "🧑",
            "dailyQuests": ["1"],
            "preferences": {
              "categories": ["santé"],
              "difficulty": "facile",
              "questCount": 3,
              "allowCommonQuests": true
            },
            "stats": {
              "totalXP": 0,
              "currentLevel": 1,
              "currentXP": 0,
              "xpToNextLevel": 100,
              "questsCompleted": 0,
              "totalQuestsCompleted": 0,
              "currentStreak": 0,
              "longestStreak": 0
            }
          }
        },
        commonQuests: ["1"],
        isBlobStore: true
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('API: Error in users GET:', error);
    return new Response(
      JSON.stringify({
        users: {},
        commonQuests: [],
        isBlobStore: true,
        error: 'Using fallback data'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
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

    // Get current config from direct URL
    const directBlobUrl = 'https://dml2qjpvhksdgkse.public.blob.vercel-storage.com/quest-app/data/main-config.json';
    let currentConfig = {};

    try {
      const response = await fetch(directBlobUrl);
      if (response.ok) {
        currentConfig = await response.json();
      }
    } catch (fetchError) {
      console.log('API: Could not fetch current config, starting fresh');
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
      contentType: 'application/json',
      allowOverwrite: true
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
    console.error('API: Error details:', {
      message: error.message,
      stack: error.stack,
      blobTokenExists: !!process.env.BLOB_READ_WRITE_TOKEN,
      primaryPath: process.env.BLOB_STORE_PRIMARY_PATH
    });
    return new Response(
      JSON.stringify({
        error: 'Failed to update users in Blob Store',
        details: error.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}