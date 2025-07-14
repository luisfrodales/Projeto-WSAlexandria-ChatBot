import React, { useState, useEffect } from 'react';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { ChatBox } from '../components/chat/ChatBox';
import { FileUploader } from '../components/FileUploader';
import { LlamaIndexStatus } from '../components/LlamaIndexStatus';
import { EnvDebug } from '../components/EnvDebug';
import { EnvTest } from '../components/EnvTest';
import FileStatusChecker from '../components/FileStatusChecker';
import { MessageSquare, Upload, BarChart3, Settings, Share2, Trash2, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { Button } from '../components/ui/Button';

export const DashboardPage: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'upload' | 'analytics' | 'settings' | 'share'>('chat');
  const { user } = useAuth();
  const { conversations, deleteConversation, clearConversations, createConversation } = useChat();

  // Set admin user ID for conversation persistence
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem('current_admin_id', user.id);
    }
  }, [user]);

  const generateGuestLink = () => {
    const guestId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const guestLink = `${window.location.origin}/guest/${guestId}`;
    return { guestId, guestLink };
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

  const handleNewChat = () => {
    const title = `Novo Chat ${conversations.length + 1}`;
    createConversation(title);
  };

  const tabs = [
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'upload', label: 'Upload', icon: Upload },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Configurações', icon: Settings },
    { id: 'share', label: 'Compartilhar', icon: Share2 },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'chat':
        return <ChatBox />;
      case 'upload':
        return (
          <div className="p-6 bg-white h-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Upload de Documentos</h2>
            <div className="space-y-6">
              <LlamaIndexStatus />
              <FileUploader />
              <FileStatusChecker />
            </div>
          </div>
        );
      case 'analytics':
        return (
          <div className="p-6 bg-white h-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-lg p-6 text-white">
                <h3 className="text-lg font-semibold mb-2">Total de Perguntas</h3>
                <p className="text-3xl font-bold">147</p>
                <p className="text-primary-100 text-sm">Este mês</p>
              </div>
              <div className="bg-gradient-to-r from-emerald-600 to-green-600 rounded-lg p-6 text-white">
                <h3 className="text-lg font-semibold mb-2">Respostas Úteis</h3>
                <p className="text-3xl font-bold">92%</p>
                <p className="text-green-100 text-sm">Taxa de satisfação</p>
              </div>
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6 text-white">
                <h3 className="text-lg font-semibold mb-2">Documentos Processados</h3>
                <p className="text-3xl font-bold">23</p>
                <p className="text-purple-100 text-sm">Base de conhecimento</p>
              </div>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="p-6 bg-white h-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Configurações</h2>
            <div className="space-y-6">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-2">Preferências de Notificação</h3>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" defaultChecked />
                    <span className="text-sm text-gray-600">Notificações por email</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" defaultChecked />
                    <span className="text-sm text-gray-600">Notificações push</span>
                  </label>
                </div>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-2">Configurações do Assistente IA</h3>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" defaultChecked />
                    <span className="text-sm text-gray-600">Sugerir soluções automaticamente</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm text-gray-600">Respostas por voz</span>
                  </label>
                </div>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-2">Gerenciamento de Dados</h3>
                <div className="space-y-2">
                  <button
                    onClick={handleClearAll}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Limpar Todas as Conversas
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      case 'share':
        return (
          <div className="p-6 bg-white h-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Compartilhar Acesso Convidado</h2>
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Gerar Link Convidado</h3>
                <p className="text-gray-600 mb-4">
                  Crie um link temporário que permite que outros acessem o chatbot sem precisar fazer login.
                  Usuários convidados terão acesso limitado - eles só podem usar a funcionalidade de chat.
                </p>
                <button
                  onClick={() => {
                    const { guestId, guestLink } = generateGuestLink();
                    navigator.clipboard.writeText(guestLink);
                    alert(`Link convidado copiado para a área de transferência!\n\nID do Convidado: ${guestId}\nLink: ${guestLink}`);
                  }}
                  className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Gerar e Copiar Link
                </button>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-2">Links Convidados Recentes</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between items-center">
                    <span>Convidado-abc123def456</span>
                    <span className="text-xs text-gray-500">2 horas atrás</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Convidado-xyz789uvw012</span>
                    <span className="text-xs text-gray-500">1 dia atrás</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return <ChatBox />;
    }
  };

  return (
    <div className="h-screen flex bg-gray-100">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        <div className="flex-1 flex">
          <div className="flex-1 flex flex-col">
            <div className="bg-white border-b px-4">
              <nav className="flex space-x-8">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 py-4 px-2 border-b-2 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            <div className="flex-1 overflow-hidden">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
      <EnvDebug />
    </div>
  );
};