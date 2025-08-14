import { NextRequest, NextResponse } from 'next/server';
import { getAllDrinks, getDrinkById, filterDrinks } from '@/lib/drinks.server';
import { DrinkFilters } from '@/app/types/drinks';
import { barDataService } from '@/lib/barDataService.server';
import { barMenuService } from '@/lib/barMenuService';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const drinkId = searchParams.get('id');
    const barId = searchParams.get('bar_id');

    // If ID is provided, return single drink
    if (drinkId) {
      const drink = await getDrinkById(drinkId);
      if (!drink) {
        return NextResponse.json(
          { error: 'Drink not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(drink);
    }

    // Otherwise, return filtered drinks
    const filters: DrinkFilters = {};

    // Parse categories
    const categories = searchParams.get('categories');
    if (categories) {
      filters.categories = categories.split(',') as DrinkFilters['categories'];
    }

    // Parse flavors
    const flavors = searchParams.get('flavors');
    if (flavors) {
      filters.flavors = flavors.split(',') as DrinkFilters['flavors'];
    }

    // Parse strength
    const strength = searchParams.get('strength');
    if (strength) {
      filters.strength = strength.split(',') as DrinkFilters['strength'];
    }

    // Parse occasions
    const occasions = searchParams.get('occasions');
    if (occasions) {
      filters.occasions = occasions.split(',') as DrinkFilters['occasions'];
    }

    // Parse search query
    const search = searchParams.get('search');
    if (search) {
      filters.search = search;
    }

    // Get drinks from specific bar or default source
    let allDrinks;
    
    if (barId) {
      console.log(`🍹 Loading drinks for bar ${barId}`);
      
      // Get bar information
      const bar = await barDataService.getBarById(barId);
      if (!bar) {
        return NextResponse.json(
          { error: 'Bar not found' },
          { status: 404 }
        );
      }
      
      if (!bar.active) {
        return NextResponse.json(
          { error: 'Bar is currently inactive' },
          { status: 404 }
        );
      }
      
      // Fetch drinks from bar's specific sheet using the new service
      try {
        const barMenuResponse = await barMenuService.getBarMenu(barId, bar.menu_sheet_id);
        allDrinks = barMenuResponse.drinks;
        
        console.log(`✅ Loaded ${allDrinks.length} drinks from ${bar.name}'s menu (source: ${barMenuResponse.source})`);
      } catch (error) {
        console.error(`Failed to load menu for bar ${barId}:`, error);
        return NextResponse.json(
          { error: 'Failed to load bar menu' },
          { status: 500 }
        );
      }
    } else {
      // Use default drink source
      allDrinks = await getAllDrinks();
    }

    const filteredDrinks = Object.keys(filters).length > 0
      ? filterDrinks(allDrinks, filters)
      : allDrinks;

    return NextResponse.json({
      drinks: filteredDrinks,
      total: filteredDrinks.length,
    });
  } catch (error) {
    console.error('Drinks API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch drinks' },
      { status: 500 }
    );
  }
}