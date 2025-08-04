import 'server-only';
import { Drink, DrinkRecommendation, Occasion } from '@/app/types/drinks';
import { WizardPreferences, OccasionMood } from '@/app/types/wizard';
import { WeatherData } from '@/app/types/weather';
import { getHappyHourBonus } from '@/lib/happyHour';
import { getPopularDrinks } from '@/lib/supabase';
import { isSafeForAllergies } from '@/lib/allergenDetector';
import { drinkDataService } from '@/lib/drinkDataService.server';

// Map wizard occasions to drink occasions
function mapOccasion(wizardOccasion: OccasionMood): Occasion {
  const mapping: Record<OccasionMood, Occasion> = {
    'casual': 'casual',
    'party': 'celebration',
    'romantic': 'romantic', 
    'relaxing': 'casual',
    'sports': 'sports',
    'exploring': 'exploring',
    'newly21': 'newly21',
    'birthday': 'birthday',
    'business': 'business'
  };
  return mapping[wizardOccasion];
}

interface PreferenceScore {
  drink: Drink;
  score: number;
  reasons: string[];
}

export async function matchDrinksToPreferences(
  preferences: WizardPreferences,
  weatherData?: WeatherData | null,
  isMetricUnit: boolean = false,
  debug: boolean = false,
  limit: number = 10
): Promise<DrinkRecommendation[]> {
  const { drinks: allDrinks } = await drinkDataService.getAllDrinks();
  let scores: PreferenceScore[] = [];
  
  // Get popularity data
  const popularDrinks = await getPopularDrinks();
  const popularityMap = new Map(popularDrinks.map(p => [p.drink_id, p.like_count]));

  if (debug) {
    console.log('🔍 DEBUG: Matching drinks to preferences:', preferences);
    console.log('🔍 DEBUG: Total drinks in database:', allDrinks.length);
    console.log('🔍 DEBUG: Popular drinks loaded:', popularDrinks.length);
  }

  // Pre-filter drinks by category if specified
  const filteredDrinks = preferences.category && preferences.category !== 'any' && preferences.category !== 'featured'
    ? allDrinks.filter(drink => drink.category === preferences.category)
    : allDrinks;

  for (const drink of filteredDrinks) {
    let score = 0;
    const matchReasons: string[] = [];

    // Category matching (25 points)
    if (preferences.category) {
      if (preferences.category === 'any' || preferences.category === 'featured') {
        score += 15;
        matchReasons.push('versatile-choice');
      } else if (drink.category === preferences.category) {
        score += 25;
        matchReasons.push('perfect-category');
      }
    }

    // Flavor matching (25 points)
    if (preferences.flavor && preferences.flavor.length > 0) {
      const matchingFlavors = drink.flavor_profile.filter(flavor => 
        preferences.flavor?.includes(flavor)
      );
      if (matchingFlavors.length > 0) {
        score += Math.min(25, matchingFlavors.length * 15);
        matchReasons.push(`matches-${matchingFlavors.join('-')}`);
      }
    }

    // Strength matching (20 points)
    if (preferences.strength === drink.strength) {
      score += 20;
      matchReasons.push('perfect-strength');
    } else if (preferences.strength === 'medium') {
      // Medium preference is more flexible
      score += 10;
      matchReasons.push('compatible-strength');
    }

    // Adventure level (15 points)
    if (preferences.adventure) {
      const adventureScores = {
        'classic': drink.occasions.includes('casual') ? 15 : 5,
        'bold': drink.strength === 'strong' || drink.flavor_profile.includes('bitter') ? 15 : 5,
        'fruity': drink.flavor_profile.includes('sweet') || drink.flavor_profile.includes('sour') ? 15 : 5,
        'simple': drink.ingredients.length <= 4 ? 15 : 5
      };
      score += adventureScores[preferences.adventure] || 5;
      if (adventureScores[preferences.adventure] === 15) {
        matchReasons.push(`${preferences.adventure}-adventure`);
      }
    }

    // Occasion matching (15 points)
    if (preferences.occasion) {
      const mappedOccasion = mapOccasion(preferences.occasion);
      if (drink.occasions.includes(mappedOccasion)) {
        score += 15;
        matchReasons.push(`perfect-for-${preferences.occasion}`);
      } else if (preferences.occasion === 'party' && drink.occasions.includes('casual')) {
        score += 8;
        matchReasons.push('party-friendly');
      }
    }

    // Weather bonus (15 points) - Optional
    if (weatherData && preferences.useWeather) {
      const currentTemp = weatherData.current.temp;
      const displayTemp = isMetricUnit ? currentTemp : Math.round((currentTemp * 9/5) + 32);
      const tempUnit = isMetricUnit ? '°C' : '°F';
      
      if (currentTemp >= drink.weather_match.temp_min && 
          currentTemp <= drink.weather_match.temp_max) {
        score += 15;
        matchReasons.push(`ideal-for-${displayTemp}${tempUnit}`);
      } else if (Math.abs(currentTemp - drink.weather_match.ideal_temp) < 10) {
        score += 8;
        matchReasons.push('weather-appropriate');
      }
    }

    // Happy hour bonus (10 points)
    const happyHourBonus = getHappyHourBonus(drink);
    if (happyHourBonus > 0) {
      score += happyHourBonus;
      matchReasons.push('happy-hour-special');
    }

    // Popularity bonus (up to 10 points)
    const likeCount = popularityMap.get(drink.id) || 0;
    if (likeCount > 0) {
      const popularityBonus = Math.min(10, Math.floor(likeCount / 10));
      score += popularityBonus;
      if (likeCount >= 100) {
        matchReasons.push('crowd-favorite');
      } else if (likeCount >= 50) {
        matchReasons.push('popular-choice');
      } else if (likeCount >= 20) {
        matchReasons.push('well-liked');
      }
    }

    // Check allergies - filter out unsafe drinks
    if (preferences.allergies && preferences.allergies.length > 0) {
      const isSafe = isSafeForAllergies(drink.ingredients, preferences.allergies);
      if (!isSafe) {
        score = -1; // Mark as unsafe
        if (debug) {
          console.log(`🚫 Filtered out ${drink.name} due to allergies`);
        }
      } else {
        matchReasons.push('allergy-safe');
      }
    }

    // Featured drinks bonus
    if (drink.featured && preferences.category === 'featured') {
      score += 20;
      matchReasons.push('featured-special');
    }

    // Special occasion bonuses
    if (preferences.occasion === 'newly21' && drink.funForTwentyOne) {
      score += 10;
      matchReasons.push('perfect-for-21');
    }
    if (preferences.occasion === 'birthday' && drink.goodForBDay) {
      score += 10;
      matchReasons.push('birthday-special');
    }

    if (score > 0) {
      scores.push({ drink, score, reasons: matchReasons });
    }
  }

  // Sort by score (highest first)
  scores.sort((a, b) => b.score - a.score);

  if (debug) {
    console.log('🎯 DEBUG: Top 5 matches:');
    scores.slice(0, 5).forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.drink.name} (${item.drink.category}) - Score: ${item.score}`);
      console.log(`     Reasons: ${item.reasons.join(', ')}`);
    });
  }

  // Convert to DrinkRecommendation format and apply limit
  return scores.slice(0, limit).map(({ drink, score, reasons }) => ({
    drink,
    score,
    reasons: generateReadableReasons(reasons, drink, preferences, weatherData, isMetricUnit)
  }));
}

function generateReadableReasons(
  matchReasons: string[],
  drink: Drink,
  preferences: WizardPreferences,
  weatherData?: WeatherData | null,
  isMetricUnit: boolean = false
): string[] {
  const readableReasons: string[] = [];

  // Category match
  if (matchReasons.includes('perfect-category')) {
    readableReasons.push(`Perfect ${drink.category} match`);
  }

  // Flavor matches
  const flavorMatches = matchReasons.filter(r => r.startsWith('matches-'));
  if (flavorMatches.length > 0) {
    const flavors = flavorMatches[0].replace('matches-', '').split('-');
    readableReasons.push(`Matches your ${flavors.join(' & ')} preference`);
  }

  // Strength match
  if (matchReasons.includes('perfect-strength')) {
    readableReasons.push(`${drink.strength.charAt(0).toUpperCase() + drink.strength.slice(1)} strength as requested`);
  }

  // Adventure level
  const adventureReasons = matchReasons.filter(r => r.includes('-adventure'));
  if (adventureReasons.length > 0) {
    const adventureType = adventureReasons[0].replace('-adventure', '');
    const adventureMessages = {
      'classic': 'A timeless classic choice',
      'bold': 'Bold and adventurous',
      'fruity': 'Fruity and refreshing',
      'simple': 'Simple and straightforward'
    };
    readableReasons.push(adventureMessages[adventureType as keyof typeof adventureMessages] || '');
  }

  // Occasion
  const occasionReasons = matchReasons.filter(r => r.startsWith('perfect-for-'));
  if (occasionReasons.length > 0) {
    const occasion = occasionReasons[0].replace('perfect-for-', '');
    const occasionMessages = {
      'casual': 'Perfect for casual enjoyment',
      'party': 'Great party drink',
      'romantic': 'Ideal for a romantic evening',
      'relaxing': 'Perfect for unwinding',
      'sports': 'Great for game day',
      'exploring': 'Perfect for trying something new',
      'newly21': 'Great first legal drink',
      'birthday': 'Perfect birthday celebration drink',
      'business': 'Sophisticated business choice'
    };
    readableReasons.push(occasionMessages[occasion as keyof typeof occasionMessages] || '');
  }

  // Weather
  const weatherReasons = matchReasons.filter(r => r.includes('ideal-for-') || r === 'weather-appropriate');
  if (weatherReasons.length > 0 && weatherData) {
    if (weatherReasons[0].includes('ideal-for-')) {
      const temp = weatherReasons[0].replace('ideal-for-', '');
      readableReasons.push(`Ideal for ${temp} weather`);
    } else {
      readableReasons.push('Great for current weather');
    }
  }

  // Special features
  if (matchReasons.includes('happy-hour-special')) {
    readableReasons.push('🎉 Happy Hour Special!');
  }
  if (matchReasons.includes('featured-special')) {
    readableReasons.push('⭐ Featured Drink');
  }
  if (matchReasons.includes('perfect-for-21')) {
    readableReasons.push('🎂 Perfect for your 21st!');
  }
  if (matchReasons.includes('birthday-special')) {
    readableReasons.push('🎈 Birthday Special');
  }

  // Popularity
  if (matchReasons.includes('crowd-favorite')) {
    readableReasons.push('👥 Crowd Favorite');
  } else if (matchReasons.includes('popular-choice')) {
    readableReasons.push('👍 Popular Choice');
  } else if (matchReasons.includes('well-liked')) {
    readableReasons.push('💜 Well-liked');
  }

  // Allergy safe
  if (matchReasons.includes('allergy-safe') && preferences.allergies && preferences.allergies.length > 0) {
    readableReasons.push('✓ Safe for your allergies');
  }

  // Ensure we always have at least one reason
  if (readableReasons.length === 0) {
    readableReasons.push('Great match for your preferences');
  }

  return readableReasons;
}