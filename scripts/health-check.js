#!/usr/bin/env node

/**
 * Blob Store Health Check Script
 * Quick health check for monitoring and debugging
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

function statusColor(status) {
  switch (status) {
    case 'healthy': return 'green';
    case 'degraded': return 'yellow';
    case 'unhealthy': return 'red';
    default: return 'reset';
  }
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function main() {
  log('🏥 Blob Store Health Check', 'cyan');
  log('=' .repeat(40), 'cyan');

  let overallStatus = 'healthy';

  try {
    // Check basic availability
    log('\n🔍 Basic Availability', 'blue');
    const isAvailable = await blobStoreManager.isAvailable();
    log(`Blob Store Available: ${isAvailable ? 'Yes' : 'No'}`, isAvailable ? 'green' : 'red');

    if (!isAvailable) {
      overallStatus = 'unhealthy';
      log('❌ Blob Store is not accessible', 'red');
      log('   Check your BLOB_READ_WRITE_TOKEN environment variable', 'yellow');
      return;
    }

    // Check data integrity
    log('\n📊 Data Integrity', 'blue');
    try {
      const config = await blobStoreManager.getFullConfig();
      if (config) {
        log('Configuration: Accessible', 'green');
        log(`  Users: ${Object.keys(config.users || {}).length}`, 'blue');
        log(`  Quests: ${Object.keys(config.quests || {}).length}`, 'blue');
        log(`  Common Quests: ${config.commonQuests?.length || 0}`, 'blue');
        log(`  Last Updated: ${config.lastUpdated || 'Unknown'}`, 'blue');
      } else {
        log('Configuration: Not found', 'yellow');
        overallStatus = 'degraded';
      }
    } catch (error) {
      log(`Configuration: Error - ${error.message}`, 'red');
      overallStatus = 'unhealthy';
    }

    // Check data service
    log('\n🔧 Data Service', 'blue');
    try {
      const healthResult = await BlobDataService.getHealthStatus();
      if (healthResult.success) {
        const status = healthResult.data?.status || 'unknown';
        log(`Data Service Status: ${status}`, statusColor(status));
        if (healthResult.data?.details) {
          log(`  Details: ${JSON.stringify(healthResult.data.details)}`, 'blue');
        }
      } else {
        log(`Data Service: Error - ${healthResult.error}`, 'red');
        overallStatus = 'unhealthy';
      }
    } catch (error) {
      log(`Data Service: Error - ${error.message}`, 'red');
      overallStatus = 'unhealthy';
    }

    // Check metrics
    log('\n📈 Performance Metrics', 'blue');
    try {
      const metrics = blobStoreManager.getMetrics();
      log(`Total Operations: ${metrics.totalOperations}`, 'blue');
      log(`Success Rate: ${metrics.totalOperations > 0 ?
        Math.round((metrics.successfulOperations / metrics.totalOperations) * 100) : 0}%`,
        metrics.failedOperations === 0 ? 'green' : 'yellow');
      log(`Storage Size: ${Math.round(metrics.storageSize / 1024)} KB`, 'blue');
      log(`Last Updated: ${new Date(metrics.lastUpdated).toLocaleString()}`, 'blue');

      if (metrics.failedOperations > 0) {
        log(`Failed Operations: ${metrics.failedOperations}`, 'yellow');
        overallStatus = 'degraded';
      }
    } catch (error) {
      log(`Metrics: Error - ${error.message}`, 'red');
    }

    // Check backups
    log('\n💾 Backup Status', 'blue');
    try {
      const backups = await blobStoreManager.listBackups();
      log(`Available Backups: ${backups.length}`, backups.length > 0 ? 'green' : 'yellow');

      if (backups.length === 0) {
        log('⚠️  No backups found - consider creating one', 'yellow');
        overallStatus = 'degraded';
      } else {
        const latestBackup = backups[0];
        log(`Latest Backup: ${latestBackup}`, 'blue');
      }
    } catch (error) {
      log(`Backups: Error - ${error.message}`, 'red');
    }

  } catch (error) {
    log(`\n❌ Health check failed: ${error.message}`, 'red');
    overallStatus = 'unhealthy';
  }

  // Summary
  log('\n📋 Health Summary', 'cyan');
  log('=' .repeat(40), 'cyan');
  log(`Overall Status: ${overallStatus.toUpperCase()}`, statusColor(overallStatus));

  switch (overallStatus) {
    case 'healthy':
      log('✅ All systems operational', 'green');
      log('   Your Blob Store is working correctly', 'blue');
      break;
    case 'degraded':
      log('⚠️  Some issues detected', 'yellow');
      log('   Monitor closely and consider investigation', 'blue');
      break;
    case 'unhealthy':
      log('❌ Critical issues detected', 'red');
      log('   Immediate attention required', 'yellow');
      break;
  }

  // Exit with appropriate code
  process.exit(overallStatus === 'healthy' ? 0 : 1);
}

// Run health check
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Health check failed:', error.message);
    process.exit(2);
  });
}

export { main as healthCheck };