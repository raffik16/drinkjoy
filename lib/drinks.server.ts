import 'server-only';
import { Drink, DrinkFilters, DrinkRecommendation } from '@/app/types/drinks';
import { WeatherData } from '@/app/types/weather';
import { getTemperatureCategory, getTimeOfDay } from '@/lib/utils';
import { isCurrentlyHappyHour } from '@/lib/happyHour';
import { drinkDataService } from '@/lib/drinkDataService.server';

export async function getAllDrinks(): Promise<Drink[]> {
  const { drinks } = await drinkDataService.getAllDrinks();
  return drinks;
}

export async function getDrinkById(id: string): Promise<Drink | undefined> {
  return await drinkDataService.getDrinkById(id);
}

export function filterDrinks(drinks: Drink[], filters: DrinkFilters): Drink[] {
  return drinks.filter((drink) => {
    // Category filter
    if (filters.categories && filters.categories.length > 0) {
      if (!filters.categories.includes(drink.category)) return false;
    }

    // Flavor filter
    if (filters.flavors && filters.flavors.length > 0) {
      const hasMatchingFlavor = filters.flavors.some((flavor) =>
        drink.flavor_profile.includes(flavor)
      );
      if (!hasMatchingFlavor) return false;
    }

    // Strength filter
    if (filters.strength && filters.strength.length > 0) {
      if (!filters.strength.includes(drink.strength)) return false;
    }

    // Occasion filter
    if (filters.occasions && filters.occasions.length > 0) {
      const hasMatchingOccasion = filters.occasions.some((occasion) =>
        drink.occasions.includes(occasion)
      );
      if (!hasMatchingOccasion) return false;
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch =
        drink.name.toLowerCase().includes(searchLower) ||
        drink.description.toLowerCase().includes(searchLower) ||
        drink.ingredients.some((ing) => ing.toLowerCase().includes(searchLower));
      if (!matchesSearch) return false;
    }

    return true;
  });
}

export async function recommendDrinks(
  weather: WeatherData,
  filters?: DrinkFilters,
  isMetricUnit: boolean = false
): Promise<DrinkRecommendation[]> {
  let drinks = await getAllDrinks();

  // Apply filters if provided
  if (filters) {
    drinks = filterDrinks(drinks, filters);
  }

  // Score each drink based on weather matching
  const recommendations = drinks.map((drink) => {
    const score = calculateWeatherScore(drink, weather);
    const reasons = generateRecommendationReasons(drink, weather, score, isMetricUnit);

    return {
      drink,
      score,
      reasons,
    };
  });

  // Sort by score with happy hour priority
  return recommendations
    .filter((rec) => rec.score > 0)
    .sort((a, b) => {
      // First priority: Happy hour drinks (always prioritized when happy hour is active)
      const isHappyHourActive = isCurrentlyHappyHour();
      const aIsHappyHour = isHappyHourActive && a.drink.happy_hour;
      const bIsHappyHour = isHappyHourActive && b.drink.happy_hour;
      
      // If it's happy hour time, always put happy hour drinks first regardless of score
      if (aIsHappyHour && !bIsHappyHour) return -1;
      if (!aIsHappyHour && bIsHappyHour) return 1;
      
      // Second priority: Sort by score
      return b.score - a.score;
    });
}

function calculateWeatherScore(drink: Drink, weather: WeatherData): number {
  let score = 0;
  const currentTemp = weather.current.temp;
  const weatherMain = weather.current.main.toLowerCase();

  // Temperature matching (40 points max)
  if (currentTemp >= drink.weather_match.temp_min && currentTemp <= drink.weather_match.temp_max) {
    // Perfect temperature match
    const tempRange = drink.weather_match.temp_max - drink.weather_match.temp_min;
    const tempDiff = Math.abs(currentTemp - drink.weather_match.ideal_temp);
    const tempScore = 40 - (tempDiff / tempRange) * 20;
    score += Math.max(20, tempScore);
  } else {
    // Outside ideal range, but might still be acceptable
    const distance = Math.min(
      Math.abs(currentTemp - drink.weather_match.temp_min),
      Math.abs(currentTemp - drink.weather_match.temp_max)
    );
    score += Math.max(0, 20 - distance * 2);
  }

  // Weather condition matching (30 points max)
  if (drink.weather_match.conditions.includes(weatherMain)) {
    score += 30;
  } else if (drink.weather_match.conditions.some((condition) => 
    condition.includes('rain') && weatherMain.includes('rain') ||
    condition.includes('snow') && weatherMain.includes('snow') ||
    condition.includes('clear') && weatherMain.includes('clear')
  )) {
    score += 20;
  }

  // Time of day bonus (15 points max)
  const timeOfDay = getTimeOfDay();
  const timeBonus = getTimeOfDayBonus(drink, timeOfDay);
  score += timeBonus;

  // Temperature category bonus (15 points max)
  const tempCategory = getTemperatureCategory(currentTemp);
  const categoryBonus = getTemperatureCategoryBonus(drink, tempCategory);
  score += categoryBonus;

  return Math.min(100, Math.round(score));
}

