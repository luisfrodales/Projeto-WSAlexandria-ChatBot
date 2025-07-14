import React from 'react';
import { Brain, CheckCircle, AlertCircle, Info, Settings } from 'lucide-react';
import { useChat } from '../context/ChatContext';

export const LlamaIndexStatus: React.FC = () => {
  const { isLlamaIndexConfigured, llamaindexDocuments } = useChat();

  if (isLlamaIndexConfigured) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-green-800">
            LlamaIndex Cloud Conectado
          </span>
        </div>
        <p className="text-sm text-green-600 mt-1">
          {llamaindexDocuments.length} documento{llamaindexDocuments.length !== 1 ? 's' : ''} disponível{llamaindexDocuments.length !== 1 ? 'is' : ''} para processamento por IA
        </p>
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-medium text-yellow-800">LlamaIndex Cloud Not Configured</h3>
          <p className="text-sm text-yellow-700 mb-3">
            To enable AI-powered document processing and intelligent chat, you need to configure LlamaIndex Cloud.
          </p>
          <div className="bg-white rounded-md p-3 border border-yellow-200">
            <div className="flex items-center space-x-2">
              <Settings className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">
                LlamaIndex Cloud Não Configurado
              </span>
            </div>
            <p className="text-sm text-yellow-600 mt-1">
              Para habilitar o processamento de documentos por IA e chat inteligente, você precisa configurar o LlamaIndex Cloud.
            </p>
            <div className="text-xs text-yellow-700 space-y-1">
              <p>• Crie uma <a href="https://cloud.llamaindex.ai/" target="_blank" rel="noopener noreferrer" className="underline">conta no LlamaIndex Cloud</a></p>
              <p>• Configure as variáveis de ambiente:</p>
              <div className="bg-yellow-100 p-2 rounded text-xs font-mono">
                VITE_LLAMAINDEX_API_KEY=your_api_key<br />
                VITE_LLAMAINDEX_PROJECT_ID=your_project_id
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 