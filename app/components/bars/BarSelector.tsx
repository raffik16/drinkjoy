'use client';

import { useState, useEffect } from 'react';
import { useBar } from '@/app/contexts/BarContext';
import { Button } from '@/app/components/ui/Button';
import { Card } from '@/app/components/ui/Card';
import LoadingSpinner from '@/app/components/ui/LoadingSpinner';
import { formatDistance } from '@/lib/locationUtils';
import type { Bar, BarDistance } from '@/app/types/bars';

interface BarSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onBarSelected: (bar: Bar) => void;
  showNearbyFirst?: boolean;
}

export function BarSelector({ 
  isOpen, 
  onClose, 
  onBarSelected,
  showNearbyFirst = true 
}: BarSelectorProps) {
  const { state, actions } = useBar();
  const [allBars, setAllBars] = useState<Bar[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen && allBars.length === 0) {
      loadAllBars();
    }
  }, [isOpen]);

  const loadAllBars = async () => {
    console.log('🔄 [BarSelector] Loading all bars...');
    setIsLoading(true);
    setError('');
    
    try {
      console.log('🌐 [BarSelector] Fetching from /api/bars?active=true');
      const response = await fetch('/api/bars?active=true');
      console.log('📡 [BarSelector] API response status:', response.status);
      
      const data = await response.json();
      console.log('📊 [BarSelector] API response data:', data);
      
      if (data.success) {
        const bars = data.bars || [];
        console.log(`✅ [BarSelector] Successfully loaded ${bars.length} bars:`, bars.map((b: any) => ({ id: b.id, name: b.name, active: b.active })));
        setAllBars(bars);
      } else {
        console.error('❌ [BarSelector] API returned error:', data.error);
        setError(data.error || 'Failed to load bars');
      }
    } catch (err) {
      console.error('💥 [BarSelector] Error loading bars:', err);
      setError('Failed to load bars');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBarSelect = async (bar: Bar) => {
    try {
      // Track bar visit
      const visitResponse = await fetch('/api/bars/visit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bar_id: bar.id,
          source: state.user_location ? 'geolocation' : 'manual',
          user_location: state.user_location?.location
        }),
      });

      // Set as current bar in context
      actions.setCurrentBar(bar);
      
      onBarSelected(bar);
      onClose();
    } catch (error) {
      console.error('Error selecting bar:', error);
      // Still select the bar even if tracking fails
      actions.setCurrentBar(bar);
      onBarSelected(bar);
      onClose();
    }
  };

  if (!isOpen) return null;

  const nearbyBars = state.nearby_bars;
  const otherBars = allBars.filter(bar => 
    !nearbyBars.some(nearbyBar => nearbyBar.id === bar.id)
  );


  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl bg-white dark:bg-gray-800 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Choose Your Bar
          </h2>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="rounded-full w-8 h-8 p-0"
          >
            ✕
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <Button onClick={loadAllBars} variant="ghost">
                Try Again
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Nearby Bars */}
              {showNearbyFirst && nearbyBars.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                    Nearby Bars ({state.search_radius_miles} miles)
                  </h3>
                  <div className="space-y-3">
                    {nearbyBars.map((bar) => (
                      <BarCard 
                        key={bar.id} 
                        bar={bar} 
                        onSelect={handleBarSelect}
                        distance={formatDistance(bar.distance_miles)}
                        isNearby={true}
                      />
                    ))}
                  </div>
                  
                  {/* Search Further Button */}
                  {!state.has_searched_further && (
                    <div className="mt-4 text-center">
                      <Button
                        onClick={actions.expandSearch}
                        variant="ghost"
                        size="sm"
                        disabled={state.loading.expanded_search}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
                      >
                        {state.loading.expanded_search ? (
                          <div className="flex items-center space-x-2">
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            <span>Searching further...</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                            </svg>
                            <span>Search further (up to 25 miles)</span>
                          </div>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Other Bars */}
              {otherBars.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    {showNearbyFirst && nearbyBars.length > 0 ? 'Other Bars' : 'All Bars'}
                    <span className="ml-2 text-sm text-gray-500">({otherBars.length})</span>
                  </h3>
                  <div className="space-y-3">
                    {otherBars.map((bar) => (
                      <BarCard 
                        key={bar.id} 
                        bar={bar} 
                        onSelect={handleBarSelect}
                        isNearby={false}
                      />
                    ))}
                  </div>
                </div>
              )}


              {allBars.length === 0 && !isLoading && !error && (
                <div className="text-center py-8">
                  <p className="text-gray-600 dark:text-gray-400">
                    No bars available at the moment.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

interface BarCardProps {
  bar: Bar | BarDistance;
  onSelect: (bar: Bar) => void;
  distance?: string;
  isNearby: boolean;
}

function BarCard({ bar, onSelect, distance, isNearby }: BarCardProps) {
  const isCurrentBar = false; // You could pass this as a prop if needed

  return (
    <Card 
      className={`p-4 cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] ${
        isCurrentBar ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
      }`}
      onClick={() => onSelect(bar)}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 dark:text-white">
            {bar.name}
          </h4>
          
          {bar.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {bar.description}
            </p>
          )}
          
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {bar.address.formatted}
          </p>
          
          {bar.features && bar.features.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {bar.features.slice(0, 3).map((feature, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-300 rounded"
                >
                  {feature.replace('_', ' ')}
                </span>
              ))}
              {bar.features.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-300 rounded">
                  +{bar.features.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>

        <div className="ml-4 text-right">
          {distance && (
            <div className="flex items-center text-sm text-green-600 dark:text-green-400 mb-2">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              {distance}
            </div>
          )}
          
          <Button 
            size="sm"
            className={isNearby ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            Select
          </Button>
        </div>
      </div>
    </Card>
  );
}