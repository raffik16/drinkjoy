'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Check, X } from 'lucide-react';
import { DrinkRecommendation } from '@/app/types/drinks';
import { WizardPreferences } from '@/app/types/wizard';
import ColorSplashAnimation from '@/app/components/animations/ColorSplashAnimation';
import { analytics } from '@/lib/analytics';

const WITTY_PHRASES = [
  "Don't let these liquid treasures swim away! 🐠",
  "Save these matches for your next adventure! 🗺️",
  "Your perfect drinks deserve a permanent home! 🏠",
  "Keep these matches close to your heart! 💕",
  "Don't forget these liquid soulmates! 👯‍♀️",
  "Bookmark these beauties for later! 📖",
  "Your taste buds will thank you! 😋",
  "Lock in these liquid legends! 🔒"
];

interface EmailCaptureFormProps {
  matchedDrinks: DrinkRecommendation[];
  preferences: WizardPreferences;
}

export default function EmailCaptureForm({ matchedDrinks, preferences }: EmailCaptureFormProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setStatus('idle');

    try {
      const response = await fetch('/api/email/save-matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          matchedDrinks: matchedDrinks,
          preferences
        })
      });

      if (response.ok) {
        setStatus('success');
        
        // Track the email save event in GA
        analytics.trackEmailSaveMatches(email.trim(), matchedDrinks.length, preferences);
        
        setEmail('');
        // Success message stays visible permanently
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error('Error saving email:', error);
      setStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Use useMemo to ensure phrase stays consistent per component mount
  const randomPhrase = useMemo(() => 
    WITTY_PHRASES[Math.floor(Math.random() * WITTY_PHRASES.length)], 
    []
  );

  if (!showForm) {
    return (
      <div className="text-center">
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 active:scale-95"
        >
          <Mail className="w-4 h-4" />
          Save My Matches
        </button>
        <p className="text-xs text-gray-500 mt-2">
          {randomPhrase}
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-xl p-4 border border-gray-200"
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-800">Save Your Matches</h4>
        <button
          onClick={() => setShowForm(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <p className="text-sm text-gray-600 mb-4">
        {randomPhrase}
      </p>

      <AnimatePresence>
        {status === 'success' ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="text-center py-4"
          >
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <h5 className="font-semibold text-green-800 mb-2">Matches Saved! 🎉</h5>
            <p className="text-sm text-green-600 mb-2">
              Check your email for your perfect drink matches!
            </p>
            <p className="text-xs text-green-600">
              📧 Don&apos;t see it? Check spam - even good drinks sometimes end up in sketchy places! 🍸
            </p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-500 bg-white"
                disabled={isSubmitting}
              />
            </div>
            
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <input
                type="checkbox"
                id="privacy"
                required
                className="rounded text-purple-600 focus:ring-purple-500"
              />
              <label htmlFor="privacy">
                I want to subscribe to receive drink recommendations and updates
              </label>
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting || !email.trim()}
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <ColorSplashAnimation size="sm" repeat={true} />
                  <span>Saving Matches...</span>
                </div>
              ) : (
                `Save ${matchedDrinks.length} Matches`
              )}
            </button>
            
            {status === 'error' && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-600 text-sm text-center"
              >
                Failed to save matches. Please try again.
              </motion.p>
            )}
          </form>
        )}
      </AnimatePresence>
    </motion.div>
  );
}