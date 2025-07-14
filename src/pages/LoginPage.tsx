import React, { useState } from 'react';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { BackendStatus } from '../components/BackendStatus';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        navigate('/dashboard');
      } else {
        setError('Invalid email or password. Please check your credentials.');
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <img src="/src/components/layout/logo.png" alt="Logo" className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Bem-vindo de volta</h2>
            <p className="text-gray-600">Entre na sua conta do Projeto WSAlexandria</p>
            
            <div className="mt-4 flex justify-center">
              <BackendStatus />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              type="email"
              label="Endereço de Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-5 h-5 text-gray-400" />}
              required
              placeholder="Digite seu email"
            />

            <Input
              type="password"
              label="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="w-5 h-5 text-gray-400" />}
              required
              placeholder="Digite sua senha"
            />

            {error && (
              <div className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              loading={loading}
              className="w-full"
              size="lg"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <div className="mt-8 p-4 bg-primary-50 rounded-lg border border-primary-200">
            <p className="text-sm text-primary-800 mb-3 font-medium">Credenciais de demonstração:</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-primary-700 font-medium">Felippe Admin:</span>
                <span className="text-primary-600">felippe@chatbot.com</span>
              </div>
              <div className="flex justify-between">
                <span className="text-primary-700 font-medium">Nicholas Admin:</span>
                <span className="text-primary-600">nicholas@chatbot.com</span>
              </div>
              <div className="flex justify-between">
                <span className="text-primary-700 font-medium">Senha:</span>
                <span className="text-primary-600">2025@chatbot</span>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-primary-600 hover:text-primary-700 text-sm transition-colors"
            >
              ← Voltar ao Início
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};