import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { blobStoreManager } from '@/lib/blobStore';
import { blobStorageStrategy } from '@/lib/blobStorageStrategy';
import { VercelDataService } from '@/lib/vercelDataService';
import { userManager } from '@/lib/userManager';
import { Cloud, CloudOff, CheckCircle, XCircle, RefreshCw, Database, Settings, AlertTriangle, Info } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  details?: any;
  timestamp: string;
}

const BlobStoreTest = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [blobStoreToken, setBlobStoreToken] = useState<string>('');

  useEffect(() => {
    // Check environment variables (use Vite-compatible variable for browser access)
    const token = import.meta.env.VITE_BLOB_READ_WRITE_TOKEN || '';
    setBlobStoreToken(token);
  }, []);

  const addTestResult = (name: string, status: 'success' | 'error', message: string, details?: any) => {
    const result: TestResult = {
      name,
      status,
      message,
      details,
      timestamp: new Date().toLocaleTimeString()
    };
    setTestResults(prev => [...prev, result]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const runAllTests = async () => {
    setIsRunningTests(true);
    clearResults();

    try {
      // Test 1: Environment Variable Check
      addTestResult('Environment Variable Check',
        blobStoreToken ? 'success' : 'error',
        blobStoreToken ? 'BLOB_READ_WRITE_TOKEN is configured' : 'BLOB_READ_WRITE_TOKEN is missing',
        { configured: !!blobStoreToken, tokenLength: blobStoreToken.length }
      );

      if (!blobStoreToken) {
        toast.error('BLOB_READ_WRITE_TOKEN not configured. Please check your .env file.');
        setIsRunningTests(false);
        return;
      }

      // Test 2: Basic Blob Store Availability
      try {
        console.log('Testing Blob Store availability...');
        const isAvailable = await blobStoreManager.isAvailable();
        console.log('Blob Store availability result:', isAvailable);
        addTestResult('Blob Store Availability Check',
          isAvailable ? 'success' : 'error',
          isAvailable ? 'Blob Store is accessible' : 'Blob Store is not accessible',
          { available: isAvailable }
        );
      } catch (error) {
        console.error('Blob Store availability error:', error);
        addTestResult('Blob Store Availability Check', 'error',
          `Failed to check availability: ${error.message}`,
          { error: error.message, stack: error.stack }
        );
      }

      // Test 3: Initialize Blob Store with Defaults
      try {
        const initResult = await blobStorageStrategy.initializeWithDefaults();
        addTestResult('Initialize Blob Store',
          initResult ? 'success' : 'error',
          initResult ? 'Blob Store initialized successfully' : 'Failed to initialize Blob Store',
          { initialized: initResult }
        );
      } catch (error) {
        addTestResult('Initialize Blob Store', 'error',
          `Initialization failed: ${error.message}`,
          { error: error.message }
        );
      }

      // Test 4: Get Full Configuration
      try {
        const config = await blobStoreManager.getFullConfig();
        addTestResult('Get Full Configuration',
          config ? 'success' : 'error',
          config ? 'Configuration retrieved successfully' : 'Failed to retrieve configuration',
          {
            hasConfig: !!config,
            usersCount: config ? Object.keys(config.users).length : 0,
            questsCount: config ? Object.keys(config.quests).length : 0,
            version: config?.version,
            lastUpdated: config?.lastUpdated
          }
        );
      } catch (error) {
        addTestResult('Get Full Configuration', 'error',
          `Failed to get configuration: ${error.message}`,
          { error: error.message }
        );
      }

      // Test 5: User Manager Load Config
      try {
        await userManager.loadConfigs();
        const users = userManager.getAvailableUsers();
        const quests = userManager.getAllQuests();
        addTestResult('User Manager Load Config',
          'success',
          `User Manager loaded successfully`,
          {
            usersCount: users.length,
            questsCount: quests.length,
            hasUsersConfig: !!userManager.getUsersConfig(),
            hasQuestsLibrary: !!userManager.getQuestsLibrary()
          }
        );
      } catch (error) {
        addTestResult('User Manager Load Config', 'error',
          `User Manager failed to load: ${error.message}`,
          { error: error.message }
        );
      }

      // Test 6: Test Write Operation (Create Sample Data)
      try {
        const sampleUser = {
          id: `test-user-${Date.now()}`,
          name: 'Test User',
          avatar: '🧪',
          dailyQuests: ['1'],
          preferences: {
            categories: ['test'],
            difficulty: 'facile' as const,
            questCount: 1,
            allowCommonQuests: true
          },
          stats: {
            totalXP: 0,
            currentLevel: 1,
            currentXP: 0,
            xpToNextLevel: 100,
            questsCompleted: 0,
            totalQuestsCompleted: 0,
            currentStreak: 0,
            longestStreak: 0
          }
        };

        const createdUser = await VercelDataService.createUser(sampleUser);
        addTestResult('Test Write Operation',
          'success',
          `Successfully created test user: ${createdUser.name}`,
          { userId: createdUser.id, userName: createdUser.name }
        );

        // Test 7: Test Delete Operation (Cleanup)
        const deleteResult = await VercelDataService.deleteUser(createdUser.id);
        addTestResult('Test Delete Operation',
          deleteResult.success ? 'success' : 'error',
          deleteResult.success ? 'Successfully cleaned up test user' : 'Failed to cleanup test user',
          { success: deleteResult.success, message: deleteResult.message }
        );

      } catch (error) {
        addTestResult('Test Write Operation', 'error',
          `Write operation failed: ${error.message}`,
          { error: error.message }
        );
      }

      // Test 8: Get Blob Store Metrics
      try {
        const metrics = blobStoreManager.getMetrics();
        const blobMetrics = blobStorageStrategy.getBlobStoreMetrics();
        addTestResult('Get Blob Store Metrics',
          'success',
          'Metrics retrieved successfully',
          {
            totalOperations: metrics.totalOperations,
            successfulOperations: metrics.successfulOperations,
            failedOperations: metrics.failedOperations,
            lastOperation: metrics.lastOperation,
            storageSize: metrics.storageSize
          }
        );
      } catch (error) {
        addTestResult('Get Blob Store Metrics', 'error',
          `Failed to get metrics: ${error.message}`,
          { error: error.message }
        );
      }

      const successCount = testResults.filter(r => r.status === 'success').length;
      const errorCount = testResults.filter(r => r.status === 'error').length;

      if (errorCount === 0) {
        toast.success(`All ${successCount} tests passed! Blob Store is working correctly.`);
      } else {
        toast.warning(`${successCount} tests passed, ${errorCount} tests failed. Check results below.`);
      }

    } catch (error) {
      console.error('Test suite error:', error);
      addTestResult('Test Suite Error', 'error',
        `Test suite encountered an unexpected error: ${error.message}`,
        { error: error.message, stack: error.stack }
      );
      toast.error('Test suite encountered an unexpected error');
    } finally {
      setIsRunningTests(false);

      // Show final summary
      const successCount = testResults.filter(r => r.status === 'success').length;
      const errorCount = testResults.filter(r => r.status === 'error').length;

      console.log(`Test suite completed: ${successCount} success, ${errorCount} errors`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <RefreshCw className="h-4 w-4 text-yellow-500 animate-spin" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      success: 'default',
      error: 'destructive',
      pending: 'secondary'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95 p-6">
      <div className="container max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Database className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Blob Store Connection Test</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            This page helps you test your Vercel Blob Store configuration and diagnose any connection issues.
          </p>
        </div>

        {/* Configuration Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuration Status
            </CardTitle>
            <CardDescription>
              Current environment configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                {blobStoreToken ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <div>
                  <p className="font-medium">BLOB_READ_WRITE_TOKEN</p>
                  <p className="text-sm text-muted-foreground">
                    {blobStoreToken ? `Configured (${blobStoreToken.length} chars)` : 'Not configured'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Info className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium">Store Path</p>
                  <p className="text-sm text-muted-foreground">
                    {import.meta.env.VITE_BLOB_STORE_PRIMARY_PATH || 'quest-app/data/main-config.json'}
                  </p>
                </div>
              </div>
            </div>

            {!blobStoreToken && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertTriangle className="h-5 w-5" />
                  <p className="font-medium">Action Required</p>
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  Please add your BLOB_READ_WRITE_TOKEN to your .env file. You can get this from your Vercel dashboard under Settings → Environment Variables.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Test Controls</CardTitle>
            <CardDescription>
              Run comprehensive tests to verify your Blob Store connection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button
                onClick={runAllTests}
                disabled={isRunningTests || !blobStoreToken}
                className="flex items-center gap-2"
              >
                {isRunningTests ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Cloud className="h-4 w-4" />
                )}
                {isRunningTests ? 'Running Tests...' : 'Run All Tests'}
              </Button>
              <Button variant="outline" onClick={clearResults}>
                Clear Results
              </Button>
            </div>

            {testResults.length > 0 && (
              <div className="text-sm text-muted-foreground">
                {testResults.filter(r => r.status === 'success').length} of {testResults.length} tests passed
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Results */}
        {testResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
              <CardDescription>
                Detailed results from each test
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {testResults.map((result, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(result.status)}
                      <h3 className="font-medium">{result.name}</h3>
                      {getStatusBadge(result.status)}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {result.timestamp}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {result.message}
                  </p>
                  {result.details && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                        Show Details
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-50 rounded border overflow-x-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Setup Instructions</CardTitle>
            <CardDescription>
              How to configure your Blob Store properly
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Go to your Vercel project dashboard</li>
              <li>Navigate to Settings → Environment Variables</li>
              <li>Add or update <code className="bg-gray-100 px-1 rounded">BLOB_READ_WRITE_TOKEN</code></li>
              <li>Copy the token from your Blob Store settings</li>
              <li>Update your local <code className="bg-gray-100 px-1 rounded">.env</code> file with both:
                <br />
                <code className="bg-gray-100 px-1 rounded">BLOB_READ_WRITE_TOKEN=your_token</code>
                <br />
                <code className="bg-gray-100 px-1 rounded">VITE_BLOB_READ_WRITE_TOKEN=your_token</code>
              </li>
              <li>Restart your development server</li>
              <li>Run the tests above to verify everything works</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BlobStoreTest;