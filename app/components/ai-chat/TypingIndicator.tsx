'use client';

import React from 'react';
import { motion } from 'framer-motion';

export const TypingIndicator: React.FC = () => {
  const dotVariants = {
    initial: { y: 0 },
    animate: { y: -8 },
  };

  const dotTransition = {
    duration: 0.5,
    repeat: Infinity,
    repeatType: 'reverse' as const,
    ease: 'easeInOut' as const,
  };

  return (
    <div className="flex items-center space-x-1 px-4 py-2">
      <motion.div
        className="w-2 h-2 bg-gradient-to-r from-purple-600 to-purple-500 rounded-full shadow-sm"
        variants={dotVariants}
        initial="initial"
        animate="animate"
        transition={{ ...dotTransition, delay: 0 }}
      />
      <motion.div
        className="w-2 h-2 bg-gradient-to-r from-purple-600 to-purple-500 rounded-full shadow-sm"
        variants={dotVariants}
        initial="initial"
        animate="animate"
        transition={{ ...dotTransition, delay: 0.15 }}
      />
      <motion.div
        className="w-2 h-2 bg-gradient-to-r from-purple-600 to-purple-500 rounded-full shadow-sm"
        variants={dotVariants}
        initial="initial"
        animate="animate"
        transition={{ ...dotTransition, delay: 0.3 }}
      />
      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 italic">Carla is thinking...</span>
    </div>
  );
};