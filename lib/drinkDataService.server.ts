import 'server-only';
import { Drink } from '@/app/types/drinks';
import { databaseCache } from './database-cache';
import { googleSheetsService } from './googleSheetsService';
import { sheetsPollingService } from './sheets-polling-service';

interface DrinksResponse {
  drinks: Drink[];
  source: 'cache' | 'sheets' | 'fallback';
}

class DrinkDataService {
  private initializationAttempted = false;

  /**
   * Initialize polling service if not already done
   */
  private ensureInitialized() {
    if (!this.initializationAttempted && 
        (process.env.NODE_ENV === 'production' || process.env.AUTO_INIT_SERVICES === 'true')) {
      this.initializationAttempted = true;
      try {
        console.log('📊 Auto-initializing polling service...');
        sheetsPollingService.start();
      } catch (error) {
        console.error('Failed to initialize polling service:', error);
      }
    }
  }

  /**
   * Get all drinks with database caching (server-side only)
   */
  async getAllDrinks(): Promise<DrinksResponse> {
    this.ensureInitialized();
    try {
      // Check database cache first
      const cachedDrinks = await databaseCache.getAllDrinks();
      if (cachedDrinks && cachedDrinks.length > 0) {
        console.log(`✅ Loaded ${cachedDrinks.length} drinks from database cache`);
        return { drinks: cachedDrinks, source: 'cache' };
      }

      console.log('📊 No cached drinks found, attempting direct fetch from Google Sheets');
      
      // If cache is empty, try to fetch directly from Google Sheets as fallback
      const sheetsData = await this.fetchFromGoogleSheets();
      if (sheetsData && sheetsData.length > 0) {
        console.log(`✅ Loaded ${sheetsData.length} drinks from Google Sheets (fallback)`);
        
        // Update cache with fetched data (don't wait for this)
        databaseCache.updateAllDrinks(sheetsData).catch(error => {
          console.error('Failed to update cache after fallback fetch:', error);
        });
        
        return { drinks: sheetsData, source: 'sheets' };
      }

      console.warn('⚠️ No drinks available from cache or Google Sheets');
      return { drinks: [], source: 'fallback' };
      
    } catch (error) {
      console.error('Error in getAllDrinks:', error);
      return { drinks: [], source: 'fallback' };
    }
  }
  
  /**
   * Get drinks by category
   */
  async getDrinksByCategory(category: string): Promise<Drink[]> {
    try {
      // Check database cache for category
      const cachedDrinks = await databaseCache.getDrinksByCategory(category);
      if (cachedDrinks && cachedDrinks.length > 0) {
        return cachedDrinks;
      }
      
      // If no cached category data, get all drinks and filter
      const { drinks } = await this.getAllDrinks();
      const categoryDrinks = drinks.filter(drink => drink.category === category);
      
      return categoryDrinks;
    } catch (error) {
      console.error(`Error getting drinks by category ${category}:`, error);
      return [];
    }
  }
  
  /**
   * Get a single drink by ID
   */
  async getDrinkById(id: string): Promise<Drink | undefined> {
    try {
      // Check database cache for specific drink
      const cachedDrink = await databaseCache.getDrinkById(id);
      if (cachedDrink) {
        return cachedDrink;
      }
      
      // If not found in cache, get all drinks and find
      const { drinks } = await this.getAllDrinks();
      const drink = drinks.find(d => d.id === id);
      
      return drink;
    } catch (error) {
      console.error(`Error getting drink by ID ${id}:`, error);
      return undefined;
    }
  }
  
  /**
   * Update database cache with new data (replaces old updateCache method)
   */
  async updateCache(drinks: Drink[]): Promise<boolean> {
    try {
      const success = await databaseCache.updateAllDrinks(drinks);
      if (success) {
        console.log(`✅ Updated database cache with ${drinks.length} drinks`);
      } else {
        console.error('❌ Failed to update database cache');
      }
      return success;
    } catch (error) {
      console.error('Error updating cache:', error);
      return false;
    }
  }

  /**
   * Manual sync trigger (for admin operations)
   */
  async performManualSync(): Promise<{ success: boolean; message: string; data?: any }> {
    return await sheetsPollingService.performManualSync();
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    try {
      return await databaseCache.getCacheStats();
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return { totalDrinks: 0, drinksByCategory: {}, lastUpdated: null };
    }
  }

  /**
   * Clear cache (for admin operations)
   */
  async clearCache(): Promise<boolean> {
    try {
      return await databaseCache.clearCache();
    } catch (error) {
      console.error('Error clearing cache:', error);
      return false;
    }
  }
  
  /**
   * Fetch drinks from Google Sheets API (fallback method)
   */
  private async fetchFromGoogleSheets(): Promise<Drink[] | null> {
    try {
      return await googleSheetsService.fetchAllDrinks();
    } catch (error) {
      console.error('Error fetching from Google Sheets:', error);
      return null;
    }
  }

  /**
   * Initialize polling service (should be called on app startup)
   */
  initializePolling(): void {
    sheetsPollingService.start();
  }

  /**
   * Stop polling service (for graceful shutdown)
   */
  stopPolling(): void {
    sheetsPollingService.stop();
  }

  /**
   * Get polling service status
   */
  getPollingStatus() {
    return sheetsPollingService.getStatus();
  }
}

// Export singleton instance
export const drinkDataService = new DrinkDataService();