import { Drink, DrinkRecommendation, Occasion } from '@/app/types/drinks';
import { WizardPreferences, OccasionMood } from '@/app/types/wizard';
import { WeatherData } from '@/app/types/weather';
import { getHappyHourBonus } from '@/lib/happyHour';
import { getPopularDrinks } from '@/lib/supabase';
import { isSafeForAllergies } from '@/lib/allergenDetector';

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
import { drinkDataService } from '@/lib/drinkDataService';

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



  for (const drink of allDrinks) {
    let score = 0;
    const reasons: string[] = [];

    if (debug) {
      console.log(`\n🍹 DEBUG: Scoring "${drink.name}" (category: ${drink.category}, strength: ${drink.strength}, abv: ${drink.abv})`);
    }


    // 0. ALLERGY FILTERING - FIRST PRIORITY (Safety first!)
    if (preferences.allergies && preferences.allergies.length > 0) {
      const isSafe = isSafeForAllergies(drink.ingredients, preferences.allergies);
      if (!isSafe) {
        if (debug) {
          console.log(`   ❌ ALLERGY EXCLUSION: Contains allergens for user with allergies: ${preferences.allergies.join(', ')}`);
        }
        continue; // Skip this drink entirely - safety first!
      }
    }

    // 1. Flavor matching (25 points max)
    if (preferences.flavor) {
      const flavorMap: Record<string, string[]> = {
        'crisp': ['crisp', 'clean', 'refreshing', 'bright'],
        'smoky': ['smoky', 'peaty', 'smoky', 'charred'],
        'sweet': ['sweet', 'fruity'],
        'bitter': ['bitter', 'herbal'],
        'sour': ['sour', 'citrus'],
        'smooth': ['smooth', 'creamy', 'mild']
      };

      const preferredFlavors = flavorMap[preferences.flavor] || [];
      const matchingFlavors = drink.flavor_profile.filter(f => 
        preferredFlavors.some(pf => f.toLowerCase().includes(pf))
      );

      if (matchingFlavors.length > 0) {
        score += 25;
        reasons.push(`Matches your ${preferences.flavor} preference`);
      }
    }

    // 2. Category matching (20 points max) - High priority for direct category selection
    if (preferences.category && preferences.category !== 'any') {
      if (debug) {
        console.log(`   🎯 Category check: preference="${preferences.category}" vs drink="${drink.category}"`);
      }
      
      // Special handling for featured category
      if (preferences.category === 'featured') {
        // Only include featured drinks
        if (!drink.featured) {
          if (debug) {
            console.log(`   ❌ Not a featured drink - EXCLUDED`);
          }
          continue; // Skip non-featured drinks
        }
        // Featured drinks get base points
        score += 20;
        reasons.push('⭐ Featured Drink');
        if (debug) {
          console.log(`   ✅ Featured drink! +20 points`);
        }
      } else if (drink.category === preferences.category) {
        score += 20;
        const categoryReasons: Record<string, string> = {
          'beer': 'Your preferred beer style',
          'wine': 'Your preferred wine selection',
          'cocktail': 'Your preferred cocktail choice',
          'spirit': 'Your preferred spirit selection',
          'non-alcoholic': 'Your preferred non-alcoholic option'
        };
        reasons.push(categoryReasons[preferences.category] || 'Matches your preferred category');
        if (debug) {
          console.log(`   ✅ Category MATCH! +20 points`);
        }
      } else {
        // If category doesn't match, exclude this drink entirely
        if (debug) {
          console.log(`   ❌ Category mismatch - EXCLUDED`);
        }
        continue; // Skip this drink entirely
      }
    }

    // 3. Strength matching (20 points max) - Based on actual ABV for accuracy
    if (preferences.strength) {
      let matchesStrength = false;
      
      // Use ABV-based strength categorization for accurate matching
      if (preferences.strength === 'light' && drink.abv <= 12) {
        matchesStrength = true;
      } else if (preferences.strength === 'medium' && drink.abv > 12 && drink.abv <= 25) {
        matchesStrength = true;
      } else if (preferences.strength === 'strong' && drink.abv > 25) {
        matchesStrength = true;
      }
      
      if (matchesStrength) {
        score += 20;
        const strengthLabels = {
          'light': 'Easy Going',
          'medium': 'Balanced', 
          'strong': 'Bring the Power'
        };
        reasons.push(`${strengthLabels[preferences.strength]} (${drink.abv}% ABV)`);
      }
    }

    // 4. Adventure/Style matching (15 points max)
    if (preferences.adventure) {
      const adventureMap: Record<string, (drink: Drink) => boolean> = {
        'classic': (d) => ['Old Fashioned', 'Martini', 'Manhattan', 'Whiskey Sour', 'Margarita'].includes(d.name),
        'bold': (d) => d.flavor_profile.includes('bitter') || d.strength === 'strong',
        'fruity': (d) => d.flavor_profile.includes('sweet'),
        'simple': (d) => (d.ingredients?.length || 0) <= 3 || d.category === 'beer' || d.category === 'wine'
      };

      if (adventureMap[preferences.adventure]?.(drink)) {
        score += 15;
        const adventureReasons: Record<string, string> = {
          'classic': 'A timeless classic',
          'bold': 'Bold and adventurous',
          'fruity': 'Fruity and fun',
          'simple': 'Simple and clean'
        };
        reasons.push(adventureReasons[preferences.adventure]);
      }
    }

    // 4.5 Compound matching - bonus points for perfect combinations (10 points max)
    if (preferences.flavor && preferences.occasion) {
      // Sweet + Party = sweet cocktails get bonus
      if (preferences.flavor === 'sweet' && (preferences.occasion === 'party' || preferences.occasion === 'birthday') && 
          drink.category === 'cocktail' && drink.flavor_profile.includes('sweet')) {
        score += 10;
        reasons.push('Perfect party cocktail');
      }
      
      // Crisp + Romantic = smooth wines and spirits get bonus
      if (preferences.flavor === 'crisp' && preferences.occasion === 'romantic' && 
          (drink.category === 'wine' || (drink.category === 'spirit' && drink.strength !== 'strong'))) {
        score += 10;
        reasons.push('Romantic and refreshing');
      }
      
      // Smoky + Business = whiskeys and aged spirits get bonus
      if (preferences.flavor === 'smoky' && preferences.occasion === 'business' && 
          (drink.name.toLowerCase().includes('whiskey') || drink.name.toLowerCase().includes('bourbon') || 
           drink.name.toLowerCase().includes('scotch'))) {
        score += 10;
        reasons.push('Professional choice');
      }
      
      // Sour + Sports = beers and refreshing cocktails get bonus
      if (preferences.flavor === 'sour' && preferences.occasion === 'sports' && 
          (drink.category === 'beer' || (drink.flavor_profile.includes('sour') && drink.strength === 'light'))) {
        score += 10;
        reasons.push('Game day refresher');
      }
    }

    // 5. Occasion matching (15 points max)
    if (preferences.occasion) {
      // Special handling for newly 21 and birthday occasions
      if (preferences.occasion === 'newly21' && drink.funForTwentyOne) {
        score += 25; // Extra bonus for newly 21 drinks
        reasons.push('🎂 Perfect for your 21st celebration!');
      } else if (preferences.occasion === 'birthday' && drink.goodForBDay) {
        score += 25; // Extra bonus for birthday drinks
        reasons.push('🎉 Perfect for your birthday celebration!');
      } else if (preferences.occasion && drink.occasions?.includes(mapOccasion(preferences.occasion))) {
        score += 15;
        const occasionReasons: Record<string, string> = {
          'casual': 'Perfect for relaxing',
          'party': 'Great for parties',
          'romantic': 'Sets the mood',
          'relaxing': 'Helps you unwind',
          'sports': 'Great for game day',
          'exploring': 'Perfect for discovery'
        };
        reasons.push(occasionReasons[preferences.occasion]);
      }
    }

    // 6. Temperature preference (10 points max)
    if (preferences.temperature) {
      const tempMap: Record<string, (drink: Drink) => boolean> = {
        'cold': (d) => d.weather_match.ideal_temp <= 10 || d.category === 'beer',
        'cool': (d) => d.weather_match.ideal_temp <= 20,
        'room': (d) => d.weather_match.ideal_temp >= 15 && d.weather_match.ideal_temp <= 25,
        'warm': (d) => d.weather_match.ideal_temp >= 20 || d.name.toLowerCase().includes('toddy')
      };

      if (tempMap[preferences.temperature]?.(drink)) {
        score += 10;
      }
    }

    // 7. Weather bonus (15 points max) - if weather integration is enabled
    if (preferences.useWeather && weatherData) {
      const temp = weatherData.current.temp;
      const weatherCondition = weatherData.current.main.toLowerCase() || '';
      const description = weatherData.current.description?.toLowerCase() || '';

      // Temperature matching
      if (drink.weather_match) {
        if (temp >= drink.weather_match.temp_min && temp <= drink.weather_match.temp_max) {
          score += 10;
          reasons.push(`Great for ${Math.round(isMetricUnit ? temp : temp * 9/5 + 32)}°${isMetricUnit ? 'C' : 'F'}`);
        }

        // Weather condition matching with enhanced logic
        if (drink.weather_match.conditions?.includes(weatherCondition)) {
          score += 5;
          
          // Extra bonus for perfect weather matches
          if (weatherCondition === 'rain' && drink.category === 'spirit') {
            score += 3;
            reasons.push('Cozy rainy day drink');
          } else if (weatherCondition === 'clear' && drink.weather_match.ideal_temp >= 25) {
            score += 3;
            reasons.push('Perfect for sunny weather');
          } else if ((weatherCondition === 'snow' || temp < 5) && 
                    (drink.name.toLowerCase().includes('toddy') || 
                     drink.preparation?.toLowerCase().includes('warm') ||
                     drink.weather_match.ideal_temp <= 10)) {
            score += 3;
            reasons.push('Warms you up');
          }
        }
        
        // Humidity consideration (if available in weather data)
        if (description.includes('humid') && drink.strength === 'light') {
          score += 2;
          reasons.push('Refreshing in humidity');
        }
      }
    }

    // 8. Happy Hour bonus (25 points max) - for drinks during happy hour
    const happyHourBonus = getHappyHourBonus(drink);
    if (happyHourBonus > 0) {
      score += happyHourBonus;
      reasons.push(`🍻 Happy Hour Special - ${drink.happy_hour_price}!`);
    }

    // 9. Casual occasion bonus for happy hour selection
    if (preferences.occasion === 'casual' && drink.happy_hour) {
      score += 5;
      reasons.push('Perfect for happy hour');
    }

    // 10. Additional featured drink bonus (if featured drinks category selected)
    if (preferences.category === 'featured' && drink.featured) {
      score += 15; // Extra bonus to ensure featured drinks rank higher
      reasons.push('Hand-picked by our experts');
    }

    // 11. Popularity bonus (10 points max) - based on like count
    const likeCount = popularityMap.get(drink.id) || 0;
    if (likeCount > 0) {
      const popularityBonus = Math.min(10, Math.floor(likeCount / 2)); // 2 likes = 1 point, max 10 points
      score += popularityBonus;
      
      if (likeCount >= 20) {
        reasons.push('🔥 Crowd favorite!');
      } else if (likeCount >= 10) {
        reasons.push('⭐ Popular choice');
      } else if (likeCount >= 5) {
        reasons.push('👍 Well-liked');
      }
      
      if (debug) {
        console.log(`   💝 Popularity bonus: ${popularityBonus} points (${likeCount} likes)`);
      }
    }

    if (debug) {
      console.log(`   📊 Final score: ${score} points`);
      if (score > 0) {
        console.log(`   ✅ Added to results`);
      } else {
        console.log(`   ❌ Excluded (score: 0)`);
      }
    }

    if (score > 0) {
      // Add small random variance to scores for better mixing (±3 points)
      const randomVariance = (Math.random() - 0.5) * 6;
      
      // Occasionally give a random drink a bigger boost for more variety
      const randomBoost = Math.random() < 0.1 ? Math.random() * 10 : 0;
      
      // Special case: if base score is very high (80+), give chance for 100%
      const perfectMatchBonus = score >= 80 && Math.random() < 0.15 ? (100 - score) : 0;
      
      const randomizedScore = score + randomVariance + randomBoost + perfectMatchBonus;
      const finalScore = Math.max(0, Math.round(randomizedScore));
      
      // Ensure perfect matches can reach 100%
      const cappedScore = Math.min(100, finalScore);
      
      if (debug && perfectMatchBonus > 0) {
        console.log(`🎯 Perfect match bonus: "${drink.name}" boosted to 100%`);
      }
      
      scores.push({ drink, score: cappedScore, reasons });
      
      if (debug && randomBoost > 0) {
        console.log(`🎲 Random boost: "${drink.name}" got +${randomBoost.toFixed(1)} points`);
      }
    }
  }

  // Group drinks by score ranges for better randomization
  const scoreGroups = new Map<number, PreferenceScore[]>();
  scores.forEach(item => {
    // Group by 10-point ranges for more mixing (e.g., 80-89, 70-79, etc.)
    const groupKey = Math.floor(item.score / 10) * 10;
    if (!scoreGroups.has(groupKey)) {
      scoreGroups.set(groupKey, []);
    }
    scoreGroups.get(groupKey)!.push(item);
  });

  // Shuffle within each score group using Fisher-Yates algorithm
  scoreGroups.forEach((group, scoreRange) => {
    if (debug) {
      console.log(`🎲 Shuffling ${group.length} drinks in ${scoreRange}-${scoreRange + 9} score range`);
    }
    // Fisher-Yates shuffle algorithm
    for (let i = group.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [group[i], group[j]] = [group[j], group[i]];
    }
  });

  // Rebuild scores array with shuffled groups
  const shuffledScores: PreferenceScore[] = [];
  const sortedGroupKeys = Array.from(scoreGroups.keys()).sort((a, b) => b - a);
  
  sortedGroupKeys.forEach(key => {
    const group = scoreGroups.get(key)!;
    
    // Special handling for happy hour drinks
    const isHappyHourActive = group.some(item => getHappyHourBonus(item.drink) > 0);
    if (isHappyHourActive) {
      // Put happy hour drinks first within the group
      const happyHourDrinks = group.filter(item => item.drink.happy_hour);
      const regularDrinks = group.filter(item => !item.drink.happy_hour);
      shuffledScores.push(...happyHourDrinks, ...regularDrinks);
    } else {
      shuffledScores.push(...group);
    }
  });

  scores = shuffledScores;
  
  // Final sort: Ensure 90%+ matches are always at the front
  const perfectMatches = scores.filter(s => s.score >= 90);
  if (debug && perfectMatches.length > 0) {
    console.log(`🌟 Found ${perfectMatches.length} exceptional matches (90%+) - prioritizing to front!`);
  }
  
  scores.sort((a, b) => {
    // First priority: 90%+ matches always come first
    if (a.score >= 90 && b.score < 90) return -1;
    if (a.score < 90 && b.score >= 90) return 1;
    
    // If both are 90%+ or both are under 90%, maintain randomized order
    return 0;
  });
  
  if (debug) {
    console.log(`\n🏆 DEBUG: Final Results (top ${limit} of ${scores.length} scored drinks) - Randomized at ${new Date().toLocaleTimeString()}:`);
    console.log(`📊 LIMIT REQUESTED: ${limit}`);
    console.log(`📊 SCORES ARRAY LENGTH: ${scores.length}`);
    console.log(`📊 RETURNING: ${Math.min(limit, scores.length)} drinks`);
    scores.slice(0, limit).forEach((result, index) => {
      console.log(`${index + 1}. "${result.drink.name}" - ${result.score} points (${result.drink.category}, ${result.drink.strength}, ${result.drink.abv}% ABV)`);
      console.log(`   Reasons: ${result.reasons.join(', ')}`);
    });
  }
  
  const finalResults = scores.slice(0, limit).map(({ drink, score, reasons }) => ({
    drink,
    score,
    reasons
  }));
  
  console.log(`🎯 RETURNING ${finalResults.length} drinks to WizardResults`);
  
  return finalResults;
}

