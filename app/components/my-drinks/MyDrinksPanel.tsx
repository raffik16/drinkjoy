'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bookmark } from 'lucide-react';
import { MyDrinksContent } from './MyDrinksContent';

interface MyDrinksPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MyDrinksPanel({ isOpen, onClose }: MyDrinksPanelProps) {
  const [savedDrinksCount, setSavedDrinksCount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      const savedIds = JSON.parse(localStorage.getItem('drinkjoy-saved-drinks') || '[]');
      setSavedDrinksCount(savedIds.length);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Panel */}
          <motion.div
            className="fixed right-0 top-0 h-full w-full max-w-[400] bg-white shadow-2xl z-50 flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-500 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bookmark className="w-6 h-6" />
                  <div>
                    <h2 className="text-xl font-bold">My Saved Drinks</h2>
                    <p className="text-white/90 text-sm">{savedDrinksCount} drinks in your collection</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <MyDrinksContent compact={true} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}