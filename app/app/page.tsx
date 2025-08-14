'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Header } from '@/app/components/layout/Header';
import { Footer } from '@/app/components/layout/Footer';
import { AgeGate } from '@/app/components/ui/AgeGate';
import DrinkWizard from '@/app/components/wizard/DrinkWizard';
import WizardResults from '@/app/components/wizard/WizardResults';
import { PWAInstallPrompt } from '@/app/components/ui/PWAInstallPrompt';
import { WeatherData } from '@/app/types/weather';
import { WizardPreferences } from '@/app/types/wizard';
import ColorSplashAnimation from '@/app/components/animations/ColorSplashAnimation';
import { analytics } from '@/lib/analytics';

export default function Home() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [weatherData] = useState<WeatherData | null>(null);
  const [isAgeVerified, setIsAgeVerified] = useState<boolean | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [showWizardResults, setShowWizardResults] = useState(false);
  const [showAgeGateAfterWizard, setShowAgeGateAfterWizard] = useState(false);
  const [wizardPreferences, setWizardPreferences] = useState<WizardPreferences | null>(null);
  const [showLocationInHeader] = useState(false);
  const [currentLocation] = useState<string>('');
  const [isWizardRetake, setIsWizardRetake] = useState(false);

  // Check for dark mode preference and age verification
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const isDark = savedTheme ? savedTheme === 'dark' : systemDarkMode;
    
    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Track page view for the app
    analytics.pageView('/app', 'Drinkjoy Wizard');

    // Always show wizard on page load/refresh
    setShowWizard(true);
    
    // Check age verification for when wizard is completed
    const ageVerified = localStorage.getItem('ageVerified');
    if (ageVerified === 'true') {
      setIsAgeVerified(true);
    } else {
      setIsAgeVerified(false);
    }
  }, []);

  // Toggle dark mode
  const handleToggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };


  // Handle age verification
  const handleAgeVerification = (isOfAge: boolean) => {
    setIsAgeVerified(isOfAge);
    localStorage.setItem('ageVerified', isOfAge.toString());
    setShowAgeGateAfterWizard(false);
    
    if (isOfAge) {
      // If we have wizard preferences, show results; otherwise show main app
      if (wizardPreferences) {
        setShowWizardResults(true);
        localStorage.setItem('wizardCompleted', 'completed');
      }
      // If no wizard preferences, user will see main app (isAgeVerified = true)
    }
  };

  // Handle wizard completion
  const handleWizardComplete = (preferences: WizardPreferences) => {
    setWizardPreferences(preferences);
    setShowWizard(false);
    setIsWizardRetake(false); // Reset retake flag after completion
    localStorage.setItem('wizardPreferences', JSON.stringify(preferences));
    
    // Track when wizard results are shown (still on /app page)
    analytics.pageView('/app', 'Wizard Results - Match Found');
    
    // Check if age verification is needed
    const ageVerified = localStorage.getItem('ageVerified');
    if (ageVerified !== 'true') {
      setShowAgeGateAfterWizard(true);
      setIsAgeVerified(false);
    } else {
      setShowWizardResults(true);
    }
  };


  // Handle retake quiz
  const handleRetakeQuiz = () => {
    setShowWizardResults(false);
    setShowWizard(true);
    setIsWizardRetake(true);
  };

  // Handle view all from wizard results (unused in current implementation)
  const handleViewAllFromWizard = () => {
    // For now, just restart the wizard since we removed the main drinks view
    setShowWizardResults(false);
    setShowWizard(true);
    setIsWizardRetake(true);
  };

  // Handle show wizard from CTA
  const handleShowWizard = () => {
    setShowWizard(true);
    setIsWizardRetake(false); // Reset retake flag for new wizard sessions
  };

  // Show wizard if needed
  if (showWizard) {
    return (
      <DrinkWizard 
        onComplete={handleWizardComplete}
        weatherData={weatherData}
        isRetake={isWizardRetake}
      />
    );
  }

  // Show age gate after wizard completion if needed
  if (showAgeGateAfterWizard || isAgeVerified === false) {
    return <AgeGate onVerified={handleAgeVerification} />;
  }

  // Show loading while checking age verification (only for returning users)
  if (isAgeVerified === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <ColorSplashAnimation size="lg" repeat={true} />
      </div>
    );
  }

  // Show wizard results
  if (showWizardResults && wizardPreferences) {
    return (
      <WizardResults
        preferences={wizardPreferences}
        weatherData={weatherData}
        onRetakeQuiz={handleRetakeQuiz}
        onViewAll={handleViewAllFromWizard}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <Header 
        isDarkMode={isDarkMode} 
        onToggleDarkMode={handleToggleDarkMode}
        location={currentLocation}
        temperature={weatherData?.current.temp}
        isMetricUnit={false}
        showLocation={showLocationInHeader}
      />
      
      <main className="container mx-auto px-4 py-8 main-container">
        {/* Simple Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-amber-600 to-blue-600 bg-clip-text text-transparent">
            Find Your Perfect Drink
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Take our drink wizard to discover your perfect match
          </p>
        </motion.div>

        {/* Start Wizard Button */}
        <div className="text-center">
          <button
            onClick={handleShowWizard}
            className="bg-gradient-to-r from-amber-600 to-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-amber-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            🪄 Start Your Drink Journey
          </button>
        </div>
      </main>

      <Footer />
      

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  );
}