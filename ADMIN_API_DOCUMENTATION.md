# Admin Dashboard API Documentation

## Overview

This document describes the new admin dashboard endpoints for user management in the Quest Reward application. These endpoints use the new data structure with individual user files stored in Vercel Blob Store.

## Base URL

All admin endpoints are located under:
```
/api/blob/admin/
```

## Authentication

All admin endpoints require proper authentication. The system uses the existing admin password verification mechanism.

## Endpoints

### 1. Create User Endpoint

**Endpoint:** `POST /api/blob/admin/create-user`

**Description:** Creates a new user with the new folder structure. Generates a unique user ID if not provided.

**Request Body:**
```json
{
  "userData": {
    "name": "string (required)",
    "avatar": "string (optional, default: '👤')",
    "dailyQuests": ["string"] (optional, default: ['1', '2', '3']),
    "preferences": {
      "categories": ["string"] (optional),
      "difficulty": "facile|moyen|difficile" (optional),
      "questCount": "number" (optional),
      "allowCommonQuests": "boolean" (optional)
    },
    "stats": {
      "totalXP": "number" (optional, default: 0),
      "currentLevel": "number" (optional, default: 1),
      "currentXP": "number" (optional),
      "xpToNextLevel": "number" (optional),
      "questsCompleted": "number" (optional, default: 0),
      "totalQuestsCompleted": "number" (optional, default: 0),
      "currentStreak": "number" (optional, default: 0),
      "longestStreak": "number" (optional, default: 0)
    }
  }
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "User created successfully",
  "userId": "user1234567890abc",
  "userData": { /* Full user object */ },
  "url": "https://blob-url..."
}
```

**Error Responses:**
- `400` - Missing userData or required fields
- `409` - User with this ID already exists
- `500` - Failed to create user

### 2. Delete User Endpoint

**Endpoint:** `POST /api/blob/admin/delete-user`

**Description:** Deletes a user and cleans up their data, including removing them from the user index.

**Request Body:**
```json
{
  "userId": "string (required)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "User deleted successfully",
  "userId": "user1234567890abc"
}
```

**Error Responses:**
- `400` - Missing userId
- `404` - User not found
- `500` - Failed to delete user

### 3. Modify User Endpoint

**Endpoint:** `POST /api/blob/admin/modify-user`

**Description:** Updates user information. Only provided fields are updated; other fields remain unchanged.

**Request Body:**
```json
{
  "userId": "string (required)",
  "userData": {
    "name": "string (optional)",
    "avatar": "string (optional)",
    "stats": {
      "totalXP": "number (optional)",
      "currentLevel": "number (optional)",
      // ... other stat fields
    },
    "preferences": {
      // ... preference fields
    }
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "User updated successfully",
  "userId": "user1234567890abc",
  "userData": { /* Updated user object */ },
  "url": "https://blob-url..."
}
```

**Error Responses:**
- `400` - Missing userId or userData
- `404` - User not found
- `500` - Failed to modify user

### 4. Assign Tasks Endpoint

**Endpoint:** `POST /api/blob/admin/assign-tasks`

**Description:** Assigns, replaces, or removes quests from a user's daily quests.

**Request Body:**
```json
{
  "userId": "string (required)",
  "questIds": ["string"] (required, array of quest IDs),
  "action": "assign|replace|remove" (required)
}
```

**Actions:**
- `assign`: Add quests to user's existing daily quests (avoids duplicates)
- `replace`: Replace all of user's daily quests with the provided ones
- `remove`: Remove specific quests from user's daily quests

**Success Response (200):**
```json
{
  "success": true,
  "message": "Tasks assigned successfully",
  "userId": "user1234567890abc",
  "questIds": ["1", "2", "3"],
  "action": "assign",
  "dailyQuests": ["1", "2", "3", "4"],
  "url": "https://blob-url..."
}
```

**Error Responses:**
- `400` - Missing userId, questIds, or invalid action
- `404` - User not found
- `500` - Failed to assign tasks

