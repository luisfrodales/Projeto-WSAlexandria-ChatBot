import React from 'react';
import { 
  MessageSquare, 
  Upload, 
  History, 
  Settings, 
  Plus,
  X,
  Trash2
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useChat } from '../../context/ChatContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { 
    conversations, 
    activeConversation, 
    setActiveConversation, 
    createConversation,
    deleteConversation,
    clearConversations
  } = useChat();

  const handleNewChat = () => {
    const title = `Novo Chat ${conversations.length + 1}`;
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

  const menuItems = [
    { icon: MessageSquare, label: 'Novo Chat', onClick: handleNewChat },
    { icon: Upload, label: 'Upload de Arquivos', onClick: () => {} },
    { icon: History, label: 'Histórico de Chat', onClick: () => {} },
    { icon: Settings, label: 'Configurações', onClick: () => {} },
  ];

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Assistente</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
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

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-gray-50">
          {menuItems.slice(1).map((item, index) => (
            <button
              key={index}
              onClick={item.onClick}
              className="flex items-center space-x-3 w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
};