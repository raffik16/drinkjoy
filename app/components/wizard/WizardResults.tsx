'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { DrinkRecommendation } from '@/app/types/drinks';
import { WizardPreferences, AllergyType } from '@/app/types/wizard';
import { WeatherData } from '@/app/types/weather';
import { matchDrinksToPreferences, getMatchMessage, getAdditionalDrinksFromAllCategories } from '@/lib/drinkMatcher';
import { ChevronLeft, ChevronRight, Bookmark } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import weatherService from '@/lib/weatherService';
import LikeButton from '@/app/components/ui/LikeButton';
import SaveDrinkButton from '@/app/components/ui/SaveDrinkButton';
import OrderButton from '@/app/components/ui/OrderButton';
import ColorSplashAnimation from '@/app/components/animations/ColorSplashAnimation';
import WizardFullResults from './WizardFullResults';
import AllergiesModal from './AllergiesModal';
import { MyDrinksPanel } from '@/app/components/my-drinks/MyDrinksPanel';
import { useSavingFeature } from '@/hooks/useSavingFeature';

// Witty title generator based on match count
// function getWittyTitle(count: number): string {
//   if (count === 0) return "No Matches Found 😢";
//   if (count === 1) return "Found 1 Perfect Match - It&apos;s Meant to Be! 💕";
//   if (count === 2) return "Found 2 Liquid Soulmates! 🥂";
//   if (count === 3) return "Found 3 Perfect Matches - The Holy Trinity! 🙏";
//   if (count === 4) return "Found 4 Fantastic Matches! 🎯";
//   if (count === 5) return "Found 5 Perfect Matches - High Five! 🙌";
//   if (count <= 7) return `Found ${count} Perfect Matches for You! 🎉`;
//   if (count <= 10) return `Found ${count} Liquid Legends! 🏆`;
//   return `Found ${count} Worthy Matches - You be Spoiled for Choice! 🤩`;
// }

interface WizardResultsProps {
  preferences: WizardPreferences;
  weatherData?: WeatherData | null;
  onRetakeQuiz: () => void;
  onViewAll?: (preferences: WizardPreferences, weatherData?: WeatherData | null) => void;
}

