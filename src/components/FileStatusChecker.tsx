import React, { useState } from 'react';
import { llamaindexService } from '../services/llamaindex';

interface FileStatusCheckerProps {
  fileId?: string;
}

const FileStatusChecker: React.FC<FileStatusCheckerProps> = ({ fileId }) => {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputFileId, setInputFileId] = useState(fileId || '');

  const checkFileStatus = async () => {
    if (!inputFileId) {
      setError('Por favor, insira um File ID');
      return;
    }

    setLoading(true);
    setError(null);
    setStatus(null);

    try {
      const result = await llamaindexService.getFileStatus(inputFileId);
      setStatus(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const checkFileInDataSources = async () => {
    if (!inputFileId) {
      setError('Por favor, insira um File ID');
      return;
    }

    setLoading(true);
    setError(null);
    setStatus(null);

    try {
      const result = await llamaindexService.checkFileInDataSources(inputFileId);
      setStatus(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const waitForProcessing = async () => {
    if (!inputFileId) {
      setError('Por favor, insira um File ID');
      return;
    }

    setLoading(true);
    setError(null);
    setStatus(null);

    try {
      const result = await llamaindexService.waitForFileProcessing(inputFileId);
      setStatus(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const checkCompleteStatus = async () => {
    if (!inputFileId) {
      setError('Por favor, insira um File ID');
      return;
    }

    setLoading(true);
    setError(null);
    setStatus(null);

    try {
      const result = await llamaindexService.getFileCompleteStatus(inputFileId);
      setStatus(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Verificador de Status de Arquivos</h3>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          File ID:
        </label>
        <input
          type="text"
          value={inputFileId}
          onChange={(e) => setInputFileId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Insira o File ID"
        />
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={checkFileStatus}
          disabled={loading}
          className="px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600 disabled:opacity-50"
        >
          {loading ? 'Verificando...' : 'Verificar Status'}
        </button>
        
        <button
          onClick={checkFileInDataSources}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? 'Verificando...' : 'Verificar Data Sources'}
        </button>
        
        <button
          onClick={waitForProcessing}
          disabled={loading}
          className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
        >
          {loading ? 'Aguardando...' : 'Aguardar Processamento'}
        </button>

        <button
          onClick={checkCompleteStatus}
          disabled={loading}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
        >
          {loading ? 'Verificando...' : 'Status Completo'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {status && (
        <div className="bg-gray-50 p-4 rounded">
          <h4 className="font-semibold mb-2">Resultado:</h4>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(status, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default FileStatusChecker; 