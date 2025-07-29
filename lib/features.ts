/**
 * Feature flags utility for DrinkJoy
 */

/**
 * Check if the saving/bookmarking feature is enabled
 * @returns {boolean} true if saving is enabled via URL param
 */
export function isSavingEnabled(): boolean {
  if (typeof window === 'undefined') {
    console.log('🔍 Saving check: Server-side, returning false');
    return false;
  }
  
  const urlParams = new URLSearchParams(window.location.search);
  const savingParam = urlParams.get('saving');
  const isEnabled = savingParam === 'true';
  
  console.log('🔍 Saving check:', {
    url: window.location.href,
    searchParams: window.location.search,
    savingParam,
    isEnabled
  });
  
  return isEnabled;
}

/**
 * Get URL with saving parameter
 * @param {string} url - The base URL
 * @param {boolean} preserveParams - Whether to preserve existing params
 * @returns {string} URL with saving parameter if enabled
 */
export function getUrlWithSavingParam(url: string, preserveParams: boolean = true): string {
  if (!isSavingEnabled()) {
    return url;
  }
  
  const [baseUrl, queryString] = url.split('?');
  const params = new URLSearchParams(queryString || '');
  
  if (!preserveParams) {
    return `${baseUrl}?saving=true`;
  }
  
  params.set('saving', 'true');
  return `${baseUrl}?${params.toString()}`;
}

/**
 * Custom hook for checking saving feature in React components
 */
export function useSavingFeature() {
  if (typeof window === 'undefined') {
    return false;
  }
  
  return isSavingEnabled();
}