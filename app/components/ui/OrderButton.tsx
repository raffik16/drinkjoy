'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useInactivityDetection } from '@/app/hooks/useInactivityDetection';
import { useRealtimeStats } from '@/app/hooks/useRealtimeStats';
import { getSessionId } from '@/lib/session';
import ColorSplashAnimation from '@/app/components/animations/ColorSplashAnimation';
import { analytics } from '@/lib/analytics';

// Temporary localStorage functions until Supabase table is created
const ORDERS_KEY = 'drink_orders_temp';

function getLocalOrders(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const orders = localStorage.getItem(ORDERS_KEY);
    return orders ? JSON.parse(orders) : [];
  } catch {
    return [];
  }
}

function addLocalOrder(drinkId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const orders = getLocalOrders();
    if (!orders.includes(drinkId)) {
      orders.push(drinkId);
      localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    }
  } catch (error) {
    console.error('Error saving local order:', error);
  }
}

interface OrderButtonProps {
  drinkId: string;
  drinkName: string;
  className?: string;
}

type PromptState = 'hidden' | 'order' | 'feedback' | 'loading';

export default function OrderButton({ drinkId, drinkName, className = '' }: OrderButtonProps) {
  const [promptState, setPromptState] = useState<PromptState>('hidden');
  const [sessionId, setSessionId] = useState<string>('');
  const [locallyOrdered, setLocallyOrdered] = useState(false);
  const { hasOrdered } = useRealtimeStats(drinkId);
  
  // Check if already ordered (either from Supabase or localStorage)
  const alreadyOrdered = hasOrdered || locallyOrdered;
  
  useInactivityDetection({
    timeout: 22500, // 22.5 seconds
    onInactive: () => {
      if (!alreadyOrdered && promptState === 'hidden') {
        setPromptState('order');
      }
    },
    onActive: () => {
      // Keep the prompt visible if user is interacting with it
      if (promptState === 'hidden') {
        setPromptState('hidden');
      }
    }
  });

  useEffect(() => {
    setSessionId(getSessionId());
    // Check localStorage for existing orders
    const localOrders = getLocalOrders();
    setLocallyOrdered(localOrders.includes(drinkId));
  }, [drinkId]);

  // Hide prompt if user already ordered
  useEffect(() => {
    if (alreadyOrdered && promptState === 'order') {
      setPromptState('hidden');
    }
  }, [alreadyOrdered, promptState]);

  const handleOrder = async (ordered: boolean) => {
    if (!ordered) {
      setPromptState('hidden');
      return;
    }

    setPromptState('loading');
    
    try {
      // Try to save to Supabase first
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          drinkId,
          sessionId,
          action: 'order'
        })
      });

      if (response.ok) {
        // Mark as ordered locally as well
        addLocalOrder(drinkId);
        setLocallyOrdered(true);
        setPromptState('feedback');
        
        // Track the order event in GA
        analytics.trackDrinkOrder(drinkId, drinkName, sessionId);
      } else {
        // If Supabase fails (table doesn't exist), use localStorage only
        addLocalOrder(drinkId);
        setLocallyOrdered(true);
        setPromptState('feedback');
        
        // Track the order event in GA even if Supabase fails
        analytics.trackDrinkOrder(drinkId, drinkName, sessionId);
      }
    } catch (error) {
      console.error('Error recording order:', error);
      // Fallback to localStorage
      addLocalOrder(drinkId);
      setLocallyOrdered(true);
      setPromptState('feedback');
      
      // Track the order event in GA even on error
      analytics.trackDrinkOrder(drinkId, drinkName, sessionId);
    }
  };

  const handleFeedback = async (liked: boolean) => {
    if (liked) {
      setPromptState('loading');
      
      try {
        const response = await fetch('/api/likes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            drinkId,
            sessionId,
            action: 'like'
          })
        });

        if (response.ok) {
          setPromptState('hidden');
        }
      } catch (error) {
        console.error('Error recording like:', error);
      }
    }
    
    setPromptState('hidden');
  };

  const handleDismiss = () => {
    setPromptState('hidden');
  };

  if (promptState === 'hidden') {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={`absolute bottom-4 left-4 right-4 bg-black/90 backdrop-blur-sm rounded-xl p-4 ${className}`}
      >
        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-white/60 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {promptState === 'loading' && (
          <div className="flex items-center justify-center py-2">
            <ColorSplashAnimation size="sm" repeat={true} />
          </div>
        )}

        {promptState === 'order' && (
          <div className="space-y-3">
            <p className="text-white text-sm font-medium">
              Did you order {drinkName}?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleOrder(true)}
                className="flex-1 bg-white text-black py-2 px-4 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                Yes
              </button>
              <button
                onClick={() => handleOrder(false)}
                className="flex-1 bg-white/20 text-white py-2 px-4 rounded-lg font-medium hover:bg-white/30 transition-colors"
              >
                No
              </button>
            </div>
          </div>
        )}

        {promptState === 'feedback' && (
          <div className="space-y-3">
            <p className="text-white text-sm font-medium">
              Did you like it?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleFeedback(true)}
                className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
              >
                <ThumbsUp className="w-4 h-4" />
                Yes!
              </button>
              <button
                onClick={() => handleFeedback(false)}
                className="flex-1 bg-white/20 text-white py-2 px-4 rounded-lg font-medium hover:bg-white/30 transition-colors flex items-center justify-center gap-2"
              >
                <ThumbsDown className="w-4 h-4" />
                Not really
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}