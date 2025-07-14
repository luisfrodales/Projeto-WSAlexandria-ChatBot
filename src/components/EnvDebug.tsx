import React from 'react';
import { Bug, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

export const EnvDebug: React.FC = () => {
  const [showDebug, setShowDebug] = useState(false);

  const envVars = {
    'VITE_LLAMAINDEX_API_KEY': import.meta.env.VITE_LLAMAINDEX_API_KEY,
    'VITE_LLAMAINDEX_PROJECT_ID': import.meta.env.VITE_LLAMAINDEX_PROJECT_ID,
    'VITE_API_BASE_URL': import.meta.env.VITE_API_BASE_URL,
  };

  if (!showDebug) {
    return (
      <div className="fixed bottom-4 right-4">
        <button
          onClick={() => setShowDebug(true)}
          className="bg-secondary-600 text-white p-2 rounded-full shadow-lg hover:bg-secondary-700 transition-colors"
          title="Show Environment Debug"
        >
          <Bug className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-md">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-800">Environment Debug</h3>
        <button
          onClick={() => setShowDebug(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          <EyeOff className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-2 text-xs">
        {Object.entries(envVars).map(([key, value]) => (
          <div key={key} className="border-b border-gray-100 pb-2">
            <div className="flex justify-between mb-1">
              <span className="font-mono text-gray-600">{key}:</span>
              <span className={`font-mono ${value ? 'text-green-600' : 'text-red-600'}`}>
                {value ? '✅ Set' : '❌ Not set'}
              </span>
            </div>
            {value && (
              <div className="text-gray-500 font-mono break-all">
                {key.includes('KEY') ? `${value.substring(0, 10)}...` : value}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}; 