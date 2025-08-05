'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Heart } from 'lucide-react';

interface PopularDrink {
  drink_id: string;
  like_count: number;
  unique_users: number;
}

export default function PopularDrinksWidget() {
  const [popularDrinks, setPopularDrinks] = useState<PopularDrink[]>([]);

  useEffect(() => {
    const fetchPopularDrinks = async () => {
      try {
        const response = await fetch('/api/analytics/popular-drinks');
        if (response.ok) {
          const data = await response.json();
          setPopularDrinks(data.data || []);
        }
      } catch (err) {
        console.error('Error fetching popular drinks:', err);
      }
    };

    fetchPopularDrinks();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-blue-500" />
        <h3 className="text-lg text-gray-800 font-semibold">Popular Drinks</h3>
        <span className="text-sm text-gray-500">({popularDrinks.length} drinks)</span>
      </div>
      
      {popularDrinks.length === 0 ? (
        <p className="text-gray-500 text-sm">No drinks have been liked yet.</p>
      ) : (
        <div className="space-y-3">
          {popularDrinks.slice(0, 10).map((drink, index) => (
            <div key={drink.drink_id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-600 w-6">
                  #{index + 1}
                </span>
                <span className="text-sm text-gray-800 capitalize">
                  {drink.drink_id.replace(/-/g, ' ')}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Heart className="w-3 h-3" />
                  {drink.like_count}
                </span>
                <span className="text-xs">
                  {drink.unique_users} users
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {popularDrinks.length > 10 && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-gray-500 text-center">
            Showing top 10 of {popularDrinks.length} popular drinks
          </p>
        </div>
      )}
    </div>
  );
}