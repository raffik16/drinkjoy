'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bot } from 'lucide-react';
import { AIChatInterface } from './AIChatInterface';
import { convertAIToWizardPreferences } from '@/lib/ai/preferenceExtractor';
import { WizardPreferences } from '@/app/types/wizard';

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (preferences: WizardPreferences) => void;
}

export function AIChatModal({ isOpen, onClose, onComplete }: AIChatModalProps) {
  const [] = useState(() => crypto.randomUUID());

  const handlePreferencesReady = (aiPreferences: Record<string, unknown>) => {
    if (onComplete) {
      const wizardPrefs = convertAIToWizardPreferences(aiPreferences);
      onComplete(wizardPrefs as WizardPreferences);
    }
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            className="fixed inset-4 md:inset-8 lg:inset-16 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-500 rounded-full flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Carla Joy
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Tell me what you&apos;re in the mood for
                  </p>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors"
                aria-label="Close AI chat"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Chat Interface */}
            <div className="flex-1 overflow-hidden">
              <AIChatInterface 
                isOpen={isOpen}
                onClose={onClose}
                onPreferencesReady={handlePreferencesReady}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}