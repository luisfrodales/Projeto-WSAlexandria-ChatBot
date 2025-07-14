import React from 'react';
import { ArrowRight, MessageSquare, Upload, Brain, Shield, Zap, Users } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: MessageSquare,
      title: 'Perguntas Inteligentes',
      description: 'Obtenha respostas instantâneas para perguntas técnicas sobre equipamentos, procedimentos e processos.',
    },
    {
      icon: Upload,
      title: 'Aprendizado de Documentos',
      description: 'Faça upload de PDFs, documentos e arquivos de áudio para a IA aprender com sua base de conhecimento.',
    },
    {
      icon: Brain,
      title: 'Sugestões Contextuais',
      description: 'Receba sugestões automatizadas de soluções baseadas no contexto específico da sua pergunta.',
    },
    {
      icon: Shield,
      title: 'Seguro e Privado',
      description: 'Segurança de nível empresarial garante que seus documentos internos e conversas permaneçam privados.',
    },
    {
      icon: Zap,
      title: 'Acesso Instantâneo',
      description: 'Interface amigável para dispositivos móveis projetada para técnicos de campo e suporte em movimento.',
    },
    {
      icon: Users,
      title: 'Colaboração em Equipe',
      description: 'Compartilhe conhecimento e soluções em toda sua equipe técnica.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-xl flex items-center justify-center">
                <img src="/src/components/layout/logo.png" alt="Logo" className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Projeto WSAlexandria</h1>
                <p className="text-sm text-gray-600">Assistente Técnico Inteligente</p>
              </div>
            </div>
            <Button onClick={() => navigate('/login')}>
              Começar
            </Button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Seja bem vindo ao <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600">projeto WSAlexandria</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Revolucione seu suporte técnico com assistência alimentada por IA que aprende com seus documentos, 
              responde perguntas complexas e fornece soluções instantâneas para desafios operacionais.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                onClick={() => navigate('/guest')}
                icon={ArrowRight}
                className="px-8 py-4"
              >
                Usar Assistente
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Tudo que você precisa para suporte técnico
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Recursos poderosos projetados para aumentar a produtividade e resolver desafios técnicos complexos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group p-6 bg-gray-50 rounded-xl hover:bg-white hover:shadow-lg transition-all duration-200">
                <div className="w-12 h-12 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center space-x-2 mb-8">
            <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center">
              <img src="/src/components/layout/logo.png" alt="Logo" className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold">Projeto WSAlexandria</span>
          </div>
          <div className="text-center text-gray-400">
            <p>&copy; 2025 Projeto WSAlexandria. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};