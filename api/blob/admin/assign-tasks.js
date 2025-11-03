// Admin user management endpoint - Assign tasks to users
import { put, list } from '@vercel/blob';

console.log('API: admin/assign-tasks.js loaded successfully');

export async function POST(request) {
  try {
    console.log('API: admin/assign-tasks POST called');
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

    if (!blobToken) {
      return new Response(
        JSON.stringify({ error: 'Blob Store token not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { userId, questIds, action = 'assign' } = body;

    if (!userId || !questIds || !Array.isArray(questIds)) {
      return new Response(
        JSON.stringify({ error: 'Missing userId or questIds (must be an array)' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if user exists
    const userPath = `quest-app/users/${userId}.json`;
    let userData = null;

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

      const response = await fetch(userBlob.url);
      if (response.ok) {
        userData = await response.json();
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user data' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify quests exist by checking quest templates
    const validQuestIds = await verifyQuestsExist(questIds, blobToken);
    if (validQuestIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid quests found to assign' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update user's daily quests based on action
    switch (action) {
      case 'assign':
        // Add quests to user's daily quests (avoid duplicates)
        userData.dailyQuests = [...new Set([...userData.dailyQuests, ...validQuestIds])];
        break;
      case 'replace':
        // Replace all daily quests with new ones
        userData.dailyQuests = validQuestIds;
        break;
      case 'remove':
        // Remove specific quests from user's daily quests
        userData.dailyQuests = userData.dailyQuests.filter(questId => !validQuestIds.includes(questId));
        break;
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action. Use "assign", "replace", or "remove"' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }

    // Add task assignment record
    const assignmentRecord = {
      questIds: validQuestIds,
      action,
      assignedAt: new Date().toISOString(),
      assignedBy: 'admin'
    };

    if (!userData.taskAssignments) {
      userData.taskAssignments = [];
    }
    userData.taskAssignments.push(assignmentRecord);

    // Update user data
    userData.lastUpdated = new Date().toISOString();

    // Save updated user data
    const blob = await put(userPath, JSON.stringify(userData, null, 2), {
      access: 'public',
      token: blobToken,
      contentType: 'application/json',
      allowOverwrite: true
    });

    // Also create a daily quest assignment record for today
    await createDailyAssignmentRecord(userId, validQuestIds, blobToken);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Tasks ${action}ed successfully`,
        userId,
        questIds: validQuestIds,
        action,
        dailyQuests: userData.dailyQuests,
        url: blob.url
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('API: Error assigning tasks:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to assign tasks' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function verifyQuestsExist(questIds, token) {
  try {
    const validQuestIds = [];
    const templatePath = 'quest-app/config/quest-templates.json';

    // Get quest templates
    const { blobs } = await list({
      token: token,
      prefix: templatePath
    });

    const templateBlob = blobs.find(blob => blob.pathname === templatePath);
    let templates = {};

    if (templateBlob) {
      const response = await fetch(templateBlob.url);
      if (response.ok) {
        templates = await response.json();
      }
    }

    // Check each quest ID
    questIds.forEach(questId => {
      if (templates[questId]) {
        validQuestIds.push(questId);
      }
    });

    console.log(`Valid quests found: ${validQuestIds.length}/${questIds.length}`);
    return validQuestIds;

  } catch (error) {
    console.error('Error verifying quests:', error);
    return [];
  }
}

async function createDailyAssignmentRecord(userId, questIds, token) {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const assignmentPath = `quest-app/assignments/${today}/${userId}.json`;

    const assignmentData = {
      userId,
      questIds,
      assignedAt: new Date().toISOString(),
      assignedBy: 'admin',
      status: 'assigned'
    };

    await put(assignmentPath, JSON.stringify(assignmentData, null, 2), {
      access: 'public',
      token,
      contentType: 'application/json',
      allowOverwrite: true
    });

    console.log(`Created daily assignment record for user ${userId} on ${today}`);

  } catch (error) {
    console.error('Error creating daily assignment record:', error);
    // Don't throw here - this is not critical for the main operation
  }
}