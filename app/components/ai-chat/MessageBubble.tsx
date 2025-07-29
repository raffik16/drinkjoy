'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { FiUser } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi2';
import { Wine, Beer, Coffee, Zap } from 'lucide-react';


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

const getDrinkIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case 'wine': return Wine;
    case 'beer': return Beer;
    case 'cocktail': return Zap;
    case 'spirit': return Coffee;
    case 'non-alcoholic': return Coffee;
    default: return Zap;
  }
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, className, onQuickResponse }) => {
  const [showAllDrinks, setShowAllDrinks] = useState<{[key: string]: boolean}>({});
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

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
          'max-w-[70%] rounded-2xl px-4 py-3 shadow-sm',
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
          <div className="grid grid-cols-1 gap-2 mt-3">
            {(showAllDrinks[message.id] ? message.drinks : message.drinks.slice(0, 6)).map((drink, index) => {
              const IconComponent = getDrinkIcon(drink.category);
              const matchQualityColors = {
                perfect: 'border-green-300 bg-green-50 dark:bg-green-900/20 dark:border-green-700',
                good: 'border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700',
                other: 'border-gray-300 bg-gray-50 dark:bg-gray-800 dark:border-gray-600',
                alternative: 'border-blue-300 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700'
              };
              const matchQualityIcons = {
                perfect: '🎯',
                good: '✨',
                other: '🍹',
                alternative: '💡'
              };
              const borderColor = matchQualityColors[drink.matchQuality || 'other'];
              const matchIcon = matchQualityIcons[drink.matchQuality || 'other'];
              
              return (
                <motion.div 
                  key={index} 
                  className={`p-3 rounded-lg border ${borderColor} relative`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                >
                  <div className="flex items-start gap-2">
                    {drink.image_url ? (
                      <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden">
                        <Image 
                          src={drink.image_url} 
                          alt={drink.name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback to icon if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const iconContainer = target.parentElement;
                            if (iconContainer) {
                              iconContainer.innerHTML = `<div class="w-full h-full bg-purple-100 dark:bg-purple-800 rounded-lg flex items-center justify-center">
                                <svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                                  ${IconComponent === Wine ? '<path d="M12 2C13.1 2 14 2.9 14 4V6H10V4C10 2.9 10.9 2 12 2M6 6H18V8H16V20C16 21.1 15.1 22 14 22H10C8.9 22 8 21.1 8 20V8H6V6Z"/>' : 
                                    IconComponent === Beer ? '<path d="M5,4V6H6V19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V6H19V4H5M8,6H16V19H8V6Z"/>' :
                                    '<path d="M12,2A2,2 0 0,1 14,4V8A4,4 0 0,1 10,12H10.5A2.5,2.5 0 0,0 13,14.5V16H11V14.5A2.5,2.5 0 0,0 8.5,12H9A4,4 0 0,1 5,8V4A2,2 0 0,1 7,2H12Z"/>'}
                                </svg>
                              </div>`;
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="flex-shrink-0 w-12 h-12 bg-purple-100 dark:bg-purple-800 rounded-lg flex items-center justify-center">
                        <IconComponent className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-xs">{matchIcon}</span>
                        <h4 className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                          {drink.name}
                        </h4>
                      </div>
                      {/* Match Score as plain text */}
                      {drink.score && (
                        <p className="text-xs text-purple-600 dark:text-purple-400 mb-1 font-medium">
                          {Math.round(Math.min(100, drink.score))}% Match
                        </p>
                      )}
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                        {drink.category}
                      </p>
                      {drink.flavor_profile && drink.flavor_profile.length > 0 && (
                        <p className="text-xs text-purple-700 dark:text-purple-300 mb-1">
                          {drink.flavor_profile.slice(0, 2).join(', ')}
                        </p>
                      )}
                      {drink.abv && (
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          {drink.abv}% ABV
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
            
            {/* Show More Button */}
            {message.drinks && message.drinks.length > 6 && !showAllDrinks[message.id] && (
              <motion.button
                onClick={() => setShowAllDrinks(prev => ({ ...prev, [message.id]: true }))}
                className="mt-2 w-full px-3 py-1.5 text-xs bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-lg transition-colors border border-purple-200 hover:border-purple-300"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Show {message.drinks.length - 6} More Options
              </motion.button>
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
    </motion.div>
  );
};