## Data Structure

### User Object Structure

```json
{
  "id": "string (unique identifier)",
  "name": "string",
  "avatar": "string (emoji)",
  "dailyQuests": ["string"] (array of quest IDs),
  "preferences": {
    "categories": ["string"],
    "difficulty": "facile|moyen|difficile",
    "questCount": "number",
    "allowCommonQuests": "boolean"
  },
  "stats": {
    "totalXP": "number",
    "currentLevel": "number",
    "currentXP": "number",
    "xpToNextLevel": "number",
    "questsCompleted": "number",
    "totalQuestsCompleted": "number",
    "currentStreak": "number",
    "longestStreak": "number"
  },
  "createdAt": "string (ISO date)",
  "lastUpdated": "string (ISO date)"
}
```

### File Structure in Blob Store

```
quest-app/
├── users/
│   ├── userId1.json
│   ├── userId2.json
│   └── ...
├── indexes/
│   └── user-list.json (user index for quick lookups)
├── assignments/
│   └── YYYY-MM-DD/
│       ├── userId1.json (daily assignment records)
│       └── ...
└── config/
    └── quest-templates.json
```

## Integration with Existing Admin Dashboard

The new endpoints are integrated into the existing admin dashboard through:

1. **AdminApiService** (`src/lib/adminApiService.ts`): Provides a unified interface for all admin operations
2. **AdminUserManagement** (`src/components/AdminUserManagement.tsx`): React component that provides the user interface for user management
3. **Updated Admin.tsx**: Modified to use the new user management component

## Frontend Integration

### AdminApiService Usage

```typescript
import { AdminApiService } from '@/lib/adminApiService';

// Create user
const result = await AdminApiService.createUser({
  name: 'New User',
  avatar: '👤',
  stats: { currentLevel: 5 }
});

// Delete user
const result = await AdminApiService.deleteUser('userId');

// Modify user
const result = await AdminApiService.modifyUser('userId', {
  name: 'Updated Name',
  stats: { totalXP: 1000 }
});

// Assign tasks
const result = await AdminApiService.assignTasks('userId', ['1', '2'], 'assign');
```

## Error Handling

All endpoints follow consistent error handling patterns:

- **400 Bad Request**: Missing required parameters or invalid data
- **404 Not Found**: User or resource not found
- **409 Conflict**: Resource already exists (for create operations)
- **500 Internal Server Error**: Server-side errors

Error responses include descriptive messages:
```json
{
  "error": "User not found"
}
```

## Security Considerations

1. **Authentication**: All endpoints require admin authentication
2. **Input Validation**: All inputs are validated before processing
3. **Unique IDs**: User IDs are automatically generated to prevent collisions
4. **Data Cleanup**: User deletion removes all associated data files

## Testing

A comprehensive test suite is available at `test-admin-endpoints.html`. This file provides:

1. Individual endpoint testing
2. Bulk operations testing
3. Data integrity verification
4. Statistics overview

## Migration from Old System

To migrate from the old single-file system:

1. Use the existing user data to create individual user files
2. Update the user index for quick lookups
3. Update frontend to use the new AdminApiService
4. Test all operations to ensure data integrity

## Browser Compatibility

The endpoints are compatible with all modern browsers and use standard HTTP methods and JSON responses. The frontend components use React hooks and modern JavaScript features.

## Performance Considerations

1. **Caching**: User index provides quick lookups without loading all user data
2. **Individual Files**: Smaller file sizes for faster loading
3. **Async Operations**: All operations are asynchronous and non-blocking
4. **Error Recovery**: Comprehensive error handling with fallback mechanisms

## Future Enhancements

Potential future improvements:

1. **Batch Operations**: Bulk create/modify/delete operations
2. **User Groups**: Organize users into groups for easier management
3. **Advanced Search**: Filter and search users by various criteria
4. **Audit Log**: Track all admin operations for accountability
5. **User Templates**: Predefined user configurations for quick setup