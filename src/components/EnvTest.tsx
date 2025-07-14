import React, { useState, useEffect } from 'react';

export const EnvTest: React.FC = () => {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/config/llamaindex-config');
        const data = await response.json();
        setConfig(data.config);
      } catch (error) {
        console.error('Erro ao carregar configuração:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  if (loading) {
    return (
      <div className="fixed top-4 left-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-md z-50">
        <h3 className="font-medium text-gray-800 mb-3">Environment Test</h3>
        <div className="text-sm text-gray-600">Carregando configuração do backend...</div>
      </div>
    );
  }

  return (
    <div className="fixed top-4 left-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-md z-50">
      <h3 className="font-medium text-gray-800 mb-3">Backend Configuration Test</h3>
      <div className="space-y-2 text-xs">
        <div className="border-b border-gray-100 pb-2">
          <div className="flex justify-between mb-1">
            <span className="font-mono text-gray-600">LLAMAINDEX_API_KEY:</span>
            <span className={`font-mono ${config?.apiKey ? 'text-green-600' : 'text-red-600'}`}>
              {config?.apiKey ? '✅ Set' : '❌ Not set'}
            </span>
          </div>
          {config?.apiKey && (
            <div className="text-gray-500 font-mono break-all">
              {config.apiKey.substring(0, 10)}...
            </div>
          )}
        </div>
        <div className="border-b border-gray-100 pb-2">
          <div className="flex justify-between mb-1">
            <span className="font-mono text-gray-600">LLAMAINDEX_PROJECT_ID:</span>
            <span className={`font-mono ${config?.projectId ? 'text-green-600' : 'text-red-600'}`}>
              {config?.projectId ? '✅ Set' : '❌ Not set'}
            </span>
          </div>
          {config?.projectId && (
            <div className="text-gray-500 font-mono break-all">
              {config.projectId}
            </div>
          )}
        </div>
        <div className="border-b border-gray-100 pb-2">
          <div className="flex justify-between mb-1">
            <span className="font-mono text-gray-600">Is Configured:</span>
            <span className={`font-mono ${config?.isConfigured ? 'text-green-600' : 'text-red-600'}`}>
              {config?.isConfigured ? '✅ Yes' : '❌ No'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}; 