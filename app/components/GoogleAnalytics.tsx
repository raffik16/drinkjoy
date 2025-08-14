'use client';

import Script from 'next/script';
import { useEffect } from 'react';
import { initGA, GA_MEASUREMENT_ID } from '@/lib/analytics';

export default function GoogleAnalytics() {
  useEffect(() => {
    // Initialize GA once the script is loaded
    initGA();
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