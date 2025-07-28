'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Sparkles, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmailCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchCount?: number;
  topMatch?: {
    name: string;
    category: string;
    image_url?: string;
  };
  onSubmit?: (email: string) => void;
}

export function EmailCaptureModal({ 
  isOpen, 
  onClose, 
  matchCount = 12,
  topMatch,
  onSubmit 
}: EmailCaptureModalProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/email/save-matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email,
          sessionId: localStorage.getItem('drinkjoy-session') || '',
          matchCount
        })
      });

      if (!response.ok) throw new Error('Failed to save email');

      setSuccess(true);
      if (onSubmit) onSubmit(email);
      
      // Auto-close after success
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl z-[60] overflow-hidden mx-4"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
          >
            {/* Header */}
            <div className="relative bg-white p-6 border-b border-gray-200">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
              
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <Sparkles className="w-8 h-8 text-purple-600" />
                </motion.div>
                
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Save Your Perfect Matches!
                </h2>
                <p className="text-gray-600 text-sm">
                  We found {matchCount} amazing drinks just for you
                </p>
              </div>
            </div>

            {/* Preview Card */}
            {topMatch && (
              <div className="px-6 mb-4">
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gray-50 rounded-xl p-3 flex items-center gap-3 border border-gray-200"
                >
                  {topMatch.image_url ? (
                    <img 
                      src={topMatch.image_url} 
                      alt={topMatch.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Gift className="w-6 h-6 text-purple-600" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Your top match:</p>
                    <p className="font-semibold text-gray-900">{topMatch.name}</p>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Form */}
            <div className="p-6 pt-2">
              {!success ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Enter your email to save all matches
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className={cn(
                          "w-full pl-10 pr-4 py-3 rounded-lg border transition-colors",
                          "bg-white",
                          "placeholder-gray-400",
                          "text-gray-900",
                          "focus:outline-none focus:ring-2 focus:ring-purple-500",
                          error 
                            ? "border-red-300" 
                            : "border-gray-300"
                        )}
                        disabled={isSubmitting}
                        autoFocus
                      />
                    </div>
                    {error && (
                      <p className="mt-2 text-sm text-red-600">{error}</p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={isSubmitting || !email}
                      className={cn(
                        "flex-1 py-3 px-4 rounded-lg font-medium transition-all",
                        "bg-gradient-to-r from-purple-600 to-purple-500 text-white",
                        "hover:from-purple-700 hover:to-purple-600",
                        "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        "transform active:scale-95"
                      )}
                    >
                      {isSubmitting ? 'Saving...' : 'Save My Matches'}
                    </button>
                    
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-3 rounded-lg font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Skip
                    </button>
                  </div>

                  <p className="text-xs text-center text-gray-500">
                    We&apos;ll send you your personalized drink list and occasional updates. 
                    Unsubscribe anytime.
                  </p>
                </form>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Success! Check your email
                  </h3>
                  <p className="text-sm text-gray-600">
                    Your personalized drink matches are on their way!
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}