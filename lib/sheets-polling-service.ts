import 'server-only';
import { googleSheetsService } from './googleSheetsService';
import { Drink } from '@/app/types/drinks';

interface PollingConfig {
  intervalMs: number;
  enabled: boolean;
  spreadsheetId: string | null;
  maxRetries: number;
  retryDelayMs: number;
}

export class SheetsPollingService {
  private static instance: SheetsPollingService;
  private intervalId: NodeJS.Timeout | null = null;
  private isPolling = false;
  private config: PollingConfig;
  private consecutiveErrors = 0;
  private readonly maxConsecutiveErrors = 5;

  private constructor() {
    this.config = {
      intervalMs: 60000, // 60 seconds
      enabled: process.env.NODE_ENV === 'production' || process.env.ENABLE_SHEETS_POLLING === 'true',
      spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID || null,
      maxRetries: 3,
      retryDelayMs: 5000
    };
  }

  public static getInstance(): SheetsPollingService {
    if (!SheetsPollingService.instance) {
      SheetsPollingService.instance = new SheetsPollingService();
    }
    return SheetsPollingService.instance;
  }

  /**
   * Start the polling service
   */
  public start(): void {
    if (!this.config.enabled) {
      console.log('📊 Sheets polling service disabled');
      return;
    }

    if (!this.config.spreadsheetId) {
      console.warn('⚠️ No Google Sheets spreadsheet ID configured, polling disabled');
      return;
    }

    if (this.intervalId) {
      console.log('📊 Sheets polling service already running');
      return;
    }

    console.log(`📊 Starting sheets polling service (interval: ${this.config.intervalMs}ms)`);
    
    // Do initial sync immediately
    this.performSync().catch(error => {
      console.error('Initial sync failed:', error);
    });

    // Set up recurring polling
    this.intervalId = setInterval(() => {
      if (!this.isPolling) {
        this.performSync().catch(error => {
          console.error('Scheduled sync failed:', error);
        });
      }
    }, this.config.intervalMs);
  }

