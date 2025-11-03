// User management API with new folder structure
import { put, list, del } from '@vercel/blob';

console.log('API: users-new.js loaded successfully');

export async function GET(request) {
  try {
    console.log('API: users-new GET called');
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

    if (!blobToken) {
      return new Response(
        JSON.stringify({ error: 'Blob Store token not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // List all user files in the users folder
    const { blobs } = await list({
      token: blobToken,
      prefix: 'quest-app/users/'
    });

    const userFiles = blobs.filter(blob => blob.pathname.endsWith('.json'));
    const users = {};

    // Fetch each user file
    for (const userFile of userFiles) {
      try {
        const response = await fetch(userFile.url);
        if (response.ok) {
          const userData = await response.json();
          const userId = userFile.pathname.split('/').pop().replace('.json', '');
          users[userId] = userData;
        }
      } catch (error) {
        console.log(`Could not fetch user file: ${userFile.pathname}`);
      }
    }

    return new Response(
      JSON.stringify({
        users,
        totalUsers: Object.keys(users).length,
        isBlobStore: true
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('API: Error fetching users:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch users' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function POST(request) {
  try {
    console.log('API: users-new POST called');
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

    if (!blobToken) {
      return new Response(
        JSON.stringify({ error: 'Blob Store token not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { userId, userData } = body;

    if (!userId || !userData) {
      return new Response(
        JSON.stringify({ error: 'Missing userId or userData' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Save user data to individual file
    const userPath = `quest-app/users/${userId}.json`;
    const blob = await put(userPath, JSON.stringify(userData, null, 2), {
      access: 'public',
      token: blobToken,
      contentType: 'application/json',
      allowOverwrite: true
    });

    // Update user index
    await updateUserIndex(userId, userData, blobToken);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'User saved successfully',
        userId,
        url: blob.url
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('API: Error saving user:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to save user' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function DELETE(request) {
  try {
    console.log('API: users-new DELETE called');
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

    if (!blobToken) {
      return new Response(
        JSON.stringify({ error: 'Blob Store token not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing userId parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Delete user file
    const userPath = `quest-app/users/${userId}.json`;
    await del(userPath, { token: blobToken });

    // Remove from user index
    await removeFromUserIndex(userId, blobToken);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'User deleted successfully',
        userId
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('API: Error deleting user:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to delete user' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
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
  }
}

async function removeFromUserIndex(userId, token) {
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
      console.log('User index not found');
      return;
    }

    // Remove user from index
    delete userIndex[userId];

    // Save updated index
    await put(indexPath, JSON.stringify(userIndex, null, 2), {
      access: 'public',
      token,
      contentType: 'application/json',
      allowOverwrite: true
    });

  } catch (error) {
    console.error('Error removing from user index:', error);
  }
}