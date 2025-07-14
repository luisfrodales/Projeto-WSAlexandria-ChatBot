import React from 'react';
import { ThumbsUp, ThumbsDown, Bot, User } from 'lucide-react';
import { Message } from '../../types';
import { Button } from '../ui/Button';
import { useChat } from '../../context/ChatContext';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const { markMessageHelpful } = useChat();

  const handleFeedback = (helpful: boolean) => {
    markMessageHelpful(message.id, helpful);
  };

  return (
    <div className={`flex space-x-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
      {message.sender === 'assistant' && (
        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-full flex items-center justify-center">
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}
      
      <div className={`max-w-xs lg:max-w-md ${message.sender === 'user' ? 'order-1' : ''}`}>
        <div className={`rounded-lg px-4 py-2 shadow-sm ${
          message.sender === 'user'
            ? 'bg-primary-600 text-white'
            : 'bg-gray-100 text-gray-800'
        }`}>
          <p className="text-sm">{message.content}</p>
        </div>
        
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span>{message.timestamp.toLocaleTimeString()}</span>
          
          {message.sender === 'assistant' && (
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFeedback(true)}
                className={`p-1 h-6 w-6 ${message.helpful === true ? 'text-green-600' : 'text-gray-400'}`}
              >
                <ThumbsUp className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFeedback(false)}
                className={`p-1 h-6 w-6 ${message.helpful === false ? 'text-red-600' : 'text-gray-400'}`}
              >
                <ThumbsDown className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>

        {message.suggestions && message.suggestions.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-gray-500">Sugestões:</p>
            <div className="flex flex-wrap gap-2">
              {message.suggestions.map((suggestion, index) => (
                <span
                  key={index}
                  className="inline-block px-2 py-1 bg-primary-50 text-primary-600 text-xs rounded-full"
                >
                  {suggestion}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {message.sender === 'user' && (
        <div className="flex-shrink-0 w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
      )}
    </div>
  );
};