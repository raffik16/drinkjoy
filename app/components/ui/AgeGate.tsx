'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from './Button';

interface AgeGateProps {
  onVerified: (isOfAge: boolean) => void;
}

export const AgeGate: React.FC<AgeGateProps> = ({ onVerified }) => {
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleYes = () => {
    onVerified(true);
  };

  const handleNo = () => {
    setShowConfirmation(true);
  };

  const handleLeave = () => {
    window.location.href = 'https://www.google.com';
  };

  if (showConfirmation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-rose-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-2xl text-center overflow-hidden shadow-xl">
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-6">
              <h2 className="text-2xl font-bold text-white">
                Access Restricted
              </h2>
            </div>
            <div className="p-8">
              <p className="text-gray-700 mb-6 text-lg">
                You must be 21 or older to view alcoholic beverage recommendations.
              </p>
              
              <Button
                onClick={handleLeave}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200"
              >
                Leave Site
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-rose-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl text-center overflow-hidden shadow-xl">
          <div className="bg-gradient-to-r from-purple-400 to-rose-400 p-6">
            <h2 className="text-3xl font-bold text-white">
              Age Verification
            </h2>
          </div>
          <div className="p-8">
            <div className="mb-6">
              <p className="text-gray-700 mb-3 text-lg">
                This site contains information about alcoholic beverages.
              </p>
              <p className="text-xl font-semibold text-gray-800">
                Are you 21 years of age or older?
              </p>
            </div>
            
            <div className="flex gap-3 mb-4">
              <button
                onClick={handleYes}
                className="flex-1 bg-gradient-to-r from-purple-500 to-rose-500 hover:from-purple-600 hover:to-rose-600 text-white font-semibold py-4 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] text-sm sm:text-base whitespace-nowrap"
              >
                Yes, 21+
              </button>
              <button
                onClick={handleNo}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-4 px-4 rounded-lg transition-colors duration-200 text-sm sm:text-base"
              >
                No
              </button>
            </div>
            
            <p className="text-sm text-gray-600">
              By clicking &quot;Yes&quot;, you certify that you are of legal drinking age.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};