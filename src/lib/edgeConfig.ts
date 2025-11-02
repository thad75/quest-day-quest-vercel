import { get, has, getAll, clone, createClient } from '@vercel/edge-config';

// Edge Config client for Vercel Storage
// Multiple connection methods for maximum compatibility

// Méthode alternative: créer un client directement
let edgeConfigClient: ReturnType<typeof createClient> | null = null;

try {
  const connectionString = process.env.EDGE_CONFIG;
  if (!connectionString) {
    throw new Error('EDGE_CONFIG environment variable is not set');
  }
  edgeConfigClient = createClient(connectionString);
  console.log('Client Edge Config créé avec succès');
} catch (error) {
  console.log('Client Edge Config non disponible (normal en local):', error.message);
  edgeConfigClient = null;
}

export interface EdgeConfigData {
  users: Record<string, any>;
  quests: Record<string, any>;
  commonQuests: string[];
  adminPassword: string;
  lastUpdated: string;
  version: string;
}

export class EdgeConfigManager {
  /**
   * Get all users from Edge Config (multiple methods)
   */
  static async getUsers(): Promise<Record<string, any>> {
    // Méthode 1: Essayer avec le client direct
    if (edgeConfigClient) {
      try {
        const users = await edgeConfigClient.get('users');
        console.log('✅ Données utilisateurs chargées via client direct');
        return clone(users) || {};
      } catch (error) {
        console.log('Client direct échoué, essai méthode par défaut:', error.message);
      }
    }

    // Méthode 2: Essayer avec les fonctions globales
    try {
      const users = await get('users');
      console.log('✅ Données utilisateurs chargées via méthode par défaut');
      return clone(users) || {};
    } catch (error) {
      if (error.message.includes('No connection string provided')) {
        console.log('⚠️ EDGE_CONFIG non configuré sur Vercel. Instructions dans FIX_EDGE_CONFIG.md');
      } else {
        console.log('Edge Config non disponible (fallback vers JSON):', error.message);
      }
      return {};
    }
  }

  /**
   * Get all quests from Edge Config (multiple methods)
   */
  static async getQuests(): Promise<Record<string, any>> {
    // Méthode 1: Essayer avec le client direct
    if (edgeConfigClient) {
      try {
        const quests = await edgeConfigClient.get('quests');
        console.log('✅ Données quêtes chargées via client direct');
        return clone(quests) || {};
      } catch (error) {
        console.log('Client direct échoué pour les quêtes, essai méthode par défaut:', error.message);
      }
    }

    // Méthode 2: Essayer avec les fonctions globales
    try {
      const quests = await get('quests');
      console.log('✅ Données quêtes chargées via méthode par défaut');
      return clone(quests) || {};
    } catch (error) {
      console.log('Edge Config non disponible pour les quêtes (fallback vers JSON):', error.message);
      return {};
    }
  }

  /**
   * Get common quests from Edge Config
   */
  static async getCommonQuests(): Promise<string[]> {
    try {
      const commonQuests = await get('commonQuests');
      return clone(commonQuests) || [];
    } catch (error) {
      console.log('Edge Config non disponible pour les quêtes communes:', error.message);
      return [];
    }
  }

  /**
   * Get admin password from Edge Config
   */
  static async getAdminPassword(): Promise<string> {
    try {
      const password = await get('adminPassword');
      return password || 'admin123';
    } catch (error) {
      console.log('Edge Config non disponible pour le mot de passe admin:', error.message);
      return 'admin123';
    }
  }

  /**
   * Update users in Edge Config
   */
  static async updateUsers(users: Record<string, any>): Promise<boolean> {
    try {
      // Note: Edge Config doesn't support direct updates from client-side
      // This would need to be done through Vercel API or webhooks
      // For now, we'll use the JSON fallback system
      return false;
    } catch (error) {
      console.error('Error updating users in Edge Config:', error);
      return false;
    }
  }

  /**
   * Update quests in Edge Config
   */
  static async updateQuests(quests: Record<string, any>): Promise<boolean> {
    try {
      // Note: Edge Config doesn't support direct updates from client-side
      // This would need to be done through Vercel API or webhooks
      // For now, we'll use the JSON fallback system
      return false;
    } catch (error) {
      console.error('Error updating quests in Edge Config:', error);
      return false;
    }
  }

  /**
   * Get full configuration from Edge Config (optimisé avec getAll)
   */
  static async getFullConfig(): Promise<EdgeConfigData> {
    try {
      // Utiliser getAll pour une lecture optimisée
      const config = await getAll(['users', 'quests', 'commonQuests', 'adminPassword']);

      return {
        users: clone(config.users) || {},
        quests: clone(config.quests) || {},
        commonQuests: clone(config.commonQuests) || [],
        adminPassword: config.adminPassword || 'admin123',
        lastUpdated: new Date().toISOString(),
        version: '1.0'
      };
    } catch (error) {
      console.log('Edge Config non disponible pour la configuration complète:', error.message);
      return {
        users: {},
        quests: {},
        commonQuests: [],
        adminPassword: 'admin123',
        lastUpdated: new Date().toISOString(),
        version: '1.0'
      };
    }
  }

  /**
   * Check if Edge Config is available
   */
  static async isAvailable(): Promise<boolean> {
    try {
      // Vérifier si une clé existe
      const hasKey = await has('users');
      return hasKey;
    } catch (error) {
      console.log('Edge Config non disponible:', error.message);
      return false;
    }
  }
}