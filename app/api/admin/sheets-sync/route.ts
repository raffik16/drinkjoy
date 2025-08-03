import { NextRequest, NextResponse } from 'next/server';
import { drinkDataService } from '@/lib/drinkDataService.server';
import { Drink } from '@/app/types/drinks';

// Types for the webhook payload
interface DrinkData {
  id: string;
  name: string;
  category: 'beer' | 'wine' | 'cocktail' | 'spirit' | 'non-alcoholic';
  description: string;
  ingredients: string[];
  price?: string;
  price_16oz?: string;
  price_24oz?: string;
  abv: number;
  flavor_profile: string[];
  strength: 'light' | 'medium' | 'strong' | 'non-alcoholic';
  weather_match: {
    temp_min: number;
    temp_max: number;
    conditions: string[];
    ideal_temp: number;
  };
  occasions: string[];
  serving_suggestions: string[];
  image_url: string;
  glass_type?: string;
  preparation?: string;
  happy_hour?: boolean;
  happy_hour_price?: string;
  happy_hour_times?: string;
  featured?: boolean;
  funForTwentyOne?: boolean;
  goodForBDay?: boolean;
}

interface WebhookPayload {
  action: 'update' | 'bulk_update';
  category: string;
  drinks: DrinkData[];
  timestamp: string;
  sheet_id: string;
}

/**
 * Validate drink data structure
 */
function validateDrink(drink: DrinkData, index: number): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Required fields
  if (!drink.id) errors.push(`Drink ${index}: Missing required field 'id'`);
  if (!drink.name) errors.push(`Drink ${index}: Missing required field 'name'`);
  if (!drink.category) errors.push(`Drink ${index}: Missing required field 'category'`);
  
  // Valid categories
  const validCategories = ['beer', 'wine', 'cocktail', 'spirit', 'non-alcoholic'];
  if (drink.category && !validCategories.includes(drink.category)) {
    errors.push(`Drink ${index}: Invalid category '${drink.category}'`);
  }
  
  // Valid strength
  const validStrengths = ['light', 'medium', 'strong', 'non-alcoholic'];
  if (drink.strength && !validStrengths.includes(drink.strength)) {
    errors.push(`Drink ${index}: Invalid strength '${drink.strength}'`);
  }
  
  // ABV should be a number
  if (drink.abv !== undefined && (typeof drink.abv !== 'number' || drink.abv < 0 || drink.abv > 100)) {
    errors.push(`Drink ${index}: ABV must be a number between 0-100`);
  }
  
  return { isValid: errors.length === 0, errors };
}

/**
 * Convert CSV row data back to proper drink object
 */
function processDrinkData(rawDrink: any): DrinkData {
  const drink: Partial<DrinkData> = {};
  
  // Basic fields
  drink.id = rawDrink.id?.toString().trim() || '';
  drink.name = rawDrink.name?.toString().trim() || '';
  drink.category = rawDrink.category?.toString().trim() || '';
  drink.description = rawDrink.description?.toString().trim() || '';
  
  // Array fields - handle both arrays and semicolon-separated strings
  drink.ingredients = Array.isArray(rawDrink.ingredients) ? 
    rawDrink.ingredients : 
    (rawDrink.ingredients ? rawDrink.ingredients.split(';').map((s: string) => s.trim()).filter((s: string) => s) : []);
  
  drink.flavor_profile = Array.isArray(rawDrink.flavor_profile) ? 
    rawDrink.flavor_profile : 
    (rawDrink.flavor_profile ? rawDrink.flavor_profile.split(';').map((s: string) => s.trim()).filter((s: string) => s) : []);
  
  drink.occasions = Array.isArray(rawDrink.occasions) ? 
    rawDrink.occasions : 
    (rawDrink.occasions ? rawDrink.occasions.split(';').map((s: string) => s.trim()).filter((s: string) => s) : []);
  
  drink.serving_suggestions = Array.isArray(rawDrink.serving_suggestions) ? 
    rawDrink.serving_suggestions : 
    (rawDrink.serving_suggestions ? rawDrink.serving_suggestions.split(';').map((s: string) => s.trim()).filter((s: string) => s) : []);
  
  // Price fields
  if (rawDrink.price?.toString().trim()) drink.price = rawDrink.price.toString().trim();
  if (rawDrink.price_16oz?.toString().trim()) drink.price_16oz = rawDrink.price_16oz.toString().trim();
  if (rawDrink.price_24oz?.toString().trim()) drink.price_24oz = rawDrink.price_24oz.toString().trim();
  
  // Numeric fields
  drink.abv = parseFloat(rawDrink.abv) || 0;
  
  // String fields
  drink.strength = rawDrink.strength?.toString().trim() || 'light';
  
  // Weather object - handle both object and individual fields
  if (rawDrink.weather_match && typeof rawDrink.weather_match === 'object') {
    drink.weather_match = rawDrink.weather_match;
  } else {
    drink.weather_match = {
      temp_min: parseFloat(rawDrink.weather_temp_min) || 0,
      temp_max: parseFloat(rawDrink.weather_temp_max) || 40,
      conditions: rawDrink.weather_conditions ? 
        (Array.isArray(rawDrink.weather_conditions) ? rawDrink.weather_conditions : 
         rawDrink.weather_conditions.split(';').map((s: string) => s.trim()).filter((s: string) => s)) : ['clear'],
      ideal_temp: parseFloat(rawDrink.weather_ideal_temp) || 25
    };
  }
  
  // Optional fields
  if (rawDrink.image_url?.toString().trim()) drink.image_url = rawDrink.image_url.toString().trim();
  if (rawDrink.glass_type?.toString().trim()) drink.glass_type = rawDrink.glass_type.toString().trim();
  if (rawDrink.preparation?.toString().trim()) drink.preparation = rawDrink.preparation.toString().trim();
  
  // Boolean fields
  drink.happy_hour = rawDrink.happy_hour === true || rawDrink.happy_hour?.toString().toLowerCase() === 'true';
  drink.featured = rawDrink.featured === true || rawDrink.featured?.toString().toLowerCase() === 'true';
  drink.funForTwentyOne = rawDrink.funForTwentyOne === true || rawDrink.funForTwentyOne?.toString().toLowerCase() === 'true';
  drink.goodForBDay = rawDrink.goodForBDay === true || rawDrink.goodForBDay?.toString().toLowerCase() === 'true';
  
  // Happy hour fields
  if (rawDrink.happy_hour_price?.toString().trim()) drink.happy_hour_price = rawDrink.happy_hour_price.toString().trim();
  if (rawDrink.happy_hour_times?.toString().trim()) drink.happy_hour_times = rawDrink.happy_hour_times.toString().trim();
  
  return drink as DrinkData;
}


