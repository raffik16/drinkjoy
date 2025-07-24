'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, X, ExternalLink } from 'lucide-react';
import { SignupModal } from './SignupModal';

export function Hero() {
  const [isAppLoaded, setIsAppLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);

  const handlePreviewClick = () => {
    setIsLoading(true);
    setIsAppLoaded(true);
    // Give iframe time to load
    setTimeout(() => setIsLoading(false), 1500);
  };

  const handleClosePreview = () => {
    setIsAppLoaded(false);
    setIsLoading(false);
  };

  return (
    <section className="pt-20 pb-16 relative min-h-[80vh] overflow-hidden">
      {/* Background Image with Parallax */}
      <motion.div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url(/images/drinks/cocktails/hero-bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/75 via-black/75 to-black/85 z-10" />
      
      {/* Content */}
      <div className="relative z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center justify-center box-border">
          <motion.div 
            className="text-center lg:text-left px-6 sm:px-4"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.h1 
              className="text-3xl lg:text-6xl font-bold text-white leading-tight mb-6 drop-shadow-lg"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                Drinkjoy
              </motion.span>
              <motion.span 
                className="block text-red-400"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                AI-Powered Drink
              </motion.span>
              <motion.span 
                className="block text-orange-400"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
              >
                Recommendations
              </motion.span>
            </motion.h1>
            <motion.p 
              className="text-lg text-white/90 mb-8 leading-relaxed drop-shadow-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.0 }}
            >
              Discover your perfect drink with smart recommendations! Get personalized cocktail, beer, wine, and spirit suggestions based on your taste preferences, allergies, and occasion.
            </motion.p>
            <motion.p 
              className="text-lg text-white/80 mb-8 font-medium drop-shadow-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.2 }}
            >
              <motion.span
                animate={{ 
                  textShadow: [
                    "0 0 0px rgba(255,255,255,0.8)",
                    "0 0 10px rgba(255,255,255,0.8)",
                    "0 0 0px rgba(255,255,255,0.8)"
                  ]
                }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
              >
                Powered by AI for the perfect match
              </motion.span>
            </motion.p>
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mx-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.4 }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link 
                  href="/app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-red-600 text-white px-8 py-4 rounded-full hover:bg-red-700 transition-colors duration-200 font-semibold text-lg shadow-lg hover:shadow-xl text-center inline-block"
                >
                  Explore App
                </Link>
              </motion.div>
              <motion.button 
                onClick={() => setIsSignupModalOpen(true)}
                className="border-2 border-red-600 text-red-600 px-8 py-4 rounded-full hover:bg-red-600 hover:text-white transition-colors duration-200 font-semibold text-lg bg-white"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Sign Up
              </motion.button>
            </motion.div>
          </motion.div>
          
          {/* Interactive Mobile Preview */}
          <div className="relative hidden lg:flex items-center justify-center px-6 sm:px-4">
            <motion.div 
              className="relative"
              initial={{ opacity: 0, x: 50, rotateY: -15 }}
              animate={{ 
                opacity: 1, 
                x: 0, 
                rotateY: 0,
                scale: isAppLoaded ? 1.05 : 1,
              }}
              transition={{ 
                opacity: { duration: 0.8, delay: 0.5 },
                x: { duration: 0.8, delay: 0.5 },
                rotateY: { duration: 0.8, delay: 0.5 },
                scale: { duration: 0.5, ease: "easeInOut" }
              }}
            >
              {/* Phone Frame */}
              <motion.div 
                className="relative mx-auto w-80 h-[600px] sm:w-[420px] sm:h-[780px]"
                animate={{ 
                  y: [0, -8, 0],
                }}
                transition={{ 
                  duration: 6,
                  repeat: Infinity,
                  ease: [0.4, 0, 0.6, 1]
                }}
              >
                {/* Phone Shell with glow effect */}
                <motion.div 
                  className="absolute inset-0 bg-gray-900 rounded-[3rem] shadow-2xl"
                  animate={!isAppLoaded ? {
                    boxShadow: [
                      "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                      "0 25px 50px -12px rgba(239, 68, 68, 0.3)",
                      "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                    ]
                  } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                
                {/* Screen */}
                <div className="absolute top-6 left-4 right-4 bottom-6 bg-gradient-to-br from-amber-50 to-blue-50 rounded-[2rem] overflow-hidden">
                  <AnimatePresence mode="wait">
                    {!isAppLoaded ? (
                      // CTA Preview Screen
                      <motion.div
                        key="cta"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-full flex flex-col items-center justify-center p-8 relative"
                      >
                        <div className="text-center">
                          <motion.div
                            animate={{ 
                              scale: [1, 1.1, 1],
                              rotate: [0, 5, -5, 0]
                            }}
                            transition={{ 
                              duration: 3,
                              repeat: Infinity,
                              repeatDelay: 1
                            }}
                            className="text-6xl mb-6"
                          >
                            🍹
                          </motion.div>
                          <h3 className="text-xl font-bold text-gray-800 mb-2">
                            Try Drinkjoy Live!
                          </h3>
                          <p className="text-sm text-gray-600 mb-6">
                            Experience the magic of AI-powered drink recommendations
                          </p>
                          <motion.button
                            onClick={handlePreviewClick}
                            className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-3 rounded-full font-semibold flex items-center gap-2 mx-auto hover:from-red-700 hover:to-orange-700 transition-all"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Play className="w-4 h-4" />
                            Preview App
                          </motion.button>
                        </div>
                        
                        {/* Animated elements */}
                          <motion.div
                            className="absolute top-20 left-4 text-2xl"
                            animate={{ 
                              x: [-10, 10, -10],
                              rotate: [-15, 15, -15]
                            }}
                            transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                          >
                          🍸
                          </motion.div>
                        <motion.div
                          className="absolute top-4 right-4 text-2xl"
                          animate={{ 
                            y: [-10, 10, -10],
                            rotate: [-10, 10, -10]
                          }}
                          transition={{ duration: 3, repeat: Infinity }}
                          >
                        🍺
                        </motion.div>
                        <motion.div
                          className="absolute bottom-4 left-4 text-2xl"
                          animate={{ 
                            y: [10, -10, 10],
                            rotate: [10, -10, 10]
                          }}
                          transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                          >
                          🍷
                        </motion.div>
                        <motion.div
                          className="absolute bottom-4 right-4 text-2xl"
                          animate={{ 
                            y: [-8, 8, -8],
                            rotate: [8, -8, 8]
                          }}
                          transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
                        >
                          🥃
                        </motion.div>
                      </motion.div>
                    ) : (
                      // Live App Preview
                      <motion.div
                        key="app"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-full relative"
                      >
                        {/* Close Button */}
                        <button
                          onClick={handleClosePreview}
                          className="absolute top-2 right-2 z-50 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-colors"
                        >
                          <X className="w-4 h-4 text-gray-700" />
                        </button>
                        
                        {/* Loading Overlay */}
                        <AnimatePresence>
                          {isLoading && (
                            <motion.div
                              initial={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="absolute inset-0 bg-white z-40 flex items-center justify-center"
                            >
                              <div className="text-center">
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                  className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"
                                />
                                <p className="text-sm text-gray-600">Loading Drinkjoy...</p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        
                        {/* Iframe */}
                        <iframe
                          src="/app"
                          className="w-full h-full border-0"
                          title="Drinkjoy App Preview"
                          onLoad={() => setIsLoading(false)}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                {/* Notch */}
                {/* <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-2xl"></div> */}
              </motion.div>
              
              {/* Action Buttons */}
              <AnimatePresence>
                {isAppLoaded && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute -bottom-16 left-0 right-0 flex justify-center gap-4"
                  >
                    <Link
                      href="/app"
                      target="_blank"
                      className="bg-white text-gray-700 px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-2 text-sm font-medium"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open Full Screen
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>

            </motion.div>
          </div>
        </div>
      </div>
      </div>
      
      {/* Signup Modal */}
      <SignupModal 
        isOpen={isSignupModalOpen} 
        onClose={() => setIsSignupModalOpen(false)} 
      />
    </section>
  );
}