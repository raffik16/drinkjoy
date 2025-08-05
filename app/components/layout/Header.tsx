'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { FiSun, FiMoon } from 'react-icons/fi';
import { Button } from '@/app/components/ui/Button';

interface HeaderProps {
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  location?: string;
  temperature?: number;
  isMetricUnit?: boolean;
  showLocation?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ isDarkMode, onToggleDarkMode, location, temperature, isMetricUnit = false, showLocation = false }) => {
  
  // Format temperature display
  const formatTemperature = () => {
    if (temperature === undefined) return '';
    const displayTemp = isMetricUnit ? temperature : Math.round((temperature * 9/5) + 32);
    const unit = isMetricUnit ? '°C' : '°F';
    return `${displayTemp}${unit}`;
  };

  // Format location with proper title case
  const formatLocation = (loc?: string) => {
    if (!loc) return '';
    return loc
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };
  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800"
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-3"
            whileHover={{ scale: 1.05 }}
          >
            <Image 
              src="/logo.png" 
              alt="Drinkjoy Logo" 
              width={96} 
              height={32} 
              className="h-8 w-auto"
            />
            <div>
              <div className="relative overflow-hidden">
                <motion.p 
                  className="text-xs text-blue-600 dark:text-blue-400 font-medium absolute top-0 left-0"
                  animate={{ 
                    y: showLocation && location ? 0 : 20,
                    opacity: showLocation && location ? 1 : 0 
                  }}
                  transition={{ duration: 0.3 }}
                >
                  For {formatTemperature()} in {formatLocation(location)}
                </motion.p>
              </div>
            </div>
          </motion.div>

          <div className="flex items-center gap-4">
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleDarkMode}
                className="p-2"
              >
                {isDarkMode ? (
                  <FiSun className="w-5 h-5" />
                ) : (
                  <FiMoon className="w-5 h-5" />
                )}
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.header>
  );
};