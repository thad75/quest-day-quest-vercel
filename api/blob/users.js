// Using standard Web API types instead of Next.js
import { put, list } from '@vercel/blob';

console.log('API: users.js loaded successfully - v2.0');

// Simple in-memory store for user data
let userDataStore = {
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
  lastUpdated: new Date().toISOString(),
  version: "1.0"
};

export async function GET(request) {
  try {
    console.log('API: users GET called');

    // Try to read directly from the Blob Store database
    const directBlobUrl = 'https://dml2qjpvhksdgkse.public.blob.vercel-storage.com/quest-app/data/main-config.json';

    try {
      const response = await fetch(directBlobUrl);
      if (response.ok) {
        const config = await response.json();
        console.log('API: Successfully read from database, found', Object.keys(config.users || {}).length, 'users');

        return new Response(
          JSON.stringify({
            users: config.users || {},
            commonQuests: config.commonQuests || [],
            isBlobStore: true
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } catch (fetchError) {
      console.log('API: Could not read from database, using memory store');
    }

    // Fallback to memory store if database read fails
    return new Response(
      JSON.stringify({
        users: userDataStore.users,
        commonQuests: userDataStore.commonQuests,
        isBlobStore: true,
        warning: 'Using memory store - database read failed'
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

    const body = await request.json();
    const { users, commonQuests } = body;

    console.log('API: Received user data:', { users: Object.keys(users || {}), commonQuests });

    // Update in-memory store
    if (users) {
      userDataStore.users = users;
    }
    if (commonQuests) {
      userDataStore.commonQuests = commonQuests;
    }
    userDataStore.lastUpdated = new Date().toISOString();

    console.log('API: Updated in-memory store with', Object.keys(userDataStore.users).length, 'users');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Users updated successfully',
        users: userDataStore.users,
        commonQuests: userDataStore.commonQuests,
        timestamp: userDataStore.lastUpdated
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('API: Error updating users:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to update users',
        details: error.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}