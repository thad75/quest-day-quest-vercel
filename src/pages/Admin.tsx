import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { userManager, UserConfig, QuestConfig } from '@/lib/userManager';
import { VercelDataService } from '@/lib/vercelDataService';
import { Gamepad2, Users, Settings, LogOut, Save, Plus, Trash2, Edit, Download, Upload, FileText, Database, CheckCircle, AlertCircle, Copy, Cloud, Server } from 'lucide-react';

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [users, setUsers] = useState<UserConfig[]>([]);
  const [quests, setQuests] = useState<QuestConfig[]>([]);
  const [commonQuests, setCommonQuests] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserConfig | null>(null);
  const [editingMode, setEditingMode] = useState<'user' | 'quest' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isBlobStoreAvailable, setIsBlobStoreAvailable] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      if (!isAuthenticated) return;

      setIsLoading(true);
      try {
        // Load configuration from Blob Store
        await userManager.loadConfigs();
        const usersData = await userManager.getAvailableUsers();
        const questsData = await userManager.getAllQuests();

        setUsers(usersData);
        setQuests(questsData);
        setCommonQuests(userManager.getUsersConfig()?.commonQuests || []);
        setIsBlobStoreAvailable(true);

        toast.success('Configuration chargée depuis Blob Store');
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Erreur lors du chargement des données depuis Blob Store');
        setIsBlobStoreAvailable(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated]);

  const handleLogin = async () => {
    try {
      const isValid = await userManager.verifyAdminPassword(password);
      if (isValid) {
        setIsAuthenticated(true);
        toast.success('Connexion administrateur réussie');
      } else {
        toast.error('Mot de passe incorrect');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Erreur lors de la vérification du mot de passe');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword('');
    navigate('/login');
  };

  const handleSaveChanges = async () => {
    setIsLoading(true);
    try {
      const usersRecord = users.reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {} as Record<string, UserConfig>);

      const questsRecord = quests.reduce((acc, quest) => {
        acc[quest.id] = quest;
        return acc;
      }, {} as Record<string, QuestConfig>);

      // Update users and quests separately using VercelDataService
      const usersResponse = await VercelDataService.updateUsersConfig(usersRecord, commonQuests);
      const questsResponse = await VercelDataService.updateQuestsConfig(questsRecord);

      if (usersResponse.success && questsResponse.success) {
        toast.success('Configuration sauvegardée avec succès dans Blob Store !');
        // Reload the data to reflect changes
        await userManager.loadConfigs();
      } else {
        toast.error('Erreur lors de la sauvegarde: ' +
          (usersResponse.message || questsResponse.message));
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label} copié dans le presse-papiers`);
    }).catch(() => {
      toast.error('Erreur lors de la copie');
    });
  };

  const handleCreateUser = () => {
    const newUser: UserConfig = {
      id: `user${Date.now()}`,
      name: 'Nouvel Utilisateur',
      avatar: '👤',
      dailyQuests: ['1', '2', '3'],
      preferences: {
        categories: ['santé', 'apprentissage'],
        difficulty: 'facile',
        questCount: 3,
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
    setUsers([...users, newUser]);
    setSelectedUser(newUser);
    setEditingMode('user');
    toast.success('Nouvel utilisateur créé - Pensez à sauvegarder !');
  };

  const handleCreateQuest = () => {
    const newQuest: QuestConfig = {
      id: `quest${Date.now()}`,
      title: 'Nouvelle Quête',
      description: 'Description de la nouvelle quête',
      category: 'personnel',
      xp: 10,
      difficulty: 'facile',
      icon: '📋',
      tags: [],
      requirements: []
    };
    setQuests([...quests, newQuest]);
    toast.success('Nouvelle quête créée');
  };

  
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;

    setIsLoading(true);
    try {
      const response = await VercelDataService.deleteUser(userId);

      if (response.success) {
        setUsers(users.filter(u => u.id !== userId));
        if (selectedUser?.id === userId) {
          setSelectedUser(null);
        }
        toast.success('Utilisateur supprimé avec succès');
        // Reload to reflect changes
        await userManager.loadConfigs();
      } else {
        toast.error('Erreur lors de la suppression: ' + response.message);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Erreur lors de la suppression de l\'utilisateur');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteQuest = async (questId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette quête ?')) return;

    setIsLoading(true);
    try {
      const response = await VercelDataService.deleteQuest(questId);

      if (response.success) {
        setQuests(quests.filter(q => q.id !== questId));
        toast.success('Quête supprimée avec succès');
        // Reload to reflect changes
        await userManager.loadConfigs();
      } else {
        toast.error('Erreur lors de la suppression: ' + response.message);
      }
    } catch (error) {
      console.error('Error deleting quest:', error);
      toast.error('Erreur lors de la suppression de la quête');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveUsers = async () => {
    if (!selectedUser) return;

    setIsLoading(true);
    try {
      // Update the user in the users array
      const updatedUsers = users.map(user =>
        user.id === selectedUser.id ? selectedUser : user
      );
      setUsers(updatedUsers);

      toast.success('Modifications utilisateur sauvegardées');
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error('Erreur lors de la sauvegarde de l\'utilisateur');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportFullConfig = async () => {
    setIsLoading(true);
    try {
      await handleSaveChanges();
      toast.success('Configuration complète exportée avec succès');
    } catch (error) {
      console.error('Error exporting full config:', error);
      toast.error('Erreur lors de l\'export de la configuration');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95 flex items-center justify-center p-6">
        <Card className="w-full max-w-md backdrop-blur-xl bg-card/30 border border-border/50">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Settings className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            </div>
            <p className="text-muted-foreground">Entrez le mot de passe administrateur</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mot de passe admin"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <Button onClick={handleLogin} className="w-full">
              Se connecter
            </Button>
            <Button variant="outline" onClick={() => navigate('/login')} className="w-full">
              Retour
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95">
      {/* Header */}
      <header className="border-b border-border/30 backdrop-blur-xl bg-card/20">
        <div className="container max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-r from-primary to-secondary">
                <Settings className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                <p className="text-muted-foreground">Gestion des utilisateurs et quêtes</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Status indicator */}
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg border text-sm">
                {isBlobStoreAvailable ? (
                  <>
                    <Cloud className="h-4 w-4 text-green-500" />
                    <span className="text-green-600">Blob Store</span>
                  </>
                ) : (
                  <>
                    <Server className="h-4 w-4 text-red-500" />
                    <span className="text-red-600">Blob Store Error</span>
                  </>
                )}
              </div>

              {/* Test Blob Store button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('/test-blob', '_blank')}
                className="text-xs"
              >
                <Database className="h-3 w-3 mr-1" />
                Test
              </Button>

              <Button
                onClick={handleSaveChanges}
                size="sm"
                disabled={isLoading}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                <Save className="h-4 w-4 mr-1" />
                {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>

              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container max-w-7xl mx-auto p-6">
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Utilisateurs
            </TabsTrigger>
            <TabsTrigger value="quests" className="flex items-center gap-2">
              <Gamepad2 className="h-4 w-4" />
              Quêtes
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Statistiques
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Gestion des Utilisateurs</h2>
              <Button onClick={handleCreateUser} className="btn-scale">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un utilisateur
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Users List */}
              <Card>
                <CardHeader>
                  <CardTitle>Liste des utilisateurs</CardTitle>
                  <CardDescription>{users.length} utilisateurs au total</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-all hover:border-primary/50 ${
                        selectedUser?.id === user.id ? 'border-primary bg-primary/5' : 'border-border/30'
                      }`}
                      onClick={() => setSelectedUser(user)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{user.avatar}</span>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Niv. {user.stats.currentLevel} • {user.stats.totalQuestsCompleted} quêtes
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedUser(user);
                              setEditingMode('user');
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteUser(user.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* User Editor */}
              {selectedUser && (
                <Card>
                  <CardHeader>
                    <CardTitle>Éditer: {selectedUser.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nom</Label>
                        <Input
                          value={selectedUser.name}
                          onChange={(e) => setSelectedUser({...selectedUser, name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Avatar</Label>
                        <Input
                          value={selectedUser.avatar}
                          onChange={(e) => setSelectedUser({...selectedUser, avatar: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Niveau actuel</Label>
                      <Input
                        type="number"
                        value={selectedUser.stats.currentLevel}
                        onChange={(e) => setSelectedUser({
                          ...selectedUser,
                          stats: {...selectedUser.stats, currentLevel: parseInt(e.target.value)}
                        })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>XP totale</Label>
                      <Input
                        type="number"
                        value={selectedUser.stats.totalXP}
                        onChange={(e) => setSelectedUser({
                          ...selectedUser,
                          stats: {...selectedUser.stats, totalXP: parseInt(e.target.value)}
                        })}
                      />
                    </div>

                    <Button onClick={handleSaveUsers} className="w-full">
                      <Save className="h-4 w-4 mr-2" />
                      Sauvegarder les modifications
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Quests Tab */}
          <TabsContent value="quests" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Gestion des Quêtes</h2>
              <Button onClick={handleCreateQuest} className="btn-scale">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une quête
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quests.map((quest) => (
                <Card key={quest.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{quest.icon}</span>
                        <div>
                          <h3 className="font-semibold">{quest.title}</h3>
                          <p className="text-sm text-muted-foreground">{quest.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {/* Edit quest */}}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteQuest(quest.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{quest.description}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="px-2 py-1 rounded-full bg-primary/10 text-primary">
                        {quest.difficulty}
                      </span>
                      <span className="font-medium">{quest.xp} XP</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button onClick={handleExportFullConfig} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Sauvegarder toutes les quêtes
            </Button>
          </TabsContent>

          
          {/* Stats Tab */}
          <TabsContent value="stats" className="space-y-6">
            <h2 className="text-xl font-semibold">Statistiques Générales</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-primary">{users.length}</div>
                  <p className="text-muted-foreground">Utilisateurs</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-secondary">{quests.length}</div>
                  <p className="text-muted-foreground">Quêtes disponibles</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-accent">
                    {users.reduce((sum, user) => sum + user.stats.totalQuestsCompleted, 0)}
                  </div>
                  <p className="text-muted-foreground">Total quêtes complétées</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-success">
                    {Math.max(...users.map(u => u.stats.currentLevel), 0)}
                  </div>
                  <p className="text-muted-foreground">Niveau maximum</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Informations système</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p><strong>Mode:</strong> Frontend statique Vercel</p>
                <p><strong>Stockage:</strong> Vercel Blob Store</p>
                <p><strong>Administration:</strong> Mot de passe unique</p>
                <p><strong>Utilisateurs max:</strong> Illimité</p>
                <p><strong>Dernière mise à jour:</strong> {new Date().toLocaleDateString()}</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;