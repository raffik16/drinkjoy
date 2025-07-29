'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Trash2, Search, Filter } from 'lucide-react';
import Image from 'next/image';
import drinksData from '@/data/drinks';
import { EmailShareModal } from '@/app/components/ui/EmailShareModal';
import { DrinkCategory, Drink } from '@/app/types/drinks';

const drinks = (drinksData?.drinks || drinksData || []);

interface SavedDrink {
  id: string;
  name: string;
  category: DrinkCategory;
  description: string;
  image_url: string;
  abv: number;
  flavor_profile?: string[];
  ingredients: string[];
  strength?: string;
  weather_match?: any;
  occasions?: string[];
  serving_suggestions?: string[];
  dateSaved: string;
  glass_type?: string;
  preparation?: string;
  happy_hour?: boolean;
  happy_hour_price?: string;
  happy_hour_times?: string;
  featured?: boolean;
  funForTwentyOne?: boolean;
  goodForBDay?: boolean;
}

interface MyDrinksContentProps {
  compact?: boolean; // For panel vs full page view
  className?: string;
}

export function MyDrinksContent({ compact = false, className = '' }: MyDrinksContentProps) {
  const [savedDrinks, setSavedDrinks] = useState<SavedDrink[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [drinkToShare, setDrinkToShare] = useState<SavedDrink | null>(null);

  useEffect(() => {
    // Load saved drinks from localStorage
    const savedIds = JSON.parse(localStorage.getItem('drinkjoy-saved-drinks') || '[]');
    const savedDrinksData = savedIds
      .map((id: string) => {
        const drink = drinks.find(d => d.id === id);
        if (drink) {
          return {
            ...drink,
            dateSaved: localStorage.getItem(`drinkjoy-saved-date-${id}`) || new Date().toISOString()
          };
        }
        return null;
      })
      .filter(Boolean)
      .sort((a: SavedDrink, b: SavedDrink) => new Date(b.dateSaved).getTime() - new Date(a.dateSaved).getTime());
    
    setSavedDrinks(savedDrinksData);
    setLoading(false);
  }, []);

  const removeDrink = (drinkId: string) => {
    const savedIds = JSON.parse(localStorage.getItem('drinkjoy-saved-drinks') || '[]');
    const filtered = savedIds.filter((id: string) => id !== drinkId);
    localStorage.setItem('drinkjoy-saved-drinks', JSON.stringify(filtered));
    localStorage.removeItem(`drinkjoy-saved-date-${drinkId}`);
    setSavedDrinks(prev => prev.filter(drink => drink.id !== drinkId));
  };

  const shareDrink = (drink: SavedDrink) => {
    setDrinkToShare(drink);
    setShareModalOpen(true);
  };

  const filteredDrinks = savedDrinks.filter(drink => {
    const matchesSearch = drink.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         drink.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || drink.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...Array.from(new Set(savedDrinks.map(d => d.category)))];

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Search and Filter Controls */}
      <div className="mb-6 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search your drinks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 rounded-lg border border-gray-600 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full pl-10 pr-8 py-2 bg-gray-800 rounded-lg border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 appearance-none"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      {filteredDrinks.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <div className="text-6xl mb-4">🍹</div>
          <h3 className={`font-bold text-gray-800 mb-2 ${compact ? 'text-lg' : 'text-xl'}`}>
            {savedDrinks.length === 0 ? 'No saved drinks yet' : 'No drinks match your search'}
          </h3>
          <p className="text-gray-600 mb-6">
            {savedDrinks.length === 0 
              ? 'Start exploring and save your favorite drinks to see them here'
              : 'Try adjusting your search or filter criteria'
            }
          </p>
        </motion.div>
      ) : (
        <div className={`grid gap-4 ${compact ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
          <AnimatePresence>
            {filteredDrinks.map((drink, index) => (
              <motion.div
                key={drink.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02 }}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-200"
              >
                {/* Image */}
                <div className={`bg-gray-200 relative ${compact ? 'h-32' : 'h-48'}`}>
                  {drink.image_url ? (
                    <Image
                      src={drink.image_url}
                      alt={drink.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className={`flex items-center justify-center h-full ${compact ? 'text-3xl' : 'text-4xl'}`}>
                      🍹
                    </div>
                  )}
                  
                  {/* Actions overlay */}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button
                      onClick={() => shareDrink(drink)}
                      className="p-1.5 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
                    >
                      <Mail className="w-3 h-3 text-gray-600" />
                    </button>
                    <button
                      onClick={() => removeDrink(drink.id)}
                      className="p-1.5 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
                    >
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className={compact ? 'p-3' : 'p-4'}>
                  <h4 className={`font-semibold text-gray-800 mb-1 ${compact ? 'text-sm' : 'text-lg'}`}>
                    {drink.name}
                  </h4>
                  <p className={`text-gray-600 mb-2 ${compact ? 'text-xs' : 'text-sm'}`}>
                    {drink.category} • {drink.abv}% ABV
                  </p>
                  <p className={`text-gray-700 mb-3 line-clamp-2 ${compact ? 'text-xs' : 'text-sm'}`}>
                    {drink.description}
                  </p>
                  
                  {/* Flavor profile */}
                  {drink.flavor_profile && drink.flavor_profile.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {drink.flavor_profile.slice(0, compact ? 2 : 3).map((flavor, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full"
                        >
                          {flavor}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Date saved */}
                  <p className="text-xs text-gray-500">
                    Saved {new Date(drink.dateSaved).toLocaleDateString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Email Share Modal */}
      {drinkToShare && (
        <EmailShareModal
          isOpen={shareModalOpen}
          onClose={() => {
            setShareModalOpen(false);
            setDrinkToShare(null);
          }}
          drink={drinkToShare as Drink}
        />
      )}
    </div>
  );
}