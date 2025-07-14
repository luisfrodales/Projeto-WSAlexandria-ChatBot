import React, { useEffect, useRef } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { useChat } from '../../context/ChatContext';
import { Brain, File, Bot } from 'lucide-react';

export const ChatBox: React.FC = () => {
  const { activeConversation, isLlamaIndexConfigured, llamaindexDocuments } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages]);

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeConversation?.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                Como posso ajudá-lo hoje?
              </h3>
              <p className="text-gray-600 mb-4">
                {isLlamaIndexConfigured 
                  ? 'Pergunte-me sobre procedimentos técnicos, solução de problemas de equipamentos ou qualquer pergunta sobre seus documentos carregados.'
                  : 'Pergunte-me sobre procedimentos técnicos, solução de problemas de equipamentos ou qualquer pergunta relacionada ao trabalho.'
                }
              </p>
              
              {isLlamaIndexConfigured && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Brain className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      LlamaIndex Cloud Conectado
                    </span>
                  </div>
                  {llamaindexDocuments.length > 0 && (
                    <div className="mt-2 text-xs text-green-600">
                      {llamaindexDocuments.length} documento{llamaindexDocuments.length > 1 ? 's' : ''} disponível{llamaindexDocuments.length > 1 ? 'is' : ''} para referência
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <div className="text-sm text-gray-500">Tente perguntar:</div>
                <div className="space-y-1">
                  <div className="text-sm bg-gray-50 rounded-lg p-2">
                    "Como calibrar o sensor de pressão?"
                  </div>
                  <div className="text-sm bg-gray-50 rounded-lg p-2">
                    "Qual é o cronograma de manutenção do equipamento X?"
                  </div>
                  <div className="text-sm bg-gray-50 rounded-lg p-2">
                    "Procedimento de segurança para desligamento de emergência"
                  </div>
                  {isLlamaIndexConfigured && llamaindexDocuments.length > 0 && (
                    <div className="text-sm bg-primary-50 rounded-lg p-2 border border-primary-200">
                      "O que o manual diz sobre solucionar este problema?"
                    </div>
                  )}
                </div>
              </div>

              {isLlamaIndexConfigured && llamaindexDocuments.length > 0 && (
                <div className="mt-6">
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    Documentos Disponíveis:
                  </div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {llamaindexDocuments.slice(0, 5).map((doc) => (
                      <div key={doc.id} className="flex items-center space-x-2 text-xs text-gray-600">
                        <File className="w-3 h-3" />
                        <span className="truncate">{doc.name}</span>
                      </div>
                    ))}
                    {llamaindexDocuments.length > 5 && (
                      <div className="text-xs text-gray-500">
                        +{llamaindexDocuments.length - 5} mais documentos
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {activeConversation?.messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      <ChatInput />
    </div>
  );
};