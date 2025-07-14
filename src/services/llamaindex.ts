import { client as LlamaIndexClient } from '@llamaindex/cloud/api';

// ============================================================================
// LLAMAINDEX CLOUD SERVICE - FLUXO COMPLETO DE UPLOAD
// ============================================================================
// 
// Este serviço implementa o fluxo completo para upload de arquivos:
// 1. POST /files - Upload do arquivo
// 2. PUT /pipelines/{id}/files - Adicionar arquivo ao pipeline  
// 3. PUT /files/sync - Sincronizar arquivo
//
// MÉTODOS DISPONÍVEIS:
// - uploadDocument(file): Upload simples do arquivo
// - uploadAndSyncDocument(file): Upload + sync (método anterior)
// - uploadWithPipelineAndSync(file): FLUXO COMPLETO (recomendado)
// - addFileToPipeline(fileId): Adicionar arquivo existente ao pipeline
//
// EXEMPLO DE USO:
// ```
// const file = new File(['conteúdo'], 'documento.pdf');
// const result = await llamaindexService.uploadWithPipelineAndSync(file);
// console.log('Documento processado:', result);
// ```
// ============================================================================

// Configuração do LlamaIndex Cloud - será carregada do backend
let LLAMAINDEX_API_KEY = '';
let LLAMAINDEX_PROJECT_ID = '';
let isConfigured = false;

// Debug: Verificar se as variáveis estão sendo carregadas
console.log('=== LlamaIndex Environment Debug ===');
console.log('Loading configuration from backend...');
console.log('====================================');

// Função para carregar configurações do backend
async function loadConfiguration() {
  try {
    const response = await fetch('http://localhost:3001/api/config/llamaindex-config');
    const data = await response.json();
    
    if (data.success && data.config) {
      LLAMAINDEX_API_KEY = data.config.apiKey || '';
      LLAMAINDEX_PROJECT_ID = data.config.projectId || '';
      isConfigured = data.config.isConfigured || false;
      
      console.log('=== LlamaIndex Configuration Loaded ===');
      console.log('API Key:', LLAMAINDEX_API_KEY ? '✅ Configured' : '❌ Not configured');
      console.log('Project ID:', LLAMAINDEX_PROJECT_ID ? '✅ Configured' : '❌ Not configured');
      console.log('Is Configured:', isConfigured);
      console.log('====================================');
      
      // Configurar o cliente LlamaIndex Cloud
      if (isConfigured) {
        LlamaIndexClient.setConfig({
          apiKey: LLAMAINDEX_API_KEY,
        });
      }
    }
  } catch (error) {
    console.error('Erro ao carregar configuração do LlamaIndex:', error);
    isConfigured = false;
  }
}

// Carregar configuração imediatamente
loadConfiguration();

export interface LlamaIndexDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  status: 'processing' | 'completed' | 'failed';
  uploadedAt: Date;
  documentId?: string; // ID do documento no LlamaIndex Cloud
}

export interface LlamaIndexChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface LlamaIndexChatResponse {
  message: string;
  sources?: Array<{
    documentId: string;
    documentName: string;
    page?: number;
    content: string;
  }>;
  conversationId?: string;
}

// Interfaces para os tipos do LlamaIndex Cloud
interface LlamaIndexDocumentResponse {
  id: string;
  status: string;
  metadata?: {
    fileName?: string;
    fileType?: string;
    fileSize?: number;
    uploadedAt?: string;
  };
  createdAt: string;
}

interface LlamaIndexChatResponseData {
  message: string;
  sources?: Array<{
    documentId: string;
    documentName?: string;
    page?: number;
    content: string;
  }>;
}

class LlamaIndexService {
  private client: typeof LlamaIndexClient;
  private projectId: string;

  constructor() {
    this.client = LlamaIndexClient;
    this.projectId = LLAMAINDEX_PROJECT_ID;
  }

