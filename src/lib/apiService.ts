import { UserConfig, QuestConfig } from './userManager';
import { MockApiService } from './mockApiService';

const API_BASE = '/api';
const USE_MOCK_API = process.env.NODE_ENV === 'development' && !process.env.VITE_API_ENABLED;

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  fallback?: boolean;
}

export class ApiService {
  private static adminPassword = 'admin123';

  /**
   * Set admin password for API requests
   */
  static setAdminPassword(password: string) {
    this.adminPassword = password;
  }

  /**
   * Get headers for API requests
   */
  private static getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'x-admin-password': this.adminPassword
    };
  }

  /**
   * Handle API response
   */
  private static handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    return response.json().then(data => {
      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP error! status: ${response.status}`
        };
      }
      return {
        success: true,
        data: data.data || data,
        message: data.message,
        fallback: data.fallback
      };
    });
  }

  /**
   * Get all users and configuration
   */
  static async getUsers(): Promise<ApiResponse<{ users: Record<string, UserConfig>; commonQuests: string[] }>> {
    if (USE_MOCK_API) {
      return MockApiService.getUsers();
    }

    try {
      const response = await fetch(`${API_BASE}/users`, {
        headers: { 'Content-Type': 'application/json' }
      });
      return this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        error: `Failed to fetch users: ${(error as Error).message}`
      };
    }
  }

  /**
   * Create a new user
   */
  static async createUser(userData: Partial<UserConfig>): Promise<ApiResponse<UserConfig>> {
    if (USE_MOCK_API) {
      return MockApiService.createUser(userData);
    }

    try {
      const response = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(userData)
      });
      return this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        error: `Failed to create user: ${(error as Error).message}`
      };
    }
  }

  /**
   * Update an existing user
   */
  static async updateUser(userId: string, updates: Partial<UserConfig>): Promise<ApiResponse<UserConfig>> {
    if (USE_MOCK_API) {
      return MockApiService.updateUser(userId, updates);
    }

    try {
      const response = await fetch(`${API_BASE}/users`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({ userId, ...updates })
      });
      return this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        error: `Failed to update user: ${(error as Error).message}`
      };
    }
  }

  /**
   * Delete a user
   */
  static async deleteUser(userId: string): Promise<ApiResponse> {
    if (USE_MOCK_API) {
      return MockApiService.deleteUser(userId);
    }

    try {
      const response = await fetch(`${API_BASE}/users?userId=${encodeURIComponent(userId)}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
      return this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        error: `Failed to delete user: ${(error as Error).message}`
      };
    }
  }

  /**
   * Get all quests
   */
  static async getQuests(): Promise<ApiResponse<Record<string, QuestConfig>>> {
    if (USE_MOCK_API) {
      return MockApiService.getQuests();
    }

    try {
      const response = await fetch(`${API_BASE}/quests`, {
        headers: { 'Content-Type': 'application/json' }
      });
      return this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        error: `Failed to fetch quests: ${(error as Error).message}`
      };
    }
  }

  /**
   * Create a new quest
   */
  static async createQuest(questData: Partial<QuestConfig>): Promise<ApiResponse<QuestConfig>> {
    if (USE_MOCK_API) {
      return MockApiService.createQuest(questData);
    }

    try {
      const response = await fetch(`${API_BASE}/quests`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(questData)
      });
      return this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        error: `Failed to create quest: ${(error as Error).message}`
      };
    }
  }

  /**
   * Update an existing quest
   */
  static async updateQuest(questId: string, updates: Partial<QuestConfig>): Promise<ApiResponse<QuestConfig>> {
    if (USE_MOCK_API) {
      return MockApiService.updateQuest(questId, updates);
    }

    try {
      const response = await fetch(`${API_BASE}/quests`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({ questId, ...updates })
      });
      return this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        error: `Failed to update quest: ${(error as Error).message}`
      };
    }
  }

  /**
   * Delete a quest
   */
  static async deleteQuest(questId: string): Promise<ApiResponse> {
    if (USE_MOCK_API) {
      return MockApiService.deleteQuest(questId);
    }

    try {
      const response = await fetch(`${API_BASE}/quests?questId=${encodeURIComponent(questId)}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
      return this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        error: `Failed to delete quest: ${(error as Error).message}`
      };
    }
  }

  /**
   * Get full configuration
   */
  static async getConfig(): Promise<ApiResponse<{
    users: Record<string, UserConfig>;
    quests: Record<string, QuestConfig>;
    commonQuests: string[];
    isEdgeConfigAvailable: boolean;
  }>> {
    if (USE_MOCK_API) {
      return MockApiService.getConfig();
    }

    try {
      const response = await fetch(`${API_BASE}/config`, {
        headers: { 'Content-Type': 'application/json' }
      });
      return this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        error: `Failed to fetch config: ${(error as Error).message}`
      };
    }
  }

  /**
   * Update full configuration
   */
  static async updateConfig(
    users: Record<string, UserConfig>,
    quests: Record<string, QuestConfig>,
    commonQuests: string[]
  ): Promise<ApiResponse> {
    if (USE_MOCK_API) {
      return MockApiService.updateConfig(users, quests, commonQuests);
    }

    try {
      const response = await fetch(`${API_BASE}/config`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ users, quests, commonQuests })
      });
      return this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        error: `Failed to update config: ${(error as Error).message}`
      };
    }
  }
}