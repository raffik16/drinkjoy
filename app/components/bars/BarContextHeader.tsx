'use client';

import { useState } from 'react';
import { useBar } from '@/app/contexts/BarContext';
import { Button } from '@/app/components/ui/Button';
import { BarSelector } from './BarSelector';
import { formatDistance } from '@/lib/locationUtils';
import type { Bar } from '@/app/types/bars';

interface BarContextHeaderProps {
  className?: string;
  showLocationButton?: boolean;
}

export function BarContextHeader({ 
  className = '',
  showLocationButton = true 
}: BarContextHeaderProps) {
  const { state, actions } = useBar();
  const [showBarSelector, setShowBarSelector] = useState(false);
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);

  const currentBar = state.current_bar;
  const hasLocation = !!state.user_location;
  const nearbyBar = state.nearby_bars.find(bar => bar.id === currentBar?.id);
  const distance = nearbyBar ? formatDistance(nearbyBar.distance_miles) : null;

  const handleLocationRequest = async () => {
    if (state.loading.location) return;
    
    setIsRequestingLocation(true);
    
    try {
      await actions.requestLocation();
    } catch (error) {
      console.error('Failed to request location:', error);
    } finally {
      setIsRequestingLocation(false);
    }
  };

  const handleBarSelected = (bar: Bar) => {
    // The BarSelector already handles setting the current bar
    console.log('Bar selected:', bar.name);
  };

  if (!currentBar) {
    return (
      <div className={`bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  No Bar Selected
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Choose a bar to see their menu
                </p>
              </div>
            </div>
            
            <Button
              onClick={() => setShowBarSelector(true)}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              Choose Bar
            </Button>
          </div>
        </div>

        <BarSelector
          isOpen={showBarSelector}
          onClose={() => setShowBarSelector(false)}
          onBarSelected={handleBarSelected}
        />
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {/* Bar Icon/Image */}
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              {currentBar.image_url ? (
                <img 
                  src={currentBar.image_url} 
                  alt={currentBar.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <span className="text-white font-semibold text-sm">
                  {currentBar.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* Bar Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                  {currentBar.name}
                </h3>
                
                {distance && (
                  <div className="flex items-center text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                    {distance}
                  </div>
                )}
              </div>
              
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {currentBar.address.city}, {currentBar.address.state}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 ml-4">
            {showLocationButton && !hasLocation && (
              <Button
                onClick={handleLocationRequest}
                disabled={state.loading.location || isRequestingLocation}
                size="sm"
                variant="ghost"
                className="text-xs px-3 py-1"
              >
                {state.loading.location || isRequestingLocation ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Finding...
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                    Find Nearby
                  </>
                )}
              </Button>
            )}

            <Button
              onClick={() => setShowBarSelector(true)}
              size="sm"
              variant="ghost"
              className="text-xs px-3 py-1"
            >
              Switch Bar
            </Button>
          </div>
        </div>

        {/* Error Messages */}
        {state.errors.location && (
          <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-400">
            {state.errors.location}
          </div>
        )}
      </div>

      <BarSelector
        isOpen={showBarSelector}
        onClose={() => setShowBarSelector(false)}
        onBarSelected={handleBarSelected}
      />
    </div>
  );
}