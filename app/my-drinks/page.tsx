'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Bookmark } from 'lucide-react';
import Link from 'next/link';
import { MyDrinksContent } from '@/app/components/my-drinks/MyDrinksContent';

export default function MyDrinksPage() {
  const [savedDrinksCount, setSavedDrinksCount] = useState(0);

  useEffect(() => {
    const savedIds = JSON.parse(localStorage.getItem('drinkjoy-saved-drinks') || '[]');
    setSavedDrinksCount(savedIds.length);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-500 text-white">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link 
              href="/app"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Bookmark className="w-6 h-6" />
            <div>
              <h1 className="text-2xl font-bold">My Saved Drinks</h1>
              <p className="text-white/90">{savedDrinksCount} drinks in your collection</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <MyDrinksContent compact={false} />
        
        {/* Call to Action */}
        <div className="mt-12 text-center">
          <Link
            href="/app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-purple-600 transition-all"
          >
            Find More Drinks
          </Link>
        </div>
      </div>
    </div>
  );
}