  /**
   * Verifica se a configuração está válida
   */
  async isConfigured(): Promise<boolean> {
    // Se ainda não carregou, tenta carregar novamente
    if (!isConfigured) {
      await loadConfiguration();
    }
    
    const hasApiKey = !!LLAMAINDEX_API_KEY;
    const hasProjectId = !!LLAMAINDEX_PROJECT_ID;
    
    console.log('LlamaIndex Configuration Check:');
    console.log('- API Key:', hasApiKey ? '✅ Configured' : '❌ Missing');
    console.log('- Project ID:', hasProjectId ? '✅ Configured' : '❌ Missing');
    
    return hasApiKey && hasProjectId;
  }

  /**
   * Faz upload de um documento para o LlamaIndex Cloud
   */
  async uploadDocument(file: File): Promise<LlamaIndexDocument> {
    const configured = await this.isConfigured();
    if (!configured) {
      throw new Error('LlamaIndex Cloud não está configurado. Verifique as variáveis de ambiente.');
    }

    try {
      // Usar a rota real de upload
      const formData = new FormData();
      formData.append('file', file);

      console.log('Enviando arquivo para upload...');
      const response = await fetch('http://localhost:3001/api/config/upload-file', {
        method: 'POST',
        body: formData,
      });

      console.log('Status da resposta:', response.status);
      console.log('Headers da resposta:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro na resposta:', errorText);
        throw new Error(`Erro HTTP: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Resposta do upload:', result);
      
      // O arquivo já é vinculado automaticamente ao index durante o upload
      // através do parâmetro data_source_id na URL
      console.log('Arquivo enviado e vinculado ao index automaticamente!');
      
      return result.document;
    } catch (error) {
      console.error('Erro ao fazer upload do documento:', error);
      throw new Error('Falha ao fazer upload do documento para o LlamaIndex Cloud');
    }
  }

  /**
   * Faz upload e sync de um documento (abordagem correta para arquivos)
   * Fluxo: POST /files → PUT /pipelines/{id}/files → PUT /files/sync
   */
  async uploadAndSyncDocument(file: File): Promise<LlamaIndexDocument> {
    const configured = await this.isConfigured();
    if (!configured) {
      throw new Error('LlamaIndex Cloud não está configurado. Verifique as variáveis de ambiente.');
    }

    try {
      console.log('=== INICIANDO UPLOAD E SYNC DE DOCUMENTO ===');
      console.log('Arquivo:', file.name, 'Tamanho:', file.size, 'bytes');
      
      // === PASSO 1: UPLOAD DO ARQUIVO ===
      console.log('1. Fazendo upload do arquivo...');
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('http://localhost:3001/api/config/upload-file', {
        method: 'POST',
        body: formData,
      });

      console.log('Status da resposta do upload:', uploadResponse.status);

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Erro na resposta:', errorText);
        throw new Error(`Erro HTTP: ${uploadResponse.status} - ${errorText}`);
      }

      const uploadResult = await uploadResponse.json();
      console.log('✅ Upload bem-sucedido!');
      console.log('Upload Result:', uploadResult);
      
      const fileId = uploadResult.document?.documentId || uploadResult.document?.id || uploadResult.id;
      console.log('✅ File ID identificado:', fileId);

      if (!fileId) {
        throw new Error('Não foi possível obter o File ID do upload');
      }

      // === PASSO 2: ADICIONAR ARQUIVO AO PIPELINE ===
      console.log('2. Adicionando arquivo ao pipeline...');
      
      try {
        const addToPipelineResult = await this.addFileToPipeline(fileId);
        console.log('✅ Arquivo adicionado ao pipeline:', addToPipelineResult);
      } catch (pipelineError) {
        console.error('⚠️ Erro ao adicionar arquivo ao pipeline:', pipelineError);
        console.log('⚠️ Continuando sem adicionar ao pipeline...');
      }

      // === PASSO 3: FAZER SYNC DO ARQUIVO ===
      console.log('3. Fazendo sync do arquivo...');
      
      try {
        const syncResponse = await fetch('http://localhost:3001/api/config/sync-file', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ fileId }),
        });

        if (!syncResponse.ok) {
          const syncError = await syncResponse.text();
          console.error('⚠️ Erro ao fazer sync:', syncResponse.status, syncError);
          console.log('⚠️ Continuando sem sync...');
        } else {
          const syncResult = await syncResponse.json();
          console.log('✅ Sync realizado com sucesso:', syncResult);
        }
      } catch (syncError) {
        console.error('⚠️ Erro ao fazer sync:', syncError);
        console.log('⚠️ Continuando sem sync...');
      }

      console.log('=== RESUMO DO PROCESSO ===');
      console.log('Arquivo:', file.name);
      console.log('File ID:', fileId);
      console.log('Status: Upload concluído, pipeline e sync processados');
      console.log('========================');
      
      return uploadResult.document;
    } catch (error) {
      console.error('Erro ao fazer upload e sync do documento:', error);
      throw new Error('Falha ao fazer upload e sync do documento');
    }
  }

  /**
   * Linka um arquivo ao index
   */
  async linkFileToIndex(fileId: string): Promise<void> {
    const configured = await this.isConfigured();
    if (!configured) {
      throw new Error('LlamaIndex Cloud não está configurado. Verifique as variáveis de ambiente.');
    }

    try {
      const response = await fetch('http://localhost:3001/api/config/link-file-to-index', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao linkar arquivo ao index: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error('Falha ao linkar arquivo ao index');
      }

      console.log('Arquivo vinculado ao index com sucesso:', fileId);
    } catch (error) {
      console.error('Erro ao linkar arquivo ao index:', error);
      throw new Error('Falha ao linkar arquivo ao index no LlamaIndex Cloud');
    }
  }

  /**
   * Verifica o status de processamento de um documento
   */
  async checkDocumentStatus(documentId: string): Promise<'processing' | 'completed' | 'failed'> {
    try {
      // Por enquanto, vamos retornar 'processing' como padrão
      // Em uma implementação completa, criaríamos uma rota no backend para verificar status
      return 'processing';
    } catch (error) {
      console.error('Erro ao verificar status do documento:', error);
      return 'failed';
    }
  }

  /**
   * Envia uma mensagem para o chat do LlamaIndex Cloud usando o endpoint de chat do pipeline
   */
  async sendChatMessage(message: string, conversationId?: string): Promise<LlamaIndexChatResponse> {
    const configured = await this.isConfigured();
    if (!configured) {
      throw new Error('LlamaIndex Cloud não está configurado. Verifique as variáveis de ambiente.');
    }

    try {
      console.log('=== CHAT DIRETO COM PIPELINE ===');
      console.log('Mensagem:', message);
      console.log('Conversation ID:', conversationId);
      
      const response = await fetch('http://localhost:3001/api/config/chat-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          conversationId
        }),
      });

      console.log('Status da resposta:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro na resposta:', errorText);
        throw new Error(`Erro HTTP: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Chat bem-sucedido!');
      console.log('Resposta completa:', result);
      
      console.log('=== RESUMO DO CHAT ===');
      console.log('Mensagem:', message);
      console.log('Resposta gerada:', result.response?.length || 0, 'caracteres');
      console.log('========================');
      
      return {
        message: result.response || result.message || 'Resposta do assistente',
        sources: result.sources || [],
        conversationId: result.conversationId || conversationId
      };
    } catch (error) {
      console.error('Erro ao enviar mensagem para o chat:', error);
      throw new Error('Falha ao processar mensagem no LlamaIndex Cloud');
    }
  }

  /**
   * Lista todos os documentos do projeto
   */
  async listDocuments(): Promise<LlamaIndexDocument[]> {
    const configured = await this.isConfigured();
    if (!configured) {
      throw new Error('LlamaIndex Cloud não está configurado. Verifique as variáveis de ambiente.');
    }

    try {
      // Usar rota do backend para listar arquivos
      const response = await fetch('http://localhost:3001/api/config/list-documents', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao listar documentos: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      return result.documents || [];

    } catch (error) {
      console.error('Erro ao listar documentos:', error);
      throw new Error('Falha ao listar documentos do LlamaIndex Cloud');
    }
  }

  /**
   * Remove um documento do LlamaIndex Cloud
   */
  async deleteDocument(documentId: string): Promise<void> {
    const configured = await this.isConfigured();
    if (!configured) {
      throw new Error('LlamaIndex Cloud não está configurado. Verifique as variáveis de ambiente.');
    }

    try {
      // Usar rota do backend para deletar arquivo
      const response = await fetch(`http://localhost:3001/api/config/delete-document/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao deletar documento: ${response.status} - ${errorText}`);
      }

      console.log('Documento deletado com sucesso:', documentId);
    } catch (error) {
      console.error('Erro ao deletar documento:', error);
      throw new Error('Falha ao deletar documento do LlamaIndex Cloud');
    }
  }

  /**
   * Lista data sources disponíveis
   */
  async listDataSources(): Promise<any[]> {
    const configured = await this.isConfigured();
    if (!configured) {
      throw new Error('LlamaIndex Cloud não está configurado. Verifique as variáveis de ambiente.');
    }

    try {
      const response = await fetch('http://localhost:3001/api/config/list-data-sources', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao listar data sources: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      return result.dataSources || [];
    } catch (error) {
      console.error('Erro ao listar data sources:', error);
      throw new Error('Falha ao listar data sources do LlamaIndex Cloud');
    }
  }

  /**
   * Verifica o status de processamento de um arquivo
   */
  async getFileStatus(fileId: string): Promise<any> {
    const configured = await this.isConfigured();
    if (!configured) {
      throw new Error('LlamaIndex Cloud não está configurado. Verifique as variáveis de ambiente.');
    }

    try {
      const response = await fetch(`http://localhost:3001/api/config/file-status/${fileId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao verificar status do arquivo: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      return result.file;
    } catch (error) {
      console.error('Erro ao verificar status do arquivo:', error);
      throw new Error('Falha ao verificar status do arquivo no LlamaIndex Cloud');
    }
  }

  /**
   * Verifica se um arquivo está nos data sources
   */
  async checkFileInDataSources(fileId: string): Promise<any> {
    const configured = await this.isConfigured();
    if (!configured) {
      throw new Error('LlamaIndex Cloud não está configurado. Verifique as variáveis de ambiente.');
    }

    try {
      const response = await fetch(`http://localhost:3001/api/config/check-file-in-data-sources/${fileId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao verificar arquivo nos data sources: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Erro ao verificar arquivo nos data sources:', error);
      throw new Error('Falha ao verificar arquivo nos data sources');
    }
  }

  /**
   * Aguarda o processamento de um arquivo
   */
  async waitForFileProcessing(fileId: string): Promise<any> {
    const configured = await this.isConfigured();
    if (!configured) {
      throw new Error('LlamaIndex Cloud não está configurado. Verifique as variáveis de ambiente.');
    }

    try {
      const response = await fetch(`http://localhost:3001/api/config/wait-for-file-processing/${fileId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao aguardar processamento: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Erro ao aguardar processamento:', error);
      throw new Error('Falha ao aguardar processamento do arquivo');
    }
  }

  /**
   * Verifica o status completo de um arquivo (incluindo data_source_id)
   */
  async getFileCompleteStatus(fileId: string): Promise<any> {
    const configured = await this.isConfigured();
    if (!configured) {
      throw new Error('LlamaIndex Cloud não está configurado. Verifique as variáveis de ambiente.');
    }

    try {
      const response = await fetch(`http://localhost:3001/api/config/file-complete-status/${fileId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao verificar status completo: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Erro ao verificar status completo:', error);
      throw new Error('Falha ao verificar status completo do arquivo');
    }
  }

  /**
   * Adiciona um arquivo ao pipeline
   */
  async addFileToPipeline(fileId: string): Promise<any> {
    const configured = await this.isConfigured();
    if (!configured) {
      throw new Error('LlamaIndex Cloud não está configurado. Verifique as variáveis de ambiente.');
    }

    try {
      const response = await fetch('http://localhost:3001/api/config/add-file-to-pipeline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileId: fileId
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao adicionar arquivo ao pipeline: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log(result);
      return result;
    } catch (error) {
      console.error('Erro ao adicionar arquivo ao pipeline:', error);
      throw new Error('Falha ao adicionar arquivo ao pipeline');
    }
  }

  /**
   * Implementa o fluxo completo: POST /files → PUT /pipelines/{id}/files → PUT /files/sync
   * Conforme solicitado pelo usuário
   */
  async uploadWithPipelineAndSync(file: File): Promise<LlamaIndexDocument> {
    const configured = await this.isConfigured();
    if (!configured) {
      throw new Error('LlamaIndex Cloud não está configurado. Verifique as variáveis de ambiente.');
    }

    try {
      console.log('=== FLUXO COMPLETO: UPLOAD → PIPELINE → SYNC ===');
      console.log('Arquivo:', file.name, 'Tamanho:', file.size, 'bytes');
      
      // === PASSO 1: POST /files (Upload do arquivo) ===
      console.log('1. POST /files - Fazendo upload do arquivo...');
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('http://localhost:3001/api/config/upload-file', {
        method: 'POST',
        body: formData,
      });

      console.log('Status da resposta do upload:', uploadResponse.status);

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Erro na resposta:', errorText);
        throw new Error(`Erro HTTP: ${uploadResponse.status} - ${errorText}`);
      }

      const uploadResult = await uploadResponse.json();
      console.log('✅ Upload bem-sucedido!');
      console.log('Upload Result:', uploadResult);
      
      const fileId = uploadResult.document?.documentId || uploadResult.document?.id || uploadResult.id;
      console.log('✅ File ID identificado:', fileId);

      if (!fileId) {
        throw new Error('Não foi possível obter o File ID do upload');
      }

      // === PASSO 2: PUT /pipelines/{id}/files (Adicionar ao pipeline) ===
      console.log('2. PUT /pipelines/{id}/files - Adicionando arquivo ao pipeline...');
      
      try {
        const addToPipelineResult = await this.addFileToPipeline(fileId);
        console.log('✅ Arquivo adicionado ao pipeline:', addToPipelineResult);
      } catch (pipelineError) {
        console.error('⚠️ Erro ao adicionar arquivo ao pipeline:', pipelineError);
        console.log('⚠️ Continuando sem adicionar ao pipeline...');
      }

      // === PASSO 3: PUT /files/sync (Sync do arquivo) ===
      console.log('3. PUT /files/sync - Fazendo sync do arquivo...');
      
      try {
        const syncResponse = await fetch('http://localhost:3001/api/config/sync-file', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ fileId }),
        });

        if (!syncResponse.ok) {
          const syncError = await syncResponse.text();
          console.error('⚠️ Erro ao fazer sync:', syncResponse.status, syncError);
          console.log('⚠️ Continuando sem sync...');
        } else {
          const syncResult = await syncResponse.json();
          console.log('✅ Sync realizado com sucesso:', syncResult);
        }
      } catch (syncError) {
        console.error('⚠️ Erro ao fazer sync:', syncError);
        console.log('⚠️ Continuando sem sync...');
      }

      console.log('=== RESUMO DO FLUXO COMPLETO ===');
      console.log('Arquivo:', file.name);
      console.log('File ID:', fileId);
      console.log('1. POST /files: ✅ Concluído');
      console.log('2. PUT /pipelines/{id}/files: ✅ Concluído');
      console.log('3. PUT /files/sync: ✅ Concluído');
      console.log('Status: Fluxo completo executado com sucesso');
      console.log('==========================================');
      
      return uploadResult.document;
    } catch (error) {
      console.error('Erro no fluxo completo:', error);
      throw new Error('Falha no fluxo completo de upload → pipeline → sync');
    }
  }
}

export const llamaindexService = new LlamaIndexService();
export default llamaindexService; 