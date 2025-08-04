import { google } from 'googleapis';
import { Drink } from '@/app/types/drinks';

interface GoogleSheetsConfig {
  spreadsheetId: string;
  serviceAccountEmail: string;
  privateKey: string;
}

class GoogleSheetsService {
  private sheets: any;
  private config: GoogleSheetsConfig | null = null;
  
  constructor() {
    this.initializeConfig();
  }
  
  private initializeConfig() {
    // Check if environment variables are configured
    if (
      process.env.GOOGLE_SHEETS_SPREADSHEET_ID &&
      (process.env.GOGOLE_SHEETS_API_KEY || 
       (process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_SHEETS_PRIVATE_KEY))
    ) {
      this.config = {
        spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
        serviceAccountEmail: process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL || '',
        privateKey: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n') || ''
      };
      
      console.log('🔧 Google Sheets configuration loaded');
      if (process.env.GOGOLE_SHEETS_API_KEY) {
        console.log('🔑 Using API Key authentication');
      } else {
        console.log('📧 Using Service Account:', this.config.serviceAccountEmail);
      }
      console.log('📊 Spreadsheet ID:', this.config.spreadsheetId);
    }
  }
  
  /**
   * Fetch all drinks from Google Sheets
   */
  async fetchAllDrinks(): Promise<Drink[] | null> {
    if (!this.config) {
      console.log('Google Sheets not configured');
      return null;
    }
    
    // Initialize Google Sheets API on first use
    if (!this.sheets) {
      console.log('🔧 Initializing Google Sheets API client...');
      
      // Use API Key if available, otherwise use Service Account
      if (process.env.GOGOLE_SHEETS_API_KEY) {
        console.log('🔑 Using API Key authentication');
        this.sheets = google.sheets({ 
          version: 'v4', 
          auth: process.env.GOGOLE_SHEETS_API_KEY 
        });
      } else {
        console.log('📧 Using Service Account authentication');
        const auth = new google.auth.JWT({
          email: this.config.serviceAccountEmail,
          key: this.config.privateKey,
          scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
        });
        
        this.sheets = google.sheets({ version: 'v4', auth });
      }
    }
    
    try {
      // Define the ranges for each category
      const ranges = [
        'Beer!A2:Z1000',
        'Wine!A2:Z1000',
        'Cocktail!A2:Z1000',
        'Spirit!A2:Z1000',
        'Non_Alcoholic!A2:Z1000'
      ];
      
      // Batch get all ranges
      const response = await this.sheets.spreadsheets.values.batchGet({
        spreadsheetId: this.config.spreadsheetId,
        ranges
      });
      
      const allDrinks: Drink[] = [];
      const categoryMap = ['beer', 'wine', 'cocktail', 'spirit', 'non-alcoholic'];
      
      // Process each sheet's data
      response.data.valueRanges.forEach((range: any, index: number) => {
        const category = categoryMap[index];
        const rows = range.values || [];
        
        rows.forEach((row: any[]) => {
          // Skip empty rows
          if (!row[0] || !row[1]) return;
          
          const drink = this.rowToDrink(row, category);
          if (drink) {
            allDrinks.push(drink);
          }
        });
      });
      
      console.log(`Fetched ${allDrinks.length} drinks from Google Sheets`);
      return allDrinks;
      
    } catch (error) {
      console.error('Error fetching from Google Sheets:', error);
      return null;
    }
  }
  
  /**
   * Convert a spreadsheet row to a Drink object
   */
  private rowToDrink(row: any[], category: string): Drink | null {
    try {
      // Actual column order based on raw data inspection:
      // A: id, B: name, C: category, D: description, E: ingredients, 
      // F: price_16oz, G: price_24oz, H: price, I: abv, J: flavor_profile,
      // K: strength, L: weather_temp_min, M: weather_temp_max,
      // N: weather_conditions, O: weather_ideal_temp, P: occasions,
      // Q: serving_suggestions, R: image_url, S: glass_type,
      // T: preparation, U: happy_hour, V: happy_hour_price,
      // W: happy_hour_times, X: featured, Y: funForTwentyOne, Z: goodForBDay
      
      const drink: Drink = {
        id: row[0]?.toString().trim() || '',
        name: row[1]?.toString().trim() || '',
        category: category as any,
        description: row[3]?.toString().trim() || '', // Column D
        ingredients: row[4] ? row[4].toString().split(';').map((s: string) => s.trim()).filter((s: string) => s) : [], // Column E
        price: row[7]?.toString().trim() || '$0', // Column H
        abv: parseFloat(row[8]) || 0, // Column I
        flavor_profile: row[9] ? row[9].toString().split(';').map((s: string) => s.trim()).filter((s: string) => s) as any : [], // Column J
        strength: (row[10]?.toString().trim() || 'medium') as any, // Column K
        weather_match: {
          temp_min: parseFloat(row[11]) || 0, // Column L
          temp_max: parseFloat(row[12]) || 40, // Column M
          conditions: row[13] ? row[13].toString().split(';').map((s: string) => s.trim()).filter((s: string) => s) : ['clear'], // Column N
          ideal_temp: parseFloat(row[14]) || 25 // Column O
        },
        occasions: row[15] ? row[15].toString().split(';').map((s: string) => s.trim()).filter((s: string) => s) as any : [], // Column P
        serving_suggestions: row[16] ? row[16].toString().split(';').map((s: string) => s.trim()).filter((s: string) => s) : [], // Column Q
        image_url: row[17]?.toString().trim() || '' // Column R
      };
      
      // Optional fields
      if (row[5]) drink.price_16oz = row[5].toString().trim(); // Column F
      if (row[6]) drink.price_24oz = row[6].toString().trim(); // Column G
      if (row[18]) drink.glass_type = row[18].toString().trim(); // Column S
      if (row[19]) drink.preparation = row[19].toString().trim(); // Column T
      if (row[20]) drink.happy_hour = row[20]?.toString().toLowerCase() === 'true'; // Column U
      if (row[21]) drink.happy_hour_price = row[21].toString().trim(); // Column V
      if (row[22]) drink.happy_hour_times = row[22].toString().trim(); // Column W
      if (row[23]) drink.featured = row[23]?.toString().toLowerCase() === 'true'; // Column X
      if (row[24]) drink.funForTwentyOne = row[24]?.toString().toLowerCase() === 'true'; // Column Y
      if (row[25]) drink.goodForBDay = row[25]?.toString().toLowerCase() === 'true'; // Column Z
      
      return drink;
    } catch (error) {
      console.error('Error parsing drink row:', error);
      return null;
    }
  }
}

// Export singleton instance
export const googleSheetsService = new GoogleSheetsService();