  /**
   * Stop the polling service
   */
  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('📊 Sheets polling service stopped');
    }
  }

  /**
   * Perform a manual sync (can be called from API endpoints)
   */
  public async performManualSync(): Promise<{ success: boolean; message: string; data?: any }> {
    if (this.isPolling) {
      return { success: false, message: 'Sync already in progress' };
    }

    try {
      const result = await this.performSync();
      return { success: true, message: 'Sync completed successfully', data: result };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, message: `Sync failed: ${message}` };
    }
  }

  /**
   * Get polling service status
   */
  public getStatus(): {
    isRunning: boolean;
    isPolling: boolean;
    config: PollingConfig;
    consecutiveErrors: number;
  } {
    return {
      isRunning: this.intervalId !== null,
      isPolling: this.isPolling,
      config: this.config,
      consecutiveErrors: this.consecutiveErrors
    };
  }

  /**
   * Main sync logic with change detection
   */
  private async performSync(): Promise<any> {
    if (this.isPolling) {
      console.log('📊 Sync already in progress, skipping...');
      return null;
    }

    this.isPolling = true;
    const startTime = Date.now();

    try {
      console.log('📊 Starting Google Sheets sync...');

      // Update sync status in database
      // TODO: Re-add cache layer
      // await databaseCache.updateSheetsMetadata({
      //   spreadsheet_id: this.config.spreadsheetId!,
      //   sync_status: 'syncing',
      //   last_sync: new Date().toISOString()
      // });

      // Check if we need to sync (simple change detection)
      const shouldSync = await this.shouldPerformSync();
      
      if (!shouldSync) {
        console.log('📊 No changes detected, skipping sync');
        this.consecutiveErrors = 0; // Reset error count on successful check
        return { skipped: true, reason: 'No changes detected' };
      }

      // Fetch data from Google Sheets with retry logic
      const drinks = await this.fetchWithRetry();

      if (!drinks || drinks.length === 0) {
        throw new Error('No drinks data received from Google Sheets');
      }

      // Update database cache
      // TODO: Re-add cache layer
      // const cacheUpdateSuccess = await databaseCache.updateAllDrinks(drinks);
      // 
      // if (!cacheUpdateSuccess) {
      //   throw new Error('Failed to update database cache');
      // }

      // Update metadata with success status
      const categoryStats = this.calculateCategoryStats(drinks);
      // TODO: Re-add cache layer
      // await databaseCache.updateSheetsMetadata({
      //   spreadsheet_id: this.config.spreadsheetId!,
      //   sync_status: 'success',
      //   last_sync: new Date().toISOString(),
      //   total_drinks: drinks.length,
      //   drinks_by_category: categoryStats,
      //   error_message: undefined
      // });

      const duration = Date.now() - startTime;
      console.log(`✅ Sync completed successfully in ${duration}ms: ${drinks.length} drinks cached`);
      
      this.consecutiveErrors = 0; // Reset error count on success
      
      return {
        success: true,
        totalDrinks: drinks.length,
        categoryStats,
        duration
      };

    } catch (error) {
      this.consecutiveErrors++;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      console.error(`❌ Sync failed (attempt ${this.consecutiveErrors}):`, errorMessage);

      // Update metadata with error status
      // TODO: Re-add cache layer
      // await databaseCache.updateSheetsMetadata({
      //   spreadsheet_id: this.config.spreadsheetId!,
      //   sync_status: 'error',
      //   last_sync: new Date().toISOString(),
      //   error_message: errorMessage
      // }).catch(metaError => {
      //   console.error('Failed to update error metadata:', metaError);
      // });

      // If too many consecutive errors, temporarily disable polling
      if (this.consecutiveErrors >= this.maxConsecutiveErrors) {
        console.error(`❌ Too many consecutive errors (${this.consecutiveErrors}), stopping polling service`);
        this.stop();
      }

      throw error;
    } finally {
      this.isPolling = false;
    }
  }

  /**
   * Simple change detection logic
   * In a more sophisticated setup, you could use Google Sheets API revision history
   * For now, we'll sync if cache is older than our interval or if cache is empty
   */
  private async shouldPerformSync(): Promise<boolean> {
    try {
      // Always sync if cache is empty or unhealthy
      // TODO: Re-add cache layer
      // const isCacheHealthy = await databaseCache.isCacheHealthy(this.config.intervalMs / 1000 / 60);
      // 
      // if (!isCacheHealthy) {
      //   console.log('📊 Cache is empty or stale, sync needed');
      //   return true;
      // }

      // Get last sync metadata
      // TODO: Re-add cache layer
      // const metadata = await databaseCache.getSheetsMetadata(this.config.spreadsheetId!);
      // 
      // if (!metadata) {
      //   console.log('📊 No sync metadata found, sync needed');
      //   return true;
      // }

      // For now, we'll sync based on time interval
      // You could enhance this to check Google Sheets revision history
      // TODO: Re-add cache layer
      // const lastSync = new Date(metadata.last_sync);
      // const now = new Date();
      // const timeSinceLastSync = now.getTime() - lastSync.getTime();
      // 
      // if (timeSinceLastSync >= this.config.intervalMs) {
      //   console.log('📊 Sync interval reached, sync needed');
      //   return true;
      // }

      return true; // Always sync for now until cache layer is re-added
    } catch (error) {
      console.error('Error checking if sync needed:', error);
      return true; // Default to syncing on error
    }
  }

  /**
   * Fetch data from Google Sheets with retry logic
   */
  private async fetchWithRetry(): Promise<Drink[]> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        console.log(`📊 Fetching from Google Sheets (attempt ${attempt}/${this.config.maxRetries})`);
        const drinks = await googleSheetsService.fetchAllDrinks();
        
        if (drinks && drinks.length > 0) {
          return drinks;
        } else {
          throw new Error('No drinks data returned from Google Sheets');
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.warn(`⚠️ Fetch attempt ${attempt} failed:`, lastError.message);
        
        if (attempt < this.config.maxRetries) {
          console.log(`⏳ Retrying in ${this.config.retryDelayMs}ms...`);
          await this.delay(this.config.retryDelayMs);
        }
      }
    }

    throw lastError || new Error('All retry attempts failed');
  }

  /**
   * Calculate category statistics
   */
  private calculateCategoryStats(drinks: Drink[]): Record<string, number> {
    const stats: Record<string, number> = {};
    
    drinks.forEach(drink => {
      stats[drink.category] = (stats[drink.category] || 0) + 1;
    });

    return stats;
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Update polling configuration
   */
  public updateConfig(newConfig: Partial<PollingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart polling if interval changed and service is running
    if (newConfig.intervalMs && this.intervalId) {
      this.stop();
      this.start();
    }
  }
}

// Export singleton instance
export const sheetsPollingService = SheetsPollingService.getInstance();