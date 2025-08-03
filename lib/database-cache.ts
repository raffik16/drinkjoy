import 'server-only';
import { supabase } from './supabase';
import { Drink } from '@/app/types/drinks';

export interface DrinkCacheEntry {
  id: string;
  category: string;
  data: Drink;
  created_at: string;
  updated_at: string;
}

export interface SheetsMetadata {
  id: string;
  spreadsheet_id: string;
  last_modified: string;
  last_sync: string;
  sync_status: 'syncing' | 'success' | 'error';
  error_message?: string;
  total_drinks: number;
  drinks_by_category: Record<string, number>;
}

export class DatabaseCache {
  private static instance: DatabaseCache;
  
  public static getInstance(): DatabaseCache {
    if (!DatabaseCache.instance) {
      DatabaseCache.instance = new DatabaseCache();
    }
    return DatabaseCache.instance;
  }

  /**
   * Get all cached drinks
   */
  async getAllDrinks(): Promise<Drink[]> {
    try {
      const { data, error } = await supabase
        .from('drink_cache')
        .select('data')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching cached drinks:', error);
        return [];
      }

      return data?.map(entry => entry.data) || [];
    } catch (error) {
      console.error('Error fetching cached drinks:', error);
      return [];
    }
  }

  /**
   * Get drinks by category from cache
   */
  async getDrinksByCategory(category: string): Promise<Drink[]> {
    try {
      const { data, error } = await supabase
        .from('drink_cache')
        .select('data')
        .eq('category', category)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error(`Error fetching cached drinks for category ${category}:`, error);
        return [];
      }

      return data?.map(entry => entry.data) || [];
    } catch (error) {
      console.error(`Error fetching cached drinks for category ${category}:`, error);
      return [];
    }
  }

  /**
   * Get a single drink by ID from cache
   */
  async getDrinkById(id: string): Promise<Drink | null> {
    try {
      const { data, error } = await supabase
        .from('drink_cache')
        .select('data')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') { // Not found error
          console.error(`Error fetching cached drink ${id}:`, error);
        }
        return null;
      }

      return data?.data || null;
    } catch (error) {
      console.error(`Error fetching cached drink ${id}:`, error);
      return null;
    }
  }

  /**
   * Update cache with new drinks (replaces all existing data)
   */
  async updateAllDrinks(drinks: Drink[]): Promise<boolean> {
    try {
      // Start a transaction-like operation
      // First, clear existing cache
      const { error: deleteError } = await supabase
        .from('drink_cache')
        .delete()
        .neq('id', ''); // Delete all records

      if (deleteError) {
        console.error('Error clearing drink cache:', deleteError);
        return false;
      }

      // Insert new drinks
      const cacheEntries = drinks.map(drink => ({
        id: drink.id,
        category: drink.category,
        data: drink,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      // Insert in batches to avoid payload size limits
      const batchSize = 100;
      for (let i = 0; i < cacheEntries.length; i += batchSize) {
        const batch = cacheEntries.slice(i, i + batchSize);
        const { error: insertError } = await supabase
          .from('drink_cache')
          .insert(batch);

        if (insertError) {
          console.error(`Error inserting drink cache batch ${i}-${i + batchSize}:`, insertError);
          return false;
        }
      }

      console.log(`✅ Successfully cached ${drinks.length} drinks in database`);
      return true;
    } catch (error) {
      console.error('Error updating drink cache:', error);
      return false;
    }
  }

  /**
   * Update drinks for a specific category
   */
  async updateCategoryDrinks(category: string, drinks: Drink[]): Promise<boolean> {
    try {
      // Delete existing drinks for this category
      const { error: deleteError } = await supabase
        .from('drink_cache')
        .delete()
        .eq('category', category);

      if (deleteError) {
        console.error(`Error clearing cache for category ${category}:`, deleteError);
        return false;
      }

      // Insert new drinks for this category
      const cacheEntries = drinks.map(drink => ({
        id: drink.id,
        category: drink.category,
        data: drink,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      if (cacheEntries.length > 0) {
        const { error: insertError } = await supabase
          .from('drink_cache')
          .insert(cacheEntries);

        if (insertError) {
          console.error(`Error inserting cache for category ${category}:`, insertError);
          return false;
        }
      }

      console.log(`✅ Successfully cached ${drinks.length} drinks for category ${category}`);
      return true;
    } catch (error) {
      console.error(`Error updating cache for category ${category}:`, error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    totalDrinks: number;
    drinksByCategory: Record<string, number>;
    lastUpdated: string | null;
  }> {
    try {
      const { data: countData, error: countError } = await supabase
        .from('drink_cache')
        .select('category, updated_at');

      if (countError) {
        console.error('Error fetching cache stats:', countError);
        return { totalDrinks: 0, drinksByCategory: {}, lastUpdated: null };
      }

      const totalDrinks = countData?.length || 0;
      const drinksByCategory: Record<string, number> = {};
      let lastUpdated: string | null = null;

      countData?.forEach(entry => {
        drinksByCategory[entry.category] = (drinksByCategory[entry.category] || 0) + 1;
        if (!lastUpdated || entry.updated_at > lastUpdated) {
          lastUpdated = entry.updated_at;
        }
      });

      return { totalDrinks, drinksByCategory, lastUpdated };
    } catch (error) {
      console.error('Error fetching cache stats:', error);
      return { totalDrinks: 0, drinksByCategory: {}, lastUpdated: null };
    }
  }

  /**
   * Get Google Sheets sync metadata
   */
  async getSheetsMetadata(spreadsheetId: string): Promise<SheetsMetadata | null> {
    try {
      const { data, error } = await supabase
        .from('sheets_metadata')
        .select('*')
        .eq('spreadsheet_id', spreadsheetId)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') { // Not found error
          console.error('Error fetching sheets metadata:', error);
        }
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching sheets metadata:', error);
      return null;
    }
  }

  /**
   * Update Google Sheets sync metadata
   */
  async updateSheetsMetadata(metadata: Partial<SheetsMetadata> & { spreadsheet_id: string }): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('sheets_metadata')
        .upsert({
          ...metadata,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'spreadsheet_id'
        });

      if (error) {
        console.error('Error updating sheets metadata:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating sheets metadata:', error);
      return false;
    }
  }

  /**
   * Clear all cache data
   */
  async clearCache(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('drink_cache')
        .delete()
        .neq('id', ''); // Delete all records

      if (error) {
        console.error('Error clearing cache:', error);
        return false;
      }

      console.log('✅ Cache cleared successfully');
      return true;
    } catch (error) {
      console.error('Error clearing cache:', error);
      return false;
    }
  }

  /**
   * Check if cache is healthy (has recent data)
   */
  async isCacheHealthy(maxAgeMinutes: number = 30): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('drink_cache')
        .select('updated_at')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        return false;
      }

      const lastUpdate = new Date(data.updated_at);
      const now = new Date();
      const diffMinutes = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);

      return diffMinutes <= maxAgeMinutes;
    } catch (error) {
      return false;
    }
  }
}

export const databaseCache = DatabaseCache.getInstance();