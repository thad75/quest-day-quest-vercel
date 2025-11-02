import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { userManager, UserConfig } from '@/lib/userManager';
import { Gamepad2, Users, LogIn } from 'lucide-react';

const Login = () => {
  const [availableUsers, setAvailableUsers] = useState<UserConfig[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [loginMethod, setLoginMethod] = useState<'select' | 'input'>('select');
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const initializeLogin = async () => {
      try {
        // Charger les configurations
        await userManager.loadConfigs();

        // Essayer de charger l'utilisateur courant depuis le localStorage
        const hasCurrentUser = await userManager.loadCurrentUserFromStorage();
        if (hasCurrentUser) {
          navigate('/', { replace: true });
          return;
        }

        // Charger les utilisateurs disponibles
        const users = userManager.getAvailableUsers();
        setAvailableUsers(users);

        if (users.length === 0) {
          toast.error('Aucun utilisateur disponible. Contactez l\'administrateur.');
        }
      } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        toast.error('Erreur lors du chargement des utilisateurs');
      } finally {
        setLoading(false);
      }
    };

    initializeLogin();
  }, [navigate]);

  const handleLogin = async () => {
    const userId = loginMethod === 'select' ? selectedUser : username.toLowerCase().trim();

    if (!userId) {
      toast.error('Veuillez sélectionner ou entrer un nom d\'utilisateur');
      return;
    }

    try {
      const success = userManager.setCurrentUser(userId);
      if (success) {
        const user = userManager.getCurrentUser();
        toast.success(`Bienvenue ${user?.name} !`);
        navigate('/', { replace: true });
      } else {
        toast.error('Utilisateur non trouvé. Vérifiez le nom d\'utilisateur.');
      }
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      toast.error('Erreur lors de la connexion');
    }
  };

  const handleAdminAccess = () => {
    navigate('/admin');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Chargement des utilisateurs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95 flex items-center justify-center p-6">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        <Card className="backdrop-blur-xl bg-card/30 border border-border/50 shadow-[var(--shadow-card)] rounded-3xl">
          <CardHeader className="text-center space-y-6 pb-8">
            <div className="flex items-center justify-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-[var(--gradient-level)] rounded-2xl blur-lg opacity-50 animate-pulse" />
                <div className="relative p-3 rounded-2xl bg-[var(--gradient-level)] shadow-[var(--shadow-glow)]">
                  <Gamepad2 className="h-12 w-12 text-primary-foreground" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-black bg-[var(--gradient-level)] bg-clip-text text-transparent">
                  Quêtes Quotidiennes
                </h1>
                <p className="text-muted-foreground">Connecte-toi pour commencer ton aventure !</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Toggle method */}
            <div className="flex gap-2 p-1 bg-muted/20 rounded-xl">
              <Button
                variant={loginMethod === 'select' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setLoginMethod('select')}
                className="flex-1 rounded-lg"
              >
                <Users className="h-4 w-4 mr-2" />
                Choisir
              </Button>
              <Button
                variant={loginMethod === 'input' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setLoginMethod('input')}
                className="flex-1 rounded-lg"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Saisir
              </Button>
            </div>

            {loginMethod === 'select' ? (
              // Selection method
              <div className="space-y-4">
                <Label htmlFor="user-select" className="text-sm font-medium">
                  Choisis ton utilisateur
                </Label>
                <div className="grid gap-3">
                  {availableUsers.map((user) => (
                    <Button
                      key={user.id}
                      variant={selectedUser === user.id ? 'default' : 'outline'}
                      className="h-auto p-4 justify-start gap-3 hover:scale-[1.02] transition-all duration-300"
                      onClick={() => setSelectedUser(user.id)}
                    >
                      <span className="text-2xl">{user.avatar}</span>
                      <div className="text-left">
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Niveau {user.stats.currentLevel} • {user.stats.totalQuestsCompleted} quêtes
                        </p>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              // Input method
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium">
                    Nom d'utilisateur
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Entre ton nom d'utilisateur"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-12 rounded-xl border-border/50 focus:border-primary"
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Utilisateurs disponibles: {availableUsers.map(u => u.name).join(', ')}
                </p>
              </div>
            )}

            <Button
              onClick={handleLogin}
              className="w-full h-12 rounded-xl font-semibold bg-gradient-to-r from-primary to-secondary hover:scale-[1.02] transition-all duration-300"
              disabled={!selectedUser && !username}
            >
              <LogIn className="h-5 w-5 mr-2" />
              Se connecter
            </Button>

            {/* Admin access */}
            <div className="pt-4 border-t border-border/30">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAdminAccess}
                className="w-full text-muted-foreground hover:text-primary transition-colors"
              >
                Accès administrateur
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Available users info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            {availableUsers.length} utilisateur{availableUsers.length > 1 ? 's' : ''} disponible{availableUsers.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;