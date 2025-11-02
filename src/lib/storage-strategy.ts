import {
  QuestSystemState,
  PlayerProgress,
  UserProfile,
  Quest,
  QuestHistory,
  QuestSchedule
} from '@/types/enhanced-quest';

// Storage strategy for Vercel deployment with fallback support
export class QuestStorageStrategy {
  private static instance: QuestStorageStrategy;
  private storageMode: 'localStorage' | 'vercel_kv' | 'firebase' | 'hybrid';
  private userId: string | null = null;

  private constructor() {
    this.detectStorageMode();
    this.initializeUserId();
  }

  public static getInstance(): QuestStorageStrategy {
    if (!QuestStorageStrategy.instance) {
      QuestStorageStrategy.instance = new QuestStorageStrategy();
    }
    return QuestStorageStrategy.instance;
  }

  private detectStorageMode(): void {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      this.storageMode = 'firebase'; // Server-side, use Firebase
      return;
    }

    // Check for production environment and availability of Vercel KV
    if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_VERCEL_ENV) {
      // In production, try to use Vercel KV first
      this.storageMode = 'vercel_kv';
    } else {
      // Development or fallback to localStorage
      this.storageMode = 'localStorage';
    }
  }

  private initializeUserId(): void {
    if (typeof window !== 'undefined') {
      // Try to get existing user ID from localStorage
      let userId = localStorage.getItem('quest-user-id');

      if (!userId) {
        // Generate new user ID
        userId = this.generateUserId();
        localStorage.setItem('quest-user-id', userId);
      }

      this.userId = userId;
    }
  }

  private generateUserId(): string {
    return 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  // Main storage interface
  public async saveQuestData(data: {
    questSystemState: QuestSystemState;
    playerProgress: PlayerProgress;
    userProfile: UserProfile;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const timestamp = new Date().toISOString();
      const saveData = {
        ...data,
        userId: this.userId,
        version: '2.0',
        lastSaved: timestamp
      };

      switch (this.storageMode) {
        case 'localStorage':
          return this.saveToLocalStorage(saveData);
        case 'vercel_kv':
          return await this.saveToVercelKV(saveData);
        case 'firebase':
          return await this.saveToFirebase(saveData);
        case 'hybrid':
          return await this.saveToHybrid(saveData);
        default:
          return this.saveToLocalStorage(saveData);
      }
    } catch (error) {
      console.error('Error saving quest data:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  public async loadQuestData(): Promise<{
    questSystemState: QuestSystemState | null;
    playerProgress: PlayerProgress | null;
    userProfile: UserProfile | null;
    success: boolean;
    error?: string;
  }> {
    try {
      switch (this.storageMode) {
        case 'localStorage':
          return this.loadFromLocalStorage();
        case 'vercel_kv':
          return await this.loadFromVercelKV();
        case 'firebase':
          return await this.loadFromFirebase();
        case 'hybrid':
          return await this.loadFromHybrid();
        default:
          return this.loadFromLocalStorage();
      }
    } catch (error) {
      console.error('Error loading quest data:', error);
      return {
        questSystemState: null,
        playerProgress: null,
        userProfile: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // LocalStorage implementation
  private saveToLocalStorage(data: any): { success: boolean; error?: string } {
    try {
      if (typeof window === 'undefined') {
        return { success: false, error: 'Window not available' };
      }

      // Save main data
      localStorage.setItem('enhanced-quest-system', JSON.stringify(data));

      // Create backup
      const backupData = {
        ...data,
        isBackup: true,
        backupTimestamp: new Date().toISOString()
      };
      localStorage.setItem('enhanced-quest-system-backup', JSON.stringify(backupData));

      // Save individual components for easier partial loading
      localStorage.setItem('quest-system-state', JSON.stringify(data.questSystemState));
      localStorage.setItem('player-progress', JSON.stringify(data.playerProgress));
      localStorage.setItem('user-profile', JSON.stringify(data.userProfile));

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'LocalStorage error' };
    }
  }

  private loadFromLocalStorage(): {
    questSystemState: QuestSystemState | null;
    playerProgress: PlayerProgress | null;
    userProfile: UserProfile | null;
    success: boolean;
    error?: string;
  } {
    try {
      if (typeof window === 'undefined') {
        return {
          questSystemState: null,
          playerProgress: null,
          userProfile: null,
          success: false,
          error: 'Window not available'
        };
      }

      // Try to load main data first
      const savedData = localStorage.getItem('enhanced-quest-system');

      if (savedData) {
        const parsed = JSON.parse(savedData);

        // Validate data structure
        if (this.validateQuestData(parsed)) {
          return {
            questSystemState: parsed.questSystemState,
            playerProgress: parsed.playerProgress,
            userProfile: parsed.userProfile,
            success: true
          };
        }
      }

      // Try to load backup
      const backupData = localStorage.getItem('enhanced-quest-system-backup');
      if (backupData) {
        const parsed = JSON.parse(backupData);
        if (this.validateQuestData(parsed)) {
          console.warn('Loaded from backup data');
          return {
            questSystemState: parsed.questSystemState,
            playerProgress: parsed.playerProgress,
            userProfile: parsed.userProfile,
            success: true
          };
        }
      }

      // Try to load individual components
      const questSystemState = this.loadFromLocalStorageItem('quest-system-state');
      const playerProgress = this.loadFromLocalStorageItem('player-progress');
      const userProfile = this.loadFromLocalStorageItem('user-profile');

      return {
        questSystemState,
        playerProgress,
        userProfile,
        success: !!(questSystemState || playerProgress || userProfile)
      };
    } catch (error) {
      return {
        questSystemState: null,
        playerProgress: null,
        userProfile: null,
        success: false,
        error: error instanceof Error ? error.message : 'Parse error'
      };
    }
  }

  private loadFromLocalStorageItem(key: string): any {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }

  // Vercel KV implementation (for production)
  private async saveToVercelKV(data: any): Promise<{ success: boolean; error?: string }> {
    try {
      // This would be implemented with Vercel KV client
      // For now, we'll simulate the API call

      const response = await fetch('/api/quest-data/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: `quest_data_${this.userId}`,
          data: data
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Also save to localStorage as backup
      this.saveToLocalStorage(data);

      return { success: true };
    } catch (error) {
      console.error('Vercel KV save failed, falling back to localStorage:', error);
      return this.saveToLocalStorage(data);
    }
  }

  private async loadFromVercelKV(): Promise<{
    questSystemState: QuestSystemState | null;
    playerProgress: PlayerProgress | null;
    userProfile: UserProfile | null;
    success: boolean;
    error?: string;
  }> {
    try {
      const response = await fetch(`/api/quest-data/load?key=quest_data_${this.userId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        const data = result.data;
        if (this.validateQuestData(data)) {
          // Cache in localStorage
          this.saveToLocalStorage(data);

          return {
            questSystemState: data.questSystemState,
            playerProgress: data.playerProgress,
            userProfile: data.userProfile,
            success: true
          };
        }
      }

      // Fallback to localStorage
      return this.loadFromLocalStorage();
    } catch (error) {
      console.error('Vercel KV load failed, falling back to localStorage:', error);
      return this.loadFromLocalStorage();
    }
  }

  // Firebase implementation (server-side)
  private async saveToFirebase(data: any): Promise<{ success: boolean; error?: string }> {
    try {
      // This would be implemented with Firebase Admin SDK
      // For now, we'll return a mock implementation

      console.log('Firebase save (mock):', data);

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Firebase error' };
    }
  }

  private async loadFromFirebase(): Promise<{
    questSystemState: QuestSystemState | null;
    playerProgress: PlayerProgress | null;
    userProfile: UserProfile | null;
    success: boolean;
    error?: string;
  }> {
    try {
      // Mock Firebase implementation
      console.log('Firebase load (mock)');

      return {
        questSystemState: null,
        playerProgress: null,
        userProfile: null,
        success: false,
        error: 'Firebase not implemented'
      };
    } catch (error) {
      return {
        questSystemState: null,
        playerProgress: null,
        userProfile: null,
        success: false,
        error: error instanceof Error ? error.message : 'Firebase error'
      };
    }
  }

  // Hybrid implementation (try multiple storage methods)
  private async saveToHybrid(data: any): Promise<{ success: boolean; error?: string }> {
    try {
      // Save to primary storage
      const primaryResult = await this.saveToVercelKV(data);

      if (primaryResult.success) {
        // Also save to localStorage as backup
        this.saveToLocalStorage(data);
        return { success: true };
      }

      // Fallback to localStorage only
      return this.saveToLocalStorage(data);
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Hybrid storage error' };
    }
  }

  private async loadFromHybrid(): Promise<{
    questSystemState: QuestSystemState | null;
    playerProgress: PlayerProgress | null;
    userProfile: UserProfile | null;
    success: boolean;
    error?: string;
  }> {
    try {
      // Try to load from primary storage first
      const primaryResult = await this.loadFromVercelKV();

      if (primaryResult.success) {
        return primaryResult;
      }

      // Fallback to localStorage
      return this.loadFromLocalStorage();
    } catch (error) {
      return {
        questSystemState: null,
        playerProgress: null,
        userProfile: null,
        success: false,
        error: error instanceof Error ? error.message : 'Hybrid load error'
      };
    }
  }

  // Data validation
  private validateQuestData(data: any): boolean {
    try {
      // Check basic structure
      if (!data || typeof data !== 'object') {
        return false;
      }

      // Check required fields
      if (!data.questSystemState || !data.playerProgress || !data.userProfile) {
        return false;
      }

      // Check version compatibility
      if (data.version && data.version !== '2.0') {
        console.warn('Data version mismatch, migration may be required');
      }

      // Basic validation of nested objects
      const hasValidProgress =
        typeof data.playerProgress.currentLevel === 'number' &&
        typeof data.playerProgress.currentXP === 'number' &&
        typeof data.playerProgress.xpToNextLevel === 'number';

      const hasValidProfile =
        typeof data.userProfile.username === 'string' &&
        typeof data.userProfile.currentLevel === 'number';

      return hasValidProgress && hasValidProfile;
    } catch (error) {
      console.error('Data validation error:', error);
      return false;
    }
  }

  // Sync and backup utilities
  public async createBackup(): Promise<{ success: boolean; backupId?: string; error?: string }> {
    try {
      const data = await this.loadQuestData();

      if (!data.success) {
        return { success: false, error: 'Failed to load data for backup' };
      }

      const backupId = `backup_${Date.now()}_${this.userId}`;
      const backupData = {
        ...data,
        backupId,
        backupTimestamp: new Date().toISOString(),
        isBackup: true
      };

      // Save backup with special key
      const saveResult = await this.saveToVercelKV({
        key: backupId,
        data: backupData
      });

      if (saveResult.success) {
        // Also save to localStorage
        localStorage.setItem(`quest_backup_${backupId}`, JSON.stringify(backupData));
      }

      return {
        success: saveResult.success,
        backupId: saveResult.success ? backupId : undefined,
        error: saveResult.error
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Backup creation failed'
      };
    }
  }

  public async restoreFromBackup(backupId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Try to load backup from Vercel KV first
      const response = await fetch(`/api/quest-data/load?key=${backupId}`);

      if (response.ok) {
        const result = await response.json();

        if (result.success && result.data) {
          const saveResult = await this.saveQuestData(result.data);
          return saveResult;
        }
      }

      // Try to load backup from localStorage
      const localBackup = localStorage.getItem(`quest_backup_${backupId}`);
      if (localBackup) {
        const backupData = JSON.parse(localBackup);
        if (backupData.questSystemState && backupData.playerProgress && backupData.userProfile) {
          const saveResult = await this.saveQuestData({
            questSystemState: backupData.questSystemState,
            playerProgress: backupData.playerProgress,
            userProfile: backupData.userProfile
          });
          return saveResult;
        }
      }

      return { success: false, error: 'Backup not found' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Backup restore failed'
      };
    }
  }

  public async clearAllData(): Promise<{ success: boolean; error?: string }> {
    try {
      // Clear localStorage
      if (typeof window !== 'undefined') {
        const keysToRemove = [
          'enhanced-quest-system',
          'enhanced-quest-system-backup',
          'quest-system-state',
          'player-progress',
          'user-profile',
          'quest-user-id'
        ];

        keysToRemove.forEach(key => localStorage.removeItem(key));

        // Clear backup data
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('quest_backup_')) {
            localStorage.removeItem(key);
          }
        }
      }

      // Clear remote storage
      if (this.storageMode === 'vercel_kv') {
        try {
          await fetch(`/api/quest-data/clear?userId=${this.userId}`, {
            method: 'DELETE'
          });
        } catch (error) {
          console.warn('Failed to clear remote storage:', error);
        }
      }

      // Generate new user ID
      this.initializeUserId();

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Clear data failed'
      };
    }
  }

  // Storage analytics
  public getStorageInfo(): {
    mode: string;
    userId: string | null;
    localStorageSize: number;
    lastSaved: string | null;
    hasBackup: boolean;
  } {
    let localStorageSize = 0;
    let lastSaved = null;
    let hasBackup = false;

    if (typeof window !== 'undefined') {
      // Calculate localStorage size
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key) && key.startsWith('quest')) {
          localStorageSize += localStorage[key].length;
        }
      }

      // Get last saved time
      const mainData = localStorage.getItem('enhanced-quest-system');
      if (mainData) {
        try {
          const parsed = JSON.parse(mainData);
          lastSaved = parsed.lastSaved;
        } catch {
          // Ignore parse errors
        }
      }

      // Check for backup
      hasBackup = !!localStorage.getItem('enhanced-quest-system-backup');
    }

    return {
      mode: this.storageMode,
      userId: this.userId,
      localStorageSize,
      lastSaved,
      hasBackup
    };
  }

  // Public getters
  public getUserId(): string | null {
    return this.userId;
  }

  public getStorageMode(): string {
    return this.storageMode;
  }
}

// Export singleton instance
export const questStorage = QuestStorageStrategy.getInstance();