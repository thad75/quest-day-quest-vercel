// Quest management API with new folder structure
import { put, list, del } from '@vercel/blob';

console.log('API: quests-new.js loaded successfully');

export async function GET(request) {
  try {
    console.log('API: quests-new GET called');
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

    if (!blobToken) {
      return new Response(
        JSON.stringify({ error: 'Blob Store token not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const level = searchParams.get('level');

    if (level) {
      // Get specific quests for date and level
      return getQuestsForDateAndLevel(date, level, blobToken);
    } else if (date) {
      // Get all quests for a specific date
      return getQuestsForDate(date, blobToken);
    } else {
      // Get all quest templates
      return getQuestTemplates(blobToken);
    }

  } catch (error) {
    console.error('API: Error fetching quests:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch quests' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function POST(request) {
  try {
    console.log('API: quests-new POST called');
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

    if (!blobToken) {
      return new Response(
        JSON.stringify({ error: 'Blob Store token not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { action, questData, date, level } = body;

    switch (action) {
      case 'save_daily':
        return saveDailyQuests(date, level, questData, blobToken);
      case 'save_template':
        return saveQuestTemplate(questData, blobToken);
      case 'create_daily_from_templates':
        return createDailyQuestsFromTemplates(date, level, blobToken);
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('API: Error saving quests:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to save quests' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function getQuestTemplates(blobToken) {
  try {
    const { blobs } = await list({
      token: blobToken,
      prefix: 'quest-app/config/quest-templates.json'
    });

    const templateBlob = blobs.find(blob => blob.pathname === 'quest-app/config/quest-templates.json');

    if (templateBlob) {
      const response = await fetch(templateBlob.url);
      if (response.ok) {
        const templates = await response.json();
        return new Response(
          JSON.stringify({
            templates,
            isBlobStore: true,
            type: 'templates'
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Return default templates if none exist
    const defaultTemplates = {
      '1': {
        id: '1',
        title: 'Boire 2L d\'eau',
        description: 'Boire 2 litres d\'eau au cours de la journée',
        category: 'santé',
        xp: 10,
        difficulty: 'facile',
        icon: '💧',
        tags: ['hydratation', 'santé'],
        requirements: []
      }
    };

    return new Response(
      JSON.stringify({
        templates: defaultTemplates,
        isBlobStore: true,
        type: 'templates',
        isDefault: true
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching quest templates:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch quest templates' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function getQuestsForDate(date, blobToken) {
  try {
    const { blobs } = await list({
      token: blobToken,
      prefix: `quest-app/quests/${date}/`
    });

    const questFiles = blobs.filter(blob => blob.pathname.endsWith('.json'));
    const allQuests = {};

    for (const questFile of questFiles) {
      try {
        const response = await fetch(questFile.url);
        if (response.ok) {
          const levelQuests = await response.json();
          const level = questFile.pathname.split('/').pop().replace('.json', '');
          allQuests[level] = levelQuests;
        }
      } catch (error) {
        console.log(`Could not fetch quest file: ${questFile.pathname}`);
      }
    }

    return new Response(
      JSON.stringify({
        date,
        quests: allQuests,
        totalLevels: Object.keys(allQuests).length,
        isBlobStore: true,
        type: 'daily_quests'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching quests for date:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch quests for date' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function getQuestsForDateAndLevel(date, level, blobToken) {
  try {
    const questPath = `quest-app/quests/${date}/level${level}.json`;
    const { blobs } = await list({
      token: blobToken,
      prefix: questPath
    });

    const questBlob = blobs.find(blob => blob.pathname === questPath);

    if (questBlob) {
      const response = await fetch(questBlob.url);
      if (response.ok) {
        const quests = await response.json();
        return new Response(
          JSON.stringify({
            date,
            level,
            quests,
            isBlobStore: true,
            type: 'daily_level_quests'
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Return empty quests if none exist for this date/level
    return new Response(
      JSON.stringify({
        date,
        level,
        quests: {},
        isBlobStore: true,
        type: 'daily_level_quests',
        isEmpty: true
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching quests for date/level:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch quests for date/level' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function saveDailyQuests(date, level, questData, blobToken) {
  try {
    const questPath = `quest-app/quests/${date}/level${level}.json`;
    const blob = await put(questPath, JSON.stringify(questData, null, 2), {
      access: 'public',
      token: blobToken,
      contentType: 'application/json',
      allowOverwrite: true
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Daily quests saved successfully',
        date,
        level,
        url: blob.url
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error saving daily quests:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to save daily quests' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function saveQuestTemplate(questData, blobToken) {
  try {
    const templatePath = 'quest-app/config/quest-templates.json';
    const blob = await put(templatePath, JSON.stringify(questData, null, 2), {
      access: 'public',
      token: blobToken,
      contentType: 'application/json',
      allowOverwrite: true
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Quest templates saved successfully',
        url: blob.url
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error saving quest templates:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to save quest templates' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function createDailyQuestsFromTemplates(date, level, blobToken) {
  try {
    // Get quest templates
    const templatesResponse = await getQuestTemplates(blobToken);
    const templatesData = await templatesResponse.json();
    const templates = templatesData.templates;

    // Select appropriate quests for this level (you can implement logic here)
    const dailyQuests = {};
    Object.keys(templates).slice(0, 3).forEach(questId => {
      dailyQuests[questId] = templates[questId];
    });

    // Save daily quests
    return await saveDailyQuests(date, level, dailyQuests, blobToken);

  } catch (error) {
    console.error('Error creating daily quests from templates:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create daily quests from templates' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}