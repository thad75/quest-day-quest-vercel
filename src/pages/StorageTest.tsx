import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { VercelDataService } from '@/lib/vercelDataService';
import { userManager } from '@/lib/userManager';
import { CheckCircle, XCircle, Database, Smartphone, Cloud, RefreshCw, TestTube } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  details?: any;
  timestamp: string;
  storageType?: 'blob' | 'localStorage';
}

const StorageTest = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);

  const addTestResult = (name: string, status: 'success' | 'error', message: string, details?: any, storageType?: 'blob' | 'localStorage') => {
    const result: TestResult = {
      name,
      status,
      message,
      details,
      storageType,
      timestamp: new Date().toLocaleTimeString()
    };
    setTestResults(prev => [...prev, result]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const runStorageTests = async () => {
    setIsRunningTests(true);
    clearResults();

    try {
      // Test 1: Initialize Storage
      addTestResult('Storage Initialization', 'pending', 'Testing storage initialization...');
      try {
        const initResult = await VercelDataService.initializeBlobStore();
        addTestResult('Storage Initialization', 'success', 'Storage initialized successfully', { initialized: initResult });
      } catch (error) {
        addTestResult('Storage Initialization', 'error', `Initialization failed: ${error.message}`, { error: error.message });
      }

      // Test 2: Load Users
      addTestResult('Load Users', 'pending', 'Testing user loading...');
      try {
        const usersResult = await VercelDataService.getUsers();
        addTestResult('Load Users', 'success',
          `Loaded ${Object.keys(usersResult.users).length} users`,
          {
            usersCount: Object.keys(usersResult.users).length,
            commonQuestsCount: usersResult.commonQuests.length,
            isBlobStore: usersResult.isBlobStore
          },
          usersResult.isBlobStore ? 'blob' : 'localStorage'
        );
      } catch (error) {
        addTestResult('Load Users', 'error', `Failed to load users: ${error.message}`, { error: error.message });
      }

      // Test 3: Load Quests
      addTestResult('Load Quests', 'pending', 'Testing quest loading...');
      try {
        const quests = await VercelDataService.getQuests();
        addTestResult('Load Quests', 'success',
          `Loaded ${Object.keys(quests).length} quests`,
          {
            questsCount: Object.keys(quests).length,
            questIds: Object.keys(quests)
          }
        );
      } catch (error) {
        addTestResult('Load Quests', 'error', `Failed to load quests: ${error.message}`, { error: error.message });
      }

      // Test 4: Verify Admin Password
      addTestResult('Admin Password Verification', 'pending', 'Testing admin password...');
      try {
        const isValid = await VercelDataService.verifyAdminPassword('admin123');
        addTestResult('Admin Password Verification',
          isValid ? 'success' : 'error',
          isValid ? 'Admin password verified successfully' : 'Admin password verification failed',
          { isValid }
        );
      } catch (error) {
        addTestResult('Admin Password Verification', 'error', `Password verification failed: ${error.message}`, { error: error.message });
      }

      // Test 5: User Manager Load Config
      addTestResult('User Manager Integration', 'pending', 'Testing user manager integration...');
      try {
        await userManager.loadConfigs();
        const users = userManager.getAvailableUsers();
        const quests = userManager.getAllQuests();
        addTestResult('User Manager Integration', 'success',
          `User manager loaded: ${users.length} users, ${quests.length} quests`,
          {
            usersCount: users.length,
            questsCount: quests.length,
            hasUsersConfig: !!userManager.getUsersConfig(),
            hasQuestsLibrary: !!userManager.getQuestsLibrary()
          }
        );
      } catch (error) {
        addTestResult('User Manager Integration', 'error', `User manager failed: ${error.message}`, { error: error.message });
      }

      // Test 6: Test Update Operations
      addTestResult('Update Operations', 'pending', 'Testing data update operations...');
      try {
        const users = await VercelDataService.getUsers();
        const quests = await VercelDataService.getQuests();

        const userUpdateResult = await VercelDataService.updateUsersConfig(users.users, users.commonQuests);
        const questUpdateResult = await VercelDataService.updateQuestsConfig(quests);

        if (userUpdateResult.success && questUpdateResult.success) {
          addTestResult('Update Operations', 'success',
            'Update operations completed successfully',
            {
              userUpdate: userUpdateResult.message,
              questUpdate: questUpdateResult.message
            }
          );
        } else {
          addTestResult('Update Operations', 'error',
            'Update operations failed',
            {
              userUpdate: userUpdateResult.message,
              questUpdate: questUpdateResult.message
            }
          );
        }
      } catch (error) {
        addTestResult('Update Operations', 'error', `Update operations failed: ${error.message}`, { error: error.message });
      }

      const successCount = testResults.filter(r => r.status === 'success').length;
      const errorCount = testResults.filter(r => r.status === 'error').length;

      if (errorCount === 0) {
        toast.success(`All ${successCount} tests passed! Storage system is working correctly.`);
      } else {
        toast.warning(`${successCount} tests passed, ${errorCount} tests failed.`);
      }

    } catch (error) {
      console.error('Test suite error:', error);
      toast.error('Test suite encountered an unexpected error');
    } finally {
      setIsRunningTests(false);
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
        return null;
    }
  };

  const getStorageIcon = (storageType?: string) => {
    switch (storageType) {
      case 'blob':
        return <Cloud className="h-4 w-4 text-blue-500" />;
      case 'localStorage':
        return <Smartphone className="h-4 w-4 text-orange-500" />;
      default:
        return <Database className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStorageBadge = (storageType?: string) => {
    switch (storageType) {
      case 'blob':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Blob Store</Badge>;
      case 'localStorage':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">LocalStorage</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95 p-6">
      <div className="container max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <TestTube className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Storage System Test</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Test the storage system with automatic fallback from Blob Store to LocalStorage for development
          </p>
        </div>

        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Test Storage System</CardTitle>
            <CardDescription>
              Test both Blob Store and LocalStorage fallback functionality
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button
                onClick={runStorageTests}
                disabled={isRunningTests}
                className="flex items-center gap-2"
              >
                {isRunningTests ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Database className="h-4 w-4" />
                )}
                {isRunningTests ? 'Running Tests...' : 'Run Storage Tests'}
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
                Results from storage system tests
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {testResults.map((result, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(result.status)}
                      <h3 className="font-medium">{result.name}</h3>
                      {result.storageType && getStorageBadge(result.storageType)}
                    </div>
                    <div className="flex items-center gap-2">
                      {result.storageType && getStorageIcon(result.storageType)}
                      <span className="text-sm text-muted-foreground">
                        {result.timestamp}
                      </span>
                    </div>
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

        {/* Information */}
        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
            <CardDescription>
              Storage system with automatic fallback
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Cloud className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium">Production (Vercel)</p>
                  <p className="text-sm text-muted-foreground">
                    Uses Vercel Blob Store for persistent cloud storage
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Smartphone className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="font-medium">Development (Local)</p>
                  <p className="text-sm text-muted-foreground">
                    Uses LocalStorage to avoid CORS issues
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Automatic Fallback:</strong> The system automatically detects when Blob Store is inaccessible (due to CORS or network issues) and seamlessly falls back to LocalStorage for local development.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StorageTest;