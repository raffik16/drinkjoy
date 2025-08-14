import 'server-only';
import { Drink, DrinkCategory, FlavorProfile, DrinkStrength, Occasion } from '@/app/types/drinks';

interface BarMenuCache {
  drinks: Drink[];
  timestamp: number;
  spreadsheetId: string;
}

interface BarMenuResponse {
  drinks: Drink[];
  source: 'cache' | 'sheets';
  totalDrinks: number;
}

class BarMenuService {
  private cache: Map<string, BarMenuCache> = new Map();
  private readonly cacheTtl = 5 * 60 * 1000; // 5 minutes
  private readonly maxCacheSize = 50; // Maximum number of bar menus to cache

  /**
   * Get menu for a specific bar from its Google Sheets
   */
  async getBarMenu(barId: string, spreadsheetId: string): Promise<BarMenuResponse> {
    try {
      console.log(`🍹 [BarMenuService] Getting menu for bar ${barId} from spreadsheet ${spreadsheetId}`);

      // Check cache first
      const cached = this.getCachedMenu(barId, spreadsheetId);
      if (cached) {
        console.log(`✅ [BarMenuService] Loaded ${cached.drinks.length} drinks from cache for ${barId}`);
        return {
          drinks: cached.drinks,
          source: 'cache',
          totalDrinks: cached.drinks.length
        };
      }

      // Fetch from Google Sheets
      console.log(`📊 [BarMenuService] Fetching fresh data from spreadsheet ${spreadsheetId}`);
      const drinks = await this.fetchMenuFromSheets(spreadsheetId);
      
      if (drinks && drinks.length > 0) {
        // Cache the results
        this.setCachedMenu(barId, spreadsheetId, drinks);
        console.log(`✅ [BarMenuService] Loaded ${drinks.length} drinks from sheets for ${barId}`);
        
        return {
          drinks,
          source: 'sheets',
          totalDrinks: drinks.length
        };
      }

      console.warn(`⚠️ [BarMenuService] No drinks found for bar ${barId}`);
      return {
        drinks: [],
        source: 'sheets',
        totalDrinks: 0
      };

    } catch (error) {
      console.error(`❌ [BarMenuService] Error getting menu for bar ${barId}:`, error);
      
      // Try to return stale cache data if available
      const staleCache = this.cache.get(barId);
      if (staleCache) {
        console.log(`🔄 [BarMenuService] Returning stale cache for ${barId} due to error`);
        return {
          drinks: staleCache.drinks,
          source: 'cache',
          totalDrinks: staleCache.drinks.length
        };
      }
      
      return {
        drinks: [],
        source: 'sheets',
        totalDrinks: 0
      };
    }
  }

  /**
   * Clear cache for a specific bar
   */
  clearBarCache(barId: string): void {
    this.cache.delete(barId);
    console.log(`🗑️ [BarMenuService] Cleared cache for bar ${barId}`);
  }

  /**
   * Clear all cache
   */
  clearAllCache(): void {
    this.cache.clear();
    console.log(`🗑️ [BarMenuService] Cleared all bar menu cache`);
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const stats = Array.from(this.cache.entries()).map(([barId, cache]) => ({
      barId,
      drinkCount: cache.drinks.length,
      spreadsheetId: cache.spreadsheetId,
      timestamp: cache.timestamp,
      age: Date.now() - cache.timestamp,
      valid: this.isCacheValid(cache)
    }));

    return {
      totalCachedBars: this.cache.size,
      bars: stats,
      cacheTtl: this.cacheTtl,
      maxCacheSize: this.maxCacheSize
    };
  }

  /**
   * Get cached menu if valid
   */
  private getCachedMenu(barId: string, spreadsheetId: string): BarMenuCache | null {
    const cached = this.cache.get(barId);
    
    if (!cached) {
      return null;
    }

    // Check if spreadsheet ID matches (bar could have changed sheets)
    if (cached.spreadsheetId !== spreadsheetId) {
      console.log(`🔄 [BarMenuService] Spreadsheet ID changed for ${barId}, invalidating cache`);
      this.cache.delete(barId);
      return null;
    }

    // Check if cache is still valid
    if (!this.isCacheValid(cached)) {
      console.log(`⏰ [BarMenuService] Cache expired for ${barId}`);
      this.cache.delete(barId);
      return null;
    }

    return cached;
  }

