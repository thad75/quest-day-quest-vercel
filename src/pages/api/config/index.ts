import { NextApiRequest, NextApiResponse } from 'next';
import { EdgeConfigManager } from '@/lib/edgeConfig';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return handleGetConfig(req, res);
      case 'POST':
        return handleUpdateConfig(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Config API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleGetConfig(req: NextApiRequest, res: NextApiResponse) {
  try {
    const config = await EdgeConfigManager.getFullConfig();
    const isEdgeConfigAvailable = await EdgeConfigManager.isAvailable();

    return res.status(200).json({
      config,
      isEdgeConfigAvailable,
      success: true
    });
  } catch (error) {
    // Fallback to local JSON files
    try {
      const fs = require('fs').promises;
      const path = require('path');

      const usersConfigPath = path.join(process.cwd(), 'public', 'users-config.json');
      const questsConfigPath = path.join(process.cwd(), 'public', 'quests-library.json');

      const [usersConfigData, questsConfigData] = await Promise.all([
        fs.readFile(usersConfigPath, 'utf8'),
        fs.readFile(questsConfigPath, 'utf8')
      ]);

      const usersConfig = JSON.parse(usersConfigData);
      const questsConfig = JSON.parse(questsConfigData);

      const config = {
        users: usersConfig.users,
        quests: questsConfig.quests,
        commonQuests: usersConfig.commonQuests,
        adminPassword: usersConfig.adminPassword,
        lastUpdated: new Date().toISOString(),
        version: '1.0'
      };

      return res.status(200).json({
        config,
        isEdgeConfigAvailable: false,
        success: true,
        fallback: true
      });
    } catch (fallbackError) {
      return res.status(500).json({ error: 'Failed to load configuration' });
    }
  }
}

async function handleUpdateConfig(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { users, quests, commonQuests } = req.body;

    // Validate admin password
    const adminPassword = req.headers['x-admin-password'] as string;
    const storedPassword = await EdgeConfigManager.getAdminPassword();

    if (adminPassword !== storedPassword) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // For now, update JSON files (Edge Config updates require server-side)
    const fs = require('fs').promises;
    const path = require('path');

    const usersConfigPath = path.join(process.cwd(), 'public', 'users-config.json');
    const questsConfigPath = path.join(process.cwd(), 'public', 'quests-library.json');

    // Update users config
    let usersConfig;
    try {
      const existingData = await fs.readFile(usersConfigPath, 'utf8');
      usersConfig = JSON.parse(existingData);
    } catch {
      usersConfig = { users: {}, commonQuests: [], adminPassword: 'admin123', version: '1.0' };
    }

    if (users) {
      usersConfig.users = users;
    }
    if (commonQuests) {
      usersConfig.commonQuests = commonQuests;
    }
    usersConfig.lastUpdated = new Date().toISOString();

    // Update quests config
    let questsConfig;
    try {
      const existingData = await fs.readFile(questsConfigPath, 'utf8');
      questsConfig = JSON.parse(existingData);
    } catch {
      questsConfig = { quests: {}, version: '1.0' };
    }

    if (quests) {
      questsConfig.quests = quests;
    }
    questsConfig.lastUpdated = new Date().toISOString();

    // Write both files
    await Promise.all([
      fs.writeFile(usersConfigPath, JSON.stringify(usersConfig, null, 2)),
      fs.writeFile(questsConfigPath, JSON.stringify(questsConfig, null, 2))
    ]);

    return res.status(200).json({
      success: true,
      message: 'Configuration updated successfully',
      usersConfig: {
        users: usersConfig.users,
        commonQuests: usersConfig.commonQuests,
        lastUpdated: usersConfig.lastUpdated
      },
      questsConfig: {
        quests: questsConfig.quests,
        lastUpdated: questsConfig.lastUpdated
      }
    });
  } catch (error) {
    console.error('Error updating configuration:', error);
    return res.status(500).json({ error: 'Failed to update configuration' });
  }
}