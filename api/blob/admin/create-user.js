// Admin user management endpoint - Create new user
import { put, list } from '@vercel/blob';

console.log('API: admin/create-user.js loaded successfully');

// Handle OPTIONS for CORS
export async function OPTIONS(request) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}

export async function POST(request) {
  try {
    console.log('API: admin/create-user POST called');
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

    if (!blobToken) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Blob Store token not configured',
          message: 'Blob Store token not configured'
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    const body = await request.json();
    const { userData } = body;

    if (!userData) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing userData',
          message: 'Missing userData'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    // Generate unique user ID if not provided
    const userId = userData.id || `user${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

    // Validate required fields
    const newUserData = {
      id: userId,
      name: userData.name || 'Nouvel Utilisateur',
      avatar: userData.avatar || '👤',
      dailyQuests: userData.dailyQuests || ['1', '2', '3'],
      preferences: userData.preferences || {
        categories: ['santé', 'apprentissage'],
        difficulty: 'facile',
        questCount: 3,
        allowCommonQuests: true
      },
      stats: userData.stats || {
        totalXP: 0,
        currentLevel: 1,
        currentXP: 0,
        xpToNextLevel: 100,
        questsCompleted: 0,
        totalQuestsCompleted: 0,
        currentStreak: 0,
        longestStreak: 0
      },
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      ...userData
    };

    // Save user data to individual file
    const userPath = `quest-app/users/${userId}.json`;
    const blob = await put(userPath, JSON.stringify(newUserData, null, 2), {
      access: 'public',
      token: blobToken,
      contentType: 'application/json',
      allowOverwrite: false // Don't overwrite existing users
    });

    // Update user index
    await updateUserIndex(userId, newUserData, blobToken);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'User created successfully',
        userId,
        userData: newUserData,
        url: blob.url
      }),
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );

  } catch (error) {
    console.error('API: Error creating user:', error);

    // Handle user already exists error
    if (error.message && error.message.includes('already exists')) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'User with this ID already exists',
          message: 'User with this ID already exists'
        }),
        {
          status: 409,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to create user',
        message: error.message || 'Failed to create user',
        details: error.toString()
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
}

async function updateUserIndex(userId, userData, token) {
  try {
    const indexPath = 'quest-app/indexes/user-list.json';

    // Get current index
    let userIndex = {};
    try {
      const { blobs } = await list({ token, prefix: indexPath });
      const indexBlob = blobs.find(blob => blob.pathname === indexPath);
      if (indexBlob) {
        const response = await fetch(indexBlob.url);
        if (response.ok) {
          userIndex = await response.json();
        }
      }
    } catch (error) {
      console.log('Creating new user index');
    }

    // Update index
    userIndex[userId] = {
      name: userData.name,
      avatar: userData.avatar,
      level: userData.stats?.currentLevel || 1,
      totalXP: userData.stats?.totalXP || 0,
      createdAt: userData.createdAt || new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    // Save updated index
    await put(indexPath, JSON.stringify(userIndex, null, 2), {
      access: 'public',
      token,
      contentType: 'application/json',
      allowOverwrite: true
    });

  } catch (error) {
    console.error('Error updating user index:', error);
    throw error;
  }
}