'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { DrinkRecommendation } from '@/app/types/drinks';
import { WizardPreferences, AllergyType } from '@/app/types/wizard';
import { WeatherData } from '@/app/types/weather';
import { ChevronLeft, Bookmark } from 'lucide-react';
import Image from 'next/image';
import LikeButton from '@/app/components/ui/LikeButton';
import SaveDrinkButton from '@/app/components/ui/SaveDrinkButton';
import DrinkStatsDisplay from '@/app/components/ui/DrinkStatsDisplay';
import EmailCaptureForm from '@/app/components/ui/EmailCaptureForm';
import { EmailCaptureModal } from '@/app/components/email-capture/EmailCaptureModal';
import { MyDrinksPanel } from '@/app/components/my-drinks/MyDrinksPanel';
import { getAdditionalDrinksFromAllCategories } from '@/lib/drinkMatcher';
import ColorSplashAnimation from '@/app/components/animations/ColorSplashAnimation';

interface WizardFullResultsProps {
  recommendations: DrinkRecommendation[];
  preferences: WizardPreferences;
  weatherData?: WeatherData | null;
  onBack: () => void;
  currentAllergies?: AllergyType[];
}

export default function WizardFullResults({
  recommendations,
  preferences,
  weatherData,
  onBack,
  currentAllergies
}: WizardFullResultsProps) {
  const [allRecommendations, setAllRecommendations] = useState<DrinkRecommendation[]>(recommendations);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreDrinks, setHasMoreDrinks] = useState(false);
  const [isCheckingMore, setIsCheckingMore] = useState(true);
  const [showNoMoreDrinksMessage, setShowNoMoreDrinksMessage] = useState(false);
  const [hasExpandedToAllCategories, setHasExpandedToAllCategories] = useState(false);
  const [isAutoLoading, setIsAutoLoading] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [hasShownEmailModal, setHasShownEmailModal] = useState(false);
  const [showMyDrinksPanel, setShowMyDrinksPanel] = useState(false);
  const [hasSavedDrinks, setHasSavedDrinks] = useState(false);
  const [triggerAnimation, setTriggerAnimation] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const loadDrinksFromAllCategories = useCallback(async (isAutoLoad = false) => {
    setIsLoadingMore(true);
    setShowNoMoreDrinksMessage(false);
    if (isAutoLoad) setIsAutoLoading(true);
    
    try {
      const currentIds = allRecommendations.map(rec => rec.drink.id);
      const updatedPrefs = {
        ...preferences,
        allergies: currentAllergies || preferences.allergies
      };
      const additionalDrinks = await getAdditionalDrinksFromAllCategories(
        updatedPrefs,
        currentIds,
        15 // Load 15 more at once for better UX
      );
      
      if (additionalDrinks.length > 0) {
        setAllRecommendations(prev => [...prev, ...additionalDrinks]);
        setHasExpandedToAllCategories(true); // Mark that we've expanded
        setHasMoreDrinks(false); // Hide the button after first expansion
      } else {
        // If no drinks found from all categories, we&apos;re truly at the end
        setShowNoMoreDrinksMessage(true);
        setHasMoreDrinks(false);
      }
    } catch (error) {
      console.error('Failed to load drinks from all categories:', error);
    } finally {
      setIsLoadingMore(false);
      if (isAutoLoad) setIsAutoLoading(false);
    }
  }, [allRecommendations, preferences, currentAllergies]);

  // Check if there are more drinks available when component mounts
  useEffect(() => {
    // Always show the button to expand search
    setHasMoreDrinks(true);
    setIsCheckingMore(false);
    
    // Check if user has saved drinks before
    const savedDrinks = JSON.parse(localStorage.getItem('drinkjoy-saved-drinks') || '[]');
    setHasSavedDrinks(savedDrinks.length > 0);
    
    // Show email modal after a short delay if not already shown
    const hasSeenModal = localStorage.getItem('drinkjoy-email-modal-shown');
    if (!hasSeenModal && !hasShownEmailModal && recommendations.length > 0) {
      const timer = setTimeout(() => {
        setShowEmailModal(true);
        setHasShownEmailModal(true);
        localStorage.setItem('drinkjoy-email-modal-shown', 'true');
        // Clear the flag after 24 hours
        setTimeout(() => {
          localStorage.removeItem('drinkjoy-email-modal-shown');
        }, 24 * 60 * 60 * 1000);
      }, 2000); // Show after 2 seconds
      
      return () => clearTimeout(timer);
    }
  }, [recommendations, preferences, hasShownEmailModal]);

  // Listen for drink saved events to trigger animation
  useEffect(() => {
    const handleDrinkSaved = () => {
      setHasSavedDrinks(true); // Update saved drinks state
      setTriggerAnimation(true);
      setTimeout(() => setTriggerAnimation(false), 1000); // Reset after animation
    };

    window.addEventListener('drinkSaved', handleDrinkSaved);
    return () => window.removeEventListener('drinkSaved', handleDrinkSaved);
  }, []);

  // Intersection Observer for auto-loading more drinks
  useEffect(() => {
    if (!hasExpandedToAllCategories || isLoadingMore || showNoMoreDrinksMessage || !loadMoreRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !isAutoLoading) {
          loadDrinksFromAllCategories(true);
        }
      },
      {
        root: null,
        rootMargin: '100px', // Start loading 100px before the element comes into view
        threshold: 0.1
      }
    );

    observer.observe(loadMoreRef.current);

    return () => {
      observer.disconnect();
    };
  }, [hasExpandedToAllCategories, isLoadingMore, showNoMoreDrinksMessage, isAutoLoading, loadDrinksFromAllCategories]);


  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -300 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed inset-0 bg-gradient-to-br from-purple-50 to-rose-50 flex flex-col"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-4 flex items-center gap-4 flex-shrink-0">
        <button
          onClick={onBack}
          className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 text-center">
          <div className="text-2xl mb-1">🎯</div>
          <div className="text-lg font-bold">All Your Perfect Matches</div>
          <div className="text-xs opacity-90">
            Found {allRecommendations.length} drinks just for you!
          </div>
        </div>
        {hasSavedDrinks && (
          <motion.button
            onClick={() => setShowMyDrinksPanel(true)}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors relative"
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
              <Bookmark className="w-5 h-5" />
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
      </div>

      {/* Save All Button */}
      <div className="px-4 pb-2">
        <motion.button
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={() => setShowEmailModal(true)}
          className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl py-3 mt-3 px-4 font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
        >
          <Bookmark className="w-5 h-5" />
          Save All {allRecommendations.length} Matches
        </motion.button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 pt-2 space-y-4">
          {allRecommendations.sort((a, b) => b.score - a.score).map((rec) => (
            <motion.div
              key={rec.drink.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              whileHover={{ 
                scale: 1.02,
                boxShadow: "0 8px 25px rgba(0,0,0,0.1)",
                transition: { type: "spring", stiffness: 300 }
              }}
              className="bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 cursor-pointer"
            >
              {/* Drink Image */}
              <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0 relative overflow-hidden">
                {rec.drink.image_url ? (
                  <Image
                    src={rec.drink.image_url}
                    alt={rec.drink.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-2xl">
                    🍹
                  </div>
                )}
              </div>
              
              {/* Drink Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-gray-800 truncate">
                    {rec.drink.name}
                  </h4>
                  <motion.div 
                    className="flex items-center gap-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-3 py-1 rounded-full flex-shrink-0 shadow-sm"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <span className="text-xs font-bold">{Math.min(100, rec.score)}%</span>
                    <span className="text-xs">🎯</span>
                  </motion.div>
                </div>
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                  {rec.drink.description}
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="capitalize">{rec.drink.category}</span>
                    <span className="capitalize">{rec.drink.strength}</span>
                    <span>{rec.drink.abv}% ABV</span>
                  </div>
                  <DrinkStatsDisplay drinkId={rec.drink.id} />
                </div>
                
                {/* Match Reasons with Expandable Details */}
                {rec.reasons && rec.reasons.length > 0 && (
                  <motion.div 
                    className="mt-2"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="text-xs text-purple-700 bg-purple-50 rounded-lg px-3 py-2 border border-purple-200">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-purple-800">Why this matches:</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {rec.reasons.map((reason, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 bg-white text-purple-700 px-2 py-0.5 rounded-full text-xs border border-purple-300">
                            <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                            {reason}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex-shrink-0 flex flex-col gap-2">
                <SaveDrinkButton 
                  drinkId={rec.drink.id}
                  drinkName={rec.drink.name}
                  drink={rec.drink}
                  size="sm"
                  showShareOption={true}
                />
                <LikeButton 
                  drinkId={rec.drink.id} 
                  size="sm"
                />
              </div>
            </motion.div>
          ))}
          
          {/* Divider and Load More Section */}
          {!hasExpandedToAllCategories && !isCheckingMore && recommendations.length > 0 && (
            <>
              {hasMoreDrinks ? (
                <div className="mt-8 mb-4">
                  <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative bg-gradient-to-br from-purple-50 to-rose-50 px-4">
                      <button
                        onClick={() => loadDrinksFromAllCategories()}
                        disabled={isLoadingMore}
                        className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                      >
                        {isLoadingMore ? (
                          <>
                            <ColorSplashAnimation size="sm" repeat={true} />
                            <span>Loading...</span>
                          </>
                        ) : (
                          <>
                            <span>🍹</span>
                            <span>Explore All Categories</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <p className="text-center text-sm text-gray-500 mt-2">
                    Discover drinks from other categories while keeping your allergy preferences.<br/>
                  </p>
                </div>
              ) : null}
            </>
          )}
          
          {/* Intersection Observer trigger and auto-loading indicator */}
          {hasExpandedToAllCategories && !showNoMoreDrinksMessage && (
            <div ref={loadMoreRef} className="mt-4 mb-4 mx-4 text-center">
              {isAutoLoading ? (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-200">
                  <ColorSplashAnimation size="md" repeat={true} />
                  <p className="text-blue-700 font-semibold mt-3 mb-1">
                    ✨ Loading More Perfect Matches...
                  </p>
                  <p className="text-blue-600 text-sm">
                    Searching through all categories for more drinks you&apos;ll love!
                  </p>
                </div>
              ) : (
                <div className="h-4 w-full opacity-0">
                  {/* Invisible trigger element for Intersection Observer */}
                </div>
              )}
            </div>
          )}

          {/* No More Drinks Due to Allergies Message */}
          {showNoMoreDrinksMessage && (
            <div className="mt-8 mb-4 mx-4">
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    Feeling Inspired Yet?
                  </h3>
                  <p className="text-gray-600 mb-4">
                    You should be inspired by now! With this many drinks under your belt, go on, ask the bartender what&apos;s on your mind.
                  </p>
                  
                  <div className="bg-white rounded-lg p-4 mb-4 border border-purple-100">
                    <p className="text-sm text-purple-800 font-semibold mb-1">
                      🏆 Congratulations!
                    </p>
                    <p className="text-xs text-purple-600">
                      You&apos;ve discovered every drink we have that matches your taste and dietary needs. 
                      Time to try some of your favorites!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with preferences and email capture */}
        <div className="p-4 bg-white mx-4 rounded-xl mb-4 shadow-sm">
          <div className="mb-4">
            <h4 className="font-semibold text-gray-800 mb-2 text-center">
              Your Perfect {preferences.category && preferences.category !== 'any' && preferences.category !== 'featured'
                ? preferences.category === 'non-alcoholic' 
                  ? 'Non-Alcoholic' 
                  : preferences.category.charAt(0).toUpperCase() + preferences.category.slice(1)
                : ''} Profile
            </h4>
            <div className="flex flex-wrap gap-2 justify-center">
              {preferences.flavor && (
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                  {preferences.flavor} flavors
                </span>
              )}
              {preferences.strength && (
                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                  {preferences.strength} strength
                </span>
              )}
              {preferences.occasion && (
                <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-sm">
                  {preferences.occasion} vibes
                </span>
              )}
              {preferences.useWeather && weatherData && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  weather-matched
                </span>
              )}
              {(currentAllergies || preferences.allergies) && (currentAllergies || preferences.allergies)!.length > 0 && !(currentAllergies || preferences.allergies)!.includes('none') && (
                <span className="px-3 py-1 bg-purple-100 text-red-700 rounded-full text-sm">
                  🚫 {(currentAllergies || preferences.allergies)!.join(', ')} free
                </span>
              )}
            </div>
          </div>
          
          <EmailCaptureForm 
            matchedDrinks={allRecommendations}
            preferences={{
              ...preferences,
              allergies: currentAllergies || preferences.allergies
            }}
          />
        </div>
      </div>
      
      {/* Email Capture Modal */}
      <EmailCaptureModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        matchCount={allRecommendations.length}
        topMatch={allRecommendations[0] ? {
          name: allRecommendations[0].drink.name,
          category: allRecommendations[0].drink.category,
          image_url: allRecommendations[0].drink.image_url
        } : undefined}
        onSubmit={(email) => {
          console.log('Email captured:', email);
          // Email is already saved by the modal
        }}
      />
      
      {/* My Drinks Panel */}
      <MyDrinksPanel
        isOpen={showMyDrinksPanel}
        onClose={() => setShowMyDrinksPanel(false)}
      />
    </motion.div>
  );
}