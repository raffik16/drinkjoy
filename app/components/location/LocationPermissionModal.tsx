'use client';

import { useState } from 'react';
import { useBar } from '@/app/contexts/BarContext';
import { Button } from '@/app/components/ui/Button';
import { Card } from '@/app/components/ui/Card';

interface LocationPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationGranted: () => void;
  onLocationDenied: () => void;
}

export function LocationPermissionModal({ 
  isOpen, 
  onClose, 
  onLocationGranted, 
  onLocationDenied 
}: LocationPermissionModalProps) {
  const { actions, state } = useBar();
  const [isRequesting, setIsRequesting] = useState(false);

  if (!isOpen) return null;

  const handleAllowLocation = async () => {
    setIsRequesting(true);
    
    try {
      await actions.requestLocation();
      
      // Check if location was successfully obtained
      if (state.user_location) {
        onLocationGranted();
        onClose();
      } else if (state.errors.location) {
        // Location was denied or failed
        onLocationDenied();
      }
    } catch (error) {
      console.error('Failed to request location:', error);
      onLocationDenied();
    } finally {
      setIsRequesting(false);
    }
  };

  const handleManualSelection = () => {
    onLocationDenied();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-white dark:bg-gray-800 p-6">
        <div className="text-center space-y-4">
          {/* Icon */}
          <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
            <svg 
              className="w-8 h-8 text-blue-600 dark:text-blue-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" 
              />
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" 
              />
            </svg>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Find Your Nearby Bars
          </h2>

          {/* Description */}
          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
            We'd like to show you bars near your location for the best experience. 
            Your location is only used to find nearby bars and is not stored.
          </p>

          {/* Error Message */}
          {state.errors.location && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-700 dark:text-red-400 text-sm">
                {state.errors.location}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3 pt-2">
            <Button
              onClick={handleAllowLocation}
              disabled={isRequesting || state.loading.location}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isRequesting || state.loading.location ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Getting Location...
                </>
              ) : (
                'Allow Location Access'
              )}
            </Button>

            <Button
              onClick={handleManualSelection}
              variant="ghost"
              className="w-full border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              disabled={isRequesting || state.loading.location}
            >
              Choose Bar Manually
            </Button>
          </div>

          {/* Privacy Note */}
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Your privacy is important to us. Location data is only used to find nearby bars and is not saved or shared.
          </p>
        </div>
      </Card>
    </div>
  );
}