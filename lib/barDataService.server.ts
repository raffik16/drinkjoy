import 'server-only';
import { Bar } from '@/app/types/bars';

interface BarsResponse {
  bars: Bar[];
  source: 'cache' | 'sheets' | 'fallback';
}

class BarDataService {
  private cache: Bar[] | null = null;
  private cacheTimestamp: number = 0;
  private readonly cacheTtl = 5 * 60 * 1000; // 5 minutes

  /**
   * Get all active bars from Google Sheets
   */
  async getAllBars(): Promise<BarsResponse> {
    try {
      // Check cache first
      if (this.cache && this.isCacheValid()) {
        console.log(`✅ Loaded ${this.cache.length} bars from cache`);
        return { bars: this.cache, source: 'cache' };
      }

      console.log('📊 Fetching bars from Google Sheets...');
      const bars = await this.fetchBarsFromSheets();
      
      if (bars && bars.length > 0) {
        // Update cache
        this.cache = bars;
        this.cacheTimestamp = Date.now();
        console.log(`✅ Loaded ${bars.length} bars from Google Sheets`);
        return { bars, source: 'sheets' };
      }

      console.warn('⚠️ No bars available from Google Sheets');
      return { bars: [], source: 'fallback' };
      
    } catch (error) {
      console.error('Error in getAllBars:', error);
      // Return cached data if available, even if expired
      if (this.cache) {
        console.log('🔄 Returning expired cache due to error');
        return { bars: this.cache, source: 'cache' };
      }
      return { bars: [], source: 'fallback' };
    }
  }

  /**
   * Get active bars only
   */
  async getActiveBars(): Promise<Bar[]> {
    try {
      const { bars } = await this.getAllBars();
      return bars.filter(bar => bar.active);
    } catch (error) {
      console.error('Error getting active bars:', error);
      return [];
    }
  }

  /**
   * Get a specific bar by ID
   */
  async getBarById(id: string): Promise<Bar | null> {
    try {
      const { bars } = await this.getAllBars();
      const bar = bars.find(b => b.id === id);
      return bar || null;
    } catch (error) {
      console.error(`Error getting bar by ID ${id}:`, error);
      return null;
    }
  }

  /**
   * Clear the cache (for admin operations)
   */
  clearCache(): void {
    this.cache = null;
    this.cacheTimestamp = 0;
    console.log('🗑️ Bar cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      cached: this.cache !== null,
      count: this.cache?.length || 0,
      timestamp: this.cacheTimestamp,
      valid: this.isCacheValid(),
      ttl: this.cacheTtl
    };
  }

  /**
   * Check if cache is valid
   */
  private isCacheValid(): boolean {
    return this.cache !== null && 
           (Date.now() - this.cacheTimestamp) < this.cacheTtl;
  }

  /**
   * Fetch bars from Google Sheets API
   */
  private async fetchBarsFromSheets(): Promise<Bar[] | null> {
    try {
      const spreadsheetId = process.env.BARS_SPREADSHEET_ID;
      const apiKey = process.env.GOOGLE_SHEETS_API_KEY;

      if (!spreadsheetId || !apiKey) {
        console.error('Missing required environment variables: BARS_SPREADSHEET_ID or GOOGLE_SHEETS_API_KEY');
        return null;
      }

      const range = 'bars-template!A:R'; // Adjust range as needed
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`;

      console.log('🔗 Fetching bars from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        next: { revalidate: 300 } // 5 minutes cache
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.values || data.values.length === 0) {
        console.warn('No data found in bars spreadsheet');
        return null;
      }

      const headers = data.values[0];
      const rows = data.values.slice(1);

      console.log(`📊 Processing ${rows.length} bar rows from sheet`);

      const bars = rows
        .map((row: string[]) => this.mapSheetRowToBar(headers, row))
        .filter((bar: Bar | null): bar is Bar => bar !== null);

      console.log(`✅ Successfully mapped ${bars.length} bars`);
      return bars;

    } catch (error) {
      console.error('Error fetching bars from Google Sheets:', error);
      return null;
    }
  }

  /**
   * Map Google Sheets row to Bar object
   */
  private mapSheetRowToBar(headers: string[], row: string[]): Bar | null {
    try {
      const rowData: Record<string, string> = {};
      headers.forEach((header, index) => {
        rowData[header] = row[index] || '';
      });

      // Required fields check
      if (!rowData['ID'] || !rowData['Name'] || !rowData['MenuSheetID']) {
        console.warn('Skipping bar row due to missing required fields:', rowData);
        return null;
      }

      const bar: Bar = {
        id: rowData['ID'].trim(),
        name: rowData['Name'].trim(),
        description: rowData['Description'] || undefined,
        address: {
          street: rowData['Street'] || '',
          city: rowData['City'] || '',
          state: rowData['State'] || '',
          zip_code: rowData['ZipCode'] || '',
          formatted: this.formatAddress(rowData['Street'], rowData['City'], rowData['State'], rowData['ZipCode'])
        },
        location: {
          latitude: parseFloat(rowData['Latitude']) || 0,
          longitude: parseFloat(rowData['Longitude']) || 0
        },
        phone: rowData['Phone'] || undefined,
        website: rowData['Website'] || undefined,
        menu_sheet_id: rowData['MenuSheetID'].trim(),
        active: rowData['Active']?.toLowerCase() === 'true' || rowData['Active'] === '1',
        hours: this.parseHours(rowData['Hours']),
        features: this.parseFeatures(rowData['Features']),
        image_url: rowData['ImageURL'] || undefined,
        created_at: rowData['CreatedAt'] || new Date().toISOString(),
        updated_at: rowData['UpdatedAt'] || new Date().toISOString()
      };

      // Validate coordinates
      if (!bar.location.latitude || !bar.location.longitude) {
        console.warn(`Bar ${bar.name} has invalid coordinates: ${bar.location.latitude}, ${bar.location.longitude}`);
        return null;
      }

      return bar;
    } catch (error) {
      console.error('Error mapping sheet row to bar:', error, row);
      return null;
    }
  }

  /**
   * Format address string
   */
  private formatAddress(street: string, city: string, state: string, zipCode: string): string {
    const parts = [street, city, state, zipCode].filter(Boolean);
    return parts.join(', ');
  }

  /**
   * Parse hours JSON string
   */
  private parseHours(hoursStr: string): Record<string, { open: string; close: string }> | undefined {
    if (!hoursStr) return undefined;
    try {
      return JSON.parse(hoursStr);
    } catch (error) {
      console.warn('Failed to parse hours:', hoursStr);
      return undefined;
    }
  }

  /**
   * Parse features comma-separated string
   */
  private parseFeatures(featuresStr: string): string[] | undefined {
    if (!featuresStr) return undefined;
    return featuresStr.split(',').map(f => f.trim()).filter(Boolean);
  }
}

// Export singleton instance
export const barDataService = new BarDataService();