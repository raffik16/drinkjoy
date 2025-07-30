'use client';

import { useState, useEffect } from 'react';

/**
 * Check if the saving/bookmarking feature is enabled
 * @returns {boolean} true if saving is enabled via URL param
 */
function isSavingEnabled(): boolean {
  // TEMPORARY OVERRIDE: Always return true
  return true;
  
  if (typeof window === 'undefined') {
    return false;
  }
  
  const urlParams = new URLSearchParams(window.location.search);
  const savingParam = urlParams.get('saving');
  const isEnabled = savingParam === 'true';
  
  console.log('🎣 Hook saving check:', {
    url: window.location.href,
    searchParams: window.location.search,
    savingParam,
    isEnabled
  });
  
  return isEnabled;
}

/**
 * Custom hook for checking saving feature in React components
 * This hook will re-render when the URL changes
 */
export function useSavingFeature() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const checkEnabled = () => {
      const newEnabled = isSavingEnabled();
      console.log('🔄 Hook state update:', { oldEnabled: enabled, newEnabled });
      setEnabled(newEnabled);
    };
    
    // Check initially
    console.log('🚀 useSavingFeature hook initializing');
    checkEnabled();
    
    // Listen for URL changes
    const handleUrlChange = () => {
      console.log('🔗 URL change detected, checking saving status...');
      setTimeout(checkEnabled, 0); // Use setTimeout to ensure URL has been updated
    };
    
    // Listen for popstate (back/forward navigation)
    window.addEventListener('popstate', handleUrlChange);
    
    // Listen for pushState/replaceState changes (programmatic navigation)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      handleUrlChange();
    };
    
    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      handleUrlChange();
    };
    
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, []);

  return enabled;
}