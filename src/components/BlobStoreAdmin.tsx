import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Database,
  Backup,
  Restore,
  Settings,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  HardDrive,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  TrendingUp,
  Shield,
  FileText,
  Calendar,
  BarChart3,
  Zap
} from 'lucide-react';

import { BlobStoreManager } from '@/lib/blobStore';
import { BlobStorageStrategy } from '@/lib/blobStorageStrategy';
import { BlobMigrationService } from '@/lib/blobMigration';
import { BlobBackupService } from '@/lib/blobBackupService';

interface BlobStoreStats {
  totalSize: number;
  blobCount: number;
  backupCount: number;
  lastUpdated: string;
}

interface StorageMetrics {
  totalReads: number;
  totalWrites: number;
  cacheHits: number;
  cacheMisses: number;
  errors: number;
  averageResponseTime: number;
}

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  details?: any;
}

const BlobStoreAdmin: React.FC = () => {
  const [stats, setStats] = useState<BlobStoreStats | null>(null);
  const [metrics, setMetrics] = useState<StorageMetrics | null>(null);
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [backups, setBackups] = useState<Array<{ path: string; uploadedAt: string; size: number }>>([]);
  const [migrationPlan, setMigrationPlan] = useState<any>(null);
  const [migrationInProgress, setMigrationInProgress] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState(0);
  const [currentMigrationStep, setCurrentMigrationStep] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [statsData, metricsData, healthData, backupsData] = await Promise.all([
        BlobStoreManager.getStats(),
        BlobStorageStrategy.getMetrics(),
        BlobStorageStrategy.healthCheck(),
        BlobStoreManager.listBackups()
      ]);

      setStats(statsData);
      setMetrics(metricsData);
      setHealthStatus(healthData);
      setBackups(backupsData);
    } catch (error) {
      console.error('Failed to load Blob Store data:', error);
      toast.error('Failed to load Blob Store data');
    }
  };

  const handleCreateBackup = async () => {
    setIsLoading(true);
    try {
      const result = await BlobBackupService.createBackup('manual');
      if (result) {
        toast.success('Backup created successfully');
        loadData();
      }
    } catch (error) {
      toast.error('Failed to create backup');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreFromBackup = async (backupPath: string) => {
    if (!confirm('Are you sure you want to restore from this backup? This will replace current data.')) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await BlobBackupService.restoreFromBackup(backupPath);
      if (result.success) {
        toast.success('Restore completed successfully');
        loadData();
      } else {
        toast.error('Restore failed: ' + result.message);
      }
    } catch (error) {
      toast.error('Failed to restore from backup');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBackup = async (backupPath: string) => {
    if (!confirm('Are you sure you want to delete this backup?')) {
      return;
    }

    setIsLoading(true);
    try {
      await BlobStoreManager.deleteBackup(backupPath);
      toast.success('Backup deleted successfully');
      loadData();
    } catch (error) {
      toast.error('Failed to delete backup');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMigration = async () => {
    if (!confirm('Are you sure you want to start migration from Edge Config to Blob Store?')) {
      return;
    }

    setMigrationInProgress(true);
    setMigrationProgress(0);

    try {
      const plan = await BlobMigrationService.createMigrationPlan();
      setMigrationPlan(plan);

      const result = await BlobMigrationService.executeMigration((step, progress) => {
        setMigrationProgress(progress);
        setCurrentMigrationStep(step.name);
      });

      if (result.success) {
        toast.success('Migration completed successfully');
      } else {
        toast.error('Migration failed: ' + result.message);
      }
    } catch (error) {
      toast.error('Migration failed: ' + (error as Error).message);
    } finally {
      setMigrationInProgress(false);
      setMigrationProgress(0);
      setCurrentMigrationStep('');
      loadData();
    }
  };

  const handleOptimizeStorage = async () => {
    setIsLoading(true);
    try {
      await BlobStorageStrategy.optimize();
      toast.success('Storage optimization completed');
      loadData();
    } catch (error) {
      toast.error('Storage optimization failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestDisasterRecovery = async () => {
    setIsLoading(true);
    try {
      const result = await BlobBackupService.testDisasterRecovery();
      if (result.success) {
        toast.success(`Disaster recovery test completed in ${Math.round(result.duration / 1000)}s`);
      } else {
        toast.error('Disaster recovery test failed');
      }
    } catch (error) {
      toast.error('Disaster recovery test failed');
    } finally {
      setIsLoading(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  const getHealthColor = (status: string): string => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'unhealthy': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'degraded': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'unhealthy': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default: return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };

  if (!stats || !metrics || !healthStatus) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Blob Store Administration</h2>
          <p className="text-muted-foreground">Manage Vercel Blob Store, backups, and migrations</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={getHealthColor(healthStatus.status)}>
            {getHealthIcon(healthStatus.status)}
            <span className="ml-1">{healthStatus.status}</span>
          </Badge>
          <Button onClick={loadData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Health Alert */}
      {healthStatus.status !== 'healthy' && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Storage System Alert</AlertTitle>
          <AlertDescription>{healthStatus.message}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="backups">Backups</TabsTrigger>
          <TabsTrigger value="migration">Migration</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatBytes(stats.totalSize)}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.blobCount} objects
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Backups</CardTitle>
                <Backup className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.backupCount}</div>
                <p className="text-xs text-muted-foreground">
                  Automatic & manual
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(metrics.averageResponseTime)}ms</div>
                <p className="text-xs text-muted-foreground">
                  Last 100 operations
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.totalReads + metrics.totalWrites > 0
                    ? Math.round(((metrics.totalReads + metrics.totalWrites - metrics.errors) / (metrics.totalReads + metrics.totalWrites)) * 100)
                    : 100}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {metrics.errors} errors
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest storage operations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Reads</span>
                    <span className="font-medium">{metrics.totalReads}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Writes</span>
                    <span className="font-medium">{metrics.totalWrites}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Cache Hit Rate</span>
                    <span className="font-medium">
                      {metrics.totalReads > 0 ? Math.round((metrics.cacheHits / metrics.totalReads) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Last Updated</span>
                    <span className="font-medium">{formatDate(stats.lastUpdated)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common administrative tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={handleCreateBackup}
                  disabled={isLoading}
                  className="w-full justify-start"
                >
                  <Backup className="h-4 w-4 mr-2" />
                  Create Backup
                </Button>
                <Button
                  onClick={handleOptimizeStorage}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Optimize Storage
                </Button>
                <Button
                  onClick={handleTestDisasterRecovery}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Test Disaster Recovery
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Backups Tab */}
        <TabsContent value="backups" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Backup Management</h3>
            <Button onClick={handleCreateBackup} disabled={isLoading}>
              <Backup className="h-4 w-4 mr-2" />
              Create Backup
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {backups.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">No backups available</p>
                </CardContent>
              </Card>
            ) : (
              backups.map((backup, index) => (
                <Card key={index}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{backup.path.split('/').pop()}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(backup.uploadedAt)} • {formatBytes(backup.size)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-1" />
                            Restore
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Restore Backup</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to restore from this backup? This action cannot be undone.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline">Cancel</Button>
                            <Button
                              onClick={() => handleRestoreFromBackup(backup.path)}
                              disabled={isLoading}
                            >
                              <Restore className="h-4 w-4 mr-2" />
                              Restore
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteBackup(backup.path)}
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Migration Tab */}
        <TabsContent value="migration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Edge Config to Blob Store Migration</CardTitle>
              <CardDescription>
                Migrate your existing Edge Config data to Vercel Blob Store
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {migrationInProgress ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span className="font-medium">{currentMigrationStep}</span>
                  </div>
                  <Progress value={migrationProgress} className="w-full" />
                  <p className="text-sm text-muted-foreground">
                    Migration progress: {Math.round(migrationProgress)}%
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Migration Notice</AlertTitle>
                    <AlertDescription>
                      This will migrate all data from Edge Config to Blob Store. The process is reversible
                      but ensure you have backups before proceeding.
                    </AlertDescription>
                  </Alert>
                  <Button
                    onClick={handleMigration}
                    disabled={isLoading}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Start Migration
                  </Button>
                </div>
              )}

              {migrationPlan && (
                <div className="mt-6">
                  <h4 className="font-medium mb-3">Migration Plan</h4>
                  <div className="space-y-2">
                    {migrationPlan.steps.map((step: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded border">
                        <span className="text-sm">{step.name}</span>
                        <Badge variant={step.status === 'completed' ? 'default' : 'secondary'}>
                          {step.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Storage operation performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">Cache Hit Rate</span>
                      <span className="text-sm font-medium">
                        {metrics.totalReads > 0 ? Math.round((metrics.cacheHits / metrics.totalReads) * 100) : 0}%
                      </span>
                    </div>
                    <Progress
                      value={metrics.totalReads > 0 ? (metrics.cacheHits / metrics.totalReads) * 100 : 0}
                      className="w-full"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Operations</p>
                      <p className="text-lg font-medium">{metrics.totalReads + metrics.totalWrites}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Error Rate</p>
                      <p className="text-lg font-medium">
                        {metrics.totalReads + metrics.totalWrites > 0
                          ? Math.round((metrics.errors / (metrics.totalReads + metrics.totalWrites)) * 100)
                          : 0}%
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cache Statistics</CardTitle>
                <CardDescription>Memory cache performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Cache Size</span>
                    <span className="font-medium">
                      {BlobStorageStrategy.getCacheStats().size} / {BlobStorageStrategy.getCacheStats().maxSize}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Cache Entries</span>
                    <span className="font-medium">{BlobStorageStrategy.getCacheStats().entries.length}</span>
                  </div>
                  <Button
                    onClick={() => BlobStorageStrategy.clearCache()}
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                  >
                    Clear Cache
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Blob Store Configuration</CardTitle>
              <CardDescription>Configure Blob Store settings and policies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <Settings className="h-4 w-4" />
                  <AlertTitle>Configuration</AlertTitle>
                  <AlertDescription>
                    Blob Store configuration is managed through environment variables and Vercel dashboard settings.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded border">
                    <span className="text-sm">BLOB_READ_WRITE_TOKEN</span>
                    <Badge variant="secondary">Configured</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded border">
                    <span className="text-sm">Primary Store Path</span>
                    <span className="text-sm font-mono">quest-app/data/main-config.json</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded border">
                    <span className="text-sm">Backup Path</span>
                    <span className="text-sm font-mono">quest-app/backups/</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BlobStoreAdmin;