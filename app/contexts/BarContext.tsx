'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { Bar, BarDistance, UserLocation, BarContext as BarContextType } from '@/app/types/bars';

// Action types for the reducer
type BarAction = 
  | { type: 'SET_LOADING'; payload: { key: keyof BarContextType['loading']; value: boolean } }
  | { type: 'SET_ERROR'; payload: { key: keyof BarContextType['errors']; value: string | undefined } }
  | { type: 'SET_CURRENT_BAR'; payload: Bar | null }
  | { type: 'SET_USER_LOCATION'; payload: UserLocation | null }
  | { type: 'SET_NEARBY_BARS'; payload: BarDistance[] }
  | { type: 'SET_LOCATION_ENABLED'; payload: boolean }
  | { type: 'SET_SEARCH_RADIUS'; payload: number }
  | { type: 'SET_HAS_SEARCHED_FURTHER'; payload: boolean }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'RESET_STATE' };

// Initial state
const initialState: BarContextType = {
  current_bar: null,
  user_location: null,
  nearby_bars: [],
  location_enabled: false,
  search_radius_miles: 10,
  has_searched_further: false,
  loading: {
    bars: false,
    location: false,
    current_bar: false,
    expanded_search: false
  },
  errors: {}
};

// Reducer function
function barReducer(state: BarContextType, action: BarAction): BarContextType {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.key]: action.payload.value
        }
      };
    case 'SET_ERROR':
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload.key]: action.payload.value
        }
      };
    case 'SET_CURRENT_BAR':
      return {
        ...state,
        current_bar: action.payload
      };
    case 'SET_USER_LOCATION':
      return {
        ...state,
        user_location: action.payload
      };
    case 'SET_NEARBY_BARS':
      return {
        ...state,
        nearby_bars: action.payload
      };
    case 'SET_LOCATION_ENABLED':
      return {
        ...state,
        location_enabled: action.payload
      };
    case 'SET_SEARCH_RADIUS':
      return {
        ...state,
        search_radius_miles: action.payload
      };
    case 'SET_HAS_SEARCHED_FURTHER':
      return {
        ...state,
        has_searched_further: action.payload
      };
    case 'CLEAR_ERRORS':
      return {
        ...state,
        errors: {}
      };
    case 'RESET_STATE':
      return initialState;
    default:
      return state;
  }
}

// Context creation
const BarContext = createContext<{
  state: BarContextType;
  actions: {
    setCurrentBar: (bar: Bar | null) => void;
    setUserLocation: (location: UserLocation | null) => void;
    setNearbyBars: (bars: BarDistance[]) => void;
    setLocationEnabled: (enabled: boolean) => void;
    setSearchRadius: (radius: number) => void;
    setHasSearchedFurther: (searched: boolean) => void;
    setLoading: (key: keyof BarContextType['loading'], value: boolean) => void;
    setError: (key: keyof BarContextType['errors'], value: string | undefined) => void;
    clearErrors: () => void;
    resetState: () => void;
    requestLocation: () => Promise<void>;
    findNearbyBars: () => Promise<void>;
    expandSearch: () => Promise<void>;
    switchToBar: (barId: string) => Promise<void>;
  };
} | null>(null);

// Storage keys
const STORAGE_KEYS = {
  CURRENT_BAR: 'drinkjoy_current_bar',
  USER_LOCATION: 'drinkjoy_user_location',
  LOCATION_ENABLED: 'drinkjoy_location_enabled'
} as const;