  /**
   * Cache menu data for a bar
   */
  private setCachedMenu(barId: string, spreadsheetId: string, drinks: Drink[]): void {
    // Implement simple LRU cache by removing oldest entry if at capacity
    if (this.cache.size >= this.maxCacheSize) {
      const oldestEntry = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0];
      
      if (oldestEntry) {
        this.cache.delete(oldestEntry[0]);
        console.log(`♻️ [BarMenuService] Evicted oldest cache entry for ${oldestEntry[0]}`);
      }
    }

    this.cache.set(barId, {
      drinks,
      timestamp: Date.now(),
      spreadsheetId
    });
  }

  /**
   * Check if cache entry is valid
   */
  private isCacheValid(cache: BarMenuCache): boolean {
    return (Date.now() - cache.timestamp) < this.cacheTtl;
  }

  /**
   * Fetch menu from Google Sheets API
   */
  private async fetchMenuFromSheets(spreadsheetId: string): Promise<Drink[] | null> {
    try {
      const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
      
      if (!apiKey) {
        console.error('[BarMenuService] Missing GOOGLE_SHEETS_API_KEY');
        return null;
      }

      // Standard sheet names for drink categories
      const sheetNames = ['Beer', 'Wine', 'Cocktail', 'Spirit', 'Non_Alcoholic'];
      const allDrinks: Drink[] = [];

      console.log(`📋 [BarMenuService] Fetching from sheets: ${sheetNames.join(', ')}`);

      for (const sheetName of sheetNames) {
        try {
          const range = `${sheetName}!A:Z`; // Get all columns
          const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`;
          
          console.log(`🔗 [BarMenuService] Fetching ${sheetName}: ${url}`);
          
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
            next: { revalidate: 0 } // Don't cache at Next.js level
          });

          if (!response.ok) {
            console.warn(`⚠️ [BarMenuService] Failed to fetch ${sheetName}: ${response.status} ${response.statusText}`);
            continue; // Skip this sheet and continue with others
          }

          const data = await response.json();
          
          if (!data.values || data.values.length === 0) {
            console.log(`📝 [BarMenuService] No data in ${sheetName} sheet`);
            continue;
          }

          const headers = data.values[0];
          const rows = data.values.slice(1);
          
          console.log(`📊 [BarMenuService] Processing ${rows.length} rows from ${sheetName}`);

          const categoryDrinks = rows
            .map((row: string[]) => this.mapSheetRowToDrink(headers, row, sheetName))
            .filter((drink: Drink | null): drink is Drink => drink !== null);

          allDrinks.push(...categoryDrinks);
          console.log(`✅ [BarMenuService] Added ${categoryDrinks.length} drinks from ${sheetName}`);

        } catch (sheetError) {
          console.warn(`⚠️ [BarMenuService] Error fetching ${sheetName}:`, sheetError);
          // Continue with other sheets
        }
      }

      console.log(`🎯 [BarMenuService] Total drinks fetched: ${allDrinks.length}`);
      return allDrinks;

    } catch (error) {
      console.error('[BarMenuService] Error fetching from Google Sheets:', error);
      return null;
    }
  }

  /**
   * Map Google Sheets row to Drink object
   */
  private mapSheetRowToDrink(headers: string[], row: string[], category: string): Drink | null {
    try {
      const rowData: Record<string, string> = {};
      headers.forEach((header, index) => {
        rowData[header] = row[index] || '';
      });

      // Required fields check
      if (!rowData['id'] || !rowData['name']) {
        console.warn('[BarMenuService] Missing required fields:', { id: rowData['id'], name: rowData['name'] });
        return null;
      }

      console.log(`[BarMenuService] Mapping drink: ${rowData['id']} - ${rowData['name']}`);

      const drink: Drink = {
        id: rowData['id'].trim(),
        name: rowData['name'].trim(),
        category: this.mapSheetNameToCategory(category),
        description: rowData['description'] || '',
        ingredients: this.parseIngredients(rowData['ingredients']),
        price: rowData['price'] || '$0',
        abv: parseFloat(rowData['abv']) || 0,
        flavor_profile: this.parseFlavorProfile(rowData['flavor_profile']),
        strength: this.parseStrength(rowData['strength']),
        weather_match: this.parseWeatherMatch(rowData['weather_match']),
        occasions: this.parseOccasions(rowData['occasions']),
        serving_suggestions: this.parseArray(rowData['serving_suggestions']),
        image_url: rowData['image_url'] || '',
        glass_type: rowData['glass_type'] || '',
        preparation: rowData['preparation'] || '',
        happy_hour: rowData['happy_hour']?.toLowerCase() === 'true',
        happy_hour_price: rowData['happy_hour_price'] || undefined,
        happy_hour_times: rowData['happy_hour_times'] || undefined,
        featured: rowData['featured']?.toLowerCase() === 'true',
        funForTwentyOne: rowData['funForTwentyOne']?.toLowerCase() === 'true',
        goodForBDay: rowData['goodForBDay']?.toLowerCase() === 'true'
      };

      return drink;
    } catch (error) {
      console.error('[BarMenuService] Error mapping sheet row to drink:', error);
      console.error('[BarMenuService] Row data:', row);
      console.error('[BarMenuService] Headers:', headers);
      return null;
    }
  }

  /**
   * Parse ingredients array from string
   */
  private parseIngredients(ingredientsStr: string): string[] {
    if (!ingredientsStr) return [];
    try {
      // Try JSON parse first
      return JSON.parse(ingredientsStr);
    } catch {
      // Fallback to comma-separated
      return ingredientsStr.split(',').map(i => i.trim()).filter(Boolean);
    }
  }

  /**
   * Parse array from string (comma-separated or JSON)
   */
  private parseArray(arrayStr: string): string[] {
    if (!arrayStr) return [];
    try {
      return JSON.parse(arrayStr);
    } catch {
      return arrayStr.split(',').map(i => i.trim()).filter(Boolean);
    }
  }

  /**
   * Parse weather match object from string
   */
  private parseWeatherMatch(weatherStr: string): any {
    if (!weatherStr) return {};
    try {
      return JSON.parse(weatherStr);
    } catch {
      return {};
    }
  }

  /**
   * Map sheet name to valid DrinkCategory
   */
  private mapSheetNameToCategory(sheetName: string): DrinkCategory {
    const mapping: Record<string, DrinkCategory> = {
      'Beer': 'beer',
      'Wine': 'wine', 
      'Cocktail': 'cocktail',
      'Spirit': 'spirit',
      'Non_Alcoholic': 'non-alcoholic'
    };

    return mapping[sheetName] || 'beer'; // Default fallback
  }

  /**
   * Parse flavor profile with type validation
   */
  private parseFlavorProfile(flavorStr: string): FlavorProfile[] {
    try {
      const parsed = this.parseArray(flavorStr);
      const validFlavors: FlavorProfile[] = ['sweet', 'bitter', 'sour', 'smooth'];
      return parsed.filter((flavor): flavor is FlavorProfile => 
        validFlavors.includes(flavor as FlavorProfile)
      );
    } catch (error) {
      console.warn('[BarMenuService] Error parsing flavor profile:', flavorStr, error);
      return [];
    }
  }

  /**
   * Parse strength with validation
   */
  private parseStrength(strengthStr: string): DrinkStrength {
    const validStrengths: DrinkStrength[] = ['light', 'medium', 'strong', 'non-alcoholic'];
    return validStrengths.includes(strengthStr as DrinkStrength) 
      ? (strengthStr as DrinkStrength) 
      : 'light';
  }

  /**
   * Parse occasions with type validation
   */
  private parseOccasions(occasionsStr: string): Occasion[] {
    const parsed = this.parseArray(occasionsStr);
    const validOccasions: Occasion[] = ['casual', 'romantic', 'business', 'celebration', 'sports', 'exploring', 'newly21', 'birthday'];
    return parsed.filter((occasion): occasion is Occasion => 
      validOccasions.includes(occasion as Occasion)
    );
  }
}

// Export singleton instance
export const barMenuService = new BarMenuService();