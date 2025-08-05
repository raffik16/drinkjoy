'use client';

import React from 'react';
import { motion } from 'framer-motion';

export const Footer: React.FC = () => {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800"
    >
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              About drinkjoy.app
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your personal bartender that curates the perfect drinks with detailed recipes and shopping links. 
              Discover cocktails, beers, and wines for every occasion.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Drink Responsibly
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Please enjoy alcoholic beverages responsibly. Never drink and drive. 
              Must be of legal drinking age in your country.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Weather Data
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Real-time weather data provided by OpenWeatherMap API. 
              Location services require your permission.
            </p>
          </div>
        </div>
      </div>
    </motion.footer>
  );
};