// Provider component
export function BarProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(barReducer, initialState);

  // Load persisted data on mount
  useEffect(() => {
    try {
      // Load current bar
      const savedBar = localStorage.getItem(STORAGE_KEYS.CURRENT_BAR);
      if (savedBar) {
        const bar = JSON.parse(savedBar) as Bar;
        dispatch({ type: 'SET_CURRENT_BAR', payload: bar });
      }

      // Load user location
      const savedLocation = localStorage.getItem(STORAGE_KEYS.USER_LOCATION);
      if (savedLocation) {
        const location = JSON.parse(savedLocation) as UserLocation;
        // Only use saved location if it's less than 1 hour old
        if (Date.now() - location.timestamp < 60 * 60 * 1000) {
          dispatch({ type: 'SET_USER_LOCATION', payload: location });
        }
      }

      // Load location enabled preference
      const locationEnabled = localStorage.getItem(STORAGE_KEYS.LOCATION_ENABLED);
      if (locationEnabled !== null) {
        dispatch({ type: 'SET_LOCATION_ENABLED', payload: locationEnabled === 'true' });
      }
    } catch (error) {
      console.error('Failed to load persisted bar data:', error);
    }
  }, []);

  // Persist data when state changes
  useEffect(() => {
    try {
      if (state.current_bar) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_BAR, JSON.stringify(state.current_bar));
      } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_BAR);
      }
    } catch (error) {
      console.error('Failed to persist current bar:', error);
    }
  }, [state.current_bar]);

  useEffect(() => {
    try {
      if (state.user_location) {
        localStorage.setItem(STORAGE_KEYS.USER_LOCATION, JSON.stringify(state.user_location));
      } else {
        localStorage.removeItem(STORAGE_KEYS.USER_LOCATION);
      }
    } catch (error) {
      console.error('Failed to persist user location:', error);
    }
  }, [state.user_location]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.LOCATION_ENABLED, String(state.location_enabled));
    } catch (error) {
      console.error('Failed to persist location enabled preference:', error);
    }
  }, [state.location_enabled]);

  // Action creators
  const setCurrentBar = useCallback((bar: Bar | null) => {
    dispatch({ type: 'SET_CURRENT_BAR', payload: bar });
    
    // Track analytics
    if (typeof window !== 'undefined' && 'gtag' in window && bar) {
      (window as any).gtag('event', 'bar_selected', {
        bar_id: bar.id,
        bar_name: bar.name,
        bar_city: bar.address.city
      });
    }
  }, []);

  const setUserLocation = useCallback((location: UserLocation | null) => {
    dispatch({ type: 'SET_USER_LOCATION', payload: location });
  }, []);

  const setNearbyBars = useCallback((bars: BarDistance[]) => {
    dispatch({ type: 'SET_NEARBY_BARS', payload: bars });
  }, []);

  const setLocationEnabled = useCallback((enabled: boolean) => {
    dispatch({ type: 'SET_LOCATION_ENABLED', payload: enabled });
  }, []);

  const setSearchRadius = useCallback((radius: number) => {
    dispatch({ type: 'SET_SEARCH_RADIUS', payload: radius });
  }, []);

  const setHasSearchedFurther = useCallback((searched: boolean) => {
    dispatch({ type: 'SET_HAS_SEARCHED_FURTHER', payload: searched });
  }, []);

  const setLoading = useCallback((key: keyof BarContextType['loading'], value: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: { key, value } });
  }, []);

  const setError = useCallback((key: keyof BarContextType['errors'], value: string | undefined) => {
    dispatch({ type: 'SET_ERROR', payload: { key, value } });
  }, []);

  const clearErrors = useCallback(() => {
    dispatch({ type: 'CLEAR_ERRORS' });
  }, []);

  const resetState = useCallback(() => {
    dispatch({ type: 'RESET_STATE' });
    // Clear localStorage
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }, []);

  // Request user location
  const requestLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setError('location', 'Geolocation is not supported by this browser');
      return;
    }

    setLoading('location', true);
    setError('location', undefined);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 300000 // 5 minutes
          }
        );
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

      setUserLocation(userLocation);
      setLocationEnabled(true);

      // Track analytics
      if (typeof window !== 'undefined' && 'gtag' in window) {
        (window as any).gtag('event', 'location_granted', {
          source: 'gps',
          accuracy: position.coords.accuracy
        });
      }
    } catch (error) {
      let errorMessage = 'Failed to get location';
      
      if (error instanceof GeolocationPositionError) {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location services.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
      }

      setError('location', errorMessage);
      
      // Track analytics
      if (typeof window !== 'undefined' && 'gtag' in window) {
        (window as any).gtag('event', 'location_error', {
          error: errorMessage
        });
      }
    } finally {
      setLoading('location', false);
    }
  }, [setError, setLoading, setUserLocation, setLocationEnabled]);

  // Find nearby bars
  const findNearbyBars = useCallback(async () => {
    if (!state.user_location) {
      setError('bars', 'Location required to find nearby bars');
      return;
    }

    setLoading('bars', true);
    setError('bars', undefined);

    try {
      const response = await fetch('/api/bars/nearby', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          latitude: state.user_location.location.latitude,
          longitude: state.user_location.location.longitude,
          max_distance_miles: state.search_radius_miles,
          limit: 20,
          active_only: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setNearbyBars(data.bars || []);
        
        // Auto-select closest bar if none selected
        if (!state.current_bar && data.bars && data.bars.length > 0) {
          setCurrentBar(data.bars[0]);
        }

        // Track analytics
        if (typeof window !== 'undefined' && 'gtag' in window) {
          (window as any).gtag('event', 'bars_found', {
            bars_count: data.bars?.length || 0,
            user_latitude: state.user_location.location.latitude,
            user_longitude: state.user_location.location.longitude
          });
        }
      } else {
        throw new Error(data.error || 'Failed to find nearby bars');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to find nearby bars';
      setError('bars', errorMessage);
      
      // Track analytics
      if (typeof window !== 'undefined' && 'gtag' in window) {
        (window as any).gtag('event', 'bars_error', {
          error: errorMessage
        });
      }
    } finally {
      setLoading('bars', false);
    }
  }, [state.user_location, state.current_bar, setLoading, setError, setNearbyBars, setCurrentBar]);

  // Switch to a specific bar
  const switchToBar = useCallback(async (barId: string) => {
    setLoading('current_bar', true);
    setError('current_bar', undefined);

    try {
      // First check if we already have this bar in nearby_bars
      const existingBar = state.nearby_bars.find(bar => bar.id === barId);
      if (existingBar) {
        setCurrentBar(existingBar);
        setLoading('current_bar', false);
        return;
      }

      // If not found locally, fetch from API
      const response = await fetch(`/api/bars/${barId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.bar) {
        setCurrentBar(data.bar);
      } else {
        throw new Error(data.error || 'Bar not found');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to switch bar';
      setError('current_bar', errorMessage);
    } finally {
      setLoading('current_bar', false);
    }
  }, [state.nearby_bars, setCurrentBar, setLoading, setError]);

  // Expand search to a larger radius
  const expandSearch = useCallback(async () => {
    if (!state.user_location) {
      setError('expanded_search', 'Location required to expand search');
      return;
    }

    console.log(`🔍 [BarContext] Expanding search from ${state.search_radius_miles} to 25 miles`);
    
    setLoading('expanded_search', true);
    setError('expanded_search', undefined);
    setSearchRadius(25); // Expand to 25 miles
    setHasSearchedFurther(true);

    try {
      const response = await fetch('/api/bars/nearby', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          latitude: state.user_location.location.latitude,
          longitude: state.user_location.location.longitude,
          max_distance_miles: 25,
          limit: 50,
          active_only: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        const bars = data.bars || [];
        console.log(`🔍 [BarContext] Expanded search found ${bars.length} bars`);
        setNearbyBars(bars);
        
        // Track analytics
        if (typeof window !== 'undefined' && 'gtag' in window) {
          (window as any).gtag('event', 'search_expanded', {
            original_radius: 10,
            expanded_radius: 25,
            bars_found: bars.length
          });
        }
      } else {
        throw new Error(data.error || 'Failed to expand search');
      }
    } catch (error) {
      console.error('Failed to expand search:', error);
      setError('expanded_search', error instanceof Error ? error.message : 'Failed to expand search');
    } finally {
      setLoading('expanded_search', false);
    }
  }, [state.user_location, state.search_radius_miles, setError, setLoading, setNearbyBars, setSearchRadius, setHasSearchedFurther]);

  // Auto-find bars when location is set
  useEffect(() => {
    if (state.user_location && state.location_enabled && state.nearby_bars.length === 0) {
      findNearbyBars();
    }
  }, [state.user_location, state.location_enabled, state.nearby_bars.length, findNearbyBars]);

  const contextValue = {
    state,
    actions: {
      setCurrentBar,
      setUserLocation,
      setNearbyBars,
      setLocationEnabled,
      setSearchRadius,
      setHasSearchedFurther,
      setLoading,
      setError,
      clearErrors,
      resetState,
      requestLocation,
      findNearbyBars,
      expandSearch,
      switchToBar
    }
  };

  return (
    <BarContext.Provider value={contextValue}>
      {children}
    </BarContext.Provider>
  );
}

// Hook to use the bar context
export function useBar() {
  const context = useContext(BarContext);
  if (!context) {
    throw new Error('useBar must be used within a BarProvider');
  }
  return context;
}

// Convenience hooks
export function useCurrentBar() {
  const { state } = useBar();
  return state.current_bar;
}

export function useUserLocation() {
  const { state } = useBar();
  return state.user_location;
}

export function useNearbyBars() {
  const { state } = useBar();
  return state.nearby_bars;
}

export function useBarLoading() {
  const { state } = useBar();
  return state.loading;
}

export function useBarErrors() {
  const { state } = useBar();
  return state.errors;
}