import React from 'react';
import { Menu, LogOut, User } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b z-30 relative">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center">
              <img src="/src/components/layout/logo.png" alt="Logo" className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Projeto WSAlexandria</h1>
              <p className="text-xs text-gray-500">Assistente Técnico Inteligente</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
              {user?.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.name} 
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <User className="w-4 h-4 text-gray-600" />
              )}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-800">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.role}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            icon={LogOut}
            className="text-gray-600"
          />
        </div>
      </div>
    </header>
  );
};