export type DrinkCategory = 'beer' | 'wine' | 'cocktail' | 'spirit' | 'non-alcoholic';
export type FlavorProfile = 'sweet' | 'bitter' | 'sour' | 'savory' | 'refreshing' | 'fruity' | 'spicy' | 'smoky' | 'herbal';
export type DrinkStrength = 'light' | 'medium' | 'strong' | 'non-alcoholic';
export type Occasion = 'casual' | 'party' | 'romantic' | 'business' | 'relaxing' | 'celebration' | 'sports' | 'exploring';

export interface Drink {
  id: string;
  name: string;
  category: DrinkCategory;
  description: string;
  ingredients: string[];
  abv: number; // Alcohol by volume percentage
  flavor_profile: FlavorProfile[];
  strength: DrinkStrength;
  weather_match: {
    temp_min: number; // Celsius
    temp_max: number; // Celsius
    conditions: string[]; // Weather conditions this drink pairs with
    ideal_temp: number; // Ideal temperature for this drink
  };
  occasions: Occasion[];
  serving_suggestions: string[];
  image_url: string;
  glass_type?: string;
  preparation?: string;
  happy_hour?: boolean;
  happy_hour_price?: string;
  happy_hour_times?: string;
}

export interface DrinkFilters {
  categories?: DrinkCategory[];
  flavors?: FlavorProfile[];
  strength?: DrinkStrength[];
  occasions?: Occasion[];
  search?: string;
}

export interface DrinkRecommendation {
  drink: Drink;
  score: number; // 0-100 recommendation score
  reasons: string[]; // Why this drink was recommended
}