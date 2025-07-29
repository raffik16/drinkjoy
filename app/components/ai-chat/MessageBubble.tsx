'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { FiUser } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi2';
import { DrinkCard } from '@/app/components/drinks/DrinkCard';
// Modal imports disabled since modals are disabled in AI chat
// import { DrinkModal } from '@/app/components/drinks/DrinkModal';
// import { RecipeModal } from '@/app/components/drinks/RecipeModal';
import { Drink, DrinkRecommendation, DrinkCategory, FlavorProfile, DrinkStrength } from '@/app/types/drinks';


export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
  quickButtons?: string[];
  drinks?: Array<{
    name: string;
    category: string;
    abv?: number;
    flavor_profile?: string[];
    description?: string;
    image_url?: string;
    matchQuality?: 'perfect' | 'good' | 'other' | 'alternative';
    matchReasons?: string[];
    score?: number;
  }>;
}

interface MessageBubbleProps {
  message: Message;
  className?: string;
  onQuickResponse?: (response: string) => void;
}


export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, className, onQuickResponse }) => {
  const [showAllDrinks, setShowAllDrinks] = useState<{[key: string]: boolean}>({});
  // Modal functionality disabled in AI chat to prevent interference
  // const [selectedDrink, setSelectedDrink] = useState<Drink | null>(null);
  // const [showDrinkModal, setShowDrinkModal] = useState(false);
  // const [showRecipeModal, setShowRecipeModal] = useState(false);
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  // Click handlers disabled in AI chat to prevent modal interference
  // const handleDrinkClick = (drink: Drink) => {
  //   setSelectedDrink(drink);
  //   setShowDrinkModal(true);
  // };

  // const handleRecipeClick = (drink: Drink) => {
  //   setSelectedDrink(drink);
  //   setShowRecipeModal(true);
  // };

  // System messages get special styling
  if (isSystem) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={cn('flex justify-center', className)}
      >
        <div className="max-w-[80%] bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl px-4 py-3 text-center">
          <p className="text-sm text-yellow-800 dark:text-yellow-200 leading-relaxed">
            {message.content}
          </p>
          <div className="text-xs mt-1 text-yellow-600 dark:text-yellow-400">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        'flex items-start gap-3',
        isUser ? 'justify-end' : 'justify-start',
        className
      )}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-purple-500 flex items-center justify-center shadow-md">
          <HiSparkles className="w-4 h-4 text-white" />
        </div>
      )}
      
      <div
        className={cn(
          'rounded-2xl px-4 py-3 shadow-sm',
          // Make width more flexible for drink cards
          message.drinks && message.drinks.length > 0 ? 'max-w-[90%] w-full' : 'max-w-[70%]',
          isUser
            ? 'bg-purple-600 text-white rounded-br-sm'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-sm'
        )}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        
        {/* Quick Response Buttons */}
        {!isUser && message.quickButtons && message.quickButtons.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {message.quickButtons.map((button, index) => (
              <button
                key={index}
                onClick={() => onQuickResponse?.(button)}
                className="px-3 py-1.5 text-xs bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-lg transition-colors border border-purple-200 hover:border-purple-300"
              >
                {button}
              </button>
            ))}
          </div>
        )}
        
        {/* Drinks Grid */}
        {!isUser && message.drinks && message.drinks.length > 0 && (
          <div className="mt-4 -mx-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-4">
              {(showAllDrinks[message.id] ? message.drinks : message.drinks.slice(0, 6)).map((drinkData, index) => {
                // Transform AI response data to match Drink interface
                const drink: Drink = {
                  id: `ai-${index}-${Date.now()}`,
                  name: drinkData.name,
                  category: drinkData.category as DrinkCategory,
                  description: drinkData.description || '',
                  ingredients: [],
                  abv: drinkData.abv || 0,
                  flavor_profile: (drinkData.flavor_profile || []) as FlavorProfile[],
                  strength: 'medium' as DrinkStrength, // Default fallback
                  weather_match: {
                    temp_min: 0,
                    temp_max: 30,
                    conditions: [],
                    ideal_temp: 15
                  },
                  occasions: [],
                  serving_suggestions: [],
                  image_url: drinkData.image_url || '',
                  glass_type: undefined,
                  preparation: undefined
                };

                // Debug logging for image URLs in AI chat
                if (process.env.NODE_ENV === 'development') {
                  console.log(`AI Chat Image Debug - ${drinkData.name}:`, {
                    original_image_url: drinkData.image_url,
                    final_image_url: drink.image_url,
                    has_image: !!drink.image_url
                  });
                }

                // Create recommendation data if available
                const recommendation: DrinkRecommendation | undefined = drinkData.score ? {
                  drink,
                  score: drinkData.score,
                  reasons: drinkData.matchReasons || []
                } : undefined;
                
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                    className="relative"
                  >
                    {/* Match Quality Badge */}
                    {drinkData.matchQuality && (
                      <div className="absolute top-2 left-2 z-10">
                        <div className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium shadow-md",
                          drinkData.matchQuality === 'perfect' && "bg-green-500 text-white",
                          drinkData.matchQuality === 'good' && "bg-amber-500 text-white",
                          drinkData.matchQuality === 'other' && "bg-gray-500 text-white",
                          drinkData.matchQuality === 'alternative' && "bg-blue-500 text-white"
                        )}>
                          {drinkData.matchQuality === 'perfect' && '🎯 Perfect'}
                          {drinkData.matchQuality === 'good' && '✨ Good'}
                          {drinkData.matchQuality === 'other' && '🍹 Match'}
                          {drinkData.matchQuality === 'alternative' && '💡 Alternative'}
                        </div>
                      </div>
                    )}
                    <DrinkCard
                      drink={drink}
                      recommendation={recommendation}
                      // onClick and onRecipeClick disabled in AI chat for display-only mode
                      // onClick={() => handleDrinkClick(drink)}
                      // onRecipeClick={() => handleRecipeClick(drink)}
                      className="h-full"
                    />
                  </motion.div>
                );
              })}
            </div>
            
            {/* Show More Button */}
            {message.drinks && message.drinks.length > 6 && !showAllDrinks[message.id] && (
              <div className="px-4 mt-4">
                <motion.button
                  onClick={() => setShowAllDrinks(prev => ({ ...prev, [message.id]: true }))}
                  className="w-full px-4 py-2 text-sm bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-lg transition-colors border border-purple-200 hover:border-purple-300 font-medium"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Show {message.drinks.length - 6} More Options
                </motion.button>
              </div>
            )}
          </div>
        )}
        
        <div
          className={cn(
            'text-xs mt-1 opacity-70',
            isUser ? 'text-purple-100' : 'text-gray-500 dark:text-gray-400'
          )}
        >
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
      
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center shadow-md">
          <FiUser className="w-4 h-4 text-gray-600 dark:text-gray-300" />
        </div>
      )}
      
      {/* Modals disabled in AI chat to prevent interference */}
    </motion.div>
  );
};