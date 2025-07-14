import React, { createContext, useContext, useState, useEffect } from 'react';
import { Conversation, Message, UploadedFile } from '../types';
import { llamaindexService, LlamaIndexDocument } from '../services/llamaindex';

interface ChatContextType {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  uploadedFiles: UploadedFile[];
  llamaindexDocuments: LlamaIndexDocument[];
  isLlamaIndexConfigured: boolean;
  createConversation: (title: string) => string;
  setActiveConversation: (conversationId: string) => void;
  sendMessage: (content: string) => Promise<void>;
  markMessageHelpful: (messageId: string, helpful: boolean) => void;
  uploadFile: (file: File) => Promise<void>;
  clearConversations: () => void;
  deleteConversation: (conversationId: string) => void;
  loadLlamaIndexDocuments: () => Promise<void>;
  deleteLlamaIndexDocument: (documentId: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

// Storage keys
const getStorageKey = (userId: string) => `chat_conversations_${userId}`;
const getActiveConversationKey = (userId: string) => `active_conversation_${userId}`;

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversationState] = useState<Conversation | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [llamaindexDocuments, setLlamaIndexDocuments] = useState<LlamaIndexDocument[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('guest');
  const [isLlamaIndexConfigured, setIsLlamaIndexConfigured] = useState(false);

  // Verificar configuração do LlamaIndex Cloud
  useEffect(() => {
    const checkConfiguration = async () => {
      console.log('=== ChatContext: Checking LlamaIndex Configuration ===');
      const configured = await llamaindexService.isConfigured();
      console.log('ChatContext: isConfigured result:', configured);
      setIsLlamaIndexConfigured(configured);
      
      if (configured) {
        console.log('ChatContext: Loading LlamaIndex documents...');
        loadLlamaIndexDocuments();
      } else {
        console.log('ChatContext: LlamaIndex not configured, skipping document load');
      }
    };

    checkConfiguration();
  }, []);

  // Load conversations from localStorage on mount
  useEffect(() => {
    const loadConversations = () => {
      try {
        // Check if we're in an admin session first, then guest
        const adminId = localStorage.getItem('current_admin_id');
        const guestId = localStorage.getItem('current_guest_id');
        const userId = adminId || guestId || 'guest';
        setCurrentUserId(userId);
        
        const storedConversations = localStorage.getItem(getStorageKey(userId));
        const storedActiveConversation = localStorage.getItem(getActiveConversationKey(userId));
        
        if (storedConversations) {
          const parsedConversations = JSON.parse(storedConversations);
          // Convert date strings back to Date objects
          const conversationsWithDates = parsedConversations.map((conv: any) => ({
            ...conv,
            createdAt: new Date(conv.createdAt),
            updatedAt: new Date(conv.updatedAt),
            messages: conv.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }))
          }));
          setConversations(conversationsWithDates);
          
          // Set active conversation if exists
          if (storedActiveConversation) {
            const activeConv = conversationsWithDates.find((c: Conversation) => c.id === storedActiveConversation);
            if (activeConv) {
              setActiveConversationState(activeConv);
            }
          }
        }
      } catch (error) {
        console.error('Error loading conversations from localStorage:', error);
      }
    };

