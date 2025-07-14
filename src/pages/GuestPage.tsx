import React, { useState, useEffect } from 'react';
import { ChatBox } from '../components/chat/ChatBox';
import { ArrowLeft, Plus, MessageSquare, X, Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import { Button } from '../components/ui/Button';

export const GuestPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { 
    conversations, 
    activeConversation, 
    setActiveConversation, 
    createConversation,
    deleteConversation,
    clearConversations
  } = useChat();

  // Set guest ID for conversation persistence
  useEffect(() => {
    if (id) {
      // Set the guest ID in localStorage for this session
      localStorage.setItem('current_guest_id', id);
    }
  }, [id]);

  const handleNewChat = () => {
    const title = `Chat Convidado ${conversations.length + 1}`;
    createConversation(title);
  };

  const handleDeleteConversation = (conversationId: string) => {
    if (window.confirm('Tem certeza que deseja deletar esta conversa?')) {
      deleteConversation(conversationId);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Tem certeza que deseja limpar todas as conversas? Esta ação não pode ser desfeita.')) {
      clearConversations();
    }
  };

  return (
    <div className="h-screen flex bg-gray-100">
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Assistente Convidado</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-4 space-y-2">
          <Button
            icon={Plus}
            onClick={handleNewChat}
            className="w-full justify-start"
          >
            Novo Chat
          </Button>
        </div>

        <div className="px-4 py-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Conversas Recentes</h3>
            {conversations.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Limpar Tudo
              </button>
            )}
          </div>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {conversations.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">
                Nenhuma conversa ainda. Inicie um novo chat!
              </p>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`group relative ${
                    activeConversation?.id === conversation.id
                      ? 'bg-primary-50 border-l-4 border-primary-600'
                      : 'hover:bg-gray-50'
                  } rounded-lg transition-colors`}
                >
                  <button
                    onClick={() => setActiveConversation(conversation.id)}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
                  >
                    <div className="truncate">{conversation.title}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {conversation.messages.length} mensagens
                    </div>
                    <div className="text-xs text-gray-400">
                      {conversation.updatedAt.toLocaleDateString()}
                    </div>
                  </button>
                  <button
                    onClick={() => handleDeleteConversation(conversation.id)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-red-400 hover:text-red-600"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <MessageSquare className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigate('/')}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center">
                  <img src="/src/components/layout/logo.png" alt="Logo" className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-800">Projeto WSAlexandria</h1>
                  <p className="text-xs text-gray-500">Acesso Convidado</p>
                </div>
              </div>
            </div>
            {id && (
              <div className="text-sm text-gray-500">
                ID do Convidado: {id}
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-hidden">
          <ChatBox />
        </div>
      </div>
    </div>
  );
}; 