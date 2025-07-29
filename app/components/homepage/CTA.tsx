'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { SignupModal } from './SignupModal';

export function CTA() {
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  
  return (
    <section className="py-20 bg-gradient-to-r from-purple-600 to-purple-500 text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl lg:text-5xl font-bold mb-6">
          Ready to Find Your Perfect Drink?
        </h2>
        <p className="text-xl mb-8 opacity-90 leading-relaxed">
          Join thousands of happy drinkers discovering their perfect matches every day
        </p>
        <div className="flex flex-col gap-6 items-center">
          <Link 
            href="/app"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white text-purple-600 px-10 py-5 rounded-full hover:bg-gray-100 transition-all duration-200 font-bold text-xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 inline-block whitespace-nowrap"
          >
            Find My Perfect Drink →
          </Link>
          
          {/* Social Proof */}
          <div className="flex items-center gap-6 text-white/90 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-yellow-300">⭐⭐⭐⭐⭐</span>
              <span>4.9/5 Rating</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🍹</span>
              <span>Quality Drinks</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🎯</span>
              <span>Smart Matching</span>
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