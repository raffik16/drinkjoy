'use client';

import { useState, useEffect } from 'react';
import { useBar } from '@/app/contexts/BarContext';
import { LocationPermissionModal } from '@/app/components/location/LocationPermissionModal';
import { BarSelector } from './BarSelector';
import { BarContextHeader } from './BarContextHeader';
import type { Bar } from '@/app/types/bars';

export type BarSelectionStep = 'initial' | 'location_request' | 'bar_selection' | 'completed';

interface BarSelectionFlowProps {
  onComplete: () => void;
  autoStart?: boolean;
  showHeader?: boolean;
}

export function BarSelectionFlow({ 
  onComplete, 
  autoStart = true,
  showHeader = false 
}: BarSelectionFlowProps) {
  const { state, actions } = useBar();
  const [currentStep, setCurrentStep] = useState<BarSelectionStep>('initial');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showBarSelector, setShowBarSelector] = useState(false);

  useEffect(() => {
    if (autoStart) {
      initializeBarSelection();
    }
  }, [autoStart]);

  // Monitor state changes to progress through flow
  useEffect(() => {
    if (currentStep === 'location_request' && state.user_location && state.nearby_bars.length > 0) {
      // Got location and found nearby bars
      if (state.nearby_bars.length === 1) {
        // Only one bar nearby, auto-select it
        const nearestBar = state.nearby_bars[0];
        actions.setCurrentBar(nearestBar);
        setCurrentStep('completed');
        onComplete();
      } else {
        // Multiple bars, let user choose
        setCurrentStep('bar_selection');
        setShowLocationModal(false);
        setShowBarSelector(true);
      }
    } else if (currentStep === 'location_request' && state.user_location && state.nearby_bars.length === 0) {
      // Got location but no nearby bars, show all bars
      setCurrentStep('bar_selection');
      setShowLocationModal(false);
      setShowBarSelector(true);
    } else if (currentStep === 'bar_selection' && state.current_bar) {
      // Bar selected
      setCurrentStep('completed');
      setShowBarSelector(false);
      onComplete();
    }
  }, [state.user_location, state.nearby_bars, state.current_bar, currentStep, actions, onComplete]);

  const initializeBarSelection = async () => {
    console.log('🔄 [BarSelectionFlow] Initializing bar selection...');
    
    // Check if user already has a bar selected
    if (state.current_bar) {
      console.log('✅ [BarSelectionFlow] User already has bar selected:', state.current_bar.name);
      setCurrentStep('completed');
      onComplete();
      return;
    }

    // Check if we already have location and nearby bars
    if (state.user_location) {
      console.log('📍 [BarSelectionFlow] User location already available:', {
        lat: state.user_location.location.latitude,
        lng: state.user_location.location.longitude,
        accuracy: state.user_location.accuracy,
        source: state.user_location.source
      });
      
      if (state.nearby_bars.length === 0) {
        console.log('🔍 [BarSelectionFlow] No nearby bars in cache, refreshing search...');
        // Refresh nearby bars search
        await actions.findNearbyBars();
      }
      
      console.log(`🏪 [BarSelectionFlow] Found ${state.nearby_bars.length} nearby bars`);
      
      if (state.nearby_bars.length === 1) {
        // Auto-select single nearby bar
        console.log('🎯 [BarSelectionFlow] Auto-selecting single nearby bar:', state.nearby_bars[0].name);
        actions.setCurrentBar(state.nearby_bars[0]);
        setCurrentStep('completed');
        onComplete();
        return;
      } else if (state.nearby_bars.length > 1) {
        // Multiple bars, let user choose
        console.log('📋 [BarSelectionFlow] Multiple bars found, showing selector');
        setCurrentStep('bar_selection');
        setShowBarSelector(true);
        return;
      }
    }

    // Start the location flow
    console.log('📱 [BarSelectionFlow] Starting location request flow');
    setCurrentStep('location_request');
    setShowLocationModal(true);
  };

  const handleLocationGranted = async () => {
    console.log('📍 [BarSelectionFlow] Location granted, finding nearby bars...');
    setCurrentStep('location_request');
    
    // The useEffect will handle the next steps once location and bars are loaded
    if (!state.loading.bars && state.user_location) {
      console.log('🔍 [BarSelectionFlow] Triggering findNearbyBars...');
      await actions.findNearbyBars();
    }
  };

  const handleLocationDenied = () => {
    console.log('❌ [BarSelectionFlow] Location denied, showing manual bar selection');
    setCurrentStep('bar_selection');
    setShowLocationModal(false);
    setShowBarSelector(true);
  };

  const handleBarSelected = (bar: Bar) => {
    console.log('🍻 [BarSelectionFlow] Bar selected:', {
      id: bar.id,
      name: bar.name,
      city: bar.address.city,
      menuSheetId: bar.menu_sheet_id
    });
    // The useEffect will handle completion once current_bar is set
  };

  // Removed skip functionality - bar selection is now required

  const handleError = (error: string) => {
    console.error('Bar selection error:', error);
    // Since bar selection is required, show error state instead of skipping
    // The user will need to try again or refresh
    alert('Error selecting bar. Please try again or refresh the page.');
  };

  // If completed and showing header, render just the header
  if (currentStep === 'completed' && showHeader) {
    return <BarContextHeader className="sticky top-0 z-40" />;
  }

  // If completed and not showing header, render nothing (flow is done)
  if (currentStep === 'completed') {
    return null;
  }

  return (
    <>
      {/* Header (if enabled) */}
      {showHeader && (
        <BarContextHeader className="sticky top-0 z-40" />
      )}

      {/* Location Permission Modal */}
      <LocationPermissionModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onLocationGranted={handleLocationGranted}
        onLocationDenied={handleLocationDenied}
      />

      {/* Bar Selector Modal */}
      <BarSelector
        isOpen={showBarSelector}
        onClose={() => setShowBarSelector(false)}
        onBarSelected={handleBarSelected}
        showNearbyFirst={!!state.user_location}
      />

      {/* Bar selection is now required - no skip option */}

      {/* Loading States */}
      {state.loading.location && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-40">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl">
            <div className="flex items-center space-x-3">
              <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-gray-700 dark:text-gray-300">Getting your location...</span>
            </div>
          </div>
        </div>
      )}

      {state.loading.bars && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-40">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl">
            <div className="flex items-center space-x-3">
              <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-gray-700 dark:text-gray-300">Finding nearby bars...</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}