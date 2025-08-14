'use client';

import { useState, useEffect } from 'react';
import { useBar, useCurrentBar } from '@/app/contexts/BarContext';
import { ChevronDown, MapPin, Building } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Bar, BarDistance } from '@/app/types/bars';

interface BarSwitcherProps {
  onBarChange?: (barId: string) => void;
  className?: string;
  showLocation?: boolean;
}

export function BarSwitcher({ 
  onBarChange, 
  className = '',
  showLocation = true 
}: BarSwitcherProps) {
  const { state, actions } = useBar();
  const currentBar = useCurrentBar();
  const [isOpen, setIsOpen] = useState(false);

  // Get all available bars - load from API if we don't have them locally
  const [allBars, setAllBars] = useState<Bar[]>([]);
  
  useEffect(() => {
    const loadAllBars = async () => {
      try {
        const response = await fetch('/api/bars?active=true');
        const data = await response.json();
        if (data.success) {
          setAllBars(data.bars || []);
        }
      } catch (error) {
        console.error('Failed to load bars for switcher:', error);
      }
    };

    if (allBars.length === 0) {
      loadAllBars();
    }
  }, [allBars.length]);

  // Create available bars list with distance info where available
  const availableBars: (Bar | BarDistance)[] = allBars.map(bar => {
    // Check if this bar is in nearby_bars (has distance info)
    const nearbyBar = state.nearby_bars.find(nb => nb.id === bar.id);
    if (nearbyBar) {
      return nearbyBar; // Use the nearby bar with distance info
    }
    
    // If we have user location, calculate distance
    if (state.user_location) {
      const { calculateDistance } = require('@/lib/locationUtils');
      const distance = calculateDistance(state.user_location.location, bar.location);
      return {
        ...bar,
        distance_km: distance.distance_km,
        distance_miles: distance.distance_miles
      };
    }
    
    // Otherwise, no distance info available
    return {
      ...bar,
      distance_km: 0,
      distance_miles: 0
    };
  });

  const handleBarSelect = async (barId: string) => {
    try {
      console.log(`🍻 [BarSwitcher] Switching to bar: ${barId}`);
      
      // Find the bar in available bars (could be from nearby or all bars)
      const bar = availableBars.find(b => b.id === barId);
      if (bar) {
        actions.setCurrentBar(bar);
      } else {
        // If not found, try to switch using the bar service
        await actions.switchToBar(barId);
      }
      
      setIsOpen(false);
      
      // Notify parent component
      if (onBarChange) {
        onBarChange(barId);
      }
      
    } catch (error) {
      console.error('Failed to switch bar:', error);
    }
  };

  const handleLocateClosest = async () => {
    try {
      console.log('📍 [BarSwitcher] Requesting location to find closest bar...');
      
      // Request user location
      await actions.requestLocation();
      
      // Once location is obtained, find nearby bars
      if (state.user_location) {
        await actions.findNearbyBars();
        
        // Auto-select the closest bar if found
        if (state.nearby_bars.length > 0) {
          const closestBar = state.nearby_bars[0]; // Already sorted by distance
          await handleBarSelect(closestBar.id);
          console.log(`🎯 [BarSwitcher] Auto-selected closest bar: ${closestBar.name}`);
        }
      }
      
    } catch (error) {
      console.error('Failed to locate closest bar:', error);
    }
  };

  // If no bars available, don't render
  if (availableBars.length === 0) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Current Bar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative justify-center font-medium disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 text-sm flex items-center space-x-2 px-3 py-2 bg-white/90 backdrop-blur-md border border-gray-200 rounded-lg hover:bg-white transition-all duration-200"
      >
        <Building className="w-4 h-4 text-gray-600 flex-shrink-0" />
        
        <div className="flex items-center space-x-2 min-w-0">
          <span className="font-medium text-gray-900 truncate">
            {currentBar ? currentBar.name : 'Select Bar'}
          </span>
          {currentBar && showLocation && (
            <>
              <span className="text-gray-400">•</span>
              <div className="flex items-center space-x-1 text-gray-500">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="text-xs truncate">{currentBar.address.city}</span>
              </div>
            </>
          )}
        </div>
        
        <ChevronDown 
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${
            isOpen ? 'rotate-180' : ''
          } ${availableBars.length === 1 ? 'opacity-50' : ''}`} 
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50 min-w-[280px]"
          >

          {availableBars.map((bar) => (
            <button
              key={bar.id}
              onClick={() => handleBarSelect(bar.id)}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-150 ${
                currentBar?.id === bar.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{bar.name}</div>
                  <div className="text-sm text-gray-500 flex items-center mt-1">
                    <MapPin className="w-3 h-3 mr-1" />
                    {bar.address.city}, {bar.address.state}
                    {'distance_miles' in bar && (
                      <span className="ml-2 text-blue-600">
                        {bar.distance_miles.toFixed(1)} mi
                      </span>
                    )}
                  </div>
                  {bar.description && (
                    <div className="text-xs text-gray-400 mt-1 line-clamp-1">
                      {bar.description}
                    </div>
                  )}
                </div>

              </div>
            </button>
          ))}
            
            {/* Footer */}
            <div className="border-t border-gray-100 px-4 py-2 bg-gray-50">
              <div className="flex flex-col space-y-2">
                <div className="text-xs text-gray-500 text-center">
                  {availableBars.length === 1 
                    ? "Currently showing this bar's menu"
                    : "Different bars = different drink menus"
                  }
                </div>
                <button
                  onClick={handleLocateClosest}
                  className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={state.loading.location}
                >
                  {state.loading.location ? (
                    <div className="flex items-center space-x-1">
                      <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Getting location...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
                      </svg>
                      <span>{state.user_location ? 'Find closest bar' : 'Locate closest bar'}</span>
                    </div>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}