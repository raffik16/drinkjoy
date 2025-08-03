import { NextRequest, NextResponse } from 'next/server';
import { getAllDrinks, getDrinkById, filterDrinks } from '@/lib/drinks.server';
import { DrinkFilters } from '@/app/types/drinks';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const drinkId = searchParams.get('id');

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

    const allDrinks = await getAllDrinks();
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