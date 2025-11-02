'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Copy, Star, Eye } from 'lucide-react';
import type {
  Quest,
  UserQuest,
  QuestTemplate,
  QuestCategory,
  QuestDifficulty,
  QuestGranularity
} from '@/types/quest-system';
import { QuestBuilder } from './QuestBuilder';

interface QuestManagerProps {
  userId: string;
  quests: Quest[];
  userQuests: UserQuest[];
  templates: QuestTemplate[];
  onCreateQuest: (quest: Omit<UserQuest, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateQuest: (questId: string, updates: Partial<UserQuest>) => void;
  onDeleteQuest: (questId: string) => void;
  onDuplicateQuest: (questId: string) => void;
  onFavoriteQuest: (questId: string, isFavorite: boolean) => void;
}

const getCategoryIcon = (category: QuestCategory) => {
  const icons: Record<QuestCategory, string> = {
    [QuestCategory.HEALTH]: '❤️',
    [QuestCategory.WORK]: '💼',
    [QuestCategory.PERSONAL]: '👤',
    [QuestCategory.FITNESS]: '💪',
    [QuestCategory.LEARNING]: '📚',
    [QuestCategory.SOCIAL]: '👥',
    [QuestCategory.FINANCE]: '💰',
    [QuestCategory.CREATIVITY]: '🎨',
    [QuestCategory.HOBBY]: '🎯'
  };
  return icons[category];
};

const getDifficultyColor = (difficulty: QuestDifficulty) => {
  switch (difficulty) {
    case QuestDifficulty.EASY: return 'bg-green-100 text-green-800 border-green-300';
    case QuestDifficulty.MEDIUM: return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case QuestDifficulty.HARD: return 'bg-orange-100 text-orange-800 border-orange-300';
    case QuestDifficulty.EXPERT: return 'bg-red-100 text-red-800 border-red-300';
    default: return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

const getDifficultyLabel = (difficulty: QuestDifficulty) => {
  switch (difficulty) {
    case QuestDifficulty.EASY: return 'Facile';
    case QuestDifficulty.MEDIUM: return 'Moyen';
    case QuestDifficulty.HARD: return 'Difficile';
    case QuestDifficulty.EXPERT: return 'Expert';
    default: return 'Inconnu';
  }
};

const getGranularityLabel = (granularity: QuestGranularity) => {
  switch (granularity) {
    case 'daily': return 'Journalière';
    case 'weekly': return 'Hebdomadaire';
    case 'monthly': return 'Mensuelle';
    default: return 'Inconnue';
  }
};

export const QuestManager: React.FC<QuestManagerProps> = ({
  userId,
  quests,
  userQuests,
  templates,
  onCreateQuest,
  onUpdateQuest,
  onDeleteQuest,
  onDuplicateQuest,
  onFavoriteQuest
}) => {
  const [selectedQuest, setSelectedQuest] = useState<UserQuest | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<QuestCategory | 'all'>('all');
  const [selectedGranularity, setSelectedGranularity] = useState<QuestGranularity | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filtrer les quêtes utilisateur
  const filteredUserQuests = userQuests.filter(quest => {
    const matchesSearch = quest.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quest.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || quest.category === selectedCategory;
    const matchesGranularity = selectedGranularity === 'all' || quest.granularity === selectedGranularity;

    return matchesSearch && matchesCategory && matchesGranularity;
  });

  const handleCreateQuest = (questData: Omit<UserQuest, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    onCreateQuest(questData);
    setIsCreateDialogOpen(false);
  };

  const handleEditQuest = (questData: Partial<UserQuest>) => {
    if (selectedQuest) {
      onUpdateQuest(selectedQuest.id, questData);
      setIsEditDialogOpen(false);
      setSelectedQuest(null);
    }
  };

  const handleDeleteQuest = (questId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette quête ?')) {
      onDeleteQuest(questId);
    }
  };

  const getTemplateSuggestions = (category: QuestCategory, granularity: QuestGranularity) => {
    return templates.filter(template =>
      template.category === category &&
      template.granularity === granularity
    ).slice(0, 3);
  };

  const renderQuestCard = (quest: UserQuest) => {
    const isCustom = !!userQuests.find(uq => uq.id === quest.id);

    return (
      <Card key={quest.id} className=\"hover:shadow-lg transition-shadow\">
        <CardHeader className=\"pb-3\">
          <div className=\"flex justify-between items-start\">
            <div className=\"flex-1\">
              <div className=\"flex items-center gap-2 mb-1\">
                <span className=\"text-lg\">{getCategoryIcon(quest.category)}</span>
                <CardTitle className=\"text-lg\">{quest.customTitle || quest.title}</CardTitle>
                {isCustom && <Badge variant=\"secondary\">Perso</Badge>}
              </div>
              <CardDescription className=\"text-sm text-gray-600\">
                {quest.customDescription || quest.description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className=\"pt-0\">
          <div className=\"space-y-3\">
            {/* Métadonnées */}
            <div className=\"flex flex-wrap gap-2 text-xs\">
              <Badge className={getDifficultyColor(quest.difficulty)}>
                {getDifficultyLabel(quest.difficulty)}
              </Badge>
              <Badge variant=\"outline\">
                {getGranularityLabel(quest.granularity)}
              </Badge>
              <Badge variant=\"outline\">
                {quest.xpReward} XP
              </Badge>
            </div>

            {/* Tags */}
            <div className=\"flex flex-wrap gap-1\">
              {quest.tags.map((tag, index) => (
                <Badge key={index} variant=\"outline\" className=\"text-xs\">
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Actions */}
            <div className=\"flex gap-2 pt-2\">
              <Button size=\"sm\" variant=\"outline\" onClick={() => setSelectedQuest(quest)}>
                <Eye className=\"w-3 h-3 mr-1\" />
                Voir
              </Button>
              <Button size=\"sm\" variant=\"outline\" onClick={() => onDuplicateQuest(quest.id)}>
                <Copy className=\"w-3 h-3 mr-1\" />
                Dupliquer
              </Button>
              <Button size=\"sm\" variant=\"outline\" onClick={() => setIsEditDialogOpen(true)}>
                <Edit className=\"w-3 h-3 mr-1\" />
                Modifier
              </Button>
              <Button size=\"sm\" variant=\"destructive\" onClick={() => handleDeleteQuest(quest.id)}>
                <Trash2 className=\"w-3 h-3 mr-1\" />
                Supprimer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className=\"space-y-6\">
      {/* En-tête avec contrôles */}
      <div className=\"flex flex-wrap justify-between items-center gap-4\">
        <h2 className=\"text-2xl font-bold\">Gestion des Quêtes</h2>

        <div className=\"flex flex-wrap gap-2\">
          <div className=\"flex items-center gap-2\">
            <Input
              placeholder=\"Rechercher des quêtes...\"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className=\"w-48\"
            />
          </div>

          <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as QuestCategory | 'all')}>
            <SelectTrigger className=\"w-32\">
              <SelectValue placeholder=\"Catégorie\" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=\"all\">Toutes catégories</SelectItem>
              {Object.values(QuestCategory).map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedGranularity} onValueChange={(value) => setSelectedGranularity(value as QuestGranularity | 'all')}>
            <SelectTrigger className=\"w-32\">
              <SelectValue placeholder=\"Granularité\" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=\"all\">Toutes</SelectItem>
              {(['daily', 'weekly', 'monthly'] as QuestGranularity[]).map(granularity => (
                <SelectItem key={granularity} value={granularity}>
                  {getGranularityLabel(granularity)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className=\"w-4 h-4 mr-2\" />
            Créer
          </Button>
        </div>
      </div>

      {/* Navigation par onglets */}
      <Tabs defaultValue=\"custom\" className=\"w-full\">
        <TabsList>
          <TabsTrigger value=\"custom\">Mes Quêtes ({userQuests.length})</TabsTrigger>
          <TabsTrigger value=\"templates\">Templates ({templates.length})</TabsTrigger>
        </TabsList>

        <TabsContent value=\"custom\" className=\"space-y-4\">
          {/* Statistiques rapides */}
          <div className=\"grid grid-cols-2 md:grid-cols-4 gap-4\">
            <Card>
              <CardContent className=\"pt-6\">
                <div className=\"text-2xl font-bold\">{userQuests.length}</div>
                <p className=\"text-xs text-gray-600\">Quêtes créées</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className=\"pt-6\">
                <div className=\"text-2xl font-bold\">
                  {userQuests.filter(q => q.difficulty === QuestDifficulty.HARD).length}
                </div>
                <p className=\"text-xs text-gray-600\">Difficiles</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className=\"pt-6\">
                <div className=\"text-2xl font-bold\">
                  {new Set(userQuests.map(q => q.category)).size}
                </div>
                <p className=\"text-xs text-gray-600\">Catégories</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className=\"pt-6\">
                <div className=\"text-2xl font-bold\">
                  {userQuests.filter(q => q.granularity === 'daily').length}
                </div>
                <p className=\"text-xs text-gray-600\">Journalières</p>
              </CardContent>
            </Card>
          </div>

          {/* Liste des quêtes personnalisées */}
          <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4\">
            {filteredUserQuests.map(renderQuestCard)}
          </div>
        </TabsContent>

        <TabsContent value=\"templates\" className=\"space-y-4\">
          <div className=\"text-sm text-gray-600\">
            Les templates sont des quêtes prédéfinies que vous pouvez utiliser comme base pour créer vos propres quêtes.
          </div>

          <div className=\"grid grid-cols-1 md:grid-cols-2 gap-4\">
            {templates.map(template => (
              <Card key={template.id}>
                <CardHeader>
                  <div className=\"flex justify-between items-start\">
                    <div>
                      <CardTitle className=\"text-lg\">{template.title}</CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </div>
                    <Badge className={getDifficultyColor(template.difficulty)}>
                      {getDifficultyLabel(template.difficulty)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className=\"space-y-2 text-sm\">
                    <div className=\"flex justify-between\">
                      <span>Granularité:</span>
                      <Badge variant=\"outline\">{getGranularityLabel(template.granularity)}</Badge>
                    </div>
                    <div className=\"flex justify-between\">
                      <span>Récompense:</span>
                      <span className=\"font-medium\">{template.baseXpReward} XP</span>
                    </div>
                    <div className=\"flex justify-between\">
                      <span>Catégorie:</span>
                      <span>{getCategoryIcon(template.category)} {template.category}</span>
                    </div>
                  </div>
                  <Button
                    size=\"sm\"
                    className=\"w-full mt-4\"
                    onClick={() => {
                      setSelectedQuest({
                        ...template,
                        id: '',
                        userId,
                        createdAt: new Date(),
                        updatedAt: new Date()
                      } as UserQuest);
                      setIsEditDialogOpen(true);
                    }}
                  >
                    Utiliser comme base
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog de création/édition */}
      {(isCreateDialogOpen || isEditDialogOpen) && (
        <QuestBuilder
          quest={selectedQuest || undefined}
          templates={templates}
          onSave={isCreateDialogOpen ? handleCreateQuest : handleEditQuest}
          onCancel={() => {
            setIsCreateDialogOpen(false);
            setIsEditDialogOpen(false);
            setSelectedQuest(null);
          }}
        />
      )}

      {/* Dialog de détail */}
      {selectedQuest && !isEditDialogOpen && (
        <Dialog open={!!selectedQuest} onOpenChange={() => setSelectedQuest(null)}>
          <DialogContent className=\"max-w-2xl\">
            <DialogHeader>
              <DialogTitle>{selectedQuest.customTitle || selectedQuest.title}</DialogTitle>
              <DialogDescription>
                {selectedQuest.customDescription || selectedQuest.description}
              </DialogDescription>
            </DialogHeader>

            <div className=\"space-y-4\">
              <div className=\"grid grid-cols-2 gap-4 text-sm\">
                <div>
                  <span className=\"font-medium\">Catégorie:</span> {getCategoryIcon(selectedQuest.category)} {selectedQuest.category}
                </div>
                <div>
                  <span className=\"font-medium\">Difficulté:</span> {getDifficultyLabel(selectedQuest.difficulty)}
                </div>
                <div>
                  <span className=\"font-medium\">Granularité:</span> {getGranularityLabel(selectedQuest.granularity)}
                </div>
                <div>
                  <span className=\"font-medium\">XP:</span> {selectedQuest.xpReward}
                </div>
                <div>
                  <span className=\"font-medium\">Limite de temps:</span> {selectedQuest.timeLimit ? `${selectedQuest.timeLimit} min` : 'Illimitée'}
                </div>
                <div>
                  <span className=\"font-medium\">Créé:</span> {new Date(selectedQuest.createdAt).toLocaleDateString()}
                </div>
              </div>

              <div>
                <h4 className=\"font-medium mb-2\">Tags:</h4>
                <div className=\"flex flex-wrap gap-1\">
                  {selectedQuest.tags.map((tag, index) => (
                    <Badge key={index} variant=\"outline\">{tag}</Badge>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant=\"outline\" onClick={() => setSelectedQuest(null)}>
                Fermer
              </Button>
              <Button onClick={() => {
                setSelectedQuest(null);
                setIsEditDialogOpen(true);
              }}>
                Modifier
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};