// Helper function to get a fun match message based on score
export function getMatchMessage(score: number): string {
  if (score >= 80) return "Perfect Match! 🎯";
  if (score >= 60) return "Great Match! ⭐";
  if (score >= 40) return "Good Match! 👍";
  return "Worth a Try! 🤔";
}

// Function to get additional drinks that weren't in the initial matches
export async function getAdditionalDrinks(
  preferences: WizardPreferences,
  excludeIds: string[],
  limit: number = 20
): Promise<DrinkRecommendation[]> {
  const { drinks: allDrinks } = await drinkDataService.getAllDrinks();
  
  // Get popularity data
  const popularDrinks = await getPopularDrinks();
  const popularityMap = new Map(popularDrinks.map(p => [p.drink_id, p.like_count]));
  
  // Filter out already shown drinks and apply basic category filter
  const availableDrinks = allDrinks.filter(drink => {
    // Exclude already shown drinks
    if (excludeIds.includes(drink.id)) return false;
    
    // Apply category filter if specified
    if (preferences.category && preferences.category !== 'any') {
      if (preferences.category === 'featured' && !drink.featured) return false;
      if (preferences.category !== 'featured' && drink.category !== preferences.category) return false;
    }
    
    // Apply allergy filter
    if (preferences.allergies && preferences.allergies.length > 0) {
      const isSafe = isSafeForAllergies(drink.ingredients, preferences.allergies);
      if (!isSafe) return false;
    }
    
    return true;
  });
  
  // Calculate basic scores for additional drinks
  const scoredDrinks = availableDrinks.map(drink => {
    let score = 15; // Base score for additional drinks
    const reasons = ['More options to explore!'];
    
    // Basic flavor matching (10 points)
    if (preferences.flavor) {
      const flavorMap: Record<string, string[]> = {
        'crisp': ['crisp', 'clean', 'refreshing', 'bright'],
        'smoky': ['smoky', 'peaty', 'smoky', 'charred'],
        'sweet': ['sweet', 'fruity'],
        'bitter': ['bitter', 'herbal'],
        'sour': ['sour', 'citrus'],
        'smooth': ['smooth', 'creamy', 'mild']
      };
      
      const preferredFlavors = flavorMap[preferences.flavor] || [];
      const matchingFlavors = drink.flavor_profile.filter(f => 
        preferredFlavors.some(pf => f.toLowerCase().includes(pf))
      );
      
      if (matchingFlavors.length > 0) {
        score += 10;
        reasons.push(`${preferences.flavor} flavors`);
      }
    }
    
    // Category already matches (5 points)
    score += 5;
    reasons.push('Same category');
    
    // Strength matching (8 points)
    if (preferences.strength && drink.strength === preferences.strength) {
      score += 8;
      reasons.push(`${preferences.strength} strength`);
    }
    
    // Featured bonus (5 points)
    if (drink.featured) {
      score += 5;
      reasons.push('Featured drink');
    }
    
    // Happy hour bonus (10 points)
    const happyHourBonus = getHappyHourBonus(drink);
    if (happyHourBonus > 0) {
      score += 10;
      reasons.push('Happy hour special');
    }
    
    // Popularity bonus (5 points max)
    const likeCount = popularityMap.get(drink.id) || 0;
    if (likeCount > 0) {
      const popularityBonus = Math.min(5, Math.floor(likeCount / 4));
      score += popularityBonus;
      if (likeCount >= 10) {
        reasons.push('Popular choice');
      }
    }
    
    // Add small random variance (±3 points)
    const randomVariance = (Math.random() - 0.5) * 6;
    const finalScore = Math.max(15, Math.min(65, Math.round(score + randomVariance)));
    
    return {
      drink,
      score: finalScore,
      reasons: reasons.slice(0, 3) // Limit to 3 reasons
    };
  });
  
  // Sort by score (descending) and take the top drinks
  scoredDrinks.sort((a, b) => b.score - a.score);
  
  return scoredDrinks.slice(0, limit);
}

// Function to get additional drinks from all categories while maintaining allergy restrictions
export async function getAdditionalDrinksFromAllCategories(
  preferences: WizardPreferences,
  excludeIds: string[],
  limit: number = 10
): Promise<DrinkRecommendation[]> {
  // Create a new preferences object that opens up the category but keeps allergies
  const expandedPrefs = {
    ...preferences,
    allergies: preferences.allergies, // Explicitly keep allergy restrictions
    category: 'any' as const // Open up to all categories
  };
  
  // Use the existing getAdditionalDrinks function with expanded preferences
  return getAdditionalDrinks(expandedPrefs, excludeIds, limit);
}