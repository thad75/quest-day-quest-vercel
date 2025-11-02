import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Info, AlertTriangle, Cloud, Server, Settings, Database, FileText } from 'lucide-react';

const SimpleBlobTest = () => {
  const [envStatus, setEnvStatus] = useState({
    tokenConfigured: false,
    tokenLength: 0,
    pathConfigured: false,
    details: {}
  });

  useEffect(() => {
    checkEnvironment();
  }, []);

  const checkEnvironment = () => {
    const token = import.meta.env.VITE_BLOB_READ_WRITE_TOKEN || '';
    const path = import.meta.env.VITE_BLOB_STORE_PRIMARY_PATH || '';

    setEnvStatus({
      tokenConfigured: !!token && token !== 'blob_xxxxxxxxxxxxxxxxxxxx',
      tokenLength: token.length,
      pathConfigured: !!path,
      details: {
        tokenPrefix: token.substring(0, 20),
        hasToken: !!token,
        path: path,
        envVars: {
          VITE_BLOB_READ_WRITE_TOKEN: token ? 'SET' : 'NOT SET',
          VITE_BLOB_STORE_PRIMARY_PATH: path ? 'SET' : 'NOT SET'
        }
      }
    });
  };

  const runApplicationTest = () => {
    toast.info('Testing application functionality...');

    // Test if the app can load without errors
    try {
      // This will be tested by checking if the user manager loads properly
      const adminUrl = '/admin';
      window.open(adminUrl, '_blank');
      toast.success('Opened admin dashboard in new tab');
    } catch (error) {
      toast.error('Error opening admin dashboard');
    }
  };

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  const getBadgeVariant = (status: boolean) => {
    return status ? 'default' : 'destructive';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95 p-6">
      <div className="container max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Database className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Blob Store Configuration Check</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Simple configuration checker for Vercel Blob Store setup
          </p>
        </div>

        {/* Configuration Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Environment Configuration Status
            </CardTitle>
            <CardDescription>
              Check if your environment variables are properly configured
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Token Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center gap-3 p-4 border rounded-lg">
                {getStatusIcon(envStatus.tokenConfigured)}
                <div className="flex-1">
                  <p className="font-medium">VITE_BLOB_READ_WRITE_TOKEN</p>
                  <p className="text-sm text-muted-foreground">
                    {envStatus.tokenConfigured
                      ? `Configured (${envStatus.tokenLength} chars)`
                      : 'Not configured or using placeholder'
                    }
                  </p>
                  <Badge variant={getBadgeVariant(envStatus.tokenConfigured)} className="mt-1">
                    {envStatus.tokenConfigured ? 'OK' : 'MISSING'}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 border rounded-lg">
                {getStatusIcon(envStatus.pathConfigured)}
                <div className="flex-1">
                  <p className="font-medium">VITE_BLOB_STORE_PRIMARY_PATH</p>
                  <p className="text-sm text-muted-foreground">
                    {envStatus.details.path || 'Default path will be used'}
                  </p>
                  <Badge variant={getBadgeVariant(envStatus.pathConfigured)} className="mt-1">
                    {envStatus.pathConfigured ? 'OK' : 'DEFAULT'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Details */}
            <details className="border rounded-lg p-4">
              <summary className="cursor-pointer font-medium text-blue-600 hover:text-blue-800">
                Show Configuration Details
              </summary>
              <pre className="mt-3 text-xs bg-gray-50 p-3 rounded border overflow-x-auto">
                {JSON.stringify(envStatus.details, null, 2)}
              </pre>
            </details>

            {/* Status Messages */}
            {envStatus.tokenConfigured ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-5 w-5" />
                  <p className="font-medium">✅ Configuration Looks Good!</p>
                </div>
                <p className="text-sm text-green-700 mt-2">
                  Your Blob Store token is properly configured. The @vercel/blob package works on the server side,
                  so the real testing will happen when you use the application features.
                </p>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertTriangle className="h-5 w-5" />
                  <p className="font-medium">❌ Configuration Issues Found</p>
                </div>
                <div className="text-sm text-red-700 mt-2 space-y-1">
                  <p>• Make sure your .env file contains the real token (not the placeholder)</p>
                  <p>• Restart your development server after changing environment variables</p>
                  <p>• Check that the token starts with "vercel_blob_rw_"</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
            <CardDescription>
              How to verify your Blob Store is working
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={runApplicationTest}
                className="flex items-center gap-2"
                disabled={!envStatus.tokenConfigured}
              >
                <Cloud className="h-4 w-4" />
                Test Admin Dashboard
              </Button>

              <Button
                variant="outline"
                onClick={() => window.location.href = '/admin'}
                disabled={!envStatus.tokenConfigured}
              >
                <Server className="h-4 w-4 mr-2" />
                Go to Admin Page
              </Button>
            </div>

            <div className="text-sm text-muted-foreground bg-gray-50 p-4 rounded-lg">
              <p className="font-medium mb-2">📝 Important Notes:</p>
              <ul className="space-y-1 text-xs">
                <li>• The @vercel/blob package only works on the server side</li>
                <li>• Browser-based tests are limited to environment variable checking</li>
                <li>• Real Blob Store operations happen when you use admin features</li>
                <li>• Check the browser console for any error messages</li>
                <li>• The admin dashboard will show actual Blob Store connection status</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Troubleshooting */}
        <Card>
          <CardHeader>
            <CardTitle>Troubleshooting</CardTitle>
            <CardDescription>
              Common issues and solutions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Still showing "Not configured"?</p>
                  <p className="text-xs text-muted-foreground">
                    Restart your development server after updating the .env file (npm run dev)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Admin dashboard not working?</p>
                  <p className="text-xs text-muted-foreground">
                    Check the browser console for specific error messages about Blob Store connections
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FileText className="h-4 w-4 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Everything looks good?</p>
                  <p className="text-xs text-muted-foreground">
                    Your Blob Store is ready! Try creating a user or quest in the admin dashboard to test real operations.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SimpleBlobTest;