function getTimeOfDayBonus(drink: Drink, timeOfDay: string): number {
  const timePreferences = {
    morning: ['coffee', 'tea', 'light'],
    afternoon: ['refreshing', 'light', 'medium'],
    evening: ['medium', 'strong', 'wine', 'cocktail'],
    night: ['strong', 'spirit', 'cocktail'],
  };

  const preferences = timePreferences[timeOfDay as keyof typeof timePreferences] || [];
  
  let bonus = 0;
  if (preferences.includes(drink.category)) bonus += 10;
  if (preferences.includes(drink.strength)) bonus += 5;

  return bonus;
}

function getTemperatureCategoryBonus(drink: Drink, tempCategory: string): number {
  const categoryPreferences = {
    hot: ['refreshing', 'light', 'beer', 'non-alcoholic'],
    warm: ['medium', 'refreshing', 'cocktail'],
    cool: ['medium', 'wine', 'cocktail'],
    cold: ['strong', 'spirit', 'savory', 'spicy'],
  };

  const preferences = categoryPreferences[tempCategory as keyof typeof categoryPreferences] || [];
  
  let bonus = 0;
  if (preferences.includes(drink.category)) bonus += 10;
  if (preferences.includes(drink.strength)) bonus += 5;
  if (drink.flavor_profile.some((flavor) => preferences.includes(flavor))) bonus += 5;

  return Math.min(15, bonus);
}

function generateRecommendationReasons(
  drink: Drink,
  weather: WeatherData,
  score: number,
  isMetricUnit: boolean = false
): string[] {
  const reasons: string[] = [];
  const currentTemp = weather.current.temp;
  const weatherDesc = weather.current.description;
  const tempCategory = getTemperatureCategory(currentTemp);

  // Convert temperature for display
  const displayTemp = isMetricUnit ? currentTemp : Math.round((currentTemp * 9/5) + 32);
  const tempUnit = isMetricUnit ? '°C' : '°F';

  // Temperature-based reasons
  if (currentTemp >= drink.weather_match.temp_min && currentTemp <= drink.weather_match.temp_max) {
    if (tempCategory === 'hot') {
      reasons.push(`Perfect for this ${displayTemp}${tempUnit} weather`);
    } else if (tempCategory === 'cold') {
      reasons.push(`Ideal for warming up in ${displayTemp}${tempUnit}`);
    } else {
      reasons.push(`Great match for ${displayTemp}${tempUnit} weather`);
    }
  }

  // Weather condition reasons
  if (drink.weather_match.conditions.includes(weather.current.main.toLowerCase())) {
    reasons.push(`Excellent choice for ${weatherDesc}`);
  }

  // Flavor profile reasons
  if (tempCategory === 'hot' && drink.flavor_profile.includes('smooth')) {
    reasons.push('Refreshing choice for hot weather');
  } else if (tempCategory === 'cold' && drink.flavor_profile.includes('bitter')) {
    reasons.push('Warming flavors for cold weather');
  }

  // Time-based reasons
  const timeOfDay = getTimeOfDay();
  if (timeOfDay === 'evening' && (drink.category === 'wine' || drink.category === 'cocktail')) {
    reasons.push('Perfect evening drink');
  } else if (timeOfDay === 'afternoon' && drink.strength === 'light') {
    reasons.push('Light and suitable for afternoon');
  }

  // Ensure we always have at least one reason
  if (reasons.length === 0) {
    if (score > 70) {
      reasons.push('Highly recommended for current conditions');
    } else if (score > 40) {
      reasons.push('Good choice for the weather');
    } else {
      reasons.push('Worth trying in this weather');
    }
  }

  return reasons;
}