import React, { useCallback, useState } from 'react';
import { Upload, File, CheckCircle, AlertCircle, Brain, Info } from 'lucide-react';
import { Button } from './ui/Button';
import { useChat } from '../context/ChatContext';

export const FileUploader: React.FC = () => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const { uploadFile, uploadedFiles, llamaindexDocuments, isLlamaIndexConfigured, deleteLlamaIndexDocument } = useChat();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleFiles = (files: FileList) => {
    setSelectedFiles(Array.from(files));
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (window.confirm('Tem certeza que deseja deletar este documento?')) {
      await deleteLlamaIndexDocument(documentId);
    }
  };

  const handleUpload = async () => {
    setUploading(true);
    for (const file of selectedFiles) {
      await uploadFile(file);
    }
    setUploading(false);
    setSelectedFiles([]);
  };

  return (
    <div className="space-y-6">
      <div className={`p-4 rounded-lg border ${
        isLlamaIndexConfigured 
          ? 'bg-green-50 border-green-200' 
          : 'bg-yellow-50 border-yellow-200'
      }`}>
        <div className="flex items-center space-x-2">
          <Brain className={`w-5 h-5 ${
            isLlamaIndexConfigured ? 'text-green-600' : 'text-yellow-600'
          }`} />
          <div>
            <h3 className={`font-medium ${
              isLlamaIndexConfigured ? 'text-green-800' : 'text-yellow-800'
            }`}>
              LlamaIndex Cloud
            </h3>
            <p className={`text-sm ${
              isLlamaIndexConfigured ? 'text-green-600' : 'text-yellow-600'
            }`}>
              {isLlamaIndexConfigured 
                ? 'Conectado e funcionando. Os documentos serão processados pela IA.'
                : 'Não configurado. Configure as variáveis de ambiente para usar IA avançada.'
              }
            </p>
          </div>
        </div>
      </div>

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-800 mb-2">
          Upload de Documentos ou Arquivos de Áudio
        </h3>
        <p className="text-gray-600 mb-4">
          {isLlamaIndexConfigured 
            ? 'Arraste e solte arquivos aqui para enviá-los para o LlamaIndex Cloud para processamento por IA'
            : 'Arraste e solte arquivos aqui, ou clique para selecionar arquivos'
          }
        </p>
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept="*/*"
          multiple
          onChange={handleFileInput}
        />
        <Button
          variant="outline"
          onClick={() => document.getElementById('file-upload')?.click()}
        >
          Selecionar Arquivos
        </Button>
        {selectedFiles.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Arquivos para enviar:</h4>
            <ul className="mb-2">
              {selectedFiles.map((file, idx) => (
                <li key={idx} className="text-xs text-gray-800">
                  {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </li>
              ))}
            </ul>
            <Button
              onClick={handleUpload}
              disabled={uploading}
              className="mt-2"
            >
              {uploading ? 'Enviando...' : 'Enviar'}
            </Button>
          </div>
        )}
        <p className="text-sm text-gray-500 mt-2">
          Formatos suportados: PDF, DOC, DOCX, MP3, WAV, M4A
        </p>
      </div>

      {isLlamaIndexConfigured && llamaindexDocuments.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-primary-600" />
            <h4 className="font-medium text-gray-800">Documentos no LlamaIndex Cloud</h4>
          </div>
          <div className="space-y-2">
            {llamaindexDocuments.map((doc) => (
              <div key={doc.id} className="flex items-center space-x-3 p-3 bg-primary-50 rounded-lg">
                <File className="w-5 h-5 text-primary-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {doc.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(doc.size / 1024 / 1024).toFixed(2)} MB • {new Date(doc.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {doc.status === 'completed' && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  {doc.status === 'processing' && (
                    <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                  )}
                  {doc.status === 'failed' && (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                  <button
                    onClick={() => doc.documentId && handleDeleteDocument(doc.documentId)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Deletar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <File className="w-5 h-5 text-gray-600" />
            <h4 className="font-medium text-gray-800">Arquivos Enviados Recentemente</h4>
          </div>
          <div className="space-y-2">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <File className="w-5 h-5 text-gray-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB • {new Date(file.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  {file.status === 'completed' && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  {file.status === 'processing' && (
                    <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                  )}
                  {file.status === 'failed' && (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isLlamaIndexConfigured && (
        <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <Info className="w-5 h-5 text-primary-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-primary-800 mb-1">Configure LlamaIndex Cloud</h4>
              <p className="text-sm text-primary-600 mb-2">
                Para usar IA avançada com processamento de documentos, configure as seguintes variáveis de ambiente:
              </p>
              <div className="text-xs font-mono bg-primary-100 p-2 rounded">
                VITE_LLAMAINDEX_API_KEY=your_api_key<br />
                VITE_LLAMAINDEX_PROJECT_ID=your_project_id
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};