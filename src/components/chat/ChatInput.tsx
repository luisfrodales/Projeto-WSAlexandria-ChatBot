import React, { useState } from 'react';
import { Send, Paperclip } from 'lucide-react';
import { Button } from '../ui/Button';
import { useChat } from '../../context/ChatContext';

export const ChatInput: React.FC = () => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { sendMessage, activeConversation, createConversation } = useChat();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsLoading(true);
    
    try {
      // If no active conversation, we'll create it after the AI responds
      if (!activeConversation) {
        // Send message directly without creating conversation first
        await sendMessage(message);
      } else {
        // Send message normally for existing conversations
        await sendMessage(message);
      }
      
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="border-t bg-white p-4">
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Pergunte sobre equipamentos, procedimentos ou problemas técnicos..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            disabled={isLoading}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <Paperclip className="w-4 h-4" />
          </Button>
        </div>
        <Button
          type="submit"
          disabled={!message.trim() || isLoading}
          loading={isLoading}
          icon={Send}
          className="px-4"
        />
      </form>
    </div>
  );
};