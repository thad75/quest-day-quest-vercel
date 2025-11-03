// Admin user management endpoint - Modify user
import { put, list } from '@vercel/blob';

console.log('API: admin/modify-user.js loaded successfully');

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
    console.log('API: admin/modify-user POST called');
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
    const { userId, userData } = body;

    if (!userId || !userData) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing userId or userData',
          message: 'Missing userId or userData'
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

    // Check if user exists and get current data
    const userPath = `quest-app/users/${userId}.json`;
    let currentUserData = null;

    try {
      const { blobs } = await list({
        token: blobToken,
        prefix: userPath
      });

      const userBlob = blobs.find(blob => blob.pathname === userPath);
      if (!userBlob) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'User not found',
            message: 'User not found'
          }),
          {
            status: 404,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          }
        );
      }

      const response = await fetch(userBlob.url);
      if (response.ok) {
        currentUserData = await response.json();
      }
    } catch (error) {
      console.error('Error fetching current user data:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to fetch current user data',
          message: error.message || 'Failed to fetch current user data'
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

    // Merge current data with updates
    const updatedUserData = {
      ...currentUserData,
      ...userData,
      id: userId, // Ensure ID doesn't change
      lastUpdated: new Date().toISOString()
    };

    // Validate stats structure if provided
    if (userData.stats) {
      updatedUserData.stats = {
        totalXP: userData.stats.totalXP ?? currentUserData.stats.totalXP,
        currentLevel: userData.stats.currentLevel ?? currentUserData.stats.currentLevel,
        currentXP: userData.stats.currentXP ?? currentUserData.stats.currentXP,
        xpToNextLevel: userData.stats.xpToNextLevel ?? currentUserData.stats.xpToNextLevel,
        questsCompleted: userData.stats.questsCompleted ?? currentUserData.stats.questsCompleted,
        totalQuestsCompleted: userData.stats.totalQuestsCompleted ?? currentUserData.stats.totalQuestsCompleted,
        currentStreak: userData.stats.currentStreak ?? currentUserData.stats.currentStreak,
        longestStreak: userData.stats.longestStreak ?? currentUserData.stats.longestStreak
      };
    }

    // Save updated user data
    const blob = await put(userPath, JSON.stringify(updatedUserData, null, 2), {
      access: 'public',
      token: blobToken,
      contentType: 'application/json',
      allowOverwrite: true
    });

    // Update user index
    await updateUserIndex(userId, updatedUserData, blobToken);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'User updated successfully',
        userId,
        userData: updatedUserData,
        url: blob.url
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );

  } catch (error) {
    console.error('API: Error modifying user:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to modify user',
        message: error.message || 'Failed to modify user',
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
      console.log('User index not found, creating new one');
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