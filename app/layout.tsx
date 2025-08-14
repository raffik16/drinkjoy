import type { Metadata, Viewport } from "next";
import { Open_Sans, Inter } from "next/font/google";
import "./globals.css";
import { PWAManifest } from "@/components/PWAManifest";
import GoogleAnalytics from "@/app/components/GoogleAnalytics";
import { BarProvider } from "@/app/contexts/BarContext";

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Drinkjoy - AI-Powered Drink Recommendations & Discovery",
  description: "Discover your perfect drink with smart recommendations! Get personalized cocktail, beer, wine, and spirit suggestions based on your taste preferences, allergies, and occasion. Features weather-based recommendations, happy hour specials, and allergy-safe filtering.",
  keywords: "drink recommendations, cocktail finder, beer finder, wine recommendations, drink discovery, personalized drinks, AI bartender, allergy-safe drinks, weather-based drinks, happy hour specials, drink matching, beverage recommendations, cocktail recipes, mixology, drink preferences",
  authors: [{ name: "Drinkjoy Team" }],
  alternates: {
    canonical: "https://www.drinkjoy.app",
  },
  openGraph: {
    title: "Drinkjoy - AI-Powered Drink Recommendations & Discovery",
    description: "Answer a few questions to discover drinks perfectly matched to your taste! Features allergy filtering, weather-based suggestions, and personalized recommendations for every occasion.",
    type: "website",
    url: "https://www.drinkjoy.app",
    siteName: "Drinkjoy",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Drinkjoy - Discover Your Perfect Drink Match",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Drinkjoy - AI-Powered Drink Recommendations",
    description: "Answer a few questions to discover drinks perfectly matched to your taste preferences and dietary needs!",
    images: ["/og-image.jpg"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Drinkjoy",
  },
  other: {
    "google-site-verification": "CUmUB5IiLmsWNTMzNNs-WOhytVbT_fz7HuEZHG5I65U",
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "Drinkjoy",
    "msapplication-TileColor": "#0a0a0a",
    "msapplication-config": "/browserconfig.xml",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${openSans.variable} ${inter.variable} antialiased`}
      >
        <GoogleAnalytics />
        <PWAManifest />
        <BarProvider>
          {children}
        </BarProvider>
      </body>
    </html>
  );
}
