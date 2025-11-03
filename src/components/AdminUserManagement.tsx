import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { UserConfig, QuestConfig } from '@/lib/userManager';
import { AdminApiService } from '@/lib/adminApiService';
import {
  Users,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  UserPlus,
  Gamepad2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Settings
} from 'lucide-react';

interface AdminUserManagementProps {
  onUsersUpdated?: () => void;
}

const AdminUserManagement: React.FC<AdminUserManagementProps> = ({ onUsersUpdated }) => {
  const [users, setUsers] = useState<Record<string, UserConfig>>({});
  const [quests, setQuests] = useState<Record<string, QuestConfig>>({});
  const [selectedUser, setSelectedUser] = useState<UserConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [isAssigningTasks, setIsAssigningTasks] = useState(false);

  // Form states
  const [newUser, setNewUser] = useState<Partial<UserConfig>>({
    name: '',
    avatar: '👤',
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
  });

  const [editingUser, setEditingUser] = useState<Partial<UserConfig>>({});
  const [selectedQuests, setSelectedQuests] = useState<string[]>([]);
  const [taskAction, setTaskAction] = useState<'assign' | 'replace' | 'remove'>('assign');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [usersData, questsData] = await Promise.all([
        AdminApiService.getUsersNew(),
        AdminApiService.getQuestsNew()
      ]);

      setUsers(usersData.users || {});
      setQuests(questsData.templates || {});
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load user data');
      // Ensure state is set to empty objects even on error
      setUsers({});
      setQuests({});
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.name) {
      toast.error('User name is required');
      return;
    }

    setIsLoading(true);
    try {
      const result = await AdminApiService.createUser(newUser);

      if (result.success) {
        toast.success('User created successfully');
        setIsCreatingUser(false);
        setNewUser({
          name: '',
          avatar: '👤',
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
        });
        await loadData();
        onUsersUpdated?.();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await AdminApiService.deleteUser(userId);

      if (result.success) {
        toast.success('User deleted successfully');
        if (selectedUser?.id === userId) {
          setSelectedUser(null);
        }
        await loadData();
        onUsersUpdated?.();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleModifyUser = async () => {
    if (!selectedUser || !editingUser.name) {
      toast.error('User name is required');
      return;
    }

    setIsLoading(true);
    try {
      const result = await AdminApiService.modifyUser(selectedUser.id, editingUser);

      if (result.success) {
        toast.success('User updated successfully');
        setIsEditingUser(false);
        setEditingUser({});
        setSelectedUser(result.userData || null);
        await loadData();
        onUsersUpdated?.();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error modifying user:', error);
      toast.error('Failed to modify user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignTasks = async () => {
    if (!selectedUser || selectedQuests.length === 0) {
      toast.error('Please select at least one quest');
      return;
    }

    setIsLoading(true);
    try {
      const result = await AdminApiService.assignTasks(selectedUser.id, selectedQuests, taskAction);

      if (result.success) {
        toast.success(`Tasks ${taskAction}ed successfully`);
        setIsAssigningTasks(false);
        setSelectedQuests([]);
        setTaskAction('assign');
        await loadData();
        onUsersUpdated?.();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error assigning tasks:', error);
      toast.error('Failed to assign tasks');
    } finally {
      setIsLoading(false);
    }
  };

  const startEditingUser = (user: UserConfig) => {
    setSelectedUser(user);
    setEditingUser({
      name: user.name,
      avatar: user.avatar,
      stats: { ...user.stats },
      preferences: { ...user.preferences }
    });
    setIsEditingUser(true);
  };

  const getUserLevelColor = (level: number): string => {
    if (level >= 10) return 'bg-purple-500';
    if (level >= 5) return 'bg-blue-500';
    if (level >= 3) return 'bg-green-500';
    return 'bg-gray-500';
  };

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            User Management
          </h2>
          <p className="text-muted-foreground">
            Manage users, their stats, and assigned quests
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={loadData}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={isCreatingUser} onOpenChange={setIsCreatingUser}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Create User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>
                  Add a new user to the system
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="userName">Name</Label>
                  <Input
                    id="userName"
                    value={newUser.name || ''}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    placeholder="Enter user name"
                  />
                </div>
                <div>
                  <Label htmlFor="userAvatar">Avatar</Label>
                  <Input
                    id="userAvatar"
                    value={newUser.avatar || ''}
                    onChange={(e) => setNewUser({ ...newUser, avatar: e.target.value })}
                    placeholder="👤"
                    maxLength={2}
                  />
                </div>
                <div>
                  <Label htmlFor="userLevel">Starting Level</Label>
                  <Input
                    id="userLevel"
                    type="number"
                    min="1"
                    value={newUser.stats?.currentLevel || 1}
                    onChange={(e) => setNewUser({
                      ...newUser,
                      stats: {
                        ...newUser.stats,
                        currentLevel: parseInt(e.target.value) || 1
                      }
                    })}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreatingUser(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateUser} disabled={isLoading || !newUser.name}>
                    Create User
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{Object.keys(users).length}</div>
            <p className="text-sm text-muted-foreground">Total Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">
              {users && Object.keys(users).length > 0
                ? Math.max(...Object.values(users).map(u => u.stats?.currentLevel || 0), 0)
                : 0}
            </div>
            <p className="text-sm text-muted-foreground">Highest Level</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">
              {users && Object.keys(users).length > 0
                ? Object.values(users).reduce((sum, u) => sum + (u.stats?.totalXP || 0), 0)
                : 0}
            </div>
            <p className="text-sm text-muted-foreground">Total XP</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">
              {users && Object.keys(users).length > 0
                ? Object.values(users).reduce((sum, u) => sum + (u.stats?.totalQuestsCompleted || 0), 0)
                : 0}
            </div>
            <p className="text-sm text-muted-foreground">Quests Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Users List and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle>Users ({Object.keys(users).length})</CardTitle>
            <CardDescription>Click on a user to view details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 max-h-96 overflow-y-auto">
            {users && Object.values(users).length > 0 ? Object.values(users).map((user) => (
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
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge className={`text-white ${getUserLevelColor(user.stats?.currentLevel || 1)}`}>
                          Lvl {user.stats?.currentLevel || 1}
                        </Badge>
                        <span>{user.stats?.totalXP || 0} XP</span>
                        <span>{user.stats?.totalQuestsCompleted || 0} quests</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditingUser(user);
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsAssigningTasks(true);
                      }}
                    >
                      <Gamepad2 className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteUser(user.id, user.name);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center text-muted-foreground py-8">
                {isLoading ? 'Loading users...' : 'No users found'}
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Details */}
        {selectedUser && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>{selectedUser.avatar}</span>
                {selectedUser.name}
              </CardTitle>
              <CardDescription>User details and actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">User ID</Label>
                  <p className="font-mono text-xs">{selectedUser.id}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Level</Label>
                  <Badge className={`text-white ${getUserLevelColor(selectedUser.stats?.currentLevel || 1)}`}>
                    Level {selectedUser.stats?.currentLevel || 1}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Total XP</Label>
                  <p className="font-medium">{selectedUser.stats?.totalXP || 0}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Quests Completed</Label>
                  <p className="font-medium">{selectedUser.stats?.totalQuestsCompleted || 0}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">Current Daily Quests</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedUser.dailyQuests?.map((questId) => {
                    const quest = quests[questId];
                    return quest ? (
                      <Badge key={questId} variant="secondary" className="text-xs">
                        {quest.icon} {quest.title}
                      </Badge>
                    ) : (
                      <Badge key={questId} variant="outline" className="text-xs">
                        {questId} (Not Found)
                      </Badge>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => startEditingUser(selectedUser)}
                  variant="outline"
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit User
                </Button>
                <Button
                  onClick={() => setIsAssigningTasks(true)}
                  variant="outline"
                  className="flex-1"
                >
                  <Gamepad2 className="h-4 w-4 mr-2" />
                  Assign Quests
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit User Dialog */}
      <Dialog open={isEditingUser} onOpenChange={setIsEditingUser}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User: {selectedUser?.name}</DialogTitle>
            <DialogDescription>
              Modify user information and stats
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editUserName">Name</Label>
              <Input
                id="editUserName"
                value={editingUser.name || ''}
                onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="editUserAvatar">Avatar</Label>
              <Input
                id="editUserAvatar"
                value={editingUser.avatar || ''}
                onChange={(e) => setEditingUser({ ...editingUser, avatar: e.target.value })}
                maxLength={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editUserLevel">Level</Label>
                <Input
                  id="editUserLevel"
                  type="number"
                  min="1"
                  value={editingUser.stats?.currentLevel || 1}
                  onChange={(e) => setEditingUser({
                    ...editingUser,
                    stats: {
                      ...editingUser.stats,
                      currentLevel: parseInt(e.target.value) || 1
                    }
                  })}
                />
              </div>
              <div>
                <Label htmlFor="editUserXP">Total XP</Label>
                <Input
                  id="editUserXP"
                  type="number"
                  min="0"
                  value={editingUser.stats?.totalXP || 0}
                  onChange={(e) => setEditingUser({
                    ...editingUser,
                    stats: {
                      ...editingUser.stats,
                      totalXP: parseInt(e.target.value) || 0
                    }
                  })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditingUser(false)}>
                Cancel
              </Button>
              <Button onClick={handleModifyUser} disabled={isLoading || !editingUser.name}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Tasks Dialog */}
      <Dialog open={isAssigningTasks} onOpenChange={setIsAssigningTasks}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign Quests to: {selectedUser?.name}</DialogTitle>
            <DialogDescription>
              Select quests to assign to this user
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Action Type</Label>
              <Select value={taskAction} onValueChange={(value: 'assign' | 'replace' | 'remove') => setTaskAction(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="assign">Add to existing quests</SelectItem>
                  <SelectItem value="replace">Replace all quests</SelectItem>
                  <SelectItem value="remove">Remove selected quests</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Select Quests</Label>
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto border rounded-md p-2">
                {quests && Object.values(quests).length > 0 ? Object.values(quests).map((quest) => (
                  <div key={quest.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`quest-${quest.id}`}
                      checked={selectedQuests.includes(quest.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedQuests([...selectedQuests, quest.id]);
                        } else {
                          setSelectedQuests(selectedQuests.filter(id => id !== quest.id));
                        }
                      }}
                      className="rounded"
                    />
                    <label htmlFor={`quest-${quest.id}`} className="text-sm flex items-center gap-2 cursor-pointer">
                      <span>{quest.icon}</span>
                      <span>{quest.title}</span>
                      <Badge variant="outline" className="text-xs">
                        {quest.difficulty}
                      </Badge>
                      <span className="text-muted-foreground">{quest.xp} XP</span>
                    </label>
                  </div>
                )) : (
                  <div className="text-center text-muted-foreground py-4">
                    No quests available
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAssigningTasks(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAssignTasks}
                disabled={isLoading || selectedQuests.length === 0}
              >
                <Gamepad2 className="h-4 w-4 mr-2" />
                {taskAction === 'assign' ? 'Assign' : taskAction === 'replace' ? 'Replace' : 'Remove'} Quests
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUserManagement;