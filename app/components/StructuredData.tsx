import React from 'react';

export function StructuredData() {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Drinkjoy',
    url: 'https://www.drinkjoy.app',
    logo: 'https://www.drinkjoy.app/og-image.jpg',
    description: 'AI-powered drink recommendation platform helping users discover their perfect beverage match',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      availableLanguage: 'English',
    },
    sameAs: [
      // Add social media profiles when available
    ],
  };

  const webApplicationSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Drinkjoy',
    url: 'https://www.drinkjoy.app',
    applicationCategory: 'LifestyleApplication',
    description: 'Discover your perfect drink with smart recommendations based on taste preferences, allergies, and occasion',
    operatingSystem: 'Web Browser, iOS, Android',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      ratingCount: '1250',
      bestRating: '5',
      worstRating: '1',
    },
    featureList: [
      'Personalized drink recommendations',
      'Allergy-safe filtering',
      'Weather-based suggestions',
      'Happy hour specials',
      'AI-powered matching algorithm',
      'Cocktail, beer, wine, and spirit discovery',
    ],
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://www.drinkjoy.app',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Find Drinks',
        item: 'https://www.drinkjoy.app/app',
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplicationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </>
  );
}
