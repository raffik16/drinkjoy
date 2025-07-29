'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/app/components/ui/Card';
import { Drink, DrinkRecommendation } from '@/app/types/drinks';
import { FiPercent, FiDroplet, FiBook, FiStar } from 'react-icons/fi';
import { cn } from '@/lib/utils';

interface DrinkCardProps {
  drink: Drink;
  recommendation?: DrinkRecommendation;
  onClick?: () => void;
  onRecipeClick?: () => void;
  className?: string;
}

export const DrinkCard: React.FC<DrinkCardProps> = ({ 
  drink, 
  recommendation, 
  onClick,
  onRecipeClick,
  className 
}) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  
  const categoryColors = {
    beer: 'from-amber-500 to-amber-600',
    wine: 'from-purple-500 to-purple-600',
    cocktail: 'from-pink-500 to-pink-600',
    spirit: 'from-purple-500 to-purple-600',
    'non-alcoholic': 'from-green-500 to-green-600',
  };

  const strengthIcons = {
    'non-alcoholic': '○○○',
    light: '●○○',
    medium: '●●○',
    strong: '●●●',
  };

  return (
    <motion.div
      whileHover={onClick ? { y: -4 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      className={className}
    >
      <Card 
        variant="default" 
        hover={false}
        onClick={onClick}
        className={cn("overflow-hidden h-full", onClick && "cursor-pointer")}
      >
        <div className="relative h-48 w-full">
          {imageLoading && !imageError && (
            <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse">
              <div className="absolute inset-0 animate-shimmer" />
            </div>
          )}
          {drink.image_url && drink.image_url.trim() !== '' && !imageError ? (
            <Image
              src={drink.image_url}
              alt={drink.name}
              fill
              className={cn("object-cover transition-opacity duration-300", 
                imageLoading ? "opacity-0" : "opacity-100"
              )}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onLoad={() => setImageLoading(false)}
              onError={() => {
                setImageError(true);
                setImageLoading(false);
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-100 to-gray-200">
              <span className="text-6xl">🍹</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Happy Hour Badge */}
          {drink.happy_hour && (
            <div className="absolute top-3 left-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold shadow-lg">
              🎉 Happy Hour Special
            </div>
          )}

          {recommendation && recommendation.score > 80 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-3 right-3 bg-gradient-to-r from-yellow-400 to-amber-500 text-white p-2 rounded-full"
            >
              <FiStar className="w-5 h-5" />
            </motion.div>
          )}

          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="text-xl font-bold text-white mb-1">{drink.name}</h3>
            <div className="flex items-center gap-3 text-sm text-white/80">
              <span className={cn('px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r text-white', 
                categoryColors[drink.category]
              )}>
{drink.category}
              </span>
              <span className="flex items-center gap-1">
                <FiPercent className="w-4 h-4" />
                {drink.abv}%
              </span>
            </div>
          </div>
        </div>

        <CardContent className="p-4">
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
            {drink.description}
          </p>


          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm">
              <FiDroplet className="w-4 h-4 text-gray-500" />
              <span className="text-gray-700 dark:text-gray-300">
                {strengthIcons[drink.strength]}
              </span>
            </div>
            
            {drink.glass_type && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {drink.glass_type}
              </span>
            )}
          </div>

          {recommendation && (
            <div className="border-t pt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Match Score
                </span>
                <span className={cn(
                  'text-sm font-bold',
                  recommendation.score > 70 ? 'text-green-600' : 
                  recommendation.score > 40 ? 'text-yellow-600' : 'text-gray-600'
                )}>
                  {Math.min(100, recommendation.score)}%
                </span>
              </div>
              
              {recommendation.reasons.length > 0 && (
                <p className="text-xs text-gray-600 dark:text-gray-400 italic">
                  {recommendation.reasons[0]}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-1 mt-3">
            {drink.flavor_profile.slice(0, 3).map((flavor) => (
              <span
                key={flavor}
                className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full"
              >
                {flavor}
              </span>
            ))}
          </div>

          {/* Recipe Button */}
          {onRecipeClick && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRecipeClick();
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors duration-200 text-sm font-medium"
              >
                <FiBook className="w-4 h-4" />
                {drink.category === 'beer' || drink.category === 'wine' ? 'Details + Shop' : 'Get Recipe'}
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};