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
import { ConfigManager } from '@/lib/configManager';
import { Gamepad2, Users, Settings, LogOut, Save, Plus, Trash2, Edit, Download, Upload, FileText, Database } from 'lucide-react';

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [users, setUsers] = useState<UserConfig[]>([]);
  const [quests, setQuests] = useState<QuestConfig[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserConfig | null>(null);
  const [editingMode, setEditingMode] = useState<'user' | 'quest' | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeAdmin = async () => {
      try {
        await userManager.loadConfigs();
        setUsers(userManager.getAvailableUsers());
        setQuests(userManager.getAllQuests());
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
        toast.error('Erreur lors du chargement des données');
      }
    };

    initializeAdmin();
  }, []);

  const handleLogin = () => {
    if (userManager.verifyAdminPassword(password)) {
      setIsAuthenticated(true);
      toast.success('Connexion administrateur réussie');
    } else {
      toast.error('Mot de passe incorrect');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword('');
    navigate('/login');
  };

  const handleSaveUsers = () => {
    ConfigManager.exportUsersConfig(users, ['1', '2', '10']); // Quêtes communes par défaut
    toast.success('Configuration des utilisateurs exportée avec succès');
  };

  const handleSaveQuests = () => {
    ConfigManager.exportQuestsConfig(quests);
    toast.success('Configuration des quêtes exportée avec succès');
  };

  const handleExportFullConfig = () => {
    ConfigManager.exportFullConfig(users, quests, ['1', '2', '10']);
    toast.success('Configuration complète exportée avec succès');
  };

  const handleGenerateBackup = () => {
    ConfigManager.generateBackup(users, quests, ['1', '2', '10']);
    toast.success('Backup généré avec succès');
  };

  const handleImportUsers = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const config = await ConfigManager.importUsersConfig(file);
      const validation = ConfigManager.validateUsersConfig(config);

      if (!validation.isValid) {
        toast.error('Erreurs de validation: ' + validation.errors.join(', '));
        return;
      }

      // Convertir l'objet en tableau
      const importedUsers = Object.values(config.users);
      setUsers(importedUsers);

      toast.success(`${importedUsers.length} utilisateurs importés avec succès`);
    } catch (error) {
      toast.error('Erreur lors de l\'import: ' + (error as Error).message);
    }

    // Reset l'input file
    event.target.value = '';
  };

  const handleImportQuests = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const config = await ConfigManager.importQuestsConfig(file);
      const validation = ConfigManager.validateQuestsConfig(config);

      if (!validation.isValid) {
        toast.error('Erreurs de validation: ' + validation.errors.join(', '));
        return;
      }

      // Convertir l'objet en tableau
      const importedQuests = Object.values(config.quests);
      setQuests(importedQuests);

      toast.success(`${importedQuests.length} quêtes importées avec succès`);
    } catch (error) {
      toast.error('Erreur lors de l\'import: ' + (error as Error).message);
    }

    // Reset l'input file
    event.target.value = '';
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
        currentStreak: 0,
        totalQuestsCompleted: 0
      }
    };
    setUsers([...users, newUser]);
    setSelectedUser(newUser);
    setEditingMode('user');
    toast.success('Nouvel utilisateur créé');
  };

  const handleCreateQuest = () => {
    const newQuest: QuestConfig = {
      id: `quest${Date.now()}`,
      title: 'Nouvelle Quête',
      description: 'Description de la nouvelle quête',
      category: 'personnel',
      xp: 10,
      difficulty: 'facile',
      timeLimit: 24,
      icon: '📋'
    };
    setQuests([...quests, newQuest]);
    toast.success('Nouvelle quête créée');
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(users.filter(u => u.id !== userId));
    if (selectedUser?.id === userId) {
      setSelectedUser(null);
    }
    toast.success('Utilisateur supprimé');
  };

  const handleDeleteQuest = (questId: string) => {
    setQuests(quests.filter(q => q.id !== questId));
    toast.success('Quête supprimée');
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
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <div className="container max-w-7xl mx-auto p-6">
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Utilisateurs
            </TabsTrigger>
            <TabsTrigger value="quests" className="flex items-center gap-2">
              <Gamepad2 className="h-4 w-4" />
              Quêtes
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Export/Import
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

            <Button onClick={handleSaveQuests} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Sauvegarder toutes les quêtes
            </Button>
          </TabsContent>

          {/* Export/Import Tab */}
          <TabsContent value="export" className="space-y-6">
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold mb-2">Export/Import Configuration</h2>
                <p className="text-muted-foreground">
                  Exportez vos modifications pour les sauvegarder, puis importez-les pour les appliquer.
                </p>
              </div>

              {/* Export Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Exporter la Configuration
                  </CardTitle>
                  <CardDescription>
                    Téléchargez les fichiers de configuration pour les sauvegarder ou les partager
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button onClick={handleSaveUsers} className="btn-scale h-12">
                      <Users className="h-4 w-4 mr-2" />
                      Exporter les Utilisateurs
                    </Button>
                    <Button onClick={handleSaveQuests} className="btn-scale h-12">
                      <Gamepad2 className="h-4 w-4 mr-2" />
                      Exporter les Quêtes
                    </Button>
                    <Button onClick={handleExportFullConfig} className="btn-scale h-12">
                      <FileText className="h-4 w-4 mr-2" />
                      Exporter Tout (JSON complet)
                    </Button>
                    <Button onClick={handleGenerateBackup} variant="outline" className="btn-scale h-12">
                      <Database className="h-4 w-4 mr-2" />
                      Générer un Backup
                    </Button>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/20">
                    <h4 className="font-medium mb-2">Instructions pour Vercel:</h4>
                    <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                      <li>Cliquez sur "Exporter Tout" pour télécharger la configuration</li>
                      <li>Remplacez les fichiers JSON dans votre projet local</li>
                      <li>Faites un commit: <code className="bg-muted px-1 rounded">git add . && git commit -m "Update config"</code></li>
                      <li>Push: <code className="bg-muted px-1 rounded">git push</code></li>
                      <li>Vercel déploiera automatiquement les changements</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>

              {/* Import Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Importer la Configuration
                  </CardTitle>
                  <CardDescription>
                    Importez des fichiers de configuration pour mettre à jour les données
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="users-import" className="text-sm font-medium">
                          Importer les Utilisateurs
                        </Label>
                        <Input
                          id="users-import"
                          type="file"
                          accept=".json"
                          onChange={handleImportUsers}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Format: users-config.json
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="quests-import" className="text-sm font-medium">
                          Importer les Quêtes
                        </Label>
                        <Input
                          id="quests-import"
                          type="file"
                          accept=".json"
                          onChange={handleImportQuests}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Format: quests-library.json
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                    <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      ⚠️ Important
                    </h4>
                    <p className="text-sm text-yellow-700">
                      L'import remplace les données actuelles. Assurez-vous d'avoir un backup avant d'importer.
                      Les modifications ne seront persistantes qu'après avoir exporté et remplacé les fichiers sur Vercel.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Configuration Actuelle</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-primary">{users.length}</div>
                      <p className="text-sm text-muted-foreground">Utilisateurs</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-secondary">{quests.length}</div>
                      <p className="text-sm text-muted-foreground">Quêtes</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-accent">
                        {users.reduce((sum, user) => sum + user.stats.totalQuestsCompleted, 0)}
                      </div>
                      <p className="text-sm text-muted-foreground">Quêtes terminées</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-success">
                        {Math.max(...users.map(u => u.stats.currentLevel), 0)}
                      </div>
                      <p className="text-sm text-muted-foreground">Niveau max</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
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
                <p><strong>Stockage:</strong> Fichiers JSON</p>
                <p><strong>Administration:</strong> Mot de passe unique</p>
                <p><strong>Utilisateurs max:</strong> 10</p>
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