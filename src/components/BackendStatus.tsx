import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Wifi, WifiOff } from 'lucide-react';

interface BackendStatusProps {
  className?: string;
}

export const BackendStatus: React.FC<BackendStatusProps> = ({ className = '' }) => {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkBackendStatus = async () => {
    try {
      const response = await fetch('http://localhost:3001/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setStatus('online');
      } else {
        setStatus('offline');
      }
    } catch (error) {
      setStatus('offline');
    }
    
    setLastCheck(new Date());
  };

  useEffect(() => {
    checkBackendStatus();
    
    // Check every 30 seconds
    const interval = setInterval(checkBackendStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    switch (status) {
      case 'online':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'offline':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'checking':
        return <Wifi className="w-4 h-4 text-yellow-500 animate-pulse" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'online':
        return 'Backend Online';
      case 'offline':
        return 'Backend Offline';
      case 'checking':
        return 'Verificando...';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'offline':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'checking':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  return (
    <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full border text-xs font-medium ${getStatusColor()} ${className}`}>
      {getStatusIcon()}
      <span>{getStatusText()}</span>
    </div>
  );
}; 