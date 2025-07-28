'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bookmark, BookmarkCheck, Share2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SaveDrinkButtonProps {
  drinkId: string;
  drinkName: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showShareOption?: boolean;
}

export default function SaveDrinkButton({ 
  drinkId, 
  drinkName,
  size = 'md',
  className,
  showShareOption = true
}: SaveDrinkButtonProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [copied, setCopied] = useState(false);

  // Check if drink is already saved
  useEffect(() => {
    const savedDrinks = JSON.parse(localStorage.getItem('drinkjoy-saved-drinks') || '[]');
    setIsSaved(savedDrinks.includes(drinkId));
  }, [drinkId]);

  const handleSave = () => {
    const savedDrinks = JSON.parse(localStorage.getItem('drinkjoy-saved-drinks') || '[]');
    
    if (isSaved) {
      // Remove from saved
      const filtered = savedDrinks.filter((id: string) => id !== drinkId);
      localStorage.setItem('drinkjoy-saved-drinks', JSON.stringify(filtered));
      setIsSaved(false);
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 2000);
    } else {
      // Add to saved
      savedDrinks.push(drinkId);
      localStorage.setItem('drinkjoy-saved-drinks', JSON.stringify(savedDrinks));
      localStorage.setItem(`drinkjoy-saved-date-${drinkId}`, new Date().toISOString());
      setIsSaved(true);
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 2000);
      
      // Dispatch custom event to trigger saved drinks icon animation
      window.dispatchEvent(new CustomEvent('drinkSaved', { 
        detail: { drinkId, drinkName } 
      }));
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/drink/${drinkId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: drinkName,
          text: `Check out this drink: ${drinkName}`,
          url: shareUrl
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback to copy to clipboard
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const sizeClasses = {
    sm: 'p-1.5 text-xs',
    md: 'p-2 text-sm',
    lg: 'p-3 text-base'
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <div className="flex items-center gap-1 relative">
      <motion.button
        onClick={handleSave}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "relative rounded-lg transition-all duration-200",
          "shadow-md hover:shadow-lg",
          "border",
          isSaved 
            ? "text-purple-600 bg-purple-50 border-purple-200" 
            : "text-gray-600 bg-white border-gray-200 hover:text-purple-600 hover:bg-purple-50",
          sizeClasses[size],
          className
        )}
        aria-label={isSaved ? "Remove from saved" : "Save drink"}
      >
        <motion.div
          initial={false}
          animate={{ 
            scale: isSaved ? [1, 1.2, 1] : 1,
            rotate: isSaved ? [0, -10, 10, 0] : 0
          }}
          transition={{ duration: 0.3 }}
        >
          {isSaved ? (
            <BookmarkCheck className={iconSizes[size]} />
          ) : (
            <Bookmark className={iconSizes[size]} />
          )}
        </motion.div>
      </motion.button>

      {showShareOption && (
        <motion.button
          onClick={handleShare}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            "relative rounded-lg transition-all duration-200",
            "bg-white shadow-md hover:shadow-lg",
            "border border-gray-200",
            "text-gray-600 hover:text-purple-600 hover:bg-purple-50",
            sizeClasses[size]
          )}
          aria-label="Share drink"
        >
          {copied ? (
            <Check className={cn(iconSizes[size], "text-green-600")} />
          ) : (
            <Share2 className={iconSizes[size]} />
          )}
        </motion.button>
      )}

      {/* Tooltip */}
      {showTooltip && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 5 }}
          className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap"
        >
          <div className="bg-gray-800 dark:bg-gray-700 text-white text-xs px-2 py-1 rounded shadow-lg">
            {isSaved ? 'Saved!' : 'Removed'}
          </div>
        </motion.div>
      )}

      {/* Copy tooltip */}
      {copied && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 5 }}
          className="absolute -top-8 right-0 whitespace-nowrap"
        >
          <div className="bg-gray-800 dark:bg-gray-700 text-white text-xs px-2 py-1 rounded shadow-lg">
            Link copied!
          </div>
        </motion.div>
      )}
    </div>
  );
}