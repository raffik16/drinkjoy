'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export function PWAManifest() {
  const pathname = usePathname();
  
  useEffect(() => {
    // Find existing manifest link
    const existingManifest = document.querySelector('link[rel="manifest"]');
    
    // Determine which manifest to use based on current path
    const manifestPath = pathname === '/app' ? '/manifest-app.json' : '/manifest.json';
    
    if (existingManifest) {
      // Update existing manifest
      existingManifest.setAttribute('href', manifestPath);
    } else {
      // Create new manifest link
      const manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      manifestLink.href = manifestPath;
      document.head.appendChild(manifestLink);
    }
    
    // For iOS, we also need to update the apple-mobile-web-app meta tags
    if (pathname === '/app') {
      // Update or create apple-mobile-web-app-capable
      let appleMeta = document.querySelector('meta[name="apple-mobile-web-app-capable"]') as HTMLMetaElement;
      if (!appleMeta) {
        appleMeta = document.createElement('meta');
        appleMeta.name = 'apple-mobile-web-app-capable';
        document.head.appendChild(appleMeta);
      }
      appleMeta.content = 'yes';
      
      // Update or create apple-mobile-web-app-title
      let appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]') as HTMLMetaElement;
      if (!appleTitle) {
        appleTitle = document.createElement('meta');
        appleTitle.name = 'apple-mobile-web-app-title';
        document.head.appendChild(appleTitle);
      }
      appleTitle.content = 'Drinkjoy App';
      
      // Add apple-touch-startup-image for /app
      let startupImage = document.querySelector('link[rel="apple-touch-startup-image"]') as HTMLLinkElement;
      if (!startupImage) {
        startupImage = document.createElement('link');
        startupImage.rel = 'apple-touch-startup-image';
        startupImage.href = '/drinkjoy-icon.svg';
        document.head.appendChild(startupImage);
      }
    }
  }, [pathname]);
  
  return null;
}