'use client';

import Script from 'next/script';
import { useEffect } from 'react';
import { initGA, GA_MEASUREMENT_ID } from '@/lib/analytics';

export default function GoogleAnalytics() {
  useEffect(() => {
    // Initialize GA once the script is loaded
    console.log('🔧 Initializing Google Analytics...');
    initGA();
    
    // Check if GA loaded successfully after a short delay
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        console.log('📊 GA Status:', {
          hasGtag: !!window.gtag,
          hasDataLayer: !!window.dataLayer,
          measurementId: GA_MEASUREMENT_ID
        });
      }
    }, 1000);
  }, []);

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `,
        }}
      />
    </>
  );
}