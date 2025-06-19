'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiClock, FiShoppingCart, FiBook, FiStar, FiExternalLink } from 'react-icons/fi';
import { Button } from '@/app/components/ui/Button';
import { Card, CardContent } from '@/app/components/ui/Card';
import { ProcessedRecipe, ProcessedBeer, ProcessedWine } from '@/app/types/recipe';
import { CocktailDBService } from '@/lib/cocktaildb';
import { BeerWineService } from '@/lib/beerwine';
import { Drink } from '@/app/types/drinks';

interface RecipeModalProps {
  drink: Drink | null;
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'overview' | 'recipe' | 'variations' | 'shopping' | 'shop';

export const RecipeModal: React.FC<RecipeModalProps> = ({ drink, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [recipes, setRecipes] = useState<ProcessedRecipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<ProcessedRecipe | null>(null);
  const [beerWineData, setBeerWineData] = useState<(ProcessedBeer | ProcessedWine)[]>([]);
  const [selectedBeerWine, setSelectedBeerWine] = useState<ProcessedBeer | ProcessedWine | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [shoppingList, setShoppingList] = useState<string[]>([]);

  // Handle escape key
  const handleEscapeKey = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && isOpen) {
      onClose();
    }
  }, [isOpen, onClose]);

  // Handle click outside
  const handleBackdropClick = useCallback((event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }, [onClose]);

  // Add/remove escape key listener
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => document.removeEventListener('keydown', handleEscapeKey);
    }
  }, [isOpen, handleEscapeKey]);

  const fetchRecipes = useCallback(async () => {
    if (!drink) return;
    
    setIsLoading(true);
    try {
      if (drink.category === 'cocktail' || drink.category === 'spirit') {
        const foundRecipes = await CocktailDBService.findSimilarCocktails(drink.name);
        setRecipes(foundRecipes);
      } else if (drink.category === 'beer' || drink.category === 'wine') {
        const foundDrinks = await BeerWineService.findSimilarDrinks(drink.name, drink.category);
        setBeerWineData(foundDrinks);
      }
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      setIsLoading(false);
    }
  }, [drink]);

  // Fetch recipes when modal opens
  useEffect(() => {
    if (isOpen && drink) {
      // Clear previous data when opening modal
      setRecipes([]);
      setSelectedRecipe(null);
      setBeerWineData([]);
      setSelectedBeerWine(null);
      setShoppingList([]);
      setActiveTab('overview');
      
      fetchRecipes();
    } else if (!isOpen) {
      // Clear data when modal closes
      setRecipes([]);
      setSelectedRecipe(null);
      setBeerWineData([]);
      setSelectedBeerWine(null);
      setShoppingList([]);
      setActiveTab('overview');
    }
  }, [isOpen, drink, fetchRecipes]);

  // Set first recipe as selected when recipes load
  useEffect(() => {
    if (recipes.length > 0 && !selectedRecipe && (drink?.category === 'cocktail' || drink?.category === 'spirit')) {
      setSelectedRecipe(recipes[0]);
    }
  }, [recipes, selectedRecipe, drink]);

  // Set first beer/wine as selected when data loads
  useEffect(() => {
    if (beerWineData.length > 0 && !selectedBeerWine && (drink?.category === 'beer' || drink?.category === 'wine')) {
      setSelectedBeerWine(beerWineData[0]);
    }
  }, [beerWineData, selectedBeerWine, drink]);


  const addToShoppingList = (ingredient: string) => {
    if (!shoppingList.includes(ingredient)) {
      setShoppingList([...shoppingList, ingredient]);
    }
  };

  const removeFromShoppingList = (ingredient: string) => {
    setShoppingList(shoppingList.filter(item => item !== ingredient));
  };

  // Generate Amazon Fresh link for shopping
  const generateAmazonFreshLink = () => {
    const ingredients = shoppingList.length > 0 ? shoppingList : 
      (selectedRecipe?.ingredients.map(i => i.name) || []);
    
    const query = ingredients.join(' ');
    const associateId = process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_ID || 'theperfectdrink-20';
    
    return `https://www.amazon.com/s?k=${encodeURIComponent(query)}&i=amazonfresh&tag=${associateId}`;
  };

  // Generate Amazon link for beer/wine
  const generateBeerWineLink = () => {
    const associateId = process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_ID || 'theperfectdrink-20';
    
    if (!drink) return '#';
    
    // For beer/wine, search for the specific product or similar ones
    let searchQuery = '';
    
    if (selectedBeerWine) {
      // If user selected a specific beer/wine, search for that
      searchQuery = selectedBeerWine.name;
      if ('winery' in selectedBeerWine) {
        searchQuery = `${selectedBeerWine.name} ${selectedBeerWine.winery}`;
      }
    } else {
      // Otherwise, search for the general drink name
      searchQuery = drink.name;
    }
    
    // Use appropriate category
    const category = drink.category === 'beer' ? '&i=grocery' : '&i=wine';
    
    return `https://www.amazon.com/s?k=${encodeURIComponent(searchQuery)}${category}&tag=${associateId}`;
  };

  const tabs = drink?.category === 'cocktail' || drink?.category === 'spirit'
    ? [
        { id: 'overview', label: 'Overview', icon: FiBook },
        { id: 'recipe', label: 'Recipe', icon: FiClock },
        { id: 'variations', label: 'Variations', icon: FiStar },
        { id: 'shopping', label: 'Shopping List', icon: FiShoppingCart },
      ]
    : [
        { id: 'overview', label: 'Overview', icon: FiBook },
        { id: 'variations', label: 'Similar Options', icon: FiStar },
        { id: 'shop', label: 'Shop', icon: FiShoppingCart },
      ];

  if (!isOpen || !drink) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleBackdropClick}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {drink.name} {drink.category === 'cocktail' || drink.category === 'spirit' ? 'Recipes' : 'Information'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {drink.category === 'cocktail' || drink.category === 'spirit' 
                  ? 'Learn how to make this drink at home'
                  : 'Discover similar options and details'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2"
            >
              <FiX className="w-5 h-5" />
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-amber-600 border-b-2 border-amber-600 bg-amber-50 dark:bg-amber-900/20'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.id === 'shopping' && shoppingList.length > 0 && (
                  <span className="bg-amber-600 text-white text-xs rounded-full px-2 py-1 min-w-[20px] h-5 flex items-center justify-center">
                    {shoppingList.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
              </div>
            ) : (
              <>
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                          About {drink.name}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          {drink.description}
                        </p>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Category:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{drink.category}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Strength:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{drink.strength}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Glass:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{drink.glass_type}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <img
                          src={drink.image_url}
                          alt={drink.name}
                          className="w-full h-48 object-cover rounded-xl"
                        />
                      </div>
                    </div>
                    
                    {recipes.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                          Found {recipes.length} Recipe{recipes.length !== 1 ? 's' : ''}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          Select the Recipe tab to see detailed instructions, or browse variations to explore different versions.
                        </p>
                      </div>
                    )}
                    
                    {beerWineData.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                          Found {beerWineData.length} Similar {drink.category === 'beer' ? 'Beer' : 'Wine'}{beerWineData.length !== 1 ? 's' : ''}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          Browse the Similar Options tab to explore different {drink.category === 'beer' ? 'beers' : 'wines'} that match your taste.
                        </p>
                      </div>
                    )}
                    
                    {selectedBeerWine && (drink.category === 'beer' || drink.category === 'wine') && (
                      <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                          Selected: {selectedBeerWine.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {selectedBeerWine.description}
                        </p>
                        {'winery' in selectedBeerWine ? (
                          <div className="space-y-1 text-sm">
                            <p><span className="font-medium">Winery:</span> {selectedBeerWine.winery}</p>
                            {selectedBeerWine.location && <p><span className="font-medium">Location:</span> {selectedBeerWine.location}</p>}
                            {selectedBeerWine.rating && <p><span className="font-medium">Rating:</span> {selectedBeerWine.rating.toFixed(1)}/5 ({selectedBeerWine.reviews} reviews)</p>}
                          </div>
                        ) : (
                          <div className="space-y-1 text-sm">
                            <p><span className="font-medium">Type:</span> {selectedBeerWine.type}</p>
                            <p><span className="font-medium">Price:</span> {selectedBeerWine.price}</p>
                            {selectedBeerWine.rating && <p><span className="font-medium">Rating:</span> {selectedBeerWine.rating.toFixed(1)}/5 ({selectedBeerWine.reviews} reviews)</p>}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'recipe' && selectedRecipe && (
                  <div className="space-y-6">
                    <div className="flex items-start gap-6">
                      <img
                        src={selectedRecipe.image}
                        alt={selectedRecipe.name}
                        className="w-32 h-32 object-cover rounded-xl"
                      />
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                          {selectedRecipe.name}
                        </h3>
                        <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                          <span>Glass: {selectedRecipe.glass}</span>
                          <span>Type: {selectedRecipe.alcoholic}</span>
                          <span>Category: {selectedRecipe.category}</span>
                        </div>
                        {selectedRecipe.video && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => window.open(selectedRecipe.video, '_blank')}
                            className="mb-4"
                          >
                            <FiExternalLink className="w-4 h-4 mr-2" />
                            Watch Video
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Ingredients</h4>
                        <div className="space-y-2">
                          {selectedRecipe.ingredients.map((ingredient, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                              <div>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {ingredient.name}
                                </span>
                                {ingredient.measure && (
                                  <span className="text-gray-600 dark:text-gray-400 ml-2">
                                    ({ingredient.measure})
                                  </span>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => addToShoppingList(ingredient.name)}
                                className="p-1"
                              >
                                <FiShoppingCart className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Instructions</h4>
                        <div className="prose prose-sm max-w-none text-gray-600 dark:text-gray-400">
                          <p>{selectedRecipe.instructions}</p>
                        </div>
                        {selectedRecipe.tags && (
                          <div className="mt-4">
                            <h5 className="font-medium text-gray-900 dark:text-white mb-2">Tags</h5>
                            <div className="flex flex-wrap gap-2">
                              {selectedRecipe.tags.map((tag, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 text-xs rounded-full"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'variations' && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {drink.category === 'cocktail' || drink.category === 'spirit' ? 'Recipe Variations' : 'Similar Options'}
                    </h3>
                    
                    {/* Cocktail Variations */}
                    {(drink.category === 'cocktail' || drink.category === 'spirit') && recipes.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {recipes.map((recipe) => (
                          <Card
                            key={recipe.id}
                            variant="default"
                            hover={true}
                            className={`cursor-pointer transition-all ${
                              selectedRecipe?.id === recipe.id ? 'ring-2 ring-amber-500' : ''
                            }`}
                            onClick={() => {
                              setSelectedRecipe(recipe);
                              setActiveTab('recipe');
                            }}
                          >
                            <CardContent className="p-4">
                              <div className="flex gap-4">
                                <img
                                  src={recipe.image}
                                  alt={recipe.name}
                                  className="w-16 h-16 object-cover rounded-lg"
                                />
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900 dark:text-white">
                                    {recipe.name}
                                  </h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {recipe.category} • {recipe.alcoholic}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                    {recipe.ingredients.length} ingredients
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : null}
                    
                    {/* Beer/Wine Variations */}
                    {(drink.category === 'beer' || drink.category === 'wine') && beerWineData.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {beerWineData.map((item) => (
                          <Card
                            key={item.id}
                            variant="default"
                            hover={true}
                            className={`cursor-pointer transition-all ${
                              selectedBeerWine?.id === item.id ? 'ring-2 ring-amber-500' : ''
                            }`}
                            onClick={() => setSelectedBeerWine(item)}
                          >
                            <CardContent className="p-4">
                              <div className="flex gap-4">
                                {item.image && (
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-16 h-16 object-cover rounded-lg"
                                  />
                                )}
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900 dark:text-white">
                                    {item.name}
                                  </h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {'winery' in item ? item.winery : `${item.type} • ${item.price}`}
                                  </p>
                                  {item.rating && (
                                    <div className="flex items-center gap-1 mt-1">
                                      <FiStar className="w-3 h-3 text-amber-500 fill-current" />
                                      <span className="text-xs text-gray-600 dark:text-gray-400">
                                        {item.rating.toFixed(1)} ({item.reviews} reviews)
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : null}
                    
                    {/* No data message */}
                    {((drink.category === 'cocktail' || drink.category === 'spirit') && recipes.length === 0) || 
                     ((drink.category === 'beer' || drink.category === 'wine') && beerWineData.length === 0) ? (
                      <p className="text-gray-600 dark:text-gray-400">
                        No {drink.category === 'cocktail' || drink.category === 'spirit' ? 'recipe variations' : 'similar options'} found for this drink.
                      </p>
                    ) : null}
                  </div>
                )}

                {activeTab === 'shopping' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        Shopping List
                      </h3>
                      {shoppingList.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShoppingList([])}
                        >
                          Clear All
                        </Button>
                      )}
                    </div>
                    
                    {shoppingList.length > 0 ? (
                      <div className="space-y-2">
                        {shoppingList.map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                          >
                            <span className="text-gray-900 dark:text-white">{item}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromShoppingList(item)}
                              className="p-1 text-red-600 hover:text-red-700"
                            >
                              <FiX className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                        <div className="mt-4 space-y-3">
                          <Button
                            variant="primary"
                            onClick={() => window.open(generateAmazonFreshLink(), '_blank')}
                            className="w-full"
                          >
                            Shop Ingredients on Amazon Fresh
                          </Button>
                          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                            <p className="text-amber-800 dark:text-amber-200 text-sm">
                              💡 Tip: Screenshot this list or send it to your phone before heading to the store!
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                            As an Amazon Associate I earn from qualifying purchases.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FiShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">
                          Add ingredients from the recipe tab to build your shopping list.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'shop' && (drink?.category === 'beer' || drink?.category === 'wine') && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        Shop for {drink.name}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Find this {drink.category} and similar options on Amazon
                      </p>
                    </div>

                    {/* Main product search */}
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                          Search for "{drink.name}"
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          Find exact matches or similar {drink.category === 'beer' ? 'beers' : 'wines'} 
                        </p>
                        <Button
                          variant="primary"
                          onClick={() => window.open(generateBeerWineLink(), '_blank')}
                          className="w-full"
                        >
                          Search Amazon
                        </Button>
                      </div>

                      {/* Selected beer/wine option */}
                      {selectedBeerWine && (
                        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                            Selected Option: {selectedBeerWine.name}
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                {selectedBeerWine.description}
                              </p>
                              {'winery' in selectedBeerWine ? (
                                <div className="space-y-1 text-sm">
                                  <p><span className="font-medium">Winery:</span> {selectedBeerWine.winery}</p>
                                  {selectedBeerWine.location && <p><span className="font-medium">Location:</span> {selectedBeerWine.location}</p>}
                                  {selectedBeerWine.rating && <p><span className="font-medium">Rating:</span> {selectedBeerWine.rating.toFixed(1)}/5</p>}
                                </div>
                              ) : (
                                <div className="space-y-1 text-sm">
                                  <p><span className="font-medium">Type:</span> {selectedBeerWine.type}</p>
                                  <p><span className="font-medium">Price:</span> {selectedBeerWine.price}</p>
                                  {selectedBeerWine.rating && <p><span className="font-medium">Rating:</span> {selectedBeerWine.rating.toFixed(1)}/5</p>}
                                </div>
                              )}
                            </div>
                            {selectedBeerWine.image && (
                              <div className="flex justify-center">
                                <img
                                  src={selectedBeerWine.image}
                                  alt={selectedBeerWine.name}
                                  className="w-24 h-32 object-cover rounded-lg"
                                />
                              </div>
                            )}
                          </div>
                          <Button
                            variant="primary"
                            onClick={() => window.open(generateBeerWineLink(), '_blank')}
                            className="w-full"
                          >
                            Shop This {drink.category === 'beer' ? 'Beer' : 'Wine'}
                          </Button>
                        </div>
                      )}

                      {/* Category suggestions */}
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                          Browse by Category
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {drink.category === 'beer' ? (
                            <>
                              <Button
                                variant="secondary"
                                onClick={() => window.open(`https://www.amazon.com/s?k=craft+beer&i=grocery&tag=${process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_ID || 'theperfect030-20'}`, '_blank')}
                                className="w-full"
                              >
                                Craft Beers
                              </Button>
                              <Button
                                variant="secondary"
                                onClick={() => window.open(`https://www.amazon.com/s?k=imported+beer&i=grocery&tag=${process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_ID || 'theperfect030-20'}`, '_blank')}
                                className="w-full"
                              >
                                Imported Beers
                              </Button>
                              <Button
                                variant="secondary"
                                onClick={() => window.open(`https://www.amazon.com/s?k=ipa+beer&i=grocery&tag=${process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_ID || 'theperfect030-20'}`, '_blank')}
                                className="w-full"
                              >
                                IPA Beers
                              </Button>
                              <Button
                                variant="secondary"
                                onClick={() => window.open(`https://www.amazon.com/s?k=lager+beer&i=grocery&tag=${process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_ID || 'theperfect030-20'}`, '_blank')}
                                className="w-full"
                              >
                                Lagers
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="secondary"
                                onClick={() => window.open(`https://www.amazon.com/s?k=red+wine&i=wine&tag=${process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_ID || 'theperfect030-20'}`, '_blank')}
                                className="w-full"
                              >
                                Red Wines
                              </Button>
                              <Button
                                variant="secondary"
                                onClick={() => window.open(`https://www.amazon.com/s?k=white+wine&i=wine&tag=${process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_ID || 'theperfect030-20'}`, '_blank')}
                                className="w-full"
                              >
                                White Wines
                              </Button>
                              <Button
                                variant="secondary"
                                onClick={() => window.open(`https://www.amazon.com/s?k=sparkling+wine&i=wine&tag=${process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_ID || 'theperfect030-20'}`, '_blank')}
                                className="w-full"
                              >
                                Sparkling Wines
                              </Button>
                              <Button
                                variant="secondary"
                                onClick={() => window.open(`https://www.amazon.com/s?k=rose+wine&i=wine&tag=${process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_ID || 'theperfect030-20'}`, '_blank')}
                                className="w-full"
                              >
                                Rosé Wines
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Affiliate disclosure */}
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        As an Amazon Associate I earn from qualifying purchases.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};