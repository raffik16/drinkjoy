import { NextRequest, NextResponse } from 'next/server';
import { barMenuService } from '@/lib/barMenuService';
import { barDataService } from '@/lib/barDataService.server';

interface BarMenuDebugResponse {
  success: boolean;
  bars: Array<{
    barId: string;
    barName: string;
    spreadsheetId: string;
    active: boolean;
    menuStats?: {
      totalDrinks: number;
      source: string;
      categories: Record<string, number>;
    };
    cacheStats?: {
      cached: boolean;
      age: number;
      valid: boolean;
    };
    error?: string;
  }>;
  cacheOverview: any;
  timestamp: string;
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [Admin] Bar menu debug requested');

    // Get all bars
    const { bars } = await barDataService.getAllBars();
    
    const barDebugInfo = await Promise.all(
      bars.map(async (bar) => {
        const barInfo = {
          barId: bar.id,
          barName: bar.name,
          spreadsheetId: bar.menu_sheet_id,
          active: bar.active,
        };

        try {
          // Get menu stats
          const menuResponse = await barMenuService.getBarMenu(bar.id, bar.menu_sheet_id);
          
          // Calculate category distribution
          const categories: Record<string, number> = {};
          menuResponse.drinks.forEach(drink => {
            categories[drink.category] = (categories[drink.category] || 0) + 1;
          });

          return {
            ...barInfo,
            menuStats: {
              totalDrinks: menuResponse.totalDrinks,
              source: menuResponse.source,
              categories
            }
          };
        } catch (error) {
          return {
            ...barInfo,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    // Get cache overview
    const cacheOverview = barMenuService.getCacheStats();

    const response: BarMenuDebugResponse = {
      success: true,
      bars: barDebugInfo,
      cacheOverview,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ [Admin] Bar menu debug error:', error);
    
    const errorResponse: BarMenuDebugResponse = {
      success: false,
      bars: [],
      cacheOverview: {},
      timestamp: new Date().toISOString()
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// Clear cache for specific bar or all bars
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const barId = searchParams.get('bar_id');

    if (barId) {
      barMenuService.clearBarCache(barId);
      console.log(`🗑️ [Admin] Cleared cache for bar ${barId}`);
      
      return NextResponse.json({
        success: true,
        message: `Cache cleared for bar ${barId}`
      });
    } else {
      barMenuService.clearAllCache();
      console.log('🗑️ [Admin] Cleared all bar menu cache');
      
      return NextResponse.json({
        success: true,
        message: 'All bar menu cache cleared'
      });
    }

  } catch (error) {
    console.error('❌ [Admin] Cache clear error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to clear cache'
    }, { status: 500 });
  }
}