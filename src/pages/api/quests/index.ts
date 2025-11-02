import { NextApiRequest, NextApiResponse } from 'next';
import { EdgeConfigManager } from '@/lib/edgeConfig';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return handleGetQuests(req, res);
      case 'POST':
        return handleCreateQuest(req, res);
      case 'PUT':
        return handleUpdateQuest(req, res);
      case 'DELETE':
        return handleDeleteQuest(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Quests API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleGetQuests(req: NextApiRequest, res: NextApiResponse) {
  try {
    const quests = await EdgeConfigManager.getQuests();

    return res.status(200).json({
      quests,
      success: true
    });
  } catch (error) {
    // Fallback to local JSON if Edge Config fails
    try {
      const fs = require('fs').promises;
      const path = require('path');
      const questsConfigPath = path.join(process.cwd(), 'public', 'quests-library.json');
      const questsConfigData = await fs.readFile(questsConfigPath, 'utf8');
      const questsConfig = JSON.parse(questsConfigData);

      return res.status(200).json({
        quests: questsConfig.quests,
        success: true,
        fallback: true
      });
    } catch (fallbackError) {
      return res.status(500).json({ error: 'Failed to load quests' });
    }
  }
}

async function handleCreateQuest(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id, title, description, category, xp, difficulty, icon, tags, requirements } = req.body;

    if (!id || !title || !category || !xp) {
      return res.status(400).json({ error: 'Quest ID, title, category, and XP are required' });
    }

    // Validate admin password
    const adminPassword = req.headers['x-admin-password'] as string;
    const storedPassword = await EdgeConfigManager.getAdminPassword();

    if (adminPassword !== storedPassword) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const newQuest = {
      id,
      title,
      description: description || '',
      category,
      xp: Number(xp),
      difficulty: difficulty || 'moyen',
      icon: icon || '📋',
      tags: tags || [],
      requirements: requirements || [],
      createdAt: new Date().toISOString(),
      isActive: true
    };

    // For now, save to JSON file (Edge Config updates require server-side)
    const fs = require('fs').promises;
    const path = require('path');
    const questsConfigPath = path.join(process.cwd(), 'public', 'quests-library.json');

    let questsConfig;
    try {
      const existingData = await fs.readFile(questsConfigPath, 'utf8');
      questsConfig = JSON.parse(existingData);
    } catch {
      questsConfig = { quests: {}, version: '1.0' };
    }

    questsConfig.quests[id] = newQuest;
    questsConfig.lastUpdated = new Date().toISOString();

    await fs.writeFile(questsConfigPath, JSON.stringify(questsConfig, null, 2));

    return res.status(201).json({
      quest: newQuest,
      success: true,
      message: 'Quest created successfully'
    });
  } catch (error) {
    console.error('Error creating quest:', error);
    return res.status(500).json({ error: 'Failed to create quest' });
  }
}

async function handleUpdateQuest(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { questId, ...updates } = req.body;

    if (!questId) {
      return res.status(400).json({ error: 'Quest ID is required' });
    }

    // Validate admin password
    const adminPassword = req.headers['x-admin-password'] as string;
    const storedPassword = await EdgeConfigManager.getAdminPassword();

    if (adminPassword !== storedPassword) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Update quest in JSON file
    const fs = require('fs').promises;
    const path = require('path');
    const questsConfigPath = path.join(process.cwd(), 'public', 'quests-library.json');

    const questsConfigData = await fs.readFile(questsConfigPath, 'utf8');
    const questsConfig = JSON.parse(questsConfigData);

    if (!questsConfig.quests[questId]) {
      return res.status(404).json({ error: 'Quest not found' });
    }

    questsConfig.quests[questId] = { ...questsConfig.quests[questId], ...updates };
    questsConfig.lastUpdated = new Date().toISOString();

    await fs.writeFile(questsConfigPath, JSON.stringify(questsConfig, null, 2));

    return res.status(200).json({
      quest: questsConfig.quests[questId],
      success: true,
      message: 'Quest updated successfully'
    });
  } catch (error) {
    console.error('Error updating quest:', error);
    return res.status(500).json({ error: 'Failed to update quest' });
  }
}

async function handleDeleteQuest(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { questId } = req.query;

    if (!questId || typeof questId !== 'string') {
      return res.status(400).json({ error: 'Quest ID is required' });
    }

    // Validate admin password
    const adminPassword = req.headers['x-admin-password'] as string;
    const storedPassword = await EdgeConfigManager.getAdminPassword();

    if (adminPassword !== storedPassword) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Delete quest from JSON file
    const fs = require('fs').promises;
    const path = require('path');
    const questsConfigPath = path.join(process.cwd(), 'public', 'quests-library.json');

    const questsConfigData = await fs.readFile(questsConfigPath, 'utf8');
    const questsConfig = JSON.parse(questsConfigData);

    if (!questsConfig.quests[questId]) {
      return res.status(404).json({ error: 'Quest not found' });
    }

    delete questsConfig.quests[questId];
    questsConfig.lastUpdated = new Date().toISOString();

    await fs.writeFile(questsConfigPath, JSON.stringify(questsConfig, null, 2));

    return res.status(200).json({
      success: true,
      message: 'Quest deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting quest:', error);
    return res.status(500).json({ error: 'Failed to delete quest' });
  }
}