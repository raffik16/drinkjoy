'use client';

import { RefreshCw } from 'lucide-react';

export default function ResetWizard() {
  const handleReset = () => {
    localStorage.removeItem('wizardCompleted');
    localStorage.removeItem('wizardPreferences');
    window.location.reload();
  };

  return (
    <button
      onClick={handleReset}
      className="fixed bottom-4 right-4 bg-purple-500 text-white p-3 rounded-full hover:bg-purple-600 transition-colors z-50"
      title="Reset discovery quiz and preferences"
    >
      <RefreshCw className="w-6 h-6" />
    </button>
  );
}