export default function WizardResults({
  preferences,
  weatherData,
  onRetakeQuiz
}: WizardResultsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [recommendations, setRecommendations] = useState<DrinkRecommendation[]>([]);
  const [useWeather, setUseWeather] = useState(preferences.useWeather);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(true);
  const [dragDirection, setDragDirection] = useState<'left' | 'right' | null>(null);
  const [localWeatherData, setLocalWeatherData] = useState<WeatherData | null>(weatherData || null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [showFullResults, setShowFullResults] = useState(false);
  const [showAllergiesModal, setShowAllergiesModal] = useState(false);
  const [currentAllergies, setCurrentAllergies] = useState<AllergyType[]>(preferences.allergies || []);
  const [additionalDrinks, setAdditionalDrinks] = useState<DrinkRecommendation[]>([]);
  // Removed hasLoadedAdditional - no longer needed since we load all drinks upfront
  const [showNoMoreDrinksCard, setShowNoMoreDrinksCard] = useState(false);
  const [hasExpandedToAllCategories, setHasExpandedToAllCategories] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isAtAbsoluteEnd, setIsAtAbsoluteEnd] = useState(false);
  const [showMyDrinksPanel, setShowMyDrinksPanel] = useState(false);
  const [hasSavedDrinks, setHasSavedDrinks] = useState(false);
  const [triggerAnimation, setTriggerAnimation] = useState(false);
  const isSavingEnabled = useSavingFeature();

  const updateRecommendations = useCallback(async () => {
    setIsLoadingRecommendations(true);
    const updatedPrefs = { ...preferences, useWeather, allergies: currentAllergies };
    const recs = await matchDrinksToPreferences(updatedPrefs, localWeatherData, false, false, 50); // Get up to 50 matches
    setRecommendations(recs);
    setCurrentIndex(0);
    
    // Reset additional drinks when preferences change
    setAdditionalDrinks([]);
    // Reset handled above
    
    // Always reset the no more drinks card when updating recommendations
    setShowNoMoreDrinksCard(false);
    
    // Reset the expanded flag when preferences change
    setHasExpandedToAllCategories(false);
    
    // Reset absolute end flag when recommendations update
    setIsAtAbsoluteEnd(false);
    
    // If we have exhausted all drinks in the category (found very few), show the special card
    if (recs.length === 0 || (recs.length < 5 && preferences.category !== 'any')) {
      setShowNoMoreDrinksCard(true);
    }
    
    setIsLoadingRecommendations(false);
  }, [preferences, useWeather, localWeatherData, currentAllergies]);


  const handleAllergiesUpdate = (newAllergies: AllergyType[]) => {
    // Update the current allergies state
    setCurrentAllergies(newAllergies);
    setShowAllergiesModal(false);
    // updateRecommendations will be called automatically due to the dependency on currentAllergies
  };

  const loadDrinksFromAllCategories = async () => {
    try {
      setIsLoadingMore(true);
      const excludeIds = allDrinks.map(rec => rec.drink.id);
      const additional = await getAdditionalDrinksFromAllCategories(
        { ...preferences, useWeather, allergies: currentAllergies },
        excludeIds,
        15 // Load 15 more at once for better UX
      );
      
      if (additional.length > 0) {
        setAdditionalDrinks([...additionalDrinks, ...additional]);
        setShowNoMoreDrinksCard(false); // Hide the special card
        setHasExpandedToAllCategories(true); // Mark that we've expanded
        setIsAtAbsoluteEnd(false); // Reset absolute end flag
        return additional.length; // Return number of drinks loaded
      } else {
        // If no drinks found from all categories, we&apos;re truly at the end
        // Only show the card if we haven't expanded yet (first time)
        if (!hasExpandedToAllCategories) {
          setShowNoMoreDrinksCard(true);
        }
        setHasExpandedToAllCategories(true);
        setIsAtAbsoluteEnd(true); // Mark that we&apos;re at absolute end
        return 0; // No drinks loaded
      }
    } catch (error) {
      console.error('Failed to load more drinks:', error);
      return 0; // No drinks loaded due to error
    } finally {
      setIsLoadingMore(false);
    }
  };

  // No longer loading additional drinks dynamically since we get all upfront

  // Combined array of all drinks (recommendations + additional)
  const allDrinks = [...recommendations, ...additionalDrinks];
  const totalCards = allDrinks.length + (showNoMoreDrinksCard ? 1 : 0);
  const isShowingNoMoreCard = showNoMoreDrinksCard && currentIndex === allDrinks.length;
  const currentDrink = !isShowingNoMoreCard ? allDrinks[currentIndex]?.drink : null;
  const currentScore = !isShowingNoMoreCard ? (allDrinks[currentIndex]?.score || 0) : 0;
  const matchMessage = getMatchMessage(currentScore);
  const isShowingAdditionalDrink = currentIndex >= recommendations.length && !isShowingNoMoreCard;
  
  
  // Count active allergies (excluding 'none')
  const activeAllergiesCount = currentAllergies.filter(allergy => allergy !== 'none').length;

  useEffect(() => {
    updateRecommendations();
  }, [updateRecommendations]);

  // Reset image loading state when current drink changes
  useEffect(() => {
    setImageLoading(true);
  }, [currentDrink?.id]);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Check for saved drinks (only if saving is enabled)
  useEffect(() => {
    if (!isSavingEnabled) return;
    const savedIds = JSON.parse(localStorage.getItem('drinkjoy-saved-drinks') || '[]');
    setHasSavedDrinks(savedIds.length > 0);
  }, [isSavingEnabled]);

  // Listen for drink saved events to trigger animation (only if saving is enabled)
  useEffect(() => {
    if (!isSavingEnabled) return;
    
    const handleDrinkSaved = () => {
      setHasSavedDrinks(true); // Update saved drinks state
      setTriggerAnimation(true);
      setTimeout(() => setTriggerAnimation(false), 1000); // Reset after animation
    };

    window.addEventListener('drinkSaved', handleDrinkSaved);
    return () => window.removeEventListener('drinkSaved', handleDrinkSaved);
  }, [isSavingEnabled]);

  const goToNext = async () => {
    // Check if we&apos;re at the last actual drink (not counting the special card)
    if (currentIndex === allDrinks.length - 1 && !showNoMoreDrinksCard) {
      // If we've already expanded to all categories, automatically load more without showing the card
      if (hasExpandedToAllCategories && !isLoadingMore) {
        const loadedCount = await loadDrinksFromAllCategories();
        // Only advance if we actually loaded more drinks
        if (loadedCount > 0) {
          setDragDirection('left');
          setTimeout(() => {
            setCurrentIndex(currentIndex + 1);
            setDragDirection(null);
          }, 100);
        } else {
          // No more drinks available - start over from the beginning
          setDragDirection('left');
          setTimeout(() => {
            setCurrentIndex(0);
            setDragDirection(null);
          }, 100);
        }
        return;
      }
      
      // First time reaching end - show the special card once
      setShowNoMoreDrinksCard(true);
      // Advance the index to show the special card
      setDragDirection('left');
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
        setDragDirection(null);
      }, 100);
      return;
    }
    
    if (currentIndex < totalCards - 1) {
      setDragDirection('left');
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
        setDragDirection(null);
      }, 100);
    } else if (currentIndex === totalCards - 1) {
      // We're at the absolute end (including any special cards) - start over
      setDragDirection('left');
      setTimeout(() => {
        setCurrentIndex(0);
        setDragDirection(null);
      }, 100);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setDragDirection('right');
      setTimeout(() => {
        setCurrentIndex(currentIndex - 1);
        setDragDirection(null);
      }, 100);
    }
  };

  const fetchWeatherData = async () => {
    setIsLoadingLocation(true);
    setLocationError(null);
    
    try {
      // Use centralized weather service which handles caching and location logic
      const weatherData = await weatherService.getWeatherData();
      
      setLocalWeatherData(weatherData);
      setUseWeather(true);
    } catch (error) {
      console.error('WizardResults: Failed to fetch weather:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unable to get your location. Please enable location access.';
      setLocationError(errorMessage);
      setUseWeather(false);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const toggleWeather = async () => {
    if (!localWeatherData) {
      // First check if there's cached weather data we can use
      const cachedWeather = weatherService.getCachedWeatherData();
      if (cachedWeather) {
        setLocalWeatherData(cachedWeather);
        setUseWeather(true);
        return;
      }
      
      // No cached data - fetch it and enable
      await fetchWeatherData();
      // fetchWeatherData already sets useWeather to true
    } else {
      // Weather data exists - simple toggle
      setUseWeather(!useWeather);
    }
  };

  const handleDragEnd = async (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = window.innerWidth * 0.15; // 15% of viewport width
    const velocityThreshold = 500; // velocity threshold for quick flicks
    
    // Check if drag distance OR velocity exceeds threshold
    if ((info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) && currentIndex > 0) {
      // Swipe right - go to previous
      goToPrevious();
    } else if ((info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold)) {
      // Swipe left - go to next (let goToNext handle the bounds checking)
      await goToNext();
    }
    // If neither threshold is met, the card will snap back to center
  };

  // Show loading state while recommendations are being fetched
  if (isLoadingRecommendations) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-rose-50 flex items-center justify-center">
        <ColorSplashAnimation 
          repeat={true}
          size="lg"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-xl font-semibold text-gray-800 z-10">
            Finding your perfect matches...
          </p>
        </div>
      </div>
    );
  }

  // Show full results view if requested
  if (showFullResults) {
    return (
      <WizardFullResults
        recommendations={recommendations}
        preferences={preferences}
        weatherData={localWeatherData}
        onBack={() => setShowFullResults(false)}
        currentAllergies={currentAllergies}
      />
    );
  }

  if (!currentDrink && !isShowingNoMoreCard) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="min-h-screen bg-gradient-to-br from-purple-50 to-rose-50"
    >
      <div>
        {/* Header */}
        <div className="flex flex-col justify-center items-center p-2">
          {/* <h2 className="text-sm font-bold text-gray-800">
            {preferences.category === 'featured' ? '⭐ Featured Drinks' : getWittyTitle(allDrinks.length)}
          </h2> */}
          {isAtAbsoluteEnd && currentIndex === allDrinks.length - 1 && (
            <p className="text-xs text-gray-500 mt-1">
              Swipe or click next to start over! 🔄
            </p>
          )}
        </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-2 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={isShowingNoMoreCard ? 'no-more-drinks' : currentDrink?.id}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            initial={{ 
              x: dragDirection === 'left' ? 300 : dragDirection === 'right' ? -300 : 0,
              opacity: 0,
              scale: 0.8 
            }}
            animate={{ 
              x: 0,
              opacity: 1,
              scale: 1 
            }}
            exit={{ 
              x: dragDirection === 'left' ? -300 : dragDirection === 'right' ? 300 : 0,
              opacity: 0,
              scale: 0.8 
            }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30 
            }}
            className="w-full max-w-md cursor-grab active:cursor-grabbing"
            whileDrag={{ 
              scale: 1.05,
              rotate: 5,
              transition: { duration: 0.1 }
            }}
          >
            {isLoadingMore ? (
              /* Loading More Drinks Card */
              <div className="bg-white rounded-3xl overflow-hidden">
                <div className="bg-gradient-to-r from-blue-400 to-purple-400 text-white p-4 text-center">
                  <div className="text-xl font-bold">Loading More Drinks...</div>
                </div>
                
                <div className="p-6 text-center">
                  <ColorSplashAnimation size="lg" repeat={true} />
                  <h3 className="text-2xl font-bold mb-4 text-gray-800 mt-4">
                    Finding More Perfect Matches! ✨
                  </h3>
                  
                  <p className="text-gray-600 mb-6 text-lg">
                    Searching through all categories for more drinks you&apos;ll love...
                  </p>
                </div>
              </div>
            ) : isShowingNoMoreCard ? (
              /* Special No More Drinks Card */
              <div className="bg-white rounded-3xl overflow-hidden">
                <div className="bg-gradient-to-r from-purple-400 to-pink-400 text-white p-4 text-center">
                  <div className="text-xl font-bold">Oops! We&apos;re All Out!</div>
                </div>
                
                <div className="p-6 text-center">
                  <h3 className="text-2xl font-bold mb-4 text-gray-800">
                    Feeling Inspired Yet?
                  </h3>
                  
                  <p className="text-gray-600 mb-6 text-lg">
                    You should be inspired by now! Go on, ask the bartender what&apos;s on your mind - or let us show you more liquid possibilities.
                  </p>
                  
                  <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 mb-6">
                    <p className="text-yellow-800 font-semibold mb-2">
                      Want to Explore More?
                    </p>
                    <p className="text-yellow-700 text-sm">
                      We can show you drinks from all categories 
                      {activeAllergiesCount > 0 
                        ? "while still keeping your allergy restrictions for safety."
                        : "that might surprise you with new flavors!"
                      }
                    </p>
                  </div>
                  
                  <button
                    onClick={loadDrinksFromAllCategories}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-bold hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105"
                  >
                    Explore All Categories
                  </button>
                  
                  <p className="text-xs text-gray-500 mt-4">
                    {activeAllergiesCount > 0 
                      ? "(Your allergy filters will remain active for safety)"
                      : "(Discover drinks from categories you haven't tried yet)"
                    }
                  </p>
                </div>
              </div>
            ) : (
              /* Regular Drink Card */
              <div className="bg-white rounded-3xl overflow-hidden">
                {/* Match Score */}
                <div className={cn(
                  "text-white p-2 text-center",
                  isShowingAdditionalDrink 
                    ? "bg-gradient-to-r from-purple-400 to-indigo-400" 
                    : "bg-gradient-to-r from-purple-400 to-rose-400"
                )}>
                  <div className="text-lg font-bold">
                    {matchMessage}
                  </div>
                  <div className="text-sm font-bold">
                    Match Score: {currentScore}%
                  </div>
                </div>

                {/* Drink Image */}
                <div className="relative h-72 bg-gradient-to-br from-gray-100 to-gray-200">
                  {currentDrink?.image_url ? (
                    <>
                      {imageLoading && (
                        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse">
                          <div className="absolute inset-0 animate-shimmer" />
                        </div>
                      )}
                      <Image
                        src={currentDrink.image_url}
                        alt={currentDrink.name}
                        fill
                        className={cn("object-cover transition-opacity duration-300", 
                          imageLoading ? "opacity-0" : "opacity-100"
                        )}
                        onLoad={() => setImageLoading(false)}
                      />
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full text-6xl">
                      🍹
                    </div>
                  )}
                  
                  {/* Happy Hour Badge */}
                  {currentDrink?.happy_hour && (
                    <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold shadow-lg">
                      🎉 Happy Hour Special
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="absolute bottom-3 left-3 right-3 flex">
                    <div className="flex-1">
                      <SaveDrinkButton 
                        drinkId={currentDrink?.id || ''} 
                        drinkName={currentDrink?.name || ''}
                        drink={currentDrink || undefined}
                        size="md"
                        className="shadow-lg"
                        showShareOption={true}
                      />
                    </div>
                    <div className="">
                      <LikeButton 
                        drinkId={currentDrink?.id || ''} 
                        size="md"
                        className="shadow-lg"
                      />
                    </div>
                  </div>

                  {/* Order Button */}
                  <OrderButton 
                    drinkId={currentDrink?.id || ''} 
                    drinkName={currentDrink?.name || ''}
                  />
                </div>

                {/* Drink Info */}
                <div className="p-2">
                  <h3 className="text-1xl font-bold mb-2 bg-gradient-to-r from-purple-500 via-rose-500 to-purple-500 bg-clip-text text-transparent animate-gradient-x">{currentDrink?.name}</h3>
                  <p className="text-gray-600 mb-2 text-sm min-h-[3.5rem]">{currentDrink?.description}</p>
                  
                  {/* Match Reasons */}
                  {allDrinks[currentIndex]?.reasons && allDrinks[currentIndex].reasons.length > 0 && (
                    <div className={cn(
                      "rounded-lg p-2 mb-2 min-h-[3rem]",
                      isShowingAdditionalDrink 
                        ? "bg-purple-50" 
                        : "bg-purple-50"
                    )}>
                      <p className={cn(
                        "text-sm",
                        isShowingAdditionalDrink 
                          ? "text-purple-800" 
                          : "text-purple-800"
                      )}>
                        {allDrinks[currentIndex].reasons.join(' • ')}
                      </p>
                    </div>
                  )}

                  {/* Quick Info */}
                  <div className="flex justify-between text-sm text-gray-500 mb-2">
                    <span>{currentDrink?.category}</span>
                    <span>{currentDrink?.strength}</span>
                    <span>{currentDrink?.abv}% ABV</span>
                  </div>

                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Fixed Saved Drinks Button (only shown if saving is enabled) */}
      {isSavingEnabled && hasSavedDrinks && (
        <motion.button
          onClick={() => setShowMyDrinksPanel(true)}
          className="fixed top-6 right-6 w-12 h-12 bg-white rounded-full flex items-center justify-center hover:bg-gray-50 transition-all duration-200 group shadow-lg z-30"
          title="View Saved Drinks"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: triggerAnimation ? [1, 1.3, 1.1, 1.2, 1] : 1, 
            opacity: 1,
            rotate: triggerAnimation ? [0, -8, 8, -4, 0] : 0
          }}
          transition={{ 
            delay: triggerAnimation ? 0 : 0.5, 
            type: triggerAnimation ? "tween" : "spring", 
            stiffness: triggerAnimation ? 400 : 300,
            duration: triggerAnimation ? 0.8 : undefined,
            ease: triggerAnimation ? "easeInOut" : undefined
          }}
        >
          <motion.div
            animate={{ 
              scale: triggerAnimation ? [1, 1.4, 1.2, 1.3, 1] : 1
            }}
            transition={{ 
              duration: triggerAnimation ? 0.8 : 0,
              type: triggerAnimation ? "tween" : "spring",
              ease: triggerAnimation ? "easeInOut" : undefined,
              stiffness: 400
            }}
          >
            <Bookmark className="w-5 h-5 text-gray-700 group-hover:text-gray-900 transition-colors" />
          </motion.div>
          {/* Notification dot */}
          <motion.div 
            className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full border-2 border-white animate-pulse"
            animate={{
              scale: triggerAnimation ? [1, 1.6, 1.3, 1.5, 1] : 1
            }}
            transition={{
              duration: triggerAnimation ? 0.8 : 0,
              type: triggerAnimation ? "tween" : "spring",
              ease: triggerAnimation ? "easeInOut" : undefined,
              stiffness: 400
            }}
          />
        </motion.button>
      )}

      {/* Navigation */}
      <div className="p-2">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={goToPrevious}
            disabled={currentIndex === 0 || isLoadingMore}
            className={`p-2 rounded-full ${
              currentIndex === 0 || isLoadingMore
                ? 'bg-gray-200 text-gray-400'
                : 'bg-white hover:bg-gray-100 text-gray-800'
            } transition-colors`}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center min-w-0">
            {totalCards <= 10 ? (
              /* Traditional dots for small counts */
              <div className="flex gap-2">
                {Array.from({ length: totalCards }).map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 rounded-full transition-all ${
                      index === currentIndex
                        ? 'bg-purple-400 w-8'
                        : 'bg-gray-300 w-2'
                    }`}
                  />
                ))}
              </div>
            ) : (
              /* Compact progress bar for large counts */
              <div className="h-2 bg-gray-300 rounded-full w-24 relative overflow-hidden">
                <div 
                  className="h-full bg-purple-400 rounded-full transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / totalCards) * 100}%` }}
                />
              </div>
            )}
          </div>

          <button
            onClick={goToNext}
            disabled={isLoadingMore}
            className={`p-2 rounded-full ${
              isLoadingMore
                ? 'bg-gray-200 text-gray-400'
                : 'bg-white hover:bg-gray-100 text-gray-800'
            } transition-colors`}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Bottom Actions */}
        <div className="flex gap-3 mb-2">
          <button
            onClick={() => setShowFullResults(true)}
            className="flex-1 flex items-center justify-center gap-2 bg-purple-500 text-white py-2 rounded-xl font-semibold hover:bg-purple-600 transition-colors"
          >
            View All Matches
          </button>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={toggleWeather}
            disabled={isLoadingLocation}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl font-semibold transition-colors ${
              useWeather && localWeatherData
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-white text-gray-800 border border-gray-300 hover:bg-blue-50'
            } ${isLoadingLocation ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoadingLocation ? (
              <div className="flex items-center gap-2">
                <ColorSplashAnimation size="sm" repeat={true} />
                <span>Finding Location...</span>
              </div>
            ) : localWeatherData ? (
              <>
                <div className="flex flex-col text-xs leading-tight">
                  <span>{localWeatherData.location.name}</span>
                  <span className="opacity-80">
                    {Math.round(localWeatherData.current.temp * 9/5 + 32)}°F • {useWeather ? 'ON' : 'OFF'}
                  </span>
                </div>
              </>
            ) : (
              <>
               Weather Based
              </>
            )}
          </button>
          
          <button
            onClick={() => setShowAllergiesModal(true)}
            className="flex-1 flex items-center justify-center gap-2 bg-white text-gray-800 py-2 rounded-xl font-semibold border border-gray-300 hover:bg-purple-50 transition-colors"
          >
            Allergies
            {activeAllergiesCount > 0 && (
              <span className="bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] h-5 flex items-center justify-center">
                {activeAllergiesCount}
              </span>
            )}
          </button>
          
          <button
            onClick={onRetakeQuiz}
            className="flex-1 flex items-center justify-center gap-2 bg-white text-gray-800 py-2 rounded-xl font-semibold border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Retake
          </button>
        </div>

        {/* Location Error */}
        {locationError && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 p-3 bg-purple-50 border border-red-200 rounded-lg"
          >
            <p className="text-red-700 text-sm text-center">{locationError}</p>
          </motion.div>
        )}
      </div>
      </div>
      
      {/* Allergies Modal */}
      <AllergiesModal
        isOpen={showAllergiesModal}
        onClose={() => setShowAllergiesModal(false)}
        currentAllergies={currentAllergies}
        onUpdate={handleAllergiesUpdate}
      />
      
      {/* My Drinks Panel (only rendered if saving is enabled) */}
      {isSavingEnabled && (
        <MyDrinksPanel
          isOpen={showMyDrinksPanel}
          onClose={() => setShowMyDrinksPanel(false)}
        />
      )}
    </motion.div>
  );
}