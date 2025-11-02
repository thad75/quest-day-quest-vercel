#!/usr/bin/env node

/**
 * Simplified Blob Store Setup Script
 * Basic migration from JSON files to Blob Store configuration
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { put, list } from '@vercel/blob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// Configuration
const CONFIG = {
  // JSON file paths
  usersConfigPath: path.join(projectRoot, 'dist', 'users-config.json'),
  questsLibraryPath: path.join(projectRoot, 'dist', 'quests-library.json'),

  // Blob Store paths
  primaryPath: process.env.BLOB_STORE_PRIMARY_PATH || 'quest-app/data/main-config.json',
  backupPath: process.env.BLOB_STORE_BACKUP_PATH || 'quest-app/backups/'
};

// Color output utilities
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

/**
 * Check environment variables
 */
async function checkEnvironment() {
  log('🔍 Checking environment variables...', 'cyan');

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    logError('BLOB_READ_WRITE_TOKEN is not set');
    log('\n📝 To fix this:', 'yellow');
    log('1. Go to https://vercel.com/stores/blob', 'yellow');
    log('2. Create or select your Blob Store', 'yellow');
    log('3. Copy the BLOB_READ_WRITE_TOKEN', 'yellow');
    log('4. Add it to your environment variables', 'yellow');
    return false;
  }

  if (token === 'blob_xxxxxxxxxxxxxxxxxxxx') {
    logError('Please replace the placeholder token with your actual Blob Store token');
    return false;
  }

  logSuccess('Environment variables configured correctly');
  return true;
}

/**
 * Read JSON data files
 */
async function readJsonData() {
  log('📂 Reading JSON data files...', 'cyan');

  let usersConfig = null;
  let questsLibrary = null;

  try {
    // Read users config
    const usersData = await fs.readFile(CONFIG.usersConfigPath, 'utf-8');
    usersConfig = JSON.parse(usersData);
    logSuccess(`Loaded users config: ${Object.keys(usersConfig.users || {}).length} users`);

  } catch (error) {
    logError(`Failed to read users config: ${error.message}`);
    return null;
  }

  try {
    // Read quests library
    const questsData = await fs.readFile(CONFIG.questsLibraryPath, 'utf-8');
    questsLibrary = JSON.parse(questsData);
    logSuccess(`Loaded quests library: ${Object.keys(questsLibrary.quests || {}).length} quests`);

  } catch (error) {
    logError(`Failed to read quests library: ${error.message}`);
    return null;
  }

  return { usersConfig, questsLibrary };
}

/**
 * Create backup of existing data
 */
async function createBackup(data) {
  log('💾 Creating backup...', 'cyan');

  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${CONFIG.backupPath}backup-${timestamp}.json`;

    const blob = await put(backupPath, JSON.stringify(data, null, 2), {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      contentType: 'application/json'
    });

    logSuccess(`Backup created: ${blob.url}`);
    return blob.url;

  } catch (error) {
    logWarning(`Failed to create backup: ${error.message}`);
    return null;
  }
}

/**
 * Upload data to Blob Store
 */
async function uploadToBlobStore(jsonData) {
  log('📦 Uploading data to Blob Store...', 'cyan');

  const { usersConfig, questsLibrary } = jsonData;

  try {
    // Transform data structure
    const config = {
      users: usersConfig.users || {},
      quests: questsLibrary.quests || {},
      commonQuests: usersConfig.commonQuests || [],
      adminPassword: usersConfig.adminPassword || 'admin123',
      lastUpdated: new Date().toISOString(),
      version: '2.0',
      metadata: {
        migrationDate: new Date().toISOString(),
        source: 'json-files',
        originalVersion: usersConfig.version || '1.0'
      }
    };

    // Create backup first
    await createBackup(config);

    // Upload main configuration
    const blob = await put(CONFIG.primaryPath, JSON.stringify(config, null, 2), {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      contentType: 'application/json'
    });

    logSuccess(`Configuration uploaded: ${blob.url}`);
    logInfo(`  Users: ${Object.keys(config.users).length}`);
    logInfo(`  Quests: ${Object.keys(config.quests).length}`);
    logInfo(`  Common quests: ${config.commonQuests.length}`);

    return true;

  } catch (error) {
    logError(`Failed to upload data: ${error.message}`);
    return false;
  }
}

/**
 * Verify upload
 */
async function verifyUpload() {
  log('🔍 Verifying upload...', 'cyan');

  try {
    // List blobs to find our config file
    const { blobs } = await list({
      token: process.env.BLOB_READ_WRITE_TOKEN,
      prefix: CONFIG.primaryPath
    });

    const configBlob = blobs.find(blob => blob.pathname === CONFIG.primaryPath);

    if (!configBlob) {
      logError('Configuration file not found in Blob Store');
      return false;
    }

    // Fetch and verify the configuration
    const response = await fetch(configBlob.url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const config = await response.json();

    // Basic structure verification
    const checks = [
      config.users && typeof config.users === 'object',
      config.quests && typeof config.quests === 'object',
      Array.isArray(config.commonQuests),
      typeof config.adminPassword === 'string',
      typeof config.version === 'string'
    ];

    const passed = checks.filter(Boolean).length;
    const total = checks.length;

    log(`Verification: ${passed}/${total} checks passed`, passed === total ? 'green' : 'yellow');

    if (passed === total) {
      logSuccess('Upload verified successfully');
      return true;
    } else {
      logWarning('Some verification checks failed');
      return false;
    }

  } catch (error) {
    logError(`Verification failed: ${error.message}`);
    return false;
  }
}

/**
 * Main setup function
 */
async function main() {
  log('🎯 Vercel Blob Store Setup for Quest Application', 'cyan');
  log('=' .repeat(50), 'cyan');

  // Step 1: Check environment
  const envOk = await checkEnvironment();
  if (!envOk) {
    logError('Setup failed - environment not configured');
    process.exit(1);
  }

  // Step 2: Read JSON data
  const jsonData = await readJsonData();
  if (!jsonData) {
    logError('Setup failed - could not read JSON data');
    process.exit(1);
  }

  // Step 3: Upload to Blob Store
  const uploadSuccess = await uploadToBlobStore(jsonData);
  if (!uploadSuccess) {
    logError('Setup failed - could not upload data');
    process.exit(1);
  }

  // Step 4: Verify upload
  const verifySuccess = await verifyUpload();
  if (!verifySuccess) {
    logError('Setup failed - verification failed');
    process.exit(1);
  }

  // Success!
  log('\n✨ Setup Complete!', 'green');
  log('=' .repeat(50), 'cyan');
  logSuccess('Your quest application is now using Vercel Blob Store!');

  logInfo('\nNext steps:');
  logInfo('1. Update your application to use Blob Store APIs');
  logInfo('2. Test your application thoroughly');
  logInfo('3. Deploy to Vercel with the new configuration');
  logInfo('4. Monitor performance and backups');

  logInfo('\nUseful commands:');
  logInfo('• npm run blob:health  - Check Blob Store health');
  logInfo('• npm run test:blob-store - Run comprehensive tests');
  logInfo('• npm run backup:create - Create manual backup');

  logInfo('\nFile locations in Blob Store:');
  logInfo(`• Main config: ${CONFIG.primaryPath}`);
  logInfo(`• Backups: ${CONFIG.backupPath}`);
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  logError(`Unhandled rejection: ${reason}`);
  process.exit(1);
});

// Run the setup
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    logError(`Setup failed: ${error.message}`);
    process.exit(1);
  });
}

export { main as setupBlobStore };