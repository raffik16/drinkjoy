'use client';

import { Coordinates, UserLocation } from '@/app/types/bars';
import { getCurrentPosition, getLocationFromIP } from './locationUtils';

export class GeolocationService {
  private static instance: GeolocationService;
  private watchId: number | null = null;

  static getInstance(): GeolocationService {
    if (!GeolocationService.instance) {
      GeolocationService.instance = new GeolocationService();
    }
    return GeolocationService.instance;
  }

  /**
   * Request user's current location with GPS
   */
  async getCurrentLocation(options?: PositionOptions): Promise<UserLocation> {
    try {
      const position = await getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000, // 5 minutes
        ...options
      });

      const userLocation: UserLocation = {
        location: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        },
        accuracy: position.coords.accuracy,
        timestamp: Date.now(),
        source: 'gps'
      };

      console.log('📍 GPS location obtained:', userLocation);
      return userLocation;

    } catch (error) {
      console.error('GPS location failed:', error);
      throw new LocationError(
        this.getLocationErrorMessage(error as GeolocationPositionError),
        'GPS_FAILED',
        error as GeolocationPositionError
      );
    }
  }

  /**
   * Fallback to IP-based location
   */
  async getLocationFromIP(): Promise<UserLocation | null> {
    try {
      console.log('🌐 Attempting IP-based location...');
      const coordinates = await getLocationFromIP();
      
      if (!coordinates) {
        console.warn('IP location service returned no coordinates');
        return null;
      }

      const userLocation: UserLocation = {
        location: coordinates,
        accuracy: 10000, // IP location is very rough
        timestamp: Date.now(),
        source: 'ip'
      };

      console.log('🌐 IP location obtained:', userLocation);
      return userLocation;

    } catch (error) {
      console.error('IP location failed:', error);
      return null;
    }
  }

  /**
   * Try GPS first, fallback to IP if needed
   */
  async getBestAvailableLocation(): Promise<UserLocation> {
    try {
      // Try GPS first
      return await this.getCurrentLocation();
    } catch (gpsError) {
      console.log('GPS failed, trying IP fallback...');
      
      const ipLocation = await this.getLocationFromIP();
      if (ipLocation) {
        return ipLocation;
      }

      // If both fail, throw the original GPS error
      throw gpsError;
    }
  }

  /**
   * Watch position changes
   */
  watchPosition(
    callback: (location: UserLocation) => void,
    errorCallback?: (error: LocationError) => void,
    options?: PositionOptions
  ): number {
    if (!navigator.geolocation) {
      const error = new LocationError('Geolocation not supported', 'NOT_SUPPORTED');
      if (errorCallback) errorCallback(error);
      throw error;
    }

    const watchOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 300000, // 5 minutes
      ...options
    };

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const userLocation: UserLocation = {
          location: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          },
          accuracy: position.coords.accuracy,
          timestamp: Date.now(),
          source: 'gps'
        };
        callback(userLocation);
      },
      (error) => {
        const locationError = new LocationError(
          this.getLocationErrorMessage(error),
          'WATCH_FAILED',
          error
        );
        if (errorCallback) errorCallback(locationError);
      },
      watchOptions
    );

    return this.watchId;
  }

  /**
   * Clear position watch
   */
  clearWatch(): void {
    if (this.watchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  /**
   * Check if geolocation is supported
   */
  isSupported(): boolean {
    return 'geolocation' in navigator;
  }

  /**
   * Check if location services are likely enabled
   */
  async checkPermissions(): Promise<PermissionState> {
    if (!navigator.permissions) {
      return 'prompt'; // Assume prompt if permissions API not available
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      return permission.state;
    } catch (error) {
      console.warn('Failed to check geolocation permissions:', error);
      return 'prompt';
    }
  }

  /**
   * Get user-friendly error message
   */
  private getLocationErrorMessage(error: GeolocationPositionError): string {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return 'Location access denied. Please enable location services for this website.';
      case error.POSITION_UNAVAILABLE:
        return 'Location information unavailable. Please check your device settings.';
      case error.TIMEOUT:
        return 'Location request timed out. Please try again.';
      default:
        return 'Failed to get location. Please try again or select your bar manually.';
    }
  }
}

/**
 * Custom error class for location-related errors
 */
export class LocationError extends Error {
  constructor(
    message: string,
    public code: 'GPS_FAILED' | 'NOT_SUPPORTED' | 'WATCH_FAILED' | 'PERMISSION_DENIED',
    public originalError?: GeolocationPositionError
  ) {
    super(message);
    this.name = 'LocationError';
  }
}

/**
 * Singleton instance
 */
export const geolocationService = GeolocationService.getInstance();