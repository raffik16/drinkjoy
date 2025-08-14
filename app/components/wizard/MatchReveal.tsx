'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import ColorSplashAnimation from '../animations/ColorSplashAnimation';
import { analytics } from '@/lib/analytics';

import { WizardPreferences } from '@/app/types/wizard';

interface MatchRevealProps {
  onComplete: () => void;
  preferences?: WizardPreferences;
  matchCount?: number;
}

export default function MatchReveal({ onComplete, preferences, matchCount = 0 }: MatchRevealProps) {
  const [showColorSplash, setShowColorSplash] = useState(true);
  const [countdown, setCountdown] = useState(5);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Track match reveal event
    if (preferences) {
      analytics.trackMatchReveal(matchCount, preferences);
    }

    const colorSplashTimer = setTimeout(() => {
      setShowColorSplash(false);
    }, 2000);
    
    // Countdown timer
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          // Start fade out
          setIsVisible(false);
          // Complete after fade out
          setTimeout(() => {
            onComplete();
          }, 500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      clearTimeout(colorSplashTimer);
      clearInterval(countdownInterval);
    };
  }, [onComplete, preferences, matchCount]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-50 to-rose-50 flex flex-col items-center justify-center p-4">
      {showColorSplash && (
        <ColorSplashAnimation onComplete={() => setShowColorSplash(false)} />
      )}

      <motion.div
        initial={{ scale: 0 }}
        animate={{ 
          scale: 1,
          opacity: isVisible ? 1 : 0
        }}
        transition={{
          type: "spring",
          duration: 0.8,
          bounce: 0.4
        }}
        className="text-center will-change-transform relative z-10"
      >
        <div className="text-6xl sm:text-7xl md:text-8xl mb-6 min-h-[5rem] flex items-center justify-center" aria-label="Celebration">
          🎉
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
          It&apos;s a Match!
        </h1>
        <p className="text-base sm:text-lg text-gray-600 mb-8">
          We found your perfect drinks
        </p>

        {/* Countdown Indicator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-6"
        >
          <div className="flex items-center justify-center gap-4">
            <motion.div
              key={countdown}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="w-12 h-12 bg-purple-500 text-white rounded-full flex items-center justify-center text-xl font-bold"
            >
              {countdown}
            </motion.div>
           
          </div>
        </motion.div>

        <motion.button
          onClick={onComplete}
          className="bg-purple-500 text-white px-8 py-3 rounded-full font-semibold hover:bg-purple-600 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          See My Matches Now
        </motion.button>
      </motion.div>
    </div>
  );
}