    loadConversations();
  }, []);

  // Reload conversations when currentUserId changes
  useEffect(() => {
    const loadConversations = () => {
      try {
        const storedConversations = localStorage.getItem(getStorageKey(currentUserId));
        const storedActiveConversation = localStorage.getItem(getActiveConversationKey(currentUserId));
        
        if (storedConversations) {
          const parsedConversations = JSON.parse(storedConversations);
          // Convert date strings back to Date objects
          const conversationsWithDates = parsedConversations.map((conv: any) => ({
            ...conv,
            createdAt: new Date(conv.createdAt),
            updatedAt: new Date(conv.updatedAt),
            messages: conv.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }))
          }));
          setConversations(conversationsWithDates);
          
          // Set active conversation if exists
          if (storedActiveConversation) {
            const activeConv = conversationsWithDates.find((c: Conversation) => c.id === storedActiveConversation);
            if (activeConv) {
              setActiveConversationState(activeConv);
            }
          }
        } else {
          // Clear conversations if none exist for this user
          setConversations([]);
          setActiveConversationState(null);
        }
      } catch (error) {
        console.error('Error loading conversations from localStorage:', error);
      }
    };

    if (currentUserId !== 'guest') {
      loadConversations();
    }
  }, [currentUserId]);

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    const saveConversations = () => {
      try {
        if (conversations.length > 0) {
          localStorage.setItem(getStorageKey(currentUserId), JSON.stringify(conversations));
        }
        if (activeConversation) {
          localStorage.setItem(getActiveConversationKey(currentUserId), activeConversation.id);
        }
      } catch (error) {
        console.error('Error saving conversations to localStorage:', error);
      }
    };

    saveConversations();
  }, [conversations, activeConversation, currentUserId]);

  // Set user ID (for guest or admin)
  const setUserId = (userId: string) => {
    setCurrentUserId(userId);
  };

  const createConversation = (title: string): string => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setConversations(prev => [newConversation, ...prev]);
    setActiveConversationState(newConversation);
    
    // Immediately save to localStorage
    const updatedConversations = [newConversation, ...conversations];
    localStorage.setItem(getStorageKey(currentUserId), JSON.stringify(updatedConversations));
    localStorage.setItem(getActiveConversationKey(currentUserId), newConversation.id);
    
    return newConversation.id;
  };

  const setActiveConversation = (conversationId: string) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      setActiveConversationState(conversation);
    }
  };

  const deleteConversation = (conversationId: string) => {
    setConversations(prev => prev.filter(conv => conv.id !== conversationId));
    if (activeConversation?.id === conversationId) {
      setActiveConversationState(null);
    }
  };

  const clearConversations = () => {
    setConversations([]);
    setActiveConversationState(null);
  };

  const generateAIResponse = async (userMessage: string, conversationId?: string): Promise<string> => {
    try {
      // Se o LlamaIndex Cloud estiver configurado, usar o chat com documentos
      if (isLlamaIndexConfigured) {
        console.log('Usando LlamaIndex Cloud para chat com documentos...');
        
        const chatResponse = await llamaindexService.sendChatMessage(userMessage, conversationId);
        
        console.log('Resposta do LlamaIndex Cloud:', chatResponse);
        
        // Se há fontes (documentos), adicionar informações sobre elas
        let response = chatResponse.message;
        
        return response;
      } else {
        // Usar resposta mock se LlamaIndex Cloud não estiver configurado
        console.log('Usando resposta mock (LlamaIndex Cloud não configurado)...');
        return generateMockResponse(userMessage);
      }
    } catch (error) {
      console.error('Erro ao gerar resposta:', error);
      
      // Em caso de erro, usar resposta mock como fallback
      return generateMockResponse(userMessage);
    }
  };

  const generateMockResponse = (userMessage: string): string => {
    // Mock AI response generation - very fast response
    const responses = [
      "Based on the technical specifications in our documentation, I recommend checking the power supply voltage first. Ensure it's within the 220-240V range and that all connections are secure.",
      "This issue is commonly related to calibration settings. Please access the maintenance menu by holding the reset button for 5 seconds, then navigate to 'Calibration' → 'Factory Reset'.",
      "According to our safety protocols, you should first shut down the system completely before performing any maintenance. The shutdown sequence is: 1) Stop active processes, 2) Engage safety locks, 3) Power down main unit.",
      "I found several relevant documents in our knowledge base. The most recent procedure update (v2.3) suggests using the diagnostic tool located in the equipment panel. Run test sequence A-7 for comprehensive analysis.",
      "This appears to be a known issue with this model. The workaround is to restart the system in maintenance mode: Hold power + reset for 10 seconds, then follow the on-screen prompts.",
      "Based on similar cases in our system, this typically requires replacing the filter cartridge. Check the maintenance schedule - it should be replaced every 3 months or after 500 operating hours.",
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const sendMessage = async (content: string) => {
    // If no active conversation, we need to handle this specially
    if (!activeConversation && conversations.length === 0) {
      // Create a temporary message to show in the UI
      const tempUserMessage: Message = {
        id: Date.now().toString(),
        content,
        sender: 'user',
        timestamp: new Date(),
      };

      // Generate AI response first
      const aiResponse = await generateAIResponse(content, Date.now().toString());
      const tempAssistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        sender: 'assistant',
        timestamp: new Date(),
        suggestions: [
          "Verificar manual do equipamento",
          "Contatar suporte técnico",
          "Agendar manutenção",
          "Atualizar firmware"
        ].slice(0, Math.floor(Math.random() * 3) + 1),
      };

      // Now create the conversation with both messages
      const generateTitleFromMessage = (message: string): string => {
        const commonWords = [
          'como', 'qual', 'quando', 'onde', 'por', 'para', 'com', 'sem', 'que', 'uma', 'um', 'o', 'a', 'e', 'é', 'de', 'da', 'do', 'em', 'na', 'no', 'se', 'mais', 'muito', 'pouco', 'bem', 'mal',
          'este', 'esta', 'esse', 'essa', 'isso', 'aquilo', 'aqui', 'ali', 'lá', 'aqui', 'agora', 'hoje', 'ontem', 'amanhã', 'sempre', 'nunca', 'já', 'ainda', 'também', 'só', 'apenas',
          'pode', 'deve', 'precisa', 'quer', 'vai', 'vou', 'está', 'estou', 'sou', 'era', 'foi', 'será', 'seria', 'poderia', 'deveria', 'precisaria', 'queria'
        ];
        
        const words = message.toLowerCase()
          .replace(/[^\w\s]/g, ' ')
          .split(' ')
          .filter(word => 
            word.length > 2 && 
            !commonWords.includes(word) &&
            !word.match(/^\d+$/)
          );
        
        if (words.length === 0) {
          return 'Nova Conversa';
        }
        
        const titleWords = words.slice(0, 3).map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        );
        
        return titleWords.join(' ');
      };

      const title = generateTitleFromMessage(content);
      
      const newConversation: Conversation = {
        id: Date.now().toString(),
        title,
        messages: [tempUserMessage, tempAssistantMessage],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      setConversations(prev => [newConversation, ...prev]);
      setActiveConversationState(newConversation);
      
      return;
    }

    // Get the current active conversation from state
    const currentActiveConversation = activeConversation || conversations[0];
    
    if (!currentActiveConversation) {
      console.error('No active conversation available');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date(),
    };

    // Add user message to conversations
    setConversations(prev => prev.map(conv => 
      conv.id === currentActiveConversation.id 
        ? { ...conv, messages: [...conv.messages, userMessage], updatedAt: new Date() }
        : conv
    ));

    // Update active conversation with user message
    setActiveConversationState(prev => 
      prev ? { ...prev, messages: [...prev.messages, userMessage] } : null
    );

    // Generate AI response with conversation context
    const aiResponse = await generateAIResponse(content, currentActiveConversation.id);
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: aiResponse,
      sender: 'assistant',
      timestamp: new Date(),
      suggestions: [
        "Verificar manual do equipamento",
        "Contatar suporte técnico",
        "Agendar manutenção",
        "Atualizar firmware"
      ].slice(0, Math.floor(Math.random() * 3) + 1),
    };

    // Add AI response to conversations
    setConversations(prev => prev.map(conv => 
      conv.id === currentActiveConversation.id 
        ? { ...conv, messages: [...conv.messages, assistantMessage], updatedAt: new Date() }
        : conv
    ));

    // Update active conversation with AI response
    setActiveConversationState(prev => 
      prev ? { ...prev, messages: [...prev.messages, assistantMessage] } : null
    );
  };

  const markMessageHelpful = (messageId: string, helpful: boolean) => {
    setConversations(prev => prev.map(conv => ({
      ...conv,
      messages: conv.messages.map(msg => 
        msg.id === messageId ? { ...msg, helpful } : msg
      )
    })));

    if (activeConversation) {
      setActiveConversationState(prev => 
        prev ? {
          ...prev,
          messages: prev.messages.map(msg => 
            msg.id === messageId ? { ...msg, helpful } : msg
          )
        } : null
      );
    }
  };

  const uploadFile = async (file: File): Promise<void> => {
    const newFile: UploadedFile = {
      id: Date.now().toString(),
      name: file.name,
      type: file.type,
      size: file.size,
      uploadedAt: new Date(),
      status: 'processing',
    };

    setUploadedFiles(prev => [newFile, ...prev]);

    try {
      // Se o LlamaIndex Cloud estiver configurado, fazer upload e sync para o pipeline
      if (isLlamaIndexConfigured) {
        // Usar o novo método que implementa o fluxo completo: POST /files → PUT /pipelines/{id}/files → PUT /files/sync
        const llamaindexDoc = await llamaindexService.uploadWithPipelineAndSync(file);
        
        // Atualizar o arquivo local com o status do LlamaIndex
        setUploadedFiles(prev => prev.map(f => 
          f.id === newFile.id ? { ...f, status: 'completed' } : f
        ));

        // Adicionar o documento do LlamaIndex à lista
        setLlamaIndexDocuments(prev => [llamaindexDoc, ...prev]);
      } else {
        // Simular processamento se LlamaIndex Cloud não estiver configurado
        await new Promise(resolve => setTimeout(resolve, 3000));
        setUploadedFiles(prev => prev.map(f => 
          f.id === newFile.id ? { ...f, status: 'completed' } : f
        ));
      }
    } catch (error) {
      console.error('Erro ao fazer upload do arquivo:', error);
      setUploadedFiles(prev => prev.map(f => 
        f.id === newFile.id ? { ...f, status: 'failed' } : f
      ));
    }
  };

  const loadLlamaIndexDocuments = async (): Promise<void> => {
    if (!isLlamaIndexConfigured) return;

    try {
      const documents = await llamaindexService.listDocuments();
      setLlamaIndexDocuments(documents);
    } catch (error) {
      console.error('Erro ao carregar documentos do LlamaIndex Cloud:', error);
    }
  };

  const deleteLlamaIndexDocument = async (documentId: string): Promise<void> => {
    if (!isLlamaIndexConfigured) return;

    try {
      await llamaindexService.deleteDocument(documentId);
      setLlamaIndexDocuments(prev => prev.filter(doc => doc.documentId !== documentId));
    } catch (error) {
      console.error('Erro ao deletar documento do LlamaIndex Cloud:', error);
    }
  };

  return (
    <ChatContext.Provider value={{
      conversations,
      activeConversation,
      uploadedFiles,
      llamaindexDocuments,
      isLlamaIndexConfigured,
      createConversation,
      setActiveConversation,
      sendMessage,
      markMessageHelpful,
      uploadFile,
      clearConversations,
      deleteConversation,
      loadLlamaIndexDocuments,
      deleteLlamaIndexDocument,
    }}>
      {children}
    </ChatContext.Provider>
  );
};