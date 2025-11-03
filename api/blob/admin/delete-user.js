// Admin user management endpoint - Delete user
import { del, list } from '@vercel/blob';

console.log('API: admin/delete-user.js loaded successfully');

export async function POST(request) {
  try {
    console.log('API: admin/delete-user POST called');
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

    if (!blobToken) {
      return new Response(
        JSON.stringify({ error: 'Blob Store token not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing userId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if user exists
    const userPath = `quest-app/users/${userId}.json`;
    try {
      const { blobs } = await list({
        token: blobToken,
        prefix: userPath
      });

      const userBlob = blobs.find(blob => blob.pathname === userPath);
      if (!userBlob) {
        return new Response(
          JSON.stringify({ error: 'User not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } catch (error) {
      console.error('Error checking user existence:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to verify user existence' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Delete user file
    await del(userPath, { token: blobToken });

    // Remove from user index
    await removeFromUserIndex(userId, blobToken);

    // Clean up user-related data (optional - can be extended)
    await cleanupUserData(userId, blobToken);

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
    throw error;
  }
}

async function cleanupUserData(userId, token) {
  try {
    // This function can be extended to clean up additional user data
    // For example: user progress, saved quests, achievements, etc.

    // List all user-related files (excluding the main user file which is already deleted)
    const { blobs } = await list({
      token: token,
      prefix: `quest-app/user-data/${userId}/`
    });

    // Delete all user data files
    if (blobs.length > 0) {
      const deletePromises = blobs.map(blob => del(blob.pathname, { token }));
      await Promise.all(deletePromises);
      console.log(`Cleaned up ${blobs.length} user data files for user ${userId}`);
    }

  } catch (error) {
    console.error('Error cleaning up user data:', error);
    // Don't throw here - cleanup failure shouldn't prevent user deletion
  }
}