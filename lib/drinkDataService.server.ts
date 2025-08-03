import 'server-only';
import { Drink } from '@/app/types/drinks';
import { drinkCache, CACHE_KEYS } from './cache';
import { googleSheetsService } from './googleSheetsService';

interface DrinksResponse {
  drinks: Drink[];
  source: 'cache' | 'sheets';
}

class DrinkDataService {
  /**
   * Get all drinks with caching (server-side only)
   */
  async getAllDrinks(): Promise<DrinksResponse> {
    // Check cache first
    const cachedDrinks = drinkCache.get<Drink[]>(CACHE_KEYS.ALL_DRINKS);
    if (cachedDrinks) {
      return { drinks: cachedDrinks, source: 'cache' };
    }
    
    // Try to fetch from Google Sheets
    try {
      const sheetsData = await this.fetchFromGoogleSheets();
      if (sheetsData && sheetsData.length > 0) {
        // Cache the data
        drinkCache.set(CACHE_KEYS.ALL_DRINKS, sheetsData, 300); // 5 minutes TTL
        
        // Also cache by category
        this.cacheByCategory(sheetsData);
        
        console.log(`✅ Loaded ${sheetsData.length} drinks from Google Sheets`);
        return { drinks: sheetsData, source: 'sheets' };
      }
    } catch (error) {
      console.error('Failed to fetch from Google Sheets, using webhook cache:', error);
    }
    
    // If Google Sheets fails, return empty array (webhook will populate cache)
    console.log('⚠️ Google Sheets unavailable, waiting for webhook data...');
    return { drinks: [], source: 'sheets' };
  }
  
  /**
   * Get drinks by category
   */
  async getDrinksByCategory(category: string): Promise<Drink[]> {
    // Check category cache
    const cacheKey = CACHE_KEYS.DRINKS_BY_CATEGORY(category);
    const cachedDrinks = drinkCache.get<Drink[]>(cacheKey);
    if (cachedDrinks) {
      return cachedDrinks;
    }
    
    // Get all drinks and filter
    const { drinks } = await this.getAllDrinks();
    const categoryDrinks = drinks.filter(drink => drink.category === category);
    
    // Cache the filtered results
    drinkCache.set(cacheKey, categoryDrinks, 300);
    
    return categoryDrinks;
  }
  
  /**
   * Get a single drink by ID
   */
  async getDrinkById(id: string): Promise<Drink | undefined> {
    // Check specific drink cache
    const cacheKey = CACHE_KEYS.DRINK_BY_ID(id);
    const cachedDrink = drinkCache.get<Drink>(cacheKey);
    if (cachedDrink) {
      return cachedDrink;
    }
    
    // Get all drinks and find
    const { drinks } = await this.getAllDrinks();
    const drink = drinks.find(d => d.id === id);
    
    if (drink) {
      // Cache the individual drink
      drinkCache.set(cacheKey, drink, 300);
    }
    
    return drink;
  }
  
  /**
   * Update cache with new data (called by webhook)
   */
  updateCache(drinks: Drink[]): void {
    // Clear all caches
    drinkCache.clear();
    
    // Set new data
    drinkCache.set(CACHE_KEYS.ALL_DRINKS, drinks, 300);
    this.cacheByCategory(drinks);
    
    // Cache individual drinks
    drinks.forEach(drink => {
      drinkCache.set(CACHE_KEYS.DRINK_BY_ID(drink.id), drink, 300);
    });
  }
  
  /**
   * Fetch drinks from Google Sheets API
   */
  private async fetchFromGoogleSheets(): Promise<Drink[] | null> {
    return await googleSheetsService.fetchAllDrinks();
  }
  
  /**
   * Cache drinks by category
   */
  private cacheByCategory(drinks: Drink[]): void {
    const categories = ['beer', 'wine', 'cocktail', 'spirit', 'non-alcoholic'];
    
    categories.forEach(category => {
      const categoryDrinks = drinks.filter(drink => drink.category === category);
      if (categoryDrinks.length > 0) {
        drinkCache.set(CACHE_KEYS.DRINKS_BY_CATEGORY(category), categoryDrinks, 300);
      }
    });
  }
}

// Export singleton instance
export const drinkDataService = new DrinkDataService();