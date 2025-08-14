import { Coordinates, DistanceResult, DistanceOptions } from '@/app/types/bars';

/**
 * Calculate the distance between two coordinates using the Haversine formula
 */
export function calculateDistance(
  point1: Coordinates,
  point2: Coordinates,
  options: DistanceOptions = {}
): DistanceResult {
  const { unit = 'km', precision = 2 } = options;

  // Convert latitude and longitude from degrees to radians
  const lat1Rad = toRadians(point1.latitude);
  const lat2Rad = toRadians(point2.latitude);
  const deltaLatRad = toRadians(point2.latitude - point1.latitude);
  const deltaLngRad = toRadians(point2.longitude - point1.longitude);

  // Haversine formula
  const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
           Math.cos(lat1Rad) * Math.cos(lat2Rad) *
           Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // Earth's radius in kilometers
  const earthRadiusKm = 6371;
  const distanceKm = earthRadiusKm * c;
  const distanceMiles = distanceKm * 0.621371;

  return {
    distance_km: parseFloat(distanceKm.toFixed(precision)),
    distance_miles: parseFloat(distanceMiles.toFixed(precision))
  };
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate bearing (direction) from point1 to point2
 */
export function calculateBearing(point1: Coordinates, point2: Coordinates): number {
  const lat1Rad = toRadians(point1.latitude);
  const lat2Rad = toRadians(point2.latitude);
  const deltaLngRad = toRadians(point2.longitude - point1.longitude);

  const y = Math.sin(deltaLngRad) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
           Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(deltaLngRad);

  const bearingRad = Math.atan2(y, x);
  const bearingDeg = (toDegrees(bearingRad) + 360) % 360; // Normalize to 0-360

  return parseFloat(bearingDeg.toFixed(1));
}

/**
 * Convert radians to degrees
 */
function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Get compass direction from bearing
 */
export function getCompassDirection(bearing: number): string {
  const directions = [
    'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'
  ];
  const index = Math.round(bearing / 22.5) % 16;
  return directions[index];
}

/**
 * Format distance for display
 */
export function formatDistance(distance: number, unit: 'km' | 'miles' = 'miles'): string {
  // If the input is already in the desired unit, use as-is
  // Otherwise convert (this handles legacy km inputs when unit is 'miles')
  const displayDistance = distance;
  const unitLabel = unit === 'km' ? 'km' : 'mi';

  if (displayDistance < 0.1) {
    return `< 0.1 ${unitLabel}`;
  } else if (displayDistance < 1) {
    return `${displayDistance.toFixed(1)} ${unitLabel}`;
  } else {
    return `${displayDistance.toFixed(0)} ${unitLabel}`;
  }
}

/**
 * Check if coordinates are valid
 */
export function isValidCoordinates(coords: Coordinates): boolean {
  return (
    typeof coords.latitude === 'number' &&
    typeof coords.longitude === 'number' &&
    coords.latitude >= -90 &&
    coords.latitude <= 90 &&
    coords.longitude >= -180 &&
    coords.longitude <= 180 &&
    !isNaN(coords.latitude) &&
    !isNaN(coords.longitude)
  );
}

/**
 * Get current location using browser's geolocation API
 */
export function getCurrentPosition(options?: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    const defaultOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 300000, // 5 minutes
      ...options
    };

    navigator.geolocation.getCurrentPosition(
      resolve,
      reject,
      defaultOptions
    );
  });
}

/**
 * Watch position changes
 */
export function watchPosition(
  callback: (position: GeolocationPosition) => void,
  errorCallback?: (error: GeolocationPositionError) => void,
  options?: PositionOptions
): number {
  if (!navigator.geolocation) {
    throw new Error('Geolocation is not supported by this browser');
  }

  const defaultOptions: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 300000, // 5 minutes
    ...options
  };

  return navigator.geolocation.watchPosition(
    callback,
    errorCallback,
    defaultOptions
  );
}

/**
 * Clear position watch
 */
export function clearWatch(watchId: number): void {
  if (navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
  }
}

/**
 * Get user location from IP address (fallback method)
 */
export async function getLocationFromIP(): Promise<Coordinates | null> {
  try {
    const response = await fetch('/api/location/ip');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success && data.location) {
      return {
        latitude: data.location.latitude,
        longitude: data.location.longitude
      };
    }
    
    return null;
  } catch (error) {
    console.error('Failed to get location from IP:', error);
    return null;
  }
}

/**
 * Estimate location accuracy description
 */
export function getAccuracyDescription(accuracy: number): string {
  if (accuracy <= 5) return 'Very accurate';
  if (accuracy <= 20) return 'Accurate';
  if (accuracy <= 100) return 'Moderately accurate';
  if (accuracy <= 1000) return 'Rough estimate';
  return 'Very rough estimate';
}

/**
 * Calculate bounds for a given center point and radius
 */
export function calculateBounds(center: Coordinates, radiusKm: number): {
  north: number;
  south: number;
  east: number;
  west: number;
} {
  const latDiff = radiusKm / 111.32; // 1 degree latitude ≈ 111.32 km
  const lngDiff = radiusKm / (111.32 * Math.cos(toRadians(center.latitude)));

  return {
    north: center.latitude + latDiff,
    south: center.latitude - latDiff,
    east: center.longitude + lngDiff,
    west: center.longitude - lngDiff
  };
}