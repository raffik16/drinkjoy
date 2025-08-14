import { NextRequest, NextResponse } from 'next/server';
import { barDataService } from '@/lib/barDataService.server';
import { barMenuService } from '@/lib/barMenuService';
import type { Drink } from '@/app/types/drinks';

interface BarMenuResponse {
  success: boolean;
  drinks?: Drink[];
  bar?: {
    id: string;
    name: string;
    menu_sheet_id: string;
  };
  count?: number;
  source?: string;
  error?: string;
}

export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ barId: string }> }
) {
  const { barId } = await params;
  
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    if (!barId) {
      const errorResponse: BarMenuResponse = {
        success: false,
        error: 'Bar ID is required'
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    console.log(`🍹 API: Getting menu for bar ${barId}${category ? ` (category: ${category})` : ''}`);

    const startTime = Date.now();
    
    // Get bar information first
    const bar = await barDataService.getBarById(barId);
    
    if (!bar) {
      console.log(`❌ API: Bar ${barId} not found`);
      
      const errorResponse: BarMenuResponse = {
        success: false,
        error: 'Bar not found'
      };
      
      return NextResponse.json(errorResponse, { status: 404 });
    }

    if (!bar.active) {
      console.log(`❌ API: Bar ${barId} is not active`);
      
      const errorResponse: BarMenuResponse = {
        success: false,
        error: 'Bar is currently inactive'
      };
      
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // Fetch drinks from the bar's specific sheet using the new service
    console.log(`📊 Fetching drinks from bar's sheet: ${bar.menu_sheet_id}`);
    
    let drinks: Drink[] = [];
    let menuSource: string = 'sheets';
    
    try {
      const barMenuResponse = await barMenuService.getBarMenu(barId, bar.menu_sheet_id);
      drinks = barMenuResponse.drinks;
      menuSource = barMenuResponse.source;
      
      console.log(`✅ Loaded ${drinks.length} drinks from ${bar.name}'s menu (source: ${menuSource})`);
      
    } catch (sheetError) {
      console.error(`Failed to fetch from bar's sheet ${bar.menu_sheet_id}:`, sheetError);
      
      const errorResponse: BarMenuResponse = {
        success: false,
        error: 'Failed to load bar menu'
      };
      
      return NextResponse.json(errorResponse, { status: 500 });
    }

    // Filter by category if requested
    if (category) {
      drinks = drinks.filter(drink => 
        drink.category.toLowerCase() === category.toLowerCase()
      );
    }

    const duration = Date.now() - startTime;
    console.log(`✅ API: Loaded ${drinks.length} drinks for ${bar.name} in ${duration}ms`);

    // Track analytics if available
    if (typeof globalThis !== 'undefined' && 'gtag' in globalThis) {
      (globalThis as any).gtag('event', 'bar_menu_loaded', {
        bar_id: barId,
        bar_name: bar.name,
        drinks_count: drinks.length,
        category: category || 'all',
        response_time_ms: duration
      });
    }

    const response: BarMenuResponse = {
      success: true,
      drinks,
      bar: {
        id: bar.id,
        name: bar.name,
        menu_sheet_id: bar.menu_sheet_id
      },
      count: drinks.length,
      source: menuSource
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error(`❌ API Error in /api/bars/${barId}/menu:`, error);
    
    const errorResponse: BarMenuResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch bar menu'
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}