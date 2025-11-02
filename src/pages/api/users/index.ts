import { NextApiRequest, NextApiResponse } from 'next';
import { EdgeConfigManager } from '@/lib/edgeConfig';
import { userManager } from '@/lib/userManager';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return handleGetUsers(req, res);
      case 'POST':
        return handleCreateUser(req, res);
      case 'PUT':
        return handleUpdateUser(req, res);
      case 'DELETE':
        return handleDeleteUser(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Users API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleGetUsers(req: NextApiRequest, res: NextApiResponse) {
  try {
    const users = await EdgeConfigManager.getUsers();
    const commonQuests = await EdgeConfigManager.getCommonQuests();

    return res.status(200).json({
      users,
      commonQuests,
      success: true
    });
  } catch (error) {
    // Fallback to local JSON if Edge Config fails
    try {
      const fs = require('fs').promises;
      const path = require('path');
      const usersConfigPath = path.join(process.cwd(), 'public', 'users-config.json');
      const usersConfigData = await fs.readFile(usersConfigPath, 'utf8');
      const usersConfig = JSON.parse(usersConfigData);

      return res.status(200).json({
        users: usersConfig.users,
        commonQuests: usersConfig.commonQuests,
        success: true,
        fallback: true
      });
    } catch (fallbackError) {
      return res.status(500).json({ error: 'Failed to load users' });
    }
  }
}

async function handleCreateUser(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userId, name, avatar, preferences, dailyQuests } = req.body;

    if (!userId || !name) {
      return res.status(400).json({ error: 'User ID and name are required' });
    }

    // Validate admin password
    const adminPassword = req.headers['x-admin-password'] as string;
    const storedPassword = await EdgeConfigManager.getAdminPassword();

    if (adminPassword !== storedPassword) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const newUser = {
      id: userId,
      name,
      avatar: avatar || 'default',
      preferences: preferences || {},
      dailyQuests: dailyQuests || [],
      totalXP: 0,
      currentLevel: 1,
      currentXP: 0,
      xpToNextLevel: 100,
      questsCompleted: 0,
      totalQuestsCompleted: 0,
      currentStreak: 0,
      longestStreak: 0,
      joinDate: new Date().toISOString(),
      lastActiveDate: new Date().toISOString(),
      achievements: []
    };

    // For now, save to JSON file (Edge Config updates require server-side)
    const fs = require('fs').promises;
    const path = require('path');
    const usersConfigPath = path.join(process.cwd(), 'public', 'users-config.json');

    let usersConfig;
    try {
      const existingData = await fs.readFile(usersConfigPath, 'utf8');
      usersConfig = JSON.parse(existingData);
    } catch {
      usersConfig = { users: {}, commonQuests: [], adminPassword: 'admin123', version: '1.0' };
    }

    usersConfig.users[userId] = newUser;
    usersConfig.lastUpdated = new Date().toISOString();

    await fs.writeFile(usersConfigPath, JSON.stringify(usersConfig, null, 2));

    return res.status(201).json({
      user: newUser,
      success: true,
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ error: 'Failed to create user' });
  }
}

async function handleUpdateUser(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userId, ...updates } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Validate admin password
    const adminPassword = req.headers['x-admin-password'] as string;
    const storedPassword = await EdgeConfigManager.getAdminPassword();

    if (adminPassword !== storedPassword) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Update user in JSON file
    const fs = require('fs').promises;
    const path = require('path');
    const usersConfigPath = path.join(process.cwd(), 'public', 'users-config.json');

    const usersConfigData = await fs.readFile(usersConfigPath, 'utf8');
    const usersConfig = JSON.parse(usersConfigData);

    if (!usersConfig.users[userId]) {
      return res.status(404).json({ error: 'User not found' });
    }

    usersConfig.users[userId] = { ...usersConfig.users[userId], ...updates };
    usersConfig.lastUpdated = new Date().toISOString();

    await fs.writeFile(usersConfigPath, JSON.stringify(usersConfig, null, 2));

    return res.status(200).json({
      user: usersConfig.users[userId],
      success: true,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ error: 'Failed to update user' });
  }
}

async function handleDeleteUser(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Validate admin password
    const adminPassword = req.headers['x-admin-password'] as string;
    const storedPassword = await EdgeConfigManager.getAdminPassword();

    if (adminPassword !== storedPassword) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Delete user from JSON file
    const fs = require('fs').promises;
    const path = require('path');
    const usersConfigPath = path.join(process.cwd(), 'public', 'users-config.json');

    const usersConfigData = await fs.readFile(usersConfigPath, 'utf8');
    const usersConfig = JSON.parse(usersConfigData);

    if (!usersConfig.users[userId]) {
      return res.status(404).json({ error: 'User not found' });
    }

    delete usersConfig.users[userId];
    usersConfig.lastUpdated = new Date().toISOString();

    await fs.writeFile(usersConfigPath, JSON.stringify(usersConfig, null, 2));

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ error: 'Failed to delete user' });
  }
}