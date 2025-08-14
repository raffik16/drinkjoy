// Location and coordinate types
export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zip_code: string;
  formatted?: string;
}

// User location with metadata
export interface UserLocation {
  location: Coordinates;
  accuracy: number;
  timestamp: number;
  source: 'gps' | 'ip' | 'manual';
}

// Bar information from master sheet
export interface Bar {
  id: string;
  name: string;
  description?: string;
  address: Address;
  location: Coordinates;
  phone?: string;
  website?: string;
  menu_sheet_id: string;
  active: boolean;
  hours?: {
    [key: string]: {
      open: string;
      close: string;
    };
  };
  features?: string[];
  image_url?: string;
  created_at: string;
  updated_at: string;
}

// Bar with calculated distance
export interface BarDistance extends Bar {
  distance_km: number;
  distance_miles: number;
}

// Bar context state
export interface BarContext {
  current_bar: Bar | null;
  user_location: UserLocation | null;
  nearby_bars: BarDistance[];
  location_enabled: boolean;
  search_radius_miles: number;
  has_searched_further: boolean;
  loading: {
    bars: boolean;
    location: boolean;
    current_bar: boolean;
    expanded_search: boolean;
  };
  errors: {
    bars?: string;
    location?: string;
    current_bar?: string;
    expanded_search?: string;
  };
}

// API request/response types
export interface NearbyBarsRequest {
  latitude: number;
  longitude: number;
  max_distance_miles?: number;
  limit?: number;
  active_only?: boolean;
}

export interface NearbyBarsResponse {
  success: boolean;
  bars?: BarDistance[];
  count?: number;
  error?: string;
}

export interface BarResponse {
  success: boolean;
  bar?: Bar;
  error?: string;
}

export interface BarsListResponse {
  success: boolean;
  bars?: Bar[];
  count?: number;
  error?: string;
}

// Google Sheets mapping for bars
export interface BarSheetRow {
  ID: string;
  Name: string;
  Description?: string;
  Street: string;
  City: string;
  State: string;
  ZipCode: string;
  Latitude: string;
  Longitude: string;
  Phone?: string;
  Website?: string;
  MenuSheetID: string;
  Active: string;
  Hours?: string;
  Features?: string;
  ImageURL?: string;
  CreatedAt?: string;
  UpdatedAt?: string;
}

// Distance calculation utilities
export interface DistanceOptions {
  unit?: 'km' | 'miles';
  precision?: number;
}

export interface DistanceResult {
  distance_km: number;
  distance_miles: number;
}