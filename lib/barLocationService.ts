import { Bar, BarDistance, Coordinates, UserLocation, NearbyBarsRequest } from '@/app/types/bars';
import { calculateDistance, isValidCoordinates } from './locationUtils';
import { barDataService } from './barDataService.server';

class BarLocationService {
  /**
   * Find bars near a given location
   */
  async findNearbyBars(request: NearbyBarsRequest): Promise<BarDistance[]> {
    try {
      const {
        latitude,
        longitude,
        max_distance_miles = 10, // Default 10 miles for initial search
        limit = 10,
        active_only = true
      } = request;

      // Validate coordinates
      const userLocation: Coordinates = { latitude, longitude };
      if (!isValidCoordinates(userLocation)) {
        throw new Error('Invalid coordinates provided');
      }

      console.log(`🔍 [BarLocationService] Finding bars within ${max_distance_miles} miles of ${latitude}, ${longitude}`);

      // Get bars from service
      const bars = active_only 
        ? await barDataService.getActiveBars()
        : (await barDataService.getAllBars()).bars;

      if (bars.length === 0) {
        console.warn('No bars available for location search');
        return [];
      }

      // Calculate distances and filter
      const barsWithDistance: BarDistance[] = bars
        .map(bar => {
          const distance = calculateDistance(userLocation, bar.location);
          return {
            ...bar,
            distance_km: distance.distance_km,
            distance_miles: distance.distance_miles
          };
        })
        .filter(bar => bar.distance_miles <= max_distance_miles)
        .sort((a, b) => a.distance_miles - b.distance_miles)
        .slice(0, limit);

      console.log(`✅ Found ${barsWithDistance.length} bars within range`);
      return barsWithDistance;

    } catch (error) {
      console.error('Error finding nearby bars:', error);
      throw error;
    }
  }

  /**
   * Get the closest bar to a location
   */
  async getClosestBar(userLocation: Coordinates): Promise<BarDistance | null> {
    try {
      const nearbyBars = await this.findNearbyBars({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        limit: 1
      });

      return nearbyBars.length > 0 ? nearbyBars[0] : null;
    } catch (error) {
      console.error('Error getting closest bar:', error);
      return null;
    }
  }

  /**
   * Check if a user location is near any bars
   */
  async isNearBars(
    userLocation: Coordinates, 
    maxDistanceMiles: number = 30 // Changed from 50km to 30 miles
  ): Promise<boolean> {
    try {
      const nearbyBars = await this.findNearbyBars({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        max_distance_miles: maxDistanceMiles,
        limit: 1
      });

      return nearbyBars.length > 0;
    } catch (error) {
      console.error('Error checking if near bars:', error);
      return false;
    }
  }

  /**
   * Get bar recommendations based on user location
   */
  async getBarRecommendations(
    userLocation: UserLocation,
    options: {
      maxDistance?: number;
      limit?: number;
      includeFeatures?: string[];
    } = {}
  ): Promise<BarDistance[]> {
    try {
      const {
        maxDistance = 15, // Changed from 25km to 15 miles
        limit = 5,
        includeFeatures = []
      } = options;

      let nearbyBars = await this.findNearbyBars({
        latitude: userLocation.location.latitude,
        longitude: userLocation.location.longitude,
        max_distance_miles: maxDistance,
        limit: limit * 2 // Get more to allow for filtering
      });

      // Filter by features if specified
      if (includeFeatures.length > 0) {
        nearbyBars = nearbyBars.filter(bar => 
          bar.features && includeFeatures.some(feature => 
            bar.features!.includes(feature)
          )
        );
      }

      // Apply final limit
      nearbyBars = nearbyBars.slice(0, limit);

      // Add recommendation scoring
      nearbyBars = this.scoreRecommendations(nearbyBars, userLocation);

      return nearbyBars;
    } catch (error) {
      console.error('Error getting bar recommendations:', error);
      return [];
    }
  }

  /**
   * Score bars for recommendations
   */
  private scoreRecommendations(bars: BarDistance[], userLocation: UserLocation): BarDistance[] {
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    
    return bars.map(bar => {
      let score = 100; // Base score

      // Distance penalty (closer is better) - converted to miles
      if (bar.distance_miles > 6) score -= 20; // ~10km = 6 miles
      else if (bar.distance_miles > 3) score -= 10; // ~5km = 3 miles
      else if (bar.distance_miles < 0.6) score += 10; // ~1km = 0.6 miles

      // Location accuracy bonus
      if (userLocation.accuracy <= 100) score += 5;

      // GPS vs IP location preference
      if (userLocation.source === 'gps') score += 10;

      // Time-based scoring (happy hour, etc.)
      if (currentHour >= 17 && currentHour <= 19) {
        // Happy hour time
        score += 15;
      }

      // Popular features bonus
      if (bar.features) {
        const popularFeatures = ['happy_hour', 'outdoor_seating', 'craft_beer', 'cocktails'];
        const matches = bar.features.filter(f => popularFeatures.includes(f));
        score += matches.length * 5;
      }

      return {
        ...bar,
        recommendation_score: Math.max(0, Math.min(100, score))
      } as BarDistance & { recommendation_score: number };
    }).sort((a, b) => {
      const scoreA = (a as any).recommendation_score || 0;
      const scoreB = (b as any).recommendation_score || 0;
      return scoreB - scoreA;
    });
  }

  /**
   * Get delivery/service area for a bar
   */
  async getServiceArea(barId: string, radiusMiles: number = 6): Promise<{
    bar: Bar;
    radius_miles: number;
    center: Coordinates;
  } | null> {
    try {
      const bar = await barDataService.getBarById(barId);
      
      if (!bar) {
        return null;
      }

      return {
        bar,
        radius_miles: radiusMiles,
        center: bar.location
      };
    } catch (error) {
      console.error('Error getting service area:', error);
      return null;
    }
  }

  /**
   * Check if a location is within a bar's service area
   */
  async isInServiceArea(
    barId: string, 
    userLocation: Coordinates,
    serviceRadiusMiles: number = 6 // Changed from 10km to 6 miles
  ): Promise<boolean> {
    try {
      const bar = await barDataService.getBarById(barId);
      
      if (!bar) {
        return false;
      }

      const distance = calculateDistance(userLocation, bar.location);
      return distance.distance_miles <= serviceRadiusMiles;
    } catch (error) {
      console.error('Error checking service area:', error);
      return false;
    }
  }

  /**
   * Get travel time estimate (placeholder for future integration with maps API)
   */
  async getTravelTime(
    from: Coordinates,
    to: Coordinates,
    mode: 'driving' | 'walking' | 'transit' = 'driving'
  ): Promise<{
    duration_minutes: number;
    distance_km: number;
    mode: string;
  }> {
    // Simple estimation based on distance and mode
    // In production, integrate with Google Maps API or similar
    const distance = calculateDistance(from, to);
    
    let speedKmh: number;
    switch (mode) {
      case 'walking':
        speedKmh = 5; // 5 km/h average walking speed
        break;
      case 'transit':
        speedKmh = 25; // Average transit speed including wait times
        break;
      case 'driving':
      default:
        speedKmh = 40; // Average city driving speed
        break;
    }

    const durationMinutes = Math.round((distance.distance_km / speedKmh) * 60);

    return {
      duration_minutes: durationMinutes,
      distance_km: distance.distance_km,
      mode
    };
  }
}

// Export singleton instance
export const barLocationService = new BarLocationService();