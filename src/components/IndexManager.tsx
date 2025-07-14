import React, { useState, useEffect } from 'react';
import { Database, Plus, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { Button } from './ui/Button';
import { useChat } from '../context/ChatContext';
import { llamaindexService, LlamaIndexIndex } from '../services/llamaindex';

export const IndexManager: React.FC = () => {
  const [indexes, setIndexes] = useState<LlamaIndexIndex[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    fileIds: [] as string[],
    embeddingModelId: '85fa7bc3-094f-4e47-8365-a6e06e7f7944' // ID padrão fornecido
  });

  const { llamaindexDocuments, isLlamaIndexConfigured } = useChat();

  // Remover carregamento automático de indexes por enquanto
  // useEffect(() => {
  //   if (isLlamaIndexConfigured) {
  //     loadIndexes();
  //   }
  // }, [isLlamaIndexConfigured]);

  // const loadIndexes = async () => {
  //   setLoading(true);
  //   try {
  //     const indexesList = await llamaindexService.listIndexes();
  //     setIndexes(indexesList);
  //   } catch (error) {
  //     console.error('Erro ao carregar indexes:', error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleCreateIndex = async () => {
    if (!formData.name || formData.fileIds.length === 0) {
      alert('Por favor, preencha o nome e selecione pelo menos um arquivo.');
      return;
    }

    setCreating(true);
    try {
      const newIndex = await llamaindexService.createIndex(
        formData.name,
        formData.fileIds,
        formData.embeddingModelId
      );
      
      setIndexes(prev => [newIndex, ...prev]);
      setShowCreateForm(false);
      setFormData({ name: '', fileIds: [], embeddingModelId: '85fa7bc3-094f-4e47-8365-a6e06e7f7944' });
      
      alert('Index criado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar index:', error);
      alert('Erro ao criar index. Verifique o console para mais detalhes.');
    } finally {
      setCreating(false);
    }
  };

  const handleFileToggle = (fileId: string) => {
    setFormData(prev => ({
      ...prev,
      fileIds: prev.fileIds.includes(fileId)
        ? prev.fileIds.filter(id => id !== fileId)
        : [...prev.fileIds, fileId]
    }));
  };

  if (!isLlamaIndexConfigured) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">LlamaIndex Cloud não está configurado para gerenciar Indexes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Database className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-medium text-gray-800">Criar Index no LlamaIndex Cloud</h3>
        </div>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          variant="outline"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Criar Index
        </Button>
      </div>

      {showCreateForm && (
        <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
          <h4 className="font-medium text-primary-800 mb-4">Criar Novo Index</h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Index
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Ex: meu-index-de-pdfs"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecionar Arquivos ({formData.fileIds.length} selecionados)
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {llamaindexDocuments.map((doc) => (
                  <label key={doc.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.fileIds.includes(doc.documentId || '')}
                      onChange={() => handleFileToggle(doc.documentId || '')}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">{doc.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={handleCreateIndex}
                disabled={creating || !formData.name || formData.fileIds.length === 0}
                className="flex-1"
              >
                {creating ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  'Criar Index'
                )}
              </Button>
              <Button
                onClick={() => setShowCreateForm(false)}
                variant="outline"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {indexes.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-800">Indexes Criados Recentemente</h4>
          {indexes.map((index) => (
            <div key={index.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Database className="w-5 h-5 text-primary-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {index.name}
                </p>
                <p className="text-xs text-gray-500">
                  {index.fileIds.length} arquivo(s) • {new Date(index.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {index.status === 'ready' && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
                {index.status === 'creating' && (
                  <Loader className="w-5 h-5 animate-spin text-primary-500" />
                )}
                {index.status === 'failed' && (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
                <span className={`text-xs px-2 py-1 rounded-full ${
                  index.status === 'ready' ? 'bg-green-100 text-green-800' :
                  index.status === 'creating' ? 'bg-primary-100 text-primary-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {index.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}; 