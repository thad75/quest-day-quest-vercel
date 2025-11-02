#!/usr/bin/env node

/**
 * Complete Vercel Blob Store Setup and Migration Script
 *
 * This script handles:
 * 1. Environment variable verification
 * 2. Blob Store initialization and configuration
 * 3. Data migration from JSON files to Blob Store
 * 4. Backup system setup
 * 5. Verification and testing
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { blobStoreManager } from '../src/lib/blobStore.js';
import { BlobDataService } from '../src/lib/blobDataService.js';
import { BlobMigrationService } from '../src/lib/blobMigration.js';

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
  backupPath: process.env.BLOB_STORE_BACKUP_PATH || 'quest-app/backups/',

  // Backup settings
  maxBackups: parseInt(process.env.BLOB_STORE_MAX_BACKUPS || '10'),
  retentionDays: parseInt(process.env.BLOB_STORE_RETENTION_DAYS || '90'),

  // Environment variables to check
  requiredEnvVars: [
    'BLOB_READ_WRITE_TOKEN',
    'BLOB_STORE_PRIMARY_PATH',
    'BLOB_STORE_BACKUP_PATH'
  ],

  optionalEnvVars: [
    'BLOB_STORE_MAX_BACKUPS',
    'BLOB_STORE_RETENTION_DAYS',
    'EDGE_CONFIG' // For migration reference
  ]
};

// Color output utilities
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, current, total) {
  log(`\n[${current}/${total}] ${step}`, 'cyan');
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

// Progress bar
function showProgress(current, total, message = '') {
  const percentage = Math.round((current / total) * 100);
  const barLength = 30;
  const filledLength = Math.round((barLength * current) / total);
  const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);

  process.stdout.write(`\r${colors.blue}[${bar}] ${percentage}%${colors.reset} ${message}`);

  if (current === total) {
    process.stdout.write('\n');
  }
}

/**
 * Check environment variables
 */
async function checkEnvironmentVariables() {
  log('🔍 Checking environment variables...', 'bright');

  const missing = [];
  const optional = [];

  for (const varName of CONFIG.requiredEnvVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  for (const varName of CONFIG.optionalEnvVars) {
    if (!process.env[varName]) {
      optional.push(varName);
    }
  }

  if (missing.length > 0) {
    logError('Missing required environment variables:');
    missing.forEach(varName => {
      logError(`  - ${varName}`);
    });
    log('\nTo fix this, add the following to your .env file:', 'yellow');
    missing.forEach(varName => {
      log(`  ${varName}=your_value_here`, 'yellow');
    });

    if (varName === 'BLOB_READ_WRITE_TOKEN') {
      log('\n📝 To get BLOB_READ_WRITE_TOKEN:', 'cyan');
      log('  1. Go to https://vercel.com/stores/blob', 'cyan');
      log('  2. Create a new Blob Store or select existing one', 'cyan');
      log('  3. Copy the "BLOB_READ_WRITE_TOKEN"', 'cyan');
      log('  4. Add it to your environment variables', 'cyan');
    }

    return false;
  }

  if (optional.length > 0) {
    logWarning('Missing optional environment variables:');
    optional.forEach(varName => {
      logWarning(`  - ${varName}`);
    });
  }

  logSuccess('All required environment variables are configured');
  return true;
}

/**
 * Read JSON data from files
 */
async function readJsonData() {
  log('📂 Reading JSON data files...', 'bright');

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
 * Initialize Blob Store
 */
async function initializeBlobStore() {
  log('🚀 Initializing Blob Store...', 'bright');

  try {
    // Check availability
    const isAvailable = await blobStoreManager.isAvailable();
    if (!isAvailable) {
      logError('Blob Store is not available or not properly configured');
      return false;
    }

    logSuccess('Blob Store is available and ready');

    // Get current configuration
    const currentConfig = await blobStoreManager.getFullConfig();
    if (currentConfig) {
      logInfo('Existing configuration found in Blob Store');
      logInfo(`  Users: ${Object.keys(currentConfig.users || {}).length}`);
      logInfo(`  Quests: ${Object.keys(currentConfig.quests || {}).length}`);
      logInfo(`  Common Quests: ${currentConfig.commonQuests?.length || 0}`);
      logInfo(`  Last Updated: ${currentConfig.lastUpdated || 'Unknown'}`);
    } else {
      logInfo('No existing configuration found - will create new one');
    }

    return true;

  } catch (error) {
    logError(`Failed to initialize Blob Store: ${error.message}`);
    return false;
  }
}

/**
 * Create initial backup before migration
 */
async function createInitialBackup() {
  log('💾 Creating initial backup...', 'bright');

  try {
    const backupUrl = await blobStoreManager.createBackup();
    if (backupUrl) {
      logSuccess(`Initial backup created: ${backupUrl}`);
      return true;
    } else {
      logWarning('No existing data to backup - continuing');
      return true;
    }
  } catch (error) {
    logError(`Failed to create initial backup: ${error.message}`);
    return false;
  }
}

/**
 * Transform and upload data to Blob Store
 */
async function migrateDataToBlobStore(jsonData) {
  log('📦 Migrating data to Blob Store...', 'bright');

  const { usersConfig, questsLibrary } = jsonData;

  try {
    // Transform data structure
    const transformedConfig = {
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

    // Show migration progress
    showProgress(1, 4, 'Preparing data...');

    showProgress(2, 4, 'Uploading configuration...');

    // Upload to Blob Store
    const success = await blobStoreManager.updateFullConfig(transformedConfig);

    if (!success) {
      throw new Error('Failed to upload configuration to Blob Store');
    }

    showProgress(3, 4, 'Creating post-migration backup...');

    // Create backup after migration
    const backupUrl = await blobStoreManager.createBackup();

    showProgress(4, 4, 'Migration complete');

    logSuccess(`Data migrated successfully to Blob Store`);
    logInfo(`  Users migrated: ${Object.keys(transformedConfig.users).length}`);
    logInfo(`  Quests migrated: ${Object.keys(transformedConfig.quests).length}`);
    logInfo(`  Common quests: ${transformedConfig.commonQuests.length}`);

    if (backupUrl) {
      logSuccess(`Post-migration backup created: ${backupUrl}`);
    }

    return true;

  } catch (error) {
    logError(`Failed to migrate data: ${error.message}`);
    return false;
  }
}

/**
 * Verify migration success
 */
async function verifyMigration() {
  log('🔍 Verifying migration...', 'bright');

  try {
    // Get data from Blob Store
    const config = await blobStoreManager.getFullConfig();

    if (!config) {
      throw new Error('No configuration found in Blob Store');
    }

    // Verify structure
    const checks = [
      { name: 'Users data', condition: config.users && typeof config.users === 'object' },
      { name: 'Quests data', condition: config.quests && typeof config.quests === 'object' },
      { name: 'Common quests', condition: Array.isArray(config.commonQuests) },
      { name: 'Admin password', condition: typeof config.adminPassword === 'string' },
      { name: 'Version info', condition: typeof config.version === 'string' },
      { name: 'Timestamp', condition: typeof config.lastUpdated === 'string' }
    ];

    let allPassed = true;

    for (const check of checks) {
      if (check.condition) {
        logSuccess(`  ✓ ${check.name}`);
      } else {
        logError(`  ✗ ${check.name}`);
        allPassed = false;
      }
    }

    if (allPassed) {
      logSuccess('All verification checks passed');
      return true;
    } else {
      logError('Some verification checks failed');
      return false;
    }

  } catch (error) {
    logError(`Verification failed: ${error.message}`);
    return false;
  }
}

/**
 * Test Blob Store functionality
 */
async function testBlobStoreFunctionality() {
  log('🧪 Testing Blob Store functionality...', 'bright');

  try {
    // Initialize data service
    const serviceInitialized = await BlobDataService.initialize();
    if (!serviceInitialized) {
      throw new Error('Failed to initialize Blob Data Service');
    }

    logSuccess('Blob Data Service initialized');

    // Test reading users
    showProgress(1, 5, 'Testing user data access...');
    const usersResult = await BlobDataService.getUsers();
    if (!usersResult.success) {
      throw new Error(`Failed to read users: ${usersResult.error}`);
    }
    logSuccess(`Users data accessible: ${Object.keys(usersResult.data?.users || {}).length} users`);

    // Test reading quests
    showProgress(2, 5, 'Testing quest data access...');
    const questsResult = await BlobDataService.getQuests();
    if (!questsResult.success) {
      throw new Error(`Failed to read quests: ${questsResult.error}`);
    }
    logSuccess(`Quests data accessible: ${Object.keys(questsResult.data || {}).length} quests`);

    // Test full config
    showProgress(3, 5, 'Testing full configuration...');
    const configResult = await BlobDataService.getConfig();
    if (!configResult.success) {
      throw new Error(`Failed to read config: ${configResult.error}`);
    }
    logSuccess('Full configuration accessible');

    // Test admin password verification
    showProgress(4, 5, 'Testing admin password...');
    const adminCheck = await BlobDataService.verifyAdminPassword('admin123');
    if (!adminCheck) {
      logWarning('Admin password verification returned false (might be different password)');
    } else {
      logSuccess('Admin password verification working');
    }

    // Test health status
    showProgress(5, 5, 'Testing health status...');
    const healthResult = await BlobDataService.getHealthStatus();
    if (!healthResult.success) {
      throw new Error(`Failed to get health status: ${healthResult.error}`);
    }
    logSuccess(`Health status: ${healthResult.data?.status}`);

    logSuccess('All functionality tests passed');
    return true;

  } catch (error) {
    logError(`Functionality test failed: ${error.message}`);
    return false;
  }
}

/**
 * Configure backup system
 */
async function configureBackupSystem() {
  log('⚙️  Configuring backup system...', 'bright');

  try {
    // List existing backups
    const backups = await blobStoreManager.listBackups();
    logInfo(`Current backups: ${backups.length}`);

    // Clean up old backups if necessary
    if (backups.length > CONFIG.maxBackups) {
      logInfo(`Cleaning up old backups (keeping ${CONFIG.maxBackups})...`);
      await blobStoreManager.cleanupOldBackups(CONFIG.maxBackups);
      logSuccess('Backup cleanup completed');
    }

    // Create a test backup
    const testBackup = await blobStoreManager.createBackup();
    if (testBackup) {
      logSuccess('Test backup created successfully');
    }

    // Get metrics
    const metrics = blobStoreManager.getMetrics();
    logInfo('Blob Store metrics:');
    logInfo(`  Total operations: ${metrics.totalOperations}`);
    logInfo(`  Successful operations: ${metrics.successfulOperations}`);
    logInfo(`  Failed operations: ${metrics.failedOperations}`);
    logInfo(`  Storage size: ${metrics.storageSize} bytes`);
    logInfo(`  Last updated: ${metrics.lastUpdated}`);

    return true;

  } catch (error) {
    logError(`Failed to configure backup system: ${error.message}`);
    return false;
  }
}

/**
 * Generate setup summary
 */
function generateSetupSummary() {
  log('\n📋 Setup Summary', 'bright');
  log('=' .repeat(50), 'cyan');

  logInfo('Vercel Blob Store Configuration:');
  logInfo(`  Primary Path: ${CONFIG.primaryPath}`);
  logInfo(`  Backup Path: ${CONFIG.backupPath}`);
  logInfo(`  Max Backups: ${CONFIG.maxBackups}`);
  logInfo(`  Retention Days: ${CONFIG.retentionDays}`);

  logInfo('\nData Structure:');
  logInfo(`  Users: /dist/users-config.json → Blob Store users`);
  logInfo(`  Quests: /dist/quests-library.json → Blob Store quests`);
  logInfo(`  Config: Combined → Blob Store main-config.json`);

  logInfo('\nNext Steps:');
  logInfo('  1. Test your application in development');
  logInfo('  2. Deploy to Vercel');
  logInfo('  3. Monitor Blob Store performance');
  logInfo('  4. Set up automated backups');

  logInfo('\nUseful Commands:');
  logInfo('  • View backups: Check Vercel Dashboard → Storage → Blob Store');
  logInfo('  • Monitor metrics: Application logs show Blob Store metrics');
  logInfo('  • Manual backup: Call blobStoreManager.createBackup()');
  logInfo('  • Restore: blobStoreManager.restoreFromBackup(backupUrl)');

  log('\n✨ Setup Complete!', 'green');
  log('Your quest application is now using Vercel Blob Store!', 'green');
}

/**
 * Main setup function
 */
async function main() {
  log('🎯 Vercel Blob Store Setup for Quest Application', 'bright');
  log('=' .repeat(50), 'cyan');

  const steps = [
    { name: 'Check Environment Variables', fn: checkEnvironmentVariables },
    { name: 'Read JSON Data', fn: readJsonData },
    { name: 'Initialize Blob Store', fn: initializeBlobStore },
    { name: 'Create Initial Backup', fn: createInitialBackup },
    { name: 'Migrate Data to Blob Store', fn: migrateDataToBlobStore },
    { name: 'Verify Migration', fn: verifyMigration },
    { name: 'Test Functionality', fn: testBlobStoreFunctionality },
    { name: 'Configure Backup System', fn: configureBackupSystem }
  ];

  let jsonData = null;
  let currentStep = 0;

  for (const step of steps) {
    currentStep++;
    logStep(step.name, currentStep, steps.length);

    try {
      let result;

      if (step.name === 'Migrate Data to Blob Store') {
        result = await step.fn(jsonData);
      } else if (step.name === 'Read JSON Data') {
        jsonData = await step.fn();
        result = jsonData !== null;
      } else {
        result = await step.fn();
      }

      if (!result) {
        logError(`Step failed: ${step.name}`);
        logError('Setup aborted. Please fix the error and try again.');
        process.exit(1);
      }

    } catch (error) {
      logError(`Step failed: ${step.name} - ${error.message}`);
      logError('Setup aborted. Please fix the error and try again.');
      process.exit(1);
    }
  }

  generateSetupSummary();
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  logError(`Unhandled Rejection at: ${promise}`);
  logError(`Reason: ${reason}`);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logError(`Uncaught Exception: ${error.message}`);
  logError(error.stack);
  process.exit(1);
});

// Run the setup
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    logError(`Setup failed: ${error.message}`);
    logError(error.stack);
    process.exit(1);
  });
}

export { main as setupBlobStore };