/**
 * Verify webhook authentication
 */
function verifyWebhookAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const expectedSecret = process.env.SHEETS_WEBHOOK_SECRET;
  
  if (!expectedSecret) {
    console.warn('⚠️  SHEETS_WEBHOOK_SECRET not configured - allowing request');
    return true; // Allow in development
  }
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  
  const token = authHeader.substring(7);
  return token === expectedSecret;
}

export async function POST(request: NextRequest) {
  try {
    console.log('📥 Received sheets sync webhook');
    
    // Verify authentication
    if (!verifyWebhookAuth(request)) {
      console.error('❌ Unauthorized webhook request');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse payload
    const payload: WebhookPayload = await request.json();
    console.log(`📊 Processing ${payload.action} for ${payload.category} category`);
    
    // Validate payload structure
    if (!payload.drinks || !Array.isArray(payload.drinks)) {
      return NextResponse.json(
        { error: 'Invalid payload: drinks array required' },
        { status: 400 }
      );
    }
    
    // Process and validate each drink
    const processedDrinks: DrinkData[] = [];
    const allErrors: string[] = [];
    
    for (let i = 0; i < payload.drinks.length; i++) {
      const rawDrink = payload.drinks[i];
      
      try {
        const processedDrink = processDrinkData(rawDrink);
        const { isValid, errors } = validateDrink(processedDrink, i + 1);
        
        if (!isValid) {
          allErrors.push(...errors);
        } else {
          processedDrinks.push(processedDrink);
        }
      } catch (error) {
        allErrors.push(`Drink ${i + 1}: Processing error - ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    // If validation errors, return them
    if (allErrors.length > 0) {
      console.error('❌ Validation errors:', allErrors);
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: allErrors,
          processed: processedDrinks.length,
          total: payload.drinks.length
        },
        { status: 400 }
      );
    }
    
    // Update cache with new drinks
    if (payload.action === 'bulk_update') {
      // For bulk update, replace all drinks
      drinkDataService.updateCache(processedDrinks as Drink[]);
      console.log(`🔄 Bulk update: replaced cache with ${processedDrinks.length} drinks`);
    } else {
      // For single category update, try to merge with existing data
      try {
        const { drinks: allDrinks } = await drinkDataService.getAllDrinks();
        
        if (allDrinks.length > 0) {
          // Filter out drinks from the updated category
          const otherDrinks = allDrinks.filter(d => d.category !== payload.category);
          
          // Merge with new drinks
          const updatedDrinks = [...otherDrinks, ...processedDrinks as Drink[]];
          drinkDataService.updateCache(updatedDrinks);
          console.log(`🔄 Category update: merged ${processedDrinks.length} ${payload.category} drinks with ${otherDrinks.length} existing drinks`);
        } else {
          // If no existing drinks, just use the new ones
          drinkDataService.updateCache(processedDrinks as Drink[]);
          console.log(`🔄 Initial cache: added ${processedDrinks.length} ${payload.category} drinks`);
        }
      } catch (error) {
        // If we can't get existing drinks, just cache what we have
        drinkDataService.updateCache(processedDrinks as Drink[]);
        console.log(`🔄 Fallback cache: added ${processedDrinks.length} ${payload.category} drinks (error: ${error})`);
      }
    }
    
    console.log(`✅ Successfully processed ${processedDrinks.length} drinks for ${payload.category}`);
    
    return NextResponse.json({
      success: true,
      message: `Updated ${processedDrinks.length} drinks in ${payload.category} category`,
      processed: processedDrinks.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Webhook processing failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    endpoint: 'sheets-sync webhook',
    timestamp: new Date().toISOString()
  });
}