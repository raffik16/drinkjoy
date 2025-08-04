import { Drink } from '@/app/types/drinks';
import { clientCache, CACHE_KEYS } from './client-cache';

interface DrinksResponse {
  drinks: Drink[];
  source: 'cache' | 'api';
}

class DrinkDataService {
  constructor() {
    // Client-side service uses fallback data only
  }
  
  /**
   * Get all drinks with caching
   */
  async getAllDrinks(): Promise<DrinksResponse> {
    // Check cache first
    const cachedDrinks = clientCache.get<Drink[]>(CACHE_KEYS.ALL_DRINKS);
    if (cachedDrinks) {
      return { drinks: cachedDrinks, source: 'cache' };
    }
    
    // Client-side: Fetch from API endpoint
    try {
      const response = await fetch('/api/drinks');
      if (!response.ok) {
        throw new Error('Failed to fetch drinks from API');
      }
      
      const data = await response.json();
      const drinks = data.drinks || [];
      
      // Cache the data
      clientCache.set(CACHE_KEYS.ALL_DRINKS, drinks, 300);
      this.cacheByCategory(drinks);
      
      return { drinks, source: 'api' };
    } catch (error) {
      console.error('Failed to fetch drinks from API:', error);
      throw new Error('Unable to load drinks data. Please check your connection.');
    }
  }
  
  /**
   * Get drinks by category
   */
  async getDrinksByCategory(category: string): Promise<Drink[]> {
    // Check category cache
    const cacheKey = CACHE_KEYS.DRINKS_BY_CATEGORY(category);
    const cachedDrinks = clientCache.get<Drink[]>(cacheKey);
    if (cachedDrinks) {
      return cachedDrinks;
    }
    
    // Get all drinks and filter
    const { drinks } = await this.getAllDrinks();
    const categoryDrinks = drinks.filter(drink => drink.category === category);
    
    // Cache the filtered results
    clientCache.set(cacheKey, categoryDrinks, 300);
    
    return categoryDrinks;
  }
  
  /**
   * Get a single drink by ID
   */
  async getDrinkById(id: string): Promise<Drink | undefined> {
    // Check specific drink cache
    const cacheKey = CACHE_KEYS.DRINK_BY_ID(id);
    const cachedDrink = clientCache.get<Drink>(cacheKey);
    if (cachedDrink) {
      return cachedDrink;
    }
    
    // Get all drinks and find
    const { drinks } = await this.getAllDrinks();
    const drink = drinks.find(d => d.id === id);
    
    if (drink) {
      // Cache the individual drink
      clientCache.set(cacheKey, drink, 300);
    }
    
    return drink;
  }
  
  /**
   * Update cache with new data (client-side)
   */
  updateCache(drinks: Drink[]): void {
    // Clear all caches
    clientCache.clear();
    
    // Set new data
    clientCache.set(CACHE_KEYS.ALL_DRINKS, drinks, 300);
    this.cacheByCategory(drinks);
    
    // Cache individual drinks
    drinks.forEach(drink => {
      clientCache.set(CACHE_KEYS.DRINK_BY_ID(drink.id), drink, 300);
    });
  }
  
  
  /**
   * Cache drinks by category
   */
  private cacheByCategory(drinks: Drink[]): void {
    const categories = ['beer', 'wine', 'cocktail', 'spirit', 'non-alcoholic'];
    
    categories.forEach(category => {
      const categoryDrinks = drinks.filter(drink => drink.category === category);
      if (categoryDrinks.length > 0) {
        clientCache.set(CACHE_KEYS.DRINKS_BY_CATEGORY(category), categoryDrinks, 300);
      }
    });
  }
}

// Export singleton instance
export const drinkDataService = new DrinkDataService();