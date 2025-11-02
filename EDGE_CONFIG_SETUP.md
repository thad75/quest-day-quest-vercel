# Vercel Edge Config Setup Guide

This guide explains how to set up Vercel Edge Config for the Quest Day Quest application.

## What is Vercel Edge Config?

Vercel Edge Config is a global data store that allows you to read configuration data at the edge. It's the most free option available on Vercel and is included in all plans.

## Benefits

- **Free**: Included in all Vercel plans
- **Global**: Data is replicated across Vercel's global network
- **Fast**: Sub-millisecond read times from the edge
- **Consistent**: Strong consistency guarantees
- **Secure**: Built-in authentication and authorization

## Setup Instructions

### 1. Create Edge Config

1. Go to your Vercel dashboard
2. Navigate to your project
3. Go to the "Storage" tab
4. Click "Create Database"
5. Select "Edge Config"
6. Give it a name (e.g., "quest-app-config")
7. Click "Create"

### 2. Initialize Edge Config Data

Once created, initialize your Edge Config with the following data structure:

```json
{
  "users": {
    "thars": {
      "id": "thars",
      "name": "Thars",
      "avatar": "🦸",
      "dailyQuests": ["1", "3", "4", "6", "11"],
      "preferences": {
        "categories": ["santé", "apprentissage"],
        "difficulty": "facile",
        "questCount": 3,
        "allowCommonQuests": true
      },
      "totalXP": 0,
      "currentLevel": 1,
      "currentXP": 0,
      "xpToNextLevel": 100,
      "questsCompleted": 0,
      "totalQuestsCompleted": 0,
      "currentStreak": 0,
      "longestStreak": 0,
      "joinDate": "2025-01-01T00:00:00.000Z",
      "lastActiveDate": "2025-01-01T00:00:00.000Z",
      "achievements": []
    }
  },
  "quests": {
    "1": {
      "id": "1",
      "title": "Boire 2L d'eau",
      "description": "Boire 2 litres d'eau au cours de la journée",
      "category": "santé",
      "xp": 10,
      "difficulty": "facile",
      "icon": "💧",
      "tags": ["hydratation", "santé"],
      "requirements": []
    }
  },
  "commonQuests": ["1", "2", "10"],
  "adminPassword": "admin123",
  "lastUpdated": "2025-01-01T00:00:00.000Z",
  "version": "1.0"
}
```

### 3. Configure Environment Variable

1. Copy your Edge Config ID from the Vercel dashboard
2. Add it to your environment variables:

**For Vercel Deployment:**
- Go to Project Settings → Environment Variables
- Add `EDGE_CONFIG` with your Edge Config ID

**For Local Development:**
- Create a `.env.local` file
- Add: `EDGE_CONFIG=your_edge_config_id_here`

### 4. Update Data

The application includes an admin dashboard at `/admin` where you can:
- Add/edit/delete users
- Add/edit/delete quests
- Manage common quests
- Save changes directly to Edge Config

### 5. Fallback Behavior

If Edge Config is not available (local development or deployment issues), the application automatically falls back to using JSON files:
- `public/users-config.json`
- `public/quests-library.json`

## API Limitations

**Important**: Edge Config has some limitations:

1. **Read-only from client-side**: Direct updates require server-side functions or Vercel API
2. **Size limits**: Maximum 64 KB per Edge Config
3. **Rate limits**: 100 reads per second per function invocation

For this reason, the current implementation:
- Reads from Edge Config when available
- Writes to JSON files (deployed via Git)
- Uses the admin dashboard to manage updates

## Alternative: Vercel KV (Redis)

If you need full read/write capabilities, consider Vercel KV:
- 30,000 commands/month free tier
- Full read/write support
- Redis-compatible API

To switch to KV, you would need to update the API routes in `src/pages/api/` to use Vercel KV instead of Edge Config.

## Current Implementation Status

✅ **Completed:**
- Edge Config client setup
- API routes for users and quests
- Admin dashboard integration
- Login page integration
- Index page integration
- Fallback to JSON files
- Status indicators in UI

🔄 **How it works:**
1. Application tries to connect to Edge Config
2. If available, shows "Edge Config" status and reads from there
3. If not available, shows "Local Files" status and uses JSON files
4. Admin saves update JSON files (which can be deployed to update Edge Config)

This gives you the best of both worlds: fast global reads when deployed, and reliable local development with JSON files.