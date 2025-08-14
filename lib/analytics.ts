'use client';

import { WizardPreferences } from '@/app/types/wizard';

// Extend the Window interface to include gtag
declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

// GA Measurement ID
export const GA_MEASUREMENT_ID = 'G-W9N6G0PPFG';

// Initialize GA if not already done
export const initGA = () => {
  if (typeof window === 'undefined') return;
  
  // Initialize dataLayer if it doesn't exist
  window.dataLayer = window.dataLayer || [];
  
  // Define gtag function
  window.gtag = function(...args: unknown[]) {
    window.dataLayer.push(args);
  };
  
  // Configure GA
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_title: document.title,
    page_location: window.location.href,
  });
};

// Event tracking functions
export const analytics = {
  // Page view tracking
  pageView: (pagePath: string, pageTitle?: string) => {
    if (typeof window === 'undefined' || !window.gtag) return;
    
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: pagePath,
      page_title: pageTitle || document.title,
    });
  },

  // Drink order events
  trackDrinkOrder: (drinkId: string, drinkName: string, sessionId: string) => {
    if (typeof window === 'undefined' || !window.gtag) return;
    
    window.gtag('event', 'drink_order', {
      event_category: 'drinks',
      event_label: drinkName,
      custom_parameters: {
        drink_id: drinkId,
        drink_name: drinkName,
        session_id: sessionId,
      },
      value: 1,
    });
  },

  // Drink like/bookmark events
  trackDrinkLike: (drinkId: string, drinkName: string, liked: boolean, likeCount: number) => {
    if (typeof window === 'undefined' || !window.gtag) return;
    
    window.gtag('event', liked ? 'drink_like' : 'drink_unlike', {
      event_category: 'engagement',
      event_label: drinkName,
      custom_parameters: {
        drink_id: drinkId,
        drink_name: drinkName,
        like_count: likeCount,
        action: liked ? 'like' : 'unlike',
      },
      value: liked ? 1 : -1,
    });
  },

  // Email save matches event
  trackEmailSaveMatches: (_email: string, matchCount: number, preferences: WizardPreferences) => {
    if (typeof window === 'undefined' || !window.gtag) return;
    
    window.gtag('event', 'email_save_matches', {
      event_category: 'email',
      event_label: 'save_matches',
      custom_parameters: {
        match_count: matchCount,
        category_preference: preferences.category,
        flavor_preference: preferences.flavor,
        strength_preference: preferences.strength,
        occasion_preference: preferences.occasion,
        allergies: preferences.allergies?.join(',') || 'none',
        has_allergies: preferences.allergies && preferences.allergies.length > 0,
      },
      value: matchCount,
    });
  },

  // Signup modal submission
  trackSignupSubmission: (_email: string, businessName?: string) => {
    if (typeof window === 'undefined' || !window.gtag) return;
    
    window.gtag('event', 'signup_submission', {
      event_category: 'email',
      event_label: 'business_signup',
      custom_parameters: {
        has_business_name: !!businessName,
        signup_type: 'business_interest',
      },
      value: 1,
    });
  },

  // Wizard progress tracking
  trackWizardStep: (stepNumber: number, stepId: string, answer: string | string[]) => {
    if (typeof window === 'undefined' || !window.gtag) return;
    
    const answerString = Array.isArray(answer) ? answer.join(',') : answer;
    
    window.gtag('event', 'wizard_step_complete', {
      event_category: 'wizard',
      event_label: stepId,
      custom_parameters: {
        step_number: stepNumber,
        step_id: stepId,
        answer: answerString,
        wizard_progress: `${stepNumber}/5`,
      },
      value: stepNumber,
    });
  },

  // Wizard completion with full preferences
  trackWizardComplete: (preferences: WizardPreferences, matchCount: number, topMatchScore?: number) => {
    if (typeof window === 'undefined' || !window.gtag) return;
    
    window.gtag('event', 'wizard_complete', {
      event_category: 'wizard',
      event_label: 'completed',
      custom_parameters: {
        category: preferences.category,
        flavor: preferences.flavor,
        strength: preferences.strength,
        occasion: preferences.occasion,
        allergies: preferences.allergies?.join(',') || 'none',
        has_allergies: preferences.allergies && preferences.allergies.length > 0,
        match_count: matchCount,
        top_match_score: topMatchScore || 0,
        completion_rate: 100,
      },
      value: matchCount,
    });
  },

  // Match reveal event
  trackMatchReveal: (matchCount: number, preferences: WizardPreferences) => {
    if (typeof window === 'undefined' || !window.gtag) return;
    
    window.gtag('event', 'match_reveal', {
      event_category: 'wizard',
      event_label: 'matches_revealed',
      custom_parameters: {
        match_count: matchCount,
        category: preferences.category,
        flavor: preferences.flavor,
        strength: preferences.strength,
        occasion: preferences.occasion,
      },
      value: matchCount,
    });
  },

  // Age gate verification
  trackAgeVerification: (verified: boolean) => {
    if (typeof window === 'undefined' || !window.gtag) return;
    
    window.gtag('event', 'age_verification', {
      event_category: 'onboarding',
      event_label: verified ? 'verified' : 'declined',
      custom_parameters: {
        verified: verified,
      },
      value: verified ? 1 : 0,
    });
  },

  // Weather integration usage
  trackWeatherUsage: (weatherData: any, locationGranted: boolean) => {
    if (typeof window === 'undefined' || !window.gtag) return;
    
    window.gtag('event', 'weather_integration', {
      event_category: 'features',
      event_label: 'weather_data',
      custom_parameters: {
        location_granted: locationGranted,
        has_weather_data: !!weatherData,
        weather_condition: weatherData?.weather?.[0]?.main || 'unknown',
        temperature: weatherData?.main?.temp || 0,
      },
      value: locationGranted ? 1 : 0,
    });
  },

  // PWA install prompt
  trackPWAInstall: (action: 'prompted' | 'accepted' | 'dismissed') => {
    if (typeof window === 'undefined' || !window.gtag) return;
    
    window.gtag('event', 'pwa_install', {
      event_category: 'engagement',
      event_label: action,
      custom_parameters: {
        install_action: action,
      },
      value: action === 'accepted' ? 1 : 0,
    });
  },

  // Chat interaction
  trackChatInteraction: (action: 'open' | 'close' | 'message_sent' | 'suggestion_clicked') => {
    if (typeof window === 'undefined' || !window.gtag) return;
    
    window.gtag('event', 'chat_interaction', {
      event_category: 'engagement',
      event_label: action,
      custom_parameters: {
        chat_action: action,
      },
      value: 1,
    });
  },

  // Generic custom event for additional tracking
  trackCustomEvent: (eventName: string, category: string, label?: string, value?: number, customParams?: Record<string, unknown>) => {
    if (typeof window === 'undefined' || !window.gtag) return;
    
    window.gtag('event', eventName, {
      event_category: category,
      event_label: label,
      custom_parameters: customParams,
      value: value,
    });
  },
};

// Hook for easy analytics usage in components
export const useAnalytics = () => {
  return analytics;
};