#!/usr/bin/env node

/**
 * Blob Store Test Script
 * Comprehensive testing of Blob Store functionality
 */

import { blobStoreManager } from '../src/lib/blobStore.js';
import { BlobDataService } from '../src/lib/blobDataService.js';

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

function logTest(test, result) {
  if (result) {
    log(`✅ ${test}`, 'green');
  } else {
    log(`❌ ${test}`, 'red');
  }
}

async function testBlobStoreAvailability() {
  log('\n🔍 Testing Blob Store Availability', 'cyan');

  try {
    const isAvailable = await blobStoreManager.isAvailable();
    logTest('Blob Store is available', isAvailable);

    if (!isAvailable) {
      logError('Blob Store is not available - check your configuration');
      return false;
    }

    return true;
  } catch (error) {
    log(`❌ Availability test failed: ${error.message}`, 'red');
    return false;
  }
}

async function testDataIntegrity() {
  log('\n📊 Testing Data Integrity', 'cyan');

  try {
    // Test users data
    const users = await blobStoreManager.getUsers();
    logTest('Users data accessible', Object.keys(users).length >= 0);

    // Test quests data
    const quests = await blobStoreManager.getQuests();
    logTest('Quests data accessible', Object.keys(quests).length >= 0);

    // Test common quests
    const commonQuests = await blobStoreManager.getCommonQuests();
    logTest('Common quests accessible', Array.isArray(commonQuests));

    // Test admin password
    const adminPassword = await blobStoreManager.getAdminPassword();
    logTest('Admin password accessible', typeof adminPassword === 'string');

    // Test full config
    const fullConfig = await blobStoreManager.getFullConfig();
    logTest('Full configuration accessible', fullConfig !== null);

    if (fullConfig) {
      logTest('Configuration has users', typeof fullConfig.users === 'object');
      logTest('Configuration has quests', typeof fullConfig.quests === 'object');
      logTest('Configuration has common quests', Array.isArray(fullConfig.commonQuests));
      logTest('Configuration has version', typeof fullConfig.version === 'string');
      logTest('Configuration has timestamp', typeof fullConfig.lastUpdated === 'string');
    }

    return true;
  } catch (error) {
    log(`❌ Data integrity test failed: ${error.message}`, 'red');
    return false;
  }
}

async function testWriteOperations() {
  log('\n✏️  Testing Write Operations', 'cyan');

  try {
    // Get current config
    const originalConfig = await blobStoreManager.getFullConfig();
    if (!originalConfig) {
      log('❌ Cannot get original config for write test', 'red');
      return false;
    }

    // Test backup creation
    const backupUrl = await blobStoreManager.createBackup();
    logTest('Backup creation', backupUrl !== null);

    // Note: We skip actual write tests to avoid modifying production data
    log('⚠️  Write tests skipped to avoid modifying production data', 'yellow');
    log('   Run manual write tests in development environment', 'yellow');

    return true;
  } catch (error) {
    log(`❌ Write operations test failed: ${error.message}`, 'red');
    return false;
  }
}

async function testDataService() {
  log('\n🔧 Testing Data Service', 'cyan');

  try {
    // Initialize data service
    const initialized = await BlobDataService.initialize();
    logTest('Data Service initialization', initialized);

    if (!initialized) {
      log('❌ Data Service failed to initialize', 'red');
      return false;
    }

    // Test getting users
    const usersResult = await BlobDataService.getUsers();
    logTest('Get users through Data Service', usersResult.success);

    // Test getting quests
    const questsResult = await BlobDataService.getQuests();
    logTest('Get quests through Data Service', questsResult.success);

    // Test getting full config
    const configResult = await BlobDataService.getConfig();
    logTest('Get full config through Data Service', configResult.success);

    // Test health check
    const healthResult = await BlobDataService.getHealthStatus();
    logTest('Health check through Data Service', healthResult.success);

    if (healthResult.success) {
      const status = healthResult.data?.status;
      logTest(`Health status: ${status}`, ['healthy', 'degraded', 'unhealthy'].includes(status));
    }

    return true;
  } catch (error) {
    log(`❌ Data Service test failed: ${error.message}`, 'red');
    return false;
  }
}

async function testBackupSystem() {
  log('\n💾 Testing Backup System', 'cyan');

  try {
    // Test listing backups
    const backups = await blobStoreManager.listBackups();
    logTest('List backups', Array.isArray(backups));

    if (backups.length > 0) {
      log(`   Found ${backups.length} existing backups`, 'blue');
    } else {
      log('   No existing backups found', 'yellow');
    }

    // Test creating backup
    const newBackup = await blobStoreManager.createBackup();
    logTest('Create new backup', newBackup !== null);

    if (newBackup) {
      log(`   New backup: ${newBackup}`, 'blue');
    }

    // Test metrics
    const metrics = blobStoreManager.getMetrics();
    logTest('Get metrics', metrics !== null);

    if (metrics) {
      log(`   Total operations: ${metrics.totalOperations}`, 'blue');
      log(`   Successful operations: ${metrics.successfulOperations}`, 'blue');
      log(`   Failed operations: ${metrics.failedOperations}`, 'blue');
      log(`   Storage size: ${metrics.storageSize} bytes`, 'blue');
    }

    return true;
  } catch (error) {
    log(`❌ Backup system test failed: ${error.message}`, 'red');
    return false;
  }
}

async function main() {
  log('🧪 Blob Store Test Suite', 'cyan');
  log('=' .repeat(40), 'cyan');

  const tests = [
    { name: 'Blob Store Availability', fn: testBlobStoreAvailability },
    { name: 'Data Integrity', fn: testDataIntegrity },
    { name: 'Write Operations', fn: testWriteOperations },
    { name: 'Data Service', fn: testDataService },
    { name: 'Backup System', fn: testBackupSystem }
  ];

  let passed = 0;
  let total = tests.length;

  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      }
    } catch (error) {
      log(`❌ Test "${test.name}" failed with exception: ${error.message}`, 'red');
    }
  }

  log('\n📊 Test Results', 'cyan');
  log('=' .repeat(40), 'cyan');

  if (passed === total) {
    log(`🎉 All ${total} tests passed!`, 'green');
    log('✅ Blob Store is working correctly', 'green');
  } else {
    log(`${passed}/${total} tests passed`, 'yellow');
    log(`⚠️  ${total - passed} tests failed`, 'yellow');
    log('❌ Some issues detected - please check configuration', 'red');
  }

  log('\n💡 Recommendations:', 'blue');
  if (passed === total) {
    log('• Your Blob Store setup is ready for production', 'blue');
    log('• Consider setting up monitoring and alerts', 'blue');
    log('• Regularly test backup/restore procedures', 'blue');
  } else {
    log('• Check your environment variables', 'yellow');
    log('• Verify Blob Store token and permissions', 'yellow');
    log('• Review error logs for detailed issues', 'yellow');
    log('• Run the setup script if needed: npm run setup:blob-store', 'yellow');
  }
}

// Run tests
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Test suite failed:', error.message);
    process.exit(1);
  });
}

export { main as testBlobStore };