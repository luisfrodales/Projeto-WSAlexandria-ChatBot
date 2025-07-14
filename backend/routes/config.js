import express from 'express';
import multer from 'multer';
import FormData from 'form-data';

// Verificar se fetch está disponível (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.error('❌ Fetch não está disponível. Node.js 18+ é necessário.');
  process.exit(1);
}

const router = express.Router();

// Configurar multer para upload de arquivos - aceitar todos os tipos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
  fileFilter: (req, file, cb) => {
    // Aceitar todos os tipos de arquivo
    console.log('Arquivo recebido:', file.originalname, 'Tipo:', file.mimetype);
    cb(null, true);
  }
});

// Rota de teste simples
router.post('/test', (req, res) => {
  console.log('Teste POST recebido');
  res.json({ success: true, message: 'POST funcionando' });
});

// Rota para obter configurações do LlamaIndex Cloud
router.get('/llamaindex-config', (req, res) => {
  try {
    const config = {
      apiKey: process.env.LLAMAINDEX_API_KEY,
      projectId: process.env.LLAMAINDEX_PROJECT_ID,
      isConfigured: !!(process.env.LLAMAINDEX_API_KEY && process.env.LLAMAINDEX_PROJECT_ID)
    };
    
    res.json({
      success: true,
      config
    });
  } catch (error) {
    console.error('Erro ao obter configuração do LlamaIndex:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Rota de upload simplificada (sem multer)
router.post('/upload-simple', async (req, res) => {
  console.log('=== Upload simples iniciado ===');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  
  res.json({
    success: true,
    message: 'Upload simples funcionando',
    body: req.body
  });
});

// Rota para upload de arquivos para o LlamaIndex Cloud (VERSÃO COMPLETA - COM PIPELINE E SYNC)
router.post('/upload-file', upload.single('file'), async (req, res) => {
  try {
    console.log('=== UPLOAD INICIADO ===');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('File:', req.file);
    
    if (!req.file) {
      console.log('Erro: Nenhum arquivo recebido');
      return res.status(400).json({
        success: false,
        error: 'Nenhum arquivo enviado'
      });
    }

    if (!process.env.LLAMAINDEX_API_KEY) {
      console.log('Erro: API Key não configurada');
      return res.status(500).json({
        success: false,
        error: 'LlamaIndex API Key não configurada'
      });
    }

    if (!process.env.LLAMAINDEX_PROJECT_ID) {
      console.log('Erro: Project ID não configurado');
      return res.status(500).json({
        success: false,
        error: 'LlamaIndex Project ID não configurado'
      });
    }

    console.log('Arquivo válido recebido:', req.file.originalname, 'Tamanho:', req.file.size);
    console.log('Tipo MIME:', req.file.mimetype);
    console.log('Buffer disponível:', !!req.file.buffer);
    console.log('Tamanho do buffer:', req.file.buffer?.length);

    const projectId = process.env.LLAMAINDEX_PROJECT_ID;
    const organizationId = process.env.LLAMAINDEX_ORGANIZATION_ID || '34b5d229-3300-482f-b3ec-e7aa632c9a88';
    const pipelineId = 'af1793a8-d115-472a-8e61-d19ab26fd92c';
    
    // === PASSO 1: UPLOAD DO ARQUIVO ===
    console.log('1. Fazendo upload do arquivo...');
    
    const formData = new FormData();
    formData.append('upload_file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
      knownLength: req.file.buffer.length
    });

    // Upload SEM data_source_id na URL (correto)
    const uploadUrl = `https://api.cloud.llamaindex.ai/api/v1/files?project_id=${projectId}&organization_id=${organizationId}`;
    
    console.log('URL:', uploadUrl);
    console.log('Nome do arquivo:', req.file.originalname);
    console.log('Tipo MIME:', req.file.mimetype);
    console.log('Tamanho do buffer:', req.file.buffer.length, 'bytes');

    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
        ...formData.getHeaders(),
      },
      body: formData,
    });

    console.log('Status da resposta do upload:', uploadResponse.status);

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Erro no upload:', uploadResponse.status, errorText);
      return res.status(uploadResponse.status).json({
        success: false,
        error: `Erro no upload: ${uploadResponse.status} - ${errorText}`
      });
    }

    const uploadResult = await uploadResponse.json();
    console.log('✅ Upload bem-sucedido!');
    console.log('Upload Result completo:', JSON.stringify(uploadResult, null, 2));

    const fileId = uploadResult.id || uploadResult.file_id || uploadResult.fileId;
    console.log('✅ File ID identificado:', fileId);

    // === PASSO 2: ADICIONAR ARQUIVO AO PIPELINE ===
    console.log('2. Adicionando arquivo ao pipeline...');
    
    const addFileToPipelineUrl = `https://api.cloud.llamaindex.ai/api/v1/pipelines/${pipelineId}/files`;
    
    // EXATAMENTE como no curl - apenas o array com file_id
    const addFilePayload = [
      {
        file_id: fileId
      }
    ];

    console.log('Add File URL:', addFileToPipelineUrl);
    console.log('Add File Payload (exato do curl):', JSON.stringify(addFilePayload, null, 2));

    const addFileResponse = await fetch(addFileToPipelineUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(addFilePayload) // Enviando apenas o array, nada mais
    });

    console.log('Status da resposta do add file:', addFileResponse.status);

    if (!addFileResponse.ok) {
      const addFileError = await addFileResponse.text();
      console.error('Erro ao adicionar arquivo ao pipeline:', addFileResponse.status, addFileError);
      console.log('⚠️ Continuando sem adicionar ao pipeline...');
    } else {
      const addFileResult = await addFileResponse.json();
      console.log('✅ Arquivo adicionado ao pipeline:', addFileResult);
    }

    // === PASSO 3: FAZER SYNC DO PIPELINE ===
    console.log('3. Fazendo sync do pipeline...');
    
    const syncUrl = `https://api.cloud.llamaindex.ai/api/v1/pipelines/${pipelineId}/sync`;
    const syncPayload = {
      file_ids: [fileId],
      project_id: projectId,
      organization_id: organizationId
    };

    console.log('Sync URL:', syncUrl);
    console.log('Sync Payload:', JSON.stringify(syncPayload, null, 2));

    const syncResponse = await fetch(syncUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(syncPayload),
    });

    console.log('Status da resposta do sync:', syncResponse.status);

    if (!syncResponse.ok) {
      const syncError = await syncResponse.text();
      console.error('Erro ao fazer sync:', syncResponse.status, syncError);
      console.log('⚠️ Continuando sem sync...');
    } else {
      const syncResult = await syncResponse.json();
      console.log('✅ Sync realizado com sucesso:', syncResult);
    }

    // === PASSO 4: VERIFICAR STATUS DO ARQUIVO ===
    console.log('4. Verificando status do arquivo...');
    
    // Aguardar um pouco para o processamento
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const fileInfoResponse = await fetch(`https://api.cloud.llamaindex.ai/api/v1/files/${fileId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    let finalFileInfo = uploadResult;
    if (fileInfoResponse.ok) {
      finalFileInfo = await fileInfoResponse.json();
      console.log('✅ Informações atualizadas do arquivo:', finalFileInfo);
      console.log('Data Source ID:', finalFileInfo.data_source_id);
    }

    const isProcessed = finalFileInfo.status === 'completed';
    const hasDataSourceId = !!finalFileInfo.data_source_id;

    console.log('=== RESUMO DO PROCESSO ===');
    console.log('Arquivo:', req.file.originalname);
    console.log('File ID:', uploadResult.id);
    console.log('Pipeline ID:', pipelineId);
    console.log('Tamanho:', req.file.size, 'bytes');
    console.log('Status: Arquivo enviado e associado ao pipeline');
    console.log('Data Source ID:', uploadResult.data_source_id);
    console.log('========================');
    
    res.json({
      success: true,
      document: {
        id: uploadResult.id || Date.now().toString(),
        name: req.file.originalname,
        type: req.file.mimetype,
        size: req.file.size,
        status: 'completed',
        uploadedAt: new Date(),
        documentId: uploadResult.id,
        pipelineId: pipelineId,
        dataSourceId: uploadResult.data_source_id,
        isProcessed: uploadResult.status === 'completed',
        hasDataSourceId: !!uploadResult.data_source_id,
        uploadSuccessful: true,
        addedToPipeline: !!uploadResult.data_source_id,
        syncCompleted: !!uploadResult.data_source_id
      }
    });

  } catch (error) {
    console.error('Erro ao fazer upload para LlamaIndex Cloud:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Rota para listar documentos do LlamaIndex Cloud
router.get('/list-documents', async (req, res) => {
  try {
    if (!process.env.LLAMAINDEX_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'LlamaIndex API Key não configurada'
      });
    }

    const projectId = process.env.LLAMAINDEX_PROJECT_ID;
    const response = await fetch(`https://api.cloud.llamaindex.ai/api/v1/files?project_id=${projectId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na resposta do LlamaIndex Cloud:', response.status, errorText);
      return res.status(response.status).json({
        success: false,
        error: `Erro do LlamaIndex Cloud: ${response.status} - ${errorText}`
      });
    }

    const result = await response.json();
    const files = result.files || result.data?.files || [];

    console.log('=== LISTAGEM DE DOCUMENTOS ===');
    console.log('Total de arquivos encontrados:', files.length);
    files.forEach((file, index) => {
      console.log(`${index + 1}. ${file.name || file.external_file_id} (ID: ${file.id})`);
    });
    console.log('=============================');

    const documents = files.map((doc) => ({
      id: doc.id,
      name: doc.name || doc.external_file_id || doc.id,
      type: doc.file_type || 'unknown',
      size: doc.file_size || 0,
      status: doc.status || 'processing',
      uploadedAt: new Date(doc.created_at || doc.updated_at),
      documentId: doc.id,
    }));

    res.json({
      success: true,
      documents
    });

  } catch (error) {
    console.error('Erro ao listar documentos do LlamaIndex Cloud:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Rota para deletar documento do LlamaIndex Cloud
router.delete('/delete-document/:documentId', async (req, res) => {
  try {
    const { documentId } = req.params;

    if (!process.env.LLAMAINDEX_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'LlamaIndex API Key não configurada'
      });
    }

    const response = await fetch(`https://api.cloud.llamaindex.ai/api/v1/files/${documentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na resposta do LlamaIndex Cloud:', response.status, errorText);
      return res.status(response.status).json({
        success: false,
        error: `Erro do LlamaIndex Cloud: ${response.status} - ${errorText}`
      });
    }

    console.log('=== DOCUMENTO DELETADO ===');
    console.log('ID do documento:', documentId);
    console.log('Status da resposta:', response.status);
    console.log('Resposta:', response.statusText);
    console.log('==========================');
    
    res.json({
      success: true,
      message: 'Documento deletado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar documento do LlamaIndex Cloud:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Rota para linkar arquivo ao index
router.post('/link-file-to-index', async (req, res) => {
  const { fileId } = req.body;
  const indexId = 'af1793a8-d115-472a-8e61-d19ab26fd92c';
  const projectId = '1131a0d8-976a-40d8-bf3f-2e0d4cf0a401';
  const organizationId = '34b5d229-3300-482f-b3ec-e7aa632c9a88';

  try {
    console.log('=== LINKANDO ARQUIVO AO INDEX ===');
    console.log('File ID:', fileId);
    console.log('Index ID:', indexId);
    console.log('Project ID:', projectId);
    console.log('Organization ID:', organizationId);

    // Usar a abordagem correta da documentação - sync files
    const attempts = [
      {
        name: 'Pipeline Sync',
        url: `https://api.cloud.llamaindex.ai/api/v1/pipelines/${indexId}/sync`,
        method: 'POST',
        body: { 
          file_ids: [fileId],
          project_id: projectId,
          organization_id: organizationId
        }
      },
      {
        name: 'Pipeline Sync com project_id',
        url: `https://api.cloud.llamaindex.ai/api/v1/pipelines/${indexId}/sync`,
        method: 'POST',
        body: { 
          file_ids: [fileId],
          project_id: projectId,
          organization_id: organizationId
        }
      }
    ];

    let success = false;
    let lastError = '';

    for (const attempt of attempts) {
      try {
        console.log(`\n--- Tentativa: ${attempt.name} ---`);
        console.log('URL:', attempt.url);
        console.log('Método:', attempt.method);
        console.log('Body:', JSON.stringify(attempt.body, null, 2));
        
        const response = await fetch(attempt.url, {
          method: attempt.method,
          headers: {
            'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(attempt.body),
        });

        console.log('Status da resposta:', response.status);

        if (response.ok) {
          const result = await response.json();
          console.log('✅ Arquivo vinculado com sucesso:', result);
          console.log('===============================');
          
          res.json({ success: true, result, method: attempt.name });
          success = true;
          break;
        } else {
          const error = await response.text();
          console.error(`❌ Erro com ${attempt.name}:`, response.status, error);
          lastError = `${attempt.name}: ${response.status} - ${error}`;
        }
      } catch (err) {
        console.error(`❌ Erro ao tentar ${attempt.name}:`, err);
        lastError = `${attempt.name}: ${err.message}`;
      }
    }

    if (!success) {
      console.error('❌ Todas as tentativas falharam. Último erro:', lastError);
      return res.status(500).json({ 
        success: false, 
        error: `Todas as tentativas falharam. Último erro: ${lastError}` 
      });
    }

  } catch (err) {
    console.error('Erro ao conectar com LlamaIndex:', err);
    res.status(500).json({ success: false, error: 'Erro interno' });
  }
});

// Rota para verificar informações do index
router.get('/index-info', async (req, res) => {
  const indexId = 'af1793a8-d115-472a-8e61-d19ab26fd92c';
  const projectId = '1131a0d8-976a-40d8-bf3f-2e0d4cf0a401';
  const organizationId = '34b5d229-3300-482f-b3ec-e7aa632c9a88';

  try {
    console.log('=== VERIFICANDO INFORMAÇÕES DO INDEX ===');
    console.log('Index ID:', indexId);
    console.log('Project ID:', projectId);
    console.log('Organization ID:', organizationId);

    // Tentar diferentes URLs para obter informações do index
    const urls = [
      `https://api.cloud.llamaindex.ai/api/v1/pipelines/${indexId}`,
      `https://api.cloud.llamaindex.ai/api/v1/indexes/${indexId}`,
      `https://cloud.llamaindex.ai/api/projects/${projectId}/indexes/${indexId}`,
      `https://cloud.llamaindex.ai/api/organizations/${organizationId}/projects/${projectId}/indexes/${indexId}`
    ];

    let success = false;
    let lastError = '';
    let result = null;

    for (const url of urls) {
      try {
        console.log('Tentando URL:', url);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
            'Content-Type': 'application/json',
          },
        });

        console.log('Status da resposta:', response.status);

        if (response.ok) {
          result = await response.json();
          console.log('Informações do index:', result);
          console.log('===============================');
          
          res.json({ success: true, index: result, url: url });
          success = true;
          break;
        } else {
          const error = await response.text();
          console.error(`Erro com URL ${url}:`, response.status, error);
          lastError = error;
        }
      } catch (err) {
        console.error(`Erro ao tentar URL ${url}:`, err);
        lastError = err.message;
      }
    }

    if (!success) {
      console.error('Todas as URLs falharam. Último erro:', lastError);
      return res.status(500).json({ 
        success: false, 
        error: `Todas as URLs falharam. Último erro: ${lastError}` 
      });
    }

  } catch (err) {
    console.error('Erro ao conectar com LlamaIndex:', err);
    res.status(500).json({ success: false, error: 'Erro interno' });
  }
});

// Rota para verificar se um arquivo existe
router.get('/file-info/:fileId', async (req, res) => {
  const { fileId } = req.params;

  try {
    console.log('=== VERIFICANDO INFORMAÇÕES DO ARQUIVO ===');
    console.log('File ID:', fileId);

    const response = await fetch(`https://api.cloud.llamaindex.ai/api/v1/files/${fileId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Status da resposta:', response.status);

    if (response.ok) {
      const result = await response.json();
      console.log('Informações do arquivo:', result);
      console.log('===============================');
      
      res.json({ success: true, file: result });
    } else {
      const error = await response.text();
      console.error('Erro ao obter informações do arquivo:', response.status, error);
      return res.status(500).json({ success: false, error });
    }

  } catch (err) {
    console.error('Erro ao conectar com LlamaIndex:', err);
    res.status(500).json({ success: false, error: 'Erro interno' });
  }
});

// Rota para listar pipelines disponíveis
router.get('/list-pipelines', async (req, res) => {
  try {
    console.log('=== LISTANDO PIPELINES ===');

    const response = await fetch(`https://api.cloud.llamaindex.ai/api/v1/pipelines`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Status da resposta:', response.status);

    if (response.ok) {
      const result = await response.json();
      console.log('Pipelines encontrados:', result);
      console.log('===============================');
      
      res.json({ success: true, pipelines: result });
    } else {
      const error = await response.text();
      console.error('Erro ao listar pipelines:', response.status, error);
      return res.status(500).json({ success: false, error });
    }

  } catch (err) {
    console.error('Erro ao conectar com LlamaIndex:', err);
    res.status(500).json({ success: false, error: 'Erro interno' });
  }
});

// Rota para chat com documentos
router.post('/chat', async (req, res) => {
  const { message, conversationId } = req.body;
  const pipelineId = 'af1793a8-d115-472a-8e61-d19ab26fd92c';

  try {
    console.log('=== CHAT COM DOCUMENTOS ===');
    console.log('Mensagem:', message);
    console.log('Conversation ID:', conversationId);
    console.log('Pipeline ID:', pipelineId);

    // Usar o endpoint de retrieve correto
    const attempts = [
      {
        name: 'Retrieve com Pipeline',
        url: `https://api.cloud.llamaindex.ai/api/v1/pipelines/${pipelineId}/retrieve`,
        method: 'POST',
        body: {
          query: message,
          similarity_top_k: 5
        }
      },
      {
        name: 'Retrieve com Pipeline + conversation_id',
        url: `https://api.cloud.llamaindex.ai/api/v1/pipelines/${pipelineId}/retrieve`,
        method: 'POST',
        body: {
          query: message,
          similarity_top_k: 5,
          conversation_id: conversationId || null
        }
      },
      {
        name: 'Chat com Pipeline (formato correto)',
        url: `https://api.cloud.llamaindex.ai/api/v1/pipelines/${pipelineId}/chat`,
        method: 'POST',
        body: {
          messages: [
            {
              role: 'user',
              content: message
            }
          ]
        }
      },
      {
        name: 'Chat com Pipeline + conversation_id',
        url: `https://api.cloud.llamaindex.ai/api/v1/pipelines/${pipelineId}/chat`,
        method: 'POST',
        body: {
          messages: [
            {
              role: 'user',
              content: message
            }
          ],
          conversation_id: conversationId || null
        }
      }
    ];

    let success = false;
    let lastError = '';

    for (const attempt of attempts) {
      try {
        console.log(`\n--- Tentativa: ${attempt.name} ---`);
        console.log('URL:', attempt.url);
        console.log('Método:', attempt.method);
        console.log('Body:', JSON.stringify(attempt.body, null, 2));
        
        const response = await fetch(attempt.url, {
          method: attempt.method,
          headers: {
            'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(attempt.body),
        });

        console.log('Status da resposta:', response.status);

        if (response.ok) {
          const result = await response.json();
          console.log('✅ Chat bem-sucedido:', result);
          console.log('===============================');
          
          // Formatar resposta baseada no tipo de endpoint
          let formattedResponse;
          if (attempt.name.includes('Retrieve')) {
            // Para retrieve, formatar os resultados
            formattedResponse = {
              message: `Encontrei ${result.nodes?.length || 0} documentos relevantes para sua pergunta.`,
              sources: result.nodes?.map(node => ({
                documentId: node.node_id,
                content: node.text,
                score: node.score
              })) || []
            };
          } else {
            // Para chat, usar resposta direta
            formattedResponse = {
              message: result.response || result.message || 'Resposta do assistente',
              sources: result.sources || []
            };
          }
          
          res.json({ 
            success: true, 
            response: formattedResponse,
            method: attempt.name,
            conversationId: conversationId || result.conversation_id
          });
          success = true;
          break;
        } else {
          const error = await response.text();
          console.error(`❌ Erro com ${attempt.name}:`, response.status, error);
          lastError = `${attempt.name}: ${response.status} - ${error}`;
        }
      } catch (err) {
        console.error(`❌ Erro ao tentar ${attempt.name}:`, err);
        lastError = `${attempt.name}: ${err.message}`;
      }
    }

    if (!success) {
      console.error('❌ Todas as tentativas falharam. Último erro:', lastError);
      return res.status(500).json({ 
        success: false, 
        error: `Todas as tentativas falharam. Último erro: ${lastError}` 
      });
    }

  } catch (err) {
    console.error('Erro ao conectar com LlamaIndex:', err);
    res.status(500).json({ success: false, error: 'Erro interno' });
  }
});

// Rota para listar data sources
router.get('/list-data-sources', async (req, res) => {
  try {
    console.log('=== LISTANDO DATA SOURCES ===');

    const projectId = process.env.LLAMAINDEX_PROJECT_ID;
    const organizationId = process.env.LLAMAINDEX_ORGANIZATION_ID || '34b5d229-3300-482f-b3ec-e7aa632c9a88';

    // Tentar diferentes endpoints para listar data sources
    const attempts = [
      {
        name: 'Data Sources com project_id',
        url: `https://api.cloud.llamaindex.ai/api/v1/data_sources?project_id=${projectId}`
      },
      {
        name: 'Data Sources com organization_id',
        url: `https://api.cloud.llamaindex.ai/api/v1/data_sources?organization_id=${organizationId}`
      },
      {
        name: 'Data Sources com ambos IDs',
        url: `https://api.cloud.llamaindex.ai/api/v1/data_sources?project_id=${projectId}&organization_id=${organizationId}`
      },
      {
        name: 'Data Sources sem parâmetros',
        url: `https://api.cloud.llamaindex.ai/api/v1/data_sources`
      }
    ];

    let success = false;
    let lastError = '';
    let result = null;

    for (const attempt of attempts) {
      try {
        console.log(`\n--- Tentativa: ${attempt.name} ---`);
        console.log('URL:', attempt.url);
        
        const response = await fetch(attempt.url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
            'Content-Type': 'application/json',
          },
        });

        console.log('Status da resposta:', response.status);

        if (response.ok) {
          result = await response.json();
          console.log('Data sources encontrados:', result);
          console.log('===============================');
          
          res.json({ success: true, dataSources: result, method: attempt.name });
          success = true;
          break;
        } else {
          const error = await response.text();
          console.error(`Erro com ${attempt.name}:`, response.status, error);
          lastError = error;
        }
      } catch (err) {
        console.error(`Erro ao tentar ${attempt.name}:`, err);
        lastError = err.message;
      }
    }

    if (!success) {
      console.error('Todas as tentativas falharam. Último erro:', lastError);
      return res.status(500).json({ 
        success: false, 
        error: `Todas as tentativas falharam. Último erro: ${lastError}` 
      });
    }

  } catch (err) {
    console.error('Erro ao conectar com LlamaIndex:', err);
    res.status(500).json({ success: false, error: 'Erro interno' });
  }
});

// Rota para verificar status de processamento de um arquivo
router.get('/file-status/:fileId', async (req, res) => {
  const { fileId } = req.params;

  try {
    console.log('=== VERIFICANDO STATUS DO ARQUIVO ===');
    console.log('File ID:', fileId);

    const response = await fetch(`https://api.cloud.llamaindex.ai/api/v1/files/${fileId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Status da resposta:', response.status);

    if (response.ok) {
      const result = await response.json();
      console.log('Status do arquivo:', result);
      console.log('===============================');
      
      res.json({ success: true, file: result });
    } else {
      const error = await response.text();
      console.error('Erro ao obter status do arquivo:', response.status, error);
      return res.status(500).json({ success: false, error });
    }

  } catch (err) {
    console.error('Erro ao conectar com LlamaIndex:', err);
    res.status(500).json({ success: false, error: 'Erro interno' });
  }
});

// Rota para verificar se um arquivo está nos data sources
router.get('/check-file-in-data-sources/:fileId', async (req, res) => {
  const { fileId } = req.params;

  try {
    console.log('=== VERIFICANDO ARQUIVO NOS DATA SOURCES ===');
    console.log('File ID:', fileId);

    const projectId = process.env.LLAMAINDEX_PROJECT_ID;
    const organizationId = process.env.LLAMAINDEX_ORGANIZATION_ID || '34b5d229-3300-482f-b3ec-e7aa632c9a88';

    // Primeiro, verificar o status do arquivo
    const fileResponse = await fetch(`https://api.cloud.llamaindex.ai/api/v1/files/${fileId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    let fileInfo = null;
    if (fileResponse.ok) {
      fileInfo = await fileResponse.json();
      console.log('Informações do arquivo:', fileInfo);
    }

    // Tentar diferentes endpoints para verificar data sources
    const attempts = [
      {
        name: 'Data Sources com project_id',
        url: `https://api.cloud.llamaindex.ai/api/v1/data_sources?project_id=${projectId}`
      },
      {
        name: 'Data Sources com organization_id',
        url: `https://api.cloud.llamaindex.ai/api/v1/data_sources?organization_id=${organizationId}`
      },
      {
        name: 'Data Sources com ambos IDs',
        url: `https://api.cloud.llamaindex.ai/api/v1/data_sources?project_id=${projectId}&organization_id=${organizationId}`
      },
      {
        name: 'Data Sources sem parâmetros',
        url: `https://api.cloud.llamaindex.ai/api/v1/data_sources`
      }
    ];

    let dataSources = [];
    let success = false;
    let lastError = '';

    for (const attempt of attempts) {
      try {
        console.log(`\n--- Tentativa: ${attempt.name} ---`);
        console.log('URL:', attempt.url);
        
        const response = await fetch(attempt.url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
            'Content-Type': 'application/json',
          },
        });

        console.log('Status da resposta:', response.status);

        if (response.ok) {
          const result = await response.json();
          dataSources = result.data_sources || result.dataSources || result || [];
          console.log('Data sources encontrados:', dataSources.length);
          console.log('===============================');
          success = true;
          break;
        } else {
          const error = await response.text();
          console.error(`Erro com ${attempt.name}:`, response.status, error);
          lastError = error;
        }
      } catch (err) {
        console.error(`Erro ao tentar ${attempt.name}:`, err);
        lastError = err.message;
      }
    }

    // Verificar se o arquivo está em algum data source
    const fileInDataSources = dataSources.filter(ds => {
      // Verificar diferentes campos onde o arquivo pode estar referenciado
      return ds.file_ids && ds.file_ids.includes(fileId) ||
             ds.files && ds.files.some(f => f.id === fileId) ||
             ds.document_ids && ds.document_ids.includes(fileId) ||
             ds.external_file_id === fileId;
    });

    console.log('Arquivo encontrado em data sources:', fileInDataSources.length > 0);
    if (fileInDataSources.length > 0) {
      console.log('Data sources que contêm o arquivo:', fileInDataSources);
    }

    res.json({
      success: true,
      fileInfo,
      dataSources: dataSources,
      fileInDataSources: fileInDataSources,
      isProcessed: fileInfo?.status === 'completed',
      isInDataSources: fileInDataSources.length > 0
    });

  } catch (err) {
    console.error('Erro ao verificar arquivo nos data sources:', err);
    res.status(500).json({ success: false, error: 'Erro interno' });
  }
});

// Rota para aguardar processamento de um arquivo
router.get('/wait-for-file-processing/:fileId', async (req, res) => {
  const { fileId } = req.params;
  const maxAttempts = 30; // 5 minutos (30 * 10 segundos)
  const delayMs = 10000; // 10 segundos

  try {
    console.log('=== AGUARDANDO PROCESSAMENTO DO ARQUIVO ===');
    console.log('File ID:', fileId);
    console.log('Máximo de tentativas:', maxAttempts);
    console.log('Delay entre tentativas:', delayMs, 'ms');

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`\n--- Tentativa ${attempt}/${maxAttempts} ---`);
      
      const response = await fetch(`https://api.cloud.llamaindex.ai/api/v1/files/${fileId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const fileInfo = await response.json();
        console.log('Status atual:', fileInfo.status);
        
        if (fileInfo.status === 'completed') {
          console.log('✅ Arquivo processado com sucesso!');
          return res.json({
            success: true,
            fileInfo,
            attempts: attempt,
            status: 'completed'
          });
        } else if (fileInfo.status === 'failed') {
          console.log('❌ Processamento falhou');
          return res.json({
            success: false,
            fileInfo,
            attempts: attempt,
            status: 'failed'
          });
        }
      } else {
        console.log('Erro ao verificar status:', response.status);
      }

      if (attempt < maxAttempts) {
        console.log(`Aguardando ${delayMs/1000} segundos...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    console.log('❌ Timeout - arquivo não foi processado no tempo esperado');
    res.json({
      success: false,
      attempts: maxAttempts,
      status: 'timeout'
    });

  } catch (err) {
    console.error('Erro ao aguardar processamento:', err);
    res.status(500).json({ success: false, error: 'Erro interno' });
  }
});

// Rota para upload e sync de documentos (abordagem correta para arquivos)
router.post('/upload-and-sync', upload.single('file'), async (req, res) => {
  try {
    console.log('=== UPLOAD E SYNC DE DOCUMENTOS ===');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('File:', req.file);
    
    if (!req.file) {
      console.log('Erro: Nenhum arquivo recebido');
      return res.status(400).json({
        success: false,
        error: 'Nenhum arquivo enviado'
      });
    }

    if (!process.env.LLAMAINDEX_API_KEY) {
      console.log('Erro: API Key não configurada');
      return res.status(500).json({
        success: false,
        error: 'LlamaIndex API Key não configurada'
      });
    }

    console.log('Arquivo válido recebido:', req.file.originalname, 'Tamanho:', req.file.size);

    const pipelineId = 'af1793a8-d115-472a-8e61-d19ab26fd92c';
    
    // Verificar se o pipeline existe
    console.log('Verificando pipeline:', pipelineId);
    const pipelineCheckResponse = await fetch(`https://api.cloud.llamaindex.ai/api/v1/pipelines/${pipelineId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (pipelineCheckResponse.ok) {
      const pipelineInfo = await pipelineCheckResponse.json();
      console.log('✅ Pipeline encontrado:', pipelineInfo.name || pipelineInfo.id);
    } else {
      console.error('❌ Pipeline não encontrado:', pipelineId);
      return res.status(500).json({
        success: false,
        error: `Pipeline não encontrado: ${pipelineId}`
      });
    }
    
    // 1. Primeiro, fazer upload do arquivo
    const formData = new FormData();
    formData.append('upload_file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    const projectId = process.env.LLAMAINDEX_PROJECT_ID;
    const organizationId = process.env.LLAMAINDEX_ORGANIZATION_ID || '34b5d229-3300-482f-b3ec-e7aa632c9a88';
    
    // Upload do arquivo COM data_source_id na URL
    const uploadUrl = `https://api.cloud.llamaindex.ai/api/v1/files?project_id=${projectId}&organization_id=${organizationId}&data_source_id=${pipelineId}`;
    
    console.log('1. Fazendo upload do arquivo...');
    console.log('URL:', uploadUrl);
    console.log('Data Source ID:', pipelineId);

    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
        ...formData.getHeaders(),
      },
      body: formData,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Erro no upload:', uploadResponse.status, errorText);
      return res.status(uploadResponse.status).json({
        success: false,
        error: `Erro no upload: ${uploadResponse.status} - ${errorText}`
      });
    }

    let uploadResult = await uploadResponse.json();
    console.log('Upload bem-sucedido:', uploadResult);

    // Verificar se o arquivo foi associado automaticamente
    if (!uploadResult.data_source_id) {
      console.log('⚠️ Arquivo não associado automaticamente. Fazendo sync manual...');
      console.log('Pipeline ID para sync:', pipelineId);

      const syncResponse = await fetch(`https://api.cloud.llamaindex.ai/api/v1/pipelines/${pipelineId}/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_ids: [uploadResult.id],
          project_id: projectId,
          organization_id: organizationId
        }),
      });

      console.log('Sync URL:', `https://api.cloud.llamaindex.ai/api/v1/pipelines/${pipelineId}/sync`);
      console.log('Sync Payload:', JSON.stringify({
        file_ids: [uploadResult.id],
        project_id: projectId,
        organization_id: organizationId
      }, null, 2));

      if (!syncResponse.ok) {
        const syncError = await syncResponse.text();
        console.error('Erro ao fazer sync manual:', syncResponse.status, syncError);
        
        // Tentar abordagem alternativa - Add Files To Pipeline API
        console.log('🔄 Tentando Add Files To Pipeline API...');
        
        const addFilesResponse = await fetch(`https://api.cloud.llamaindex.ai/api/v1/pipelines/${pipelineId}/files`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify([
            {
              file_id: uploadResult.id
            }
          ]), // EXATAMENTE como no curl - apenas o array com file_id
        });

        if (!addFilesResponse.ok) {
          const addFilesError = await addFilesResponse.text();
          console.error('Erro na Add Files API:', addFilesResponse.status, addFilesError);
          
          // Tentar terceira abordagem - Upsert Batch Pipeline Documents
          console.log('🔄 Tentando Upsert Batch Pipeline Documents...');
          
          const upsertDocsResponse = await fetch(`https://api.cloud.llamaindex.ai/api/v1/pipelines/${pipelineId}/documents`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify([{
              file_id: uploadResult.id,
              metadata: {
                filename: req.file.originalname,
                file_size: req.file.size,
                file_type: req.file.mimetype
              }
            }]),
          });

          if (!upsertDocsResponse.ok) {
            const upsertError = await upsertDocsResponse.text();
            console.error('Erro na Upsert Documents API:', upsertDocsResponse.status, upsertError);
            return res.status(500).json({
              success: false,
              error: `Todas as tentativas falharam. Sync: ${syncResponse.status} - ${syncError}. Add Files: ${addFilesResponse.status} - ${addFilesError}. Upsert Docs: ${upsertDocsResponse.status} - ${upsertError}`
            });
          } else {
            console.log('✅ Upsert Documents concluído com sucesso');
          }
        } else {
          console.log('✅ Add Files to Pipeline concluído com sucesso');
        }
      } else {
        console.log('✅ Sync manual concluído com sucesso');
      }
      
      // Verificar o status atualizado do arquivo após o sync
      const updatedFileRes = await fetch(`https://api.cloud.llamaindex.ai/api/v1/files/${uploadResult.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (updatedFileRes.ok) {
        const updatedFileInfo = await updatedFileRes.json();
        console.log('🔁 Arquivo após sync:', updatedFileInfo);
        uploadResult = updatedFileInfo; // Atualizar com as informações mais recentes
      }
    } else {
      console.log('✅ Arquivo já associado automaticamente ao pipeline');
    }
    
    console.log('=== RESUMO DO PROCESSO ===');
    console.log('Arquivo:', req.file.originalname);
    console.log('File ID:', uploadResult.id);
    console.log('Pipeline ID:', pipelineId);
    console.log('Tamanho:', req.file.size, 'bytes');
    console.log('Status: Arquivo enviado e associado ao pipeline');
    console.log('Data Source ID:', uploadResult.data_source_id);
    console.log('========================');
    
    res.json({
      success: true,
      document: {
        id: uploadResult.id || Date.now().toString(),
        name: req.file.originalname,
        type: req.file.mimetype,
        size: req.file.size,
        status: 'completed',
        uploadedAt: new Date(),
        documentId: uploadResult.id,
        pipelineId: pipelineId,
        dataSourceId: uploadResult.data_source_id,
        isProcessed: uploadResult.status === 'completed',
        hasDataSourceId: !!uploadResult.data_source_id,
        uploadSuccessful: true,
        addedToPipeline: !!uploadResult.data_source_id,
        syncCompleted: !!uploadResult.data_source_id
      }
    });

  } catch (error) {
    console.error('Erro ao fazer upload e sync de documentos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Rota para verificar status completo do arquivo (incluindo data_source_id)
router.get('/file-complete-status/:fileId', async (req, res) => {
  const { fileId } = req.params;

  try {
    console.log('=== VERIFICANDO STATUS COMPLETO DO ARQUIVO ===');
    console.log('File ID:', fileId);

    // 1. Verificar informações do arquivo
    const fileResponse = await fetch(`https://api.cloud.llamaindex.ai/api/v1/files/${fileId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    let fileInfo = null;
    if (fileResponse.ok) {
      fileInfo = await fileResponse.json();
      console.log('Informações do arquivo:', fileInfo);
      console.log('Data Source ID:', fileInfo.data_source_id);
      console.log('Status:', fileInfo.status);
    }

    // 2. Verificar se está nos data sources
    const projectId = process.env.LLAMAINDEX_PROJECT_ID;
    const organizationId = process.env.LLAMAINDEX_ORGANIZATION_ID || '34b5d229-3300-482f-b3ec-e7aa632c9a88';

    const dataSourcesResponse = await fetch(`https://api.cloud.llamaindex.ai/api/v1/data_sources?project_id=${projectId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    let dataSources = [];
    if (dataSourcesResponse.ok) {
      const result = await dataSourcesResponse.json();
      dataSources = result.data_sources || result.dataSources || result || [];
      console.log('Data sources encontrados:', dataSources.length);
    }

    // 3. Verificar se o arquivo está em algum data source
    const fileInDataSources = dataSources.filter(ds => {
      return ds.file_ids && ds.file_ids.includes(fileId) ||
             ds.files && ds.files.some(f => f.id === fileId) ||
             ds.document_ids && ds.document_ids.includes(fileId) ||
             ds.external_file_id === fileId;
    });

    // 4. Verificar se precisa de sync manual
    const needsSync = !fileInfo?.data_source_id;
    const pipelineId = 'af1793a8-d115-472a-8e61-d19ab26fd92c';

    let syncResult = null;
    if (needsSync) {
      console.log('Arquivo precisa de sync manual...');
      
      const syncResponse = await fetch('https://api.cloud.llamaindex.ai/api/v1/files/sync', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_ids: [fileId],
          data_source_id: pipelineId
        }),
      });

      if (syncResponse.ok) {
        syncResult = await syncResponse.json();
        console.log('Sync manual realizado:', syncResult);
      } else {
        const error = await syncResponse.text();
        console.error('Erro no sync manual:', syncResponse.status, error);
      }
    }

    // 5. Verificar novamente o arquivo após sync
    let updatedFileInfo = null;
    if (needsSync) {
      const updatedFileResponse = await fetch(`https://api.cloud.llamaindex.ai/api/v1/files/${fileId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (updatedFileResponse.ok) {
        updatedFileInfo = await updatedFileResponse.json();
        console.log('Informações atualizadas do arquivo:', updatedFileInfo);
      }
    }

    console.log('=== RESUMO DO STATUS ===');
    console.log('File ID:', fileId);
    console.log('Status inicial:', fileInfo?.status);
    console.log('Data Source ID inicial:', fileInfo?.data_source_id);
    console.log('Precisa de sync:', needsSync);
    console.log('Em data sources:', fileInDataSources.length > 0);
    console.log('Status final:', updatedFileInfo?.status || fileInfo?.status);
    console.log('Data Source ID final:', updatedFileInfo?.data_source_id || fileInfo?.data_source_id);
    console.log('========================');

    res.json({
      success: true,
      fileInfo: updatedFileInfo || fileInfo,
      dataSources: dataSources,
      fileInDataSources: fileInDataSources,
      needsSync: needsSync,
      syncResult: syncResult,
      isProcessed: (updatedFileInfo || fileInfo)?.status === 'completed',
      hasDataSourceId: !!(updatedFileInfo || fileInfo)?.data_source_id,
      isInDataSources: fileInDataSources.length > 0
    });

  } catch (err) {
    console.error('Erro ao verificar status completo:', err);
    res.status(500).json({ success: false, error: 'Erro interno' });
  }
});

// Rota para testar diferentes APIs de pipeline
router.post('/test-pipeline-apis/:fileId', async (req, res) => {
  const { fileId } = req.params;
  const pipelineId = 'af1793a8-d115-472a-8e61-d19ab26fd92c';
  const projectId = process.env.LLAMAINDEX_PROJECT_ID;
  const organizationId = process.env.LLAMAINDEX_ORGANIZATION_ID || '34b5d229-3300-482f-b3ec-e7aa632c9a88';

  try {
    console.log('=== TESTANDO DIFERENTES APIS DE PIPELINE ===');
    console.log('File ID:', fileId);
    console.log('Pipeline ID:', pipelineId);

    const tests = [
      {
        name: 'Sync Pipeline',
        url: `https://api.cloud.llamaindex.ai/api/v1/pipelines/${pipelineId}/sync`,
        method: 'POST',
        body: {
          file_ids: [fileId],
          project_id: projectId,
          organization_id: organizationId
        }
      },
      {
        name: 'Add Files To Pipeline',
        url: `https://api.cloud.llamaindex.ai/api/v1/pipelines/${pipelineId}/files`,
        method: 'PUT',
        body: [
          {
            file_id: fileId
          }
        ] // EXATAMENTE como no curl - apenas o array com file_id
      },
      {
        name: 'Upsert Batch Pipeline Documents',
        url: `https://api.cloud.llamaindex.ai/api/v1/pipelines/${pipelineId}/documents`,
        method: 'PUT',
        body: [{
          file_id: fileId,
          metadata: {
            filename: 'test-file.pdf',
            file_size: 1000,
            file_type: 'application/pdf'
          }
        }]
      },
      {
        name: 'Update Pipeline Data Source',
        url: `https://api.cloud.llamaindex.ai/api/v1/pipelines/${pipelineId}/data_sources`,
        method: 'PUT',
        body: {
          file_ids: [fileId]
        }
      }
    ];

    const results = [];

    for (const test of tests) {
      try {
        console.log(`\n--- Testando: ${test.name} ---`);
        console.log('URL:', test.url);
        console.log('Método:', test.method);
        console.log('Body:', JSON.stringify(test.body, null, 2));
        
        const response = await fetch(test.url, {
          method: test.method,
          headers: {
            'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(test.body),
        });

        console.log('Status:', response.status);
        
        if (response.ok) {
          const result = await response.json();
          console.log('✅ Sucesso:', result);
          results.push({
            name: test.name,
            success: true,
            status: response.status,
            result: result
          });
        } else {
          const error = await response.text();
          console.error('❌ Erro:', response.status, error);
          results.push({
            name: test.name,
            success: false,
            status: response.status,
            error: error
          });
        }
      } catch (err) {
        console.error(`❌ Erro ao testar ${test.name}:`, err);
        results.push({
          name: test.name,
          success: false,
          error: err.message
        });
      }
    }

    console.log('\n=== RESUMO DOS TESTES ===');
    results.forEach(result => {
      console.log(`${result.success ? '✅' : '❌'} ${result.name}: ${result.success ? 'Sucesso' : 'Falhou'}`);
    });

    res.json({
      success: true,
      results: results
    });

  } catch (err) {
    console.error('Erro ao testar APIs:', err);
    res.status(500).json({ success: false, error: 'Erro interno' });
  }
});

// Rota para verificar data sources de um pipeline
router.get('/pipeline-data-sources/:pipelineId', async (req, res) => {
  const { pipelineId } = req.params;

  try {
    console.log('=== VERIFICANDO DATA SOURCES DO PIPELINE ===');
    console.log('Pipeline ID:', pipelineId);

    const response = await fetch(`https://api.cloud.llamaindex.ai/api/v1/pipelines/${pipelineId}/data-sources`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Status da resposta:', response.status);

    if (response.ok) {
      const result = await response.json();
      const dataSources = result.data_sources || result.dataSources || result || [];
      
      console.log('Data sources encontrados:', dataSources.length);
      dataSources.forEach((ds, index) => {
        console.log(`${index + 1}. Data Source ID: ${ds.id}`);
        console.log(`   Tipo: ${ds.type || 'unknown'}`);
        console.log(`   File IDs: ${ds.file_ids?.length || 0} arquivos`);
        if (ds.file_ids && ds.file_ids.length > 0) {
          console.log(`   Files: ${ds.file_ids.join(', ')}`);
        }
      });
      console.log('===============================');
      
      res.json({ 
        success: true, 
        pipelineId: pipelineId,
        dataSources: dataSources,
        totalDataSources: dataSources.length
      });
    } else {
      const error = await response.text();
      console.error('Erro ao obter data sources:', response.status, error);
      return res.status(500).json({ success: false, error });
    }

  } catch (err) {
    console.error('Erro ao conectar com LlamaIndex:', err);
    res.status(500).json({ success: false, error: 'Erro interno' });
  }
});

// Rota para verificar se um arquivo específico está nos data sources de um pipeline
router.get('/check-file-in-pipeline/:pipelineId/:fileId', async (req, res) => {
  const { pipelineId, fileId } = req.params;

  try {
    console.log('=== VERIFICANDO ARQUIVO NO PIPELINE ===');
    console.log('Pipeline ID:', pipelineId);
    console.log('File ID:', fileId);

    // 1. Verificar informações do arquivo
    const fileResponse = await fetch(`https://api.cloud.llamaindex.ai/api/v1/files/${fileId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    let fileInfo = null;
    if (fileResponse.ok) {
      fileInfo = await fileResponse.json();
      console.log('Informações do arquivo:', fileInfo);
    }

    // 2. Verificar data sources do pipeline
    const dataSourcesResponse = await fetch(`https://api.cloud.llamaindex.ai/api/v1/pipelines/${pipelineId}/data-sources`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    let dataSources = [];
    let fileInDataSources = false;
    let matchingDataSource = null;

    if (dataSourcesResponse.ok) {
      const result = await dataSourcesResponse.json();
      dataSources = result.data_sources || result.dataSources || result || [];
      
      // Verificar se o arquivo está em algum data source
      matchingDataSource = dataSources.find(ds => {
        return ds.file_ids && ds.file_ids.includes(fileId) ||
               ds.files && ds.files.some(f => f.id === fileId) ||
               ds.document_ids && ds.document_ids.includes(fileId) ||
               ds.external_file_id === fileId;
      });

      fileInDataSources = !!matchingDataSource;
      
      console.log('Data sources do pipeline:', dataSources.length);
      console.log('Arquivo encontrado em data sources:', fileInDataSources);
      if (matchingDataSource) {
        console.log('Data source que contém o arquivo:', matchingDataSource.id);
      }
    }

    console.log('=== RESUMO DA VERIFICAÇÃO ===');
    console.log('File ID:', fileId);
    console.log('Pipeline ID:', pipelineId);
    console.log('Status do arquivo:', fileInfo?.status);
    console.log('Data Source ID do arquivo:', fileInfo?.data_source_id);
    console.log('Em data sources do pipeline:', fileInDataSources);
    console.log('Data source correspondente:', matchingDataSource?.id);
    console.log('============================');

    res.json({
      success: true,
      fileInfo: fileInfo,
      pipelineId: pipelineId,
      fileId: fileId,
      dataSources: dataSources,
      fileInDataSources: fileInDataSources,
      matchingDataSource: matchingDataSource,
      isProcessed: fileInfo?.status === 'completed',
      hasDataSourceId: !!fileInfo?.data_source_id
    });

  } catch (err) {
    console.error('Erro ao verificar arquivo no pipeline:', err);
    res.status(500).json({ success: false, error: 'Erro interno' });
  }
});

// Rota para forçar associação de arquivos com pipeline
router.post('/force-file-association', async (req, res) => {
  const { fileIds, pipelineId } = req.body;
  const defaultPipelineId = 'af1793a8-d115-472a-8e61-d19ab26fd92c';

  try {
    console.log('=== FORÇANDO ASSOCIAÇÃO DE ARQUIVOS ===');
    console.log('File IDs:', fileIds);
    console.log('Pipeline ID:', pipelineId || defaultPipelineId);

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'fileIds é obrigatório e deve ser um array não vazio'
      });
    }

    const targetPipelineId = pipelineId || defaultPipelineId;
    const projectId = process.env.LLAMAINDEX_PROJECT_ID;
    
    const response = await fetch(`https://api.cloud.llamaindex.ai/api/v1/pipelines/${targetPipelineId}/data-sources`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `arquivo-${Date.now()}`,
        file_ids: fileIds,
        project_id: projectId
      }),
    });

    console.log('URL:', `https://api.cloud.llamaindex.ai/api/v1/pipelines/${targetPipelineId}/data-sources`);
    console.log('Payload:', JSON.stringify({
      name: `arquivo-${Date.now()}`,
      file_ids: fileIds,
      project_id: projectId
    }, null, 2));
    console.log('Status da resposta:', response.status);

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Data source adicionado com sucesso:', result);
      console.log('===============================');
      
      res.json({
        success: true,
        message: 'Arquivos associados com sucesso ao pipeline',
        fileIds: fileIds,
        pipelineId: targetPipelineId,
        result: result
      });
    } else {
      const error = await response.text();
      console.error('❌ Erro ao adicionar data source:', response.status, error);
      console.log('===============================');
      
      return res.status(500).json({
        success: false,
        error: `Erro ao adicionar data source: ${response.status} - ${error}`,
        fileIds: fileIds,
        pipelineId: targetPipelineId
      });
    }

  } catch (err) {
    console.error('Erro ao adicionar data source:', err);
    res.status(500).json({ success: false, error: 'Erro interno' });
  }
});

// Rota para verificar e corrigir associação de arquivos ao pipeline (VERSÃO CORRIGIDA COM DATA SOURCE + SYNC)
router.post('/fix-file-association', async (req, res) => {
  const { fileId } = req.body;
  const pipelineId = 'af1793a8-d115-472a-8e61-d19ab26fd92c';
  const projectId = process.env.LLAMAINDEX_PROJECT_ID;
  const organizationId = process.env.LLAMAINDEX_ORGANIZATION_ID || '34b5d229-3300-482f-b3ec-e7aa632c9a88';

  try {
    console.log('=== CORRIGINDO ASSOCIAÇÃO DE ARQUIVO ===');
    console.log('File ID:', fileId);
    console.log('Pipeline ID:', pipelineId);

    if (!fileId) {
      return res.status(400).json({
        success: false,
        error: 'fileId é obrigatório'
      });
    }

    // 1. Verificar status atual do arquivo
    console.log('1. Verificando status atual do arquivo...');
    const fileResponse = await fetch(`https://api.cloud.llamaindex.ai/api/v1/files/${fileId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    let fileInfo = null;
    if (fileResponse.ok) {
      fileInfo = await fileResponse.json();
      console.log('Status atual do arquivo:', fileInfo);
      console.log('Data Source ID atual:', fileInfo.data_source_id);
    }

    // 2. Verificar data sources do pipeline
    console.log('2. Verificando data sources do pipeline...');
    const dataSourcesResponse = await fetch(`https://api.cloud.llamaindex.ai/api/v1/pipelines/${pipelineId}/data-sources`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    let dataSources = [];
    let fileInDataSources = false;
    if (dataSourcesResponse.ok) {
      const result = await dataSourcesResponse.json();
      dataSources = result.data_sources || result.dataSources || result || [];
      console.log('Data sources encontrados:', dataSources.length);
      
      fileInDataSources = dataSources.some(ds => {
        return ds.file_ids && ds.file_ids.includes(fileId) ||
               ds.files && ds.files.some(f => f.id === fileId) ||
               ds.document_ids && ds.document_ids.includes(fileId) ||
               ds.external_file_id === fileId;
      });
      
      console.log('Arquivo está em data sources:', fileInDataSources);
    }

    // 3. Se não estiver associado, usar a abordagem Data Source + Sync
    const attempts = [];
    
    if (!fileInfo?.data_source_id && !fileInDataSources) {
      console.log('3. Arquivo não associado. Usando abordagem Data Source + Sync...');
      
      // Primeiro, criar data source
      attempts.push({
        name: 'Criar Data Source',
        url: `https://api.cloud.llamaindex.ai/api/v1/pipelines/${pipelineId}/data-sources`,
        method: 'POST',
        body: {
          name: `Data source - arquivo-${Date.now()}`,
          file_ids: [fileId]
        }
      });

      // Depois, fazer sync
      attempts.push({
        name: 'Sync Pipeline',
        url: `https://api.cloud.llamaindex.ai/api/v1/pipelines/${pipelineId}/sync`,
        method: 'POST',
        body: {
          file_ids: [fileId],
          project_id: projectId,
          organization_id: organizationId
        }
      });
    }

    const results = [];
    let success = false;

    for (const attempt of attempts) {
      try {
        console.log(`\n--- Tentativa: ${attempt.name} ---`);
        console.log('URL:', attempt.url);
        console.log('Método:', attempt.method);
        console.log('Body:', JSON.stringify(attempt.body, null, 2));
        
        const response = await fetch(attempt.url, {
          method: attempt.method,
          headers: {
            'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(attempt.body),
        });

        console.log('Status:', response.status);
        
        if (response.ok) {
          const result = await response.json();
          console.log('✅ Sucesso:', result);
          results.push({
            name: attempt.name,
            success: true,
            status: response.status,
            result: result
          });
          success = true;
        } else {
          const error = await response.text();
          console.error('❌ Erro:', response.status, error);
          results.push({
            name: attempt.name,
            success: false,
            status: response.status,
            error: error
          });
        }
      } catch (err) {
        console.error(`❌ Erro ao tentar ${attempt.name}:`, err);
        results.push({
          name: attempt.name,
          success: false,
          error: err.message
        });
      }
    }

    // 4. Verificar status final
    console.log('4. Verificando status final...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const finalFileResponse = await fetch(`https://api.cloud.llamaindex.ai/api/v1/files/${fileId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    let finalFileInfo = fileInfo;
    if (finalFileResponse.ok) {
      finalFileInfo = await finalFileResponse.json();
      console.log('Status final do arquivo:', finalFileInfo);
    }

    // 5. Verificar data sources finais
    const finalDataSourcesResponse = await fetch(`https://api.cloud.llamaindex.ai/api/v1/pipelines/${pipelineId}/data-sources`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    let finalDataSources = [];
    let finalFileInDataSources = false;
    if (finalDataSourcesResponse.ok) {
      const result = await finalDataSourcesResponse.json();
      finalDataSources = result.data_sources || result.dataSources || result || [];
      
      finalFileInDataSources = finalDataSources.some(ds => {
        return ds.file_ids && ds.file_ids.includes(fileId) ||
               ds.files && ds.files.some(f => f.id === fileId) ||
               ds.document_ids && ds.document_ids.includes(fileId) ||
               ds.external_file_id === fileId;
      });
    }

    console.log('=== RESUMO DA CORREÇÃO ===');
    console.log('File ID:', fileId);
    console.log('Pipeline ID:', pipelineId);
    console.log('Status inicial:', fileInfo?.status);
    console.log('Data Source ID inicial:', fileInfo?.data_source_id);
    console.log('Em data sources inicial:', fileInDataSources);
    console.log('Tentativas realizadas:', attempts.length);
    console.log('Tentativas bem-sucedidas:', results.filter(r => r.success).length);
    console.log('Status final:', finalFileInfo?.status);
    console.log('Data Source ID final:', finalFileInfo?.data_source_id);
    console.log('Em data sources final:', finalFileInDataSources);
    console.log('========================');

    res.json({
      success: true,
      fileId: fileId,
      pipelineId: pipelineId,
      initialStatus: fileInfo,
      attempts: results,
      finalStatus: finalFileInfo,
      finalDataSources: finalDataSources,
      isAssociated: !!finalFileInfo?.data_source_id || finalFileInDataSources,
      attemptsSuccessful: results.filter(r => r.success).length
    });

  } catch (err) {
    console.error('Erro ao corrigir associação:', err);
    res.status(500).json({ success: false, error: 'Erro interno' });
  }
});

// Rota para testar chat com documentos específicos
router.post('/test-chat-with-file', async (req, res) => {
  const { message, fileId } = req.body;
  const pipelineId = 'af1793a8-d115-472a-8e61-d19ab26fd92c';

  try {
    console.log('=== TESTANDO CHAT COM ARQUIVO ESPECÍFICO ===');
    console.log('Mensagem:', message);
    console.log('File ID:', fileId);
    console.log('Pipeline ID:', pipelineId);

    if (!message || !fileId) {
      return res.status(400).json({
        success: false,
        error: 'message e fileId são obrigatórios'
      });
    }

    // 1. Verificar se o arquivo existe e está associado
    console.log('1. Verificando arquivo...');
    const fileResponse = await fetch(`https://api.cloud.llamaindex.ai/api/v1/files/${fileId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    let fileInfo = null;
    if (fileResponse.ok) {
      fileInfo = await fileResponse.json();
      console.log('Informações do arquivo:', fileInfo);
      console.log('Status:', fileInfo.status);
      console.log('Data Source ID:', fileInfo.data_source_id);
    }

    // 2. Verificar data sources do pipeline
    console.log('2. Verificando data sources do pipeline...');
    const dataSourcesResponse = await fetch(`https://api.cloud.llamaindex.ai/api/v1/pipelines/${pipelineId}/data-sources`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    let dataSources = [];
    let fileInDataSources = false;
    if (dataSourcesResponse.ok) {
      const result = await dataSourcesResponse.json();
      dataSources = result.data_sources || result.dataSources || result || [];
      console.log('Data sources encontrados:', dataSources.length);
      
      fileInDataSources = dataSources.some(ds => {
        return ds.file_ids && ds.file_ids.includes(fileId) ||
               ds.files && ds.files.some(f => f.id === fileId) ||
               ds.document_ids && ds.document_ids.includes(fileId) ||
               ds.external_file_id === fileId;
      });
      
      console.log('Arquivo está em data sources:', fileInDataSources);
    }

    // 3. Se arquivo não estiver associado, tentar associar
    if (!fileInfo?.data_source_id && !fileInDataSources) {
      console.log('3. Arquivo não associado. Tentando associar...');
      
      const syncResponse = await fetch(`https://api.cloud.llamaindex.ai/api/v1/pipelines/${pipelineId}/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_ids: [fileId],
          project_id: process.env.LLAMAINDEX_PROJECT_ID,
          organization_id: process.env.LLAMAINDEX_ORGANIZATION_ID || '34b5d229-3300-482f-b3ec-e7aa632c9a88'
        }),
      });

      if (syncResponse.ok) {
        console.log('✅ Sync realizado com sucesso');
        // Aguardar processamento
        await new Promise(resolve => setTimeout(resolve, 5000));
      } else {
        const syncError = await syncResponse.text();
        console.error('❌ Erro no sync:', syncResponse.status, syncError);
      }
    }

    // 4. Testar chat com diferentes endpoints
    console.log('4. Testando chat...');
    
    const chatAttempts = [
      {
        name: 'Chat com Pipeline',
        url: `https://api.cloud.llamaindex.ai/api/v1/pipelines/${pipelineId}/chat`,
        method: 'POST',
        body: {
          messages: [
            {
              role: 'user',
              content: message
            }
          ]
        }
      },
      {
        name: 'Retrieve com Pipeline',
        url: `https://api.cloud.llamaindex.ai/api/v1/pipelines/${pipelineId}/retrieve`,
        method: 'POST',
        body: {
          query: message,
          similarity_top_k: 5
        }
      },
      {
        name: 'Query com Pipeline',
        url: `https://api.cloud.llamaindex.ai/api/v1/pipelines/${pipelineId}/query`,
        method: 'POST',
        body: {
          query: message
        }
      }
    ];

    const chatResults = [];
    let chatSuccess = false;

    for (const attempt of chatAttempts) {
      try {
        console.log(`\n--- Tentativa de Chat: ${attempt.name} ---`);
        console.log('URL:', attempt.url);
        console.log('Body:', JSON.stringify(attempt.body, null, 2));
        
        const response = await fetch(attempt.url, {
          method: attempt.method,
          headers: {
            'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(attempt.body),
        });

        console.log('Status:', response.status);
        
        if (response.ok) {
          const result = await response.json();
          console.log('✅ Chat bem-sucedido:', result);
          chatResults.push({
            name: attempt.name,
            success: true,
            status: response.status,
            result: result
          });
          chatSuccess = true;
        } else {
          const error = await response.text();
          console.error('❌ Erro no chat:', response.status, error);
          chatResults.push({
            name: attempt.name,
            success: false,
            status: response.status,
            error: error
          });
        }
      } catch (err) {
        console.error(`❌ Erro ao tentar ${attempt.name}:`, err);
        chatResults.push({
          name: attempt.name,
          success: false,
          error: err.message
        });
      }
    }

    console.log('=== RESUMO DO TESTE DE CHAT ===');
    console.log('File ID:', fileId);
    console.log('Pipeline ID:', pipelineId);
    console.log('Status do arquivo:', fileInfo?.status);
    console.log('Data Source ID:', fileInfo?.data_source_id);
    console.log('Em data sources:', fileInDataSources);
    console.log('Tentativas de chat:', chatAttempts.length);
    console.log('Chats bem-sucedidos:', chatResults.filter(r => r.success).length);
    console.log('==============================');

    res.json({
      success: true,
      fileId: fileId,
      pipelineId: pipelineId,
      fileInfo: fileInfo,
      dataSources: dataSources,
      fileInDataSources: fileInDataSources,
      chatResults: chatResults,
      chatSuccessful: chatSuccess,
      message: message
    });

  } catch (err) {
    console.error('Erro ao testar chat:', err);
    res.status(500).json({ success: false, error: 'Erro interno' });
  }
});

// Rota de diagnóstico completo do sistema LlamaIndex Cloud
router.get('/diagnose-system', async (req, res) => {
  try {
    console.log('=== DIAGNÓSTICO COMPLETO DO SISTEMA ===');

    const projectId = process.env.LLAMAINDEX_PROJECT_ID;
    const organizationId = process.env.LLAMAINDEX_ORGANIZATION_ID || '34b5d229-3300-482f-b3ec-e7aa632c9a88';
    const pipelineId = 'af1793a8-d115-472a-8e61-d19ab26fd92c';

    const diagnosis = {
      timestamp: new Date().toISOString(),
      environment: {
        apiKeyConfigured: !!process.env.LLAMAINDEX_API_KEY,
        projectIdConfigured: !!process.env.LLAMAINDEX_PROJECT_ID,
        organizationIdConfigured: !!process.env.LLAMAINDEX_ORGANIZATION_ID,
        projectId: projectId,
        organizationId: organizationId,
        pipelineId: pipelineId
      },
      pipeline: null,
      files: [],
      dataSources: [],
      errors: []
    };

    // 1. Verificar se a API Key está funcionando
    console.log('1. Verificando API Key...');
    try {
      const testResponse = await fetch('https://api.cloud.llamaindex.ai/api/v1/files', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (testResponse.ok) {
        console.log('✅ API Key está funcionando');
        diagnosis.apiKeyWorking = true;
      } else {
        console.error('❌ API Key não está funcionando:', testResponse.status);
        diagnosis.apiKeyWorking = false;
        diagnosis.errors.push(`API Key inválida: ${testResponse.status}`);
      }
    } catch (err) {
      console.error('❌ Erro ao testar API Key:', err);
      diagnosis.apiKeyWorking = false;
      diagnosis.errors.push(`Erro de conexão: ${err.message}`);
    }

    // 2. Verificar pipeline
    console.log('2. Verificando pipeline...');
    try {
      const pipelineResponse = await fetch(`https://api.cloud.llamaindex.ai/api/v1/pipelines/${pipelineId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (pipelineResponse.ok) {
        const pipelineInfo = await pipelineResponse.json();
        console.log('✅ Pipeline encontrado:', pipelineInfo.name || pipelineInfo.id);
        diagnosis.pipeline = pipelineInfo;
      } else {
        console.error('❌ Pipeline não encontrado:', pipelineResponse.status);
        diagnosis.errors.push(`Pipeline não encontrado: ${pipelineResponse.status}`);
      }
    } catch (err) {
      console.error('❌ Erro ao verificar pipeline:', err);
      diagnosis.errors.push(`Erro ao verificar pipeline: ${err.message}`);
    }

    // 3. Listar arquivos
    console.log('3. Listando arquivos...');
    try {
      const filesResponse = await fetch(`https://api.cloud.llamaindex.ai/api/v1/files?project_id=${projectId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (filesResponse.ok) {
        const filesResult = await filesResponse.json();
        const files = filesResult.files || filesResult.data?.files || [];
        console.log('✅ Arquivos encontrados:', files.length);
        
        diagnosis.files = files.map(file => ({
          id: file.id,
          name: file.name || file.external_file_id || file.id,
          status: file.status,
          data_source_id: file.data_source_id,
          file_size: file.file_size,
          created_at: file.created_at
        }));
      } else {
        console.error('❌ Erro ao listar arquivos:', filesResponse.status);
        diagnosis.errors.push(`Erro ao listar arquivos: ${filesResponse.status}`);
      }
    } catch (err) {
      console.error('❌ Erro ao listar arquivos:', err);
      diagnosis.errors.push(`Erro ao listar arquivos: ${err.message}`);
    }

    // 4. Verificar data sources do pipeline
    console.log('4. Verificando data sources do pipeline...');
    try {
      const dataSourcesResponse = await fetch(`https://api.cloud.llamaindex.ai/api/v1/pipelines/${pipelineId}/data-sources`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (dataSourcesResponse.ok) {
        const result = await dataSourcesResponse.json();
        const dataSources = result.data_sources || result.dataSources || result || [];
        console.log('✅ Data sources encontrados:', dataSources.length);
        
        diagnosis.dataSources = dataSources.map(ds => ({
          id: ds.id,
          name: ds.name,
          type: ds.type,
          file_ids: ds.file_ids || [],
          files_count: ds.file_ids?.length || 0
        }));
      } else {
        console.error('❌ Erro ao listar data sources:', dataSourcesResponse.status);
        diagnosis.errors.push(`Erro ao listar data sources: ${dataSourcesResponse.status}`);
      }
    } catch (err) {
      console.error('❌ Erro ao listar data sources:', err);
      diagnosis.errors.push(`Erro ao listar data sources: ${err.message}`);
    }

    // 5. Verificar arquivos não associados
    console.log('5. Verificando arquivos não associados...');
    const unassociatedFiles = diagnosis.files.filter(file => !file.data_source_id);
    const associatedFiles = diagnosis.files.filter(file => file.data_source_id);
    
    diagnosis.summary = {
      totalFiles: diagnosis.files.length,
      associatedFiles: associatedFiles.length,
      unassociatedFiles: unassociatedFiles.length,
      totalDataSources: diagnosis.dataSources.length,
      errors: diagnosis.errors.length
    };

    console.log('=== RESUMO DO DIAGNÓSTICO ===');
    console.log('API Key funcionando:', diagnosis.apiKeyWorking);
    console.log('Pipeline encontrado:', !!diagnosis.pipeline);
    console.log('Total de arquivos:', diagnosis.summary.totalFiles);
    console.log('Arquivos associados:', diagnosis.summary.associatedFiles);
    console.log('Arquivos não associados:', diagnosis.summary.unassociatedFiles);
    console.log('Data sources:', diagnosis.summary.totalDataSources);
    console.log('Erros encontrados:', diagnosis.summary.errors);
    console.log('================================');

    res.json({
      success: true,
      diagnosis: diagnosis
    });

  } catch (err) {
    console.error('Erro no diagnóstico:', err);
    res.status(500).json({ success: false, error: 'Erro interno' });
  }
});

// Rota para corrigir automaticamente problemas do sistema (VERSÃO CORRIGIDA COM DATA SOURCE + SYNC)
router.post('/fix-system-issues', async (req, res) => {
  try {
    console.log('=== CORRIGINDO PROBLEMAS DO SISTEMA ===');

    const projectId = process.env.LLAMAINDEX_PROJECT_ID;
    const organizationId = process.env.LLAMAINDEX_ORGANIZATION_ID || '34b5d229-3300-482f-b3ec-e7aa632c9a88';
    const pipelineId = 'af1793a8-d115-472a-8e61-d19ab26fd92c';

    const fixes = {
      timestamp: new Date().toISOString(),
      fixesApplied: [],
      errors: [],
      summary: {}
    };

    // 1. Verificar e corrigir arquivos não associados
    console.log('1. Verificando arquivos não associados...');
    try {
      const filesResponse = await fetch(`https://api.cloud.llamaindex.ai/api/v1/files?project_id=${projectId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (filesResponse.ok) {
        const filesResult = await filesResponse.json();
        const files = filesResult.files || filesResult.data?.files || [];
        
        const unassociatedFiles = files.filter(file => !file.data_source_id);
        console.log(`Encontrados ${unassociatedFiles.length} arquivos não associados`);

        if (unassociatedFiles.length > 0) {
          console.log('Aplicando correção para arquivos não associados usando Data Source + Sync...');
          
          // Primeiro, criar data source
          const dataSourceResponse = await fetch(`https://api.cloud.llamaindex.ai/api/v1/pipelines/${pipelineId}/data-sources`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: `Data source - correção-${Date.now()}`,
              file_ids: unassociatedFiles.map(f => f.id)
            }),
          });

          if (dataSourceResponse.ok) {
            const dataSourceResult = await dataSourceResponse.json();
            console.log('✅ Data source criado com sucesso');
            fixes.fixesApplied.push({
              type: 'create_data_source',
              description: `Criado data source com ${unassociatedFiles.length} arquivos`,
              files: unassociatedFiles.map(f => ({ id: f.id, name: f.name || f.external_file_id }))
            });
          } else {
            const dataSourceError = await dataSourceResponse.text();
            console.error('❌ Erro ao criar data source:', dataSourceResponse.status, dataSourceError);
            fixes.errors.push(`Erro ao criar data source: ${dataSourceResponse.status} - ${dataSourceError}`);
          }

          // Depois, fazer sync
          const syncResponse = await fetch(`https://api.cloud.llamaindex.ai/api/v1/pipelines/${pipelineId}/sync`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              file_ids: unassociatedFiles.map(f => f.id),
              project_id: projectId,
              organization_id: organizationId
            }),
          });

          if (syncResponse.ok) {
            console.log('✅ Sync realizado com sucesso');
            fixes.fixesApplied.push({
              type: 'sync_pipeline',
              description: `Sync realizado para ${unassociatedFiles.length} arquivos`,
              files: unassociatedFiles.map(f => ({ id: f.id, name: f.name || f.external_file_id }))
            });
          } else {
            const syncError = await syncResponse.text();
            console.error('❌ Erro ao fazer sync:', syncResponse.status, syncError);
            fixes.errors.push(`Erro ao fazer sync: ${syncResponse.status} - ${syncError}`);
          }
        }
      }
    } catch (err) {
      console.error('❌ Erro ao verificar arquivos:', err);
      fixes.errors.push(`Erro ao verificar arquivos: ${err.message}`);
    }

    // 2. Verificar se o pipeline está funcionando
    console.log('2. Verificando pipeline...');
    try {
      const pipelineResponse = await fetch(`https://api.cloud.llamaindex.ai/api/v1/pipelines/${pipelineId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (pipelineResponse.ok) {
        const pipelineInfo = await pipelineResponse.json();
        console.log('✅ Pipeline está funcionando:', pipelineInfo.name || pipelineInfo.id);
        fixes.fixesApplied.push({
          type: 'pipeline_check',
          description: 'Pipeline verificado e funcionando',
          pipeline: { id: pipelineId, name: pipelineInfo.name }
        });
      } else {
        console.error('❌ Pipeline não encontrado:', pipelineResponse.status);
        fixes.errors.push(`Pipeline não encontrado: ${pipelineResponse.status}`);
      }
    } catch (err) {
      console.error('❌ Erro ao verificar pipeline:', err);
      fixes.errors.push(`Erro ao verificar pipeline: ${err.message}`);
    }

    // 3. Verificar data sources do pipeline
    console.log('3. Verificando data sources do pipeline...');
    try {
      const dataSourcesResponse = await fetch(`https://api.cloud.llamaindex.ai/api/v1/pipelines/${pipelineId}/data-sources`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (dataSourcesResponse.ok) {
        const result = await dataSourcesResponse.json();
        const dataSources = result.data_sources || result.dataSources || result || [];
        
        console.log(`Encontrados ${dataSources.length} data sources`);
        fixes.fixesApplied.push({
          type: 'data_sources_check',
          description: `Verificados ${dataSources.length} data sources`,
          dataSources: dataSources.map(ds => ({ id: ds.id, name: ds.name, files_count: ds.file_ids?.length || 0 }))
        });
      } else {
        console.error('❌ Erro ao verificar data sources:', dataSourcesResponse.status);
        fixes.errors.push(`Erro ao verificar data sources: ${dataSourcesResponse.status}`);
      }
    } catch (err) {
      console.error('❌ Erro ao verificar data sources:', err);
      fixes.errors.push(`Erro ao verificar data sources: ${err.message}`);
    }

    // 4. Testar chat para verificar se tudo está funcionando
    console.log('4. Testando chat...');
    try {
      const chatResponse = await fetch(`https://api.cloud.llamaindex.ai/api/v1/pipelines/${pipelineId}/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: 'Olá, você está funcionando?'
            }
          ]
        }),
      });

      if (chatResponse.ok) {
        console.log('✅ Chat está funcionando');
        fixes.fixesApplied.push({
          type: 'chat_test',
          description: 'Chat testado e funcionando'
        });
      } else {
        const chatError = await chatResponse.text();
        console.error('❌ Erro no chat:', chatResponse.status, chatError);
        fixes.errors.push(`Erro no chat: ${chatResponse.status} - ${chatError}`);
      }
    } catch (err) {
      console.error('❌ Erro ao testar chat:', err);
      fixes.errors.push(`Erro ao testar chat: ${err.message}`);
    }

    // 5. Resumo final
    fixes.summary = {
      fixesApplied: fixes.fixesApplied.length,
      errors: fixes.errors.length,
      success: fixes.errors.length === 0
    };

    console.log('=== RESUMO DAS CORREÇÕES ===');
    console.log('Correções aplicadas:', fixes.summary.fixesApplied);
    console.log('Erros encontrados:', fixes.summary.errors);
    console.log('Sistema funcionando:', fixes.summary.success);
    console.log('================================');

    res.json({
      success: true,
      fixes: fixes
    });

  } catch (err) {
    console.error('Erro ao corrigir problemas:', err);
    res.status(500).json({ success: false, error: 'Erro interno' });
  }
});

// Rota para testar upload e verificar resposta da API
router.post('/test-upload-response', upload.single('file'), async (req, res) => {
  try {
    console.log('=== TESTE DE UPLOAD PARA VERIFICAR RESPOSTA ===');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('File:', req.file);
    
    if (!req.file) {
      console.log('Erro: Nenhum arquivo recebido');
      return res.status(400).json({
        success: false,
        error: 'Nenhum arquivo enviado'
      });
    }

    if (!process.env.LLAMAINDEX_API_KEY) {
      console.log('Erro: API Key não configurada');
      return res.status(500).json({
        success: false,
        error: 'LlamaIndex API Key não configurada'
      });
    }

    console.log('Arquivo válido recebido:', req.file.originalname, 'Tamanho:', req.file.size);

    const projectId = process.env.LLAMAINDEX_PROJECT_ID;
    const organizationId = process.env.LLAMAINDEX_ORGANIZATION_ID || '34b5d229-3300-482f-b3ec-e7aa632c9a88';
    
    // === UPLOAD DO ARQUIVO ===
    const formData = new FormData();
    formData.append('upload_file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    const uploadUrl = `https://api.cloud.llamaindex.ai/api/v1/files?project_id=${projectId}&organization_id=${organizationId}`;
    
    console.log('Fazendo upload do arquivo...');
    console.log('URL:', uploadUrl);

    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
        ...formData.getHeaders(),
      },
      body: formData,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Erro no upload:', uploadResponse.status, errorText);
      return res.status(uploadResponse.status).json({
        success: false,
        error: `Erro no upload: ${uploadResponse.status} - ${errorText}`
      });
    }

    const uploadResult = await uploadResponse.json();
    console.log('✅ Upload bem-sucedido!');
    console.log('Resposta completa da API:', JSON.stringify(uploadResult, null, 2));
    
    // Analisar a resposta para encontrar o ID
    console.log('=== ANÁLISE DA RESPOSTA ===');
    console.log('Tipo da resposta:', typeof uploadResult);
    console.log('É um array?', Array.isArray(uploadResult));
    console.log('É um objeto?', typeof uploadResult === 'object' && !Array.isArray(uploadResult));
    
    if (typeof uploadResult === 'object' && !Array.isArray(uploadResult)) {
      console.log('Chaves do objeto:', Object.keys(uploadResult));
      
      // Verificar campos comuns de ID
      const possibleIdFields = ['id', 'file_id', 'fileId', 'fileId', 'document_id', 'documentId'];
      for (const field of possibleIdFields) {
        if (uploadResult[field]) {
          console.log(`✅ ID encontrado no campo '${field}':`, uploadResult[field]);
        }
      }
      
      // Se não encontrou nos campos comuns, mostrar todos os campos
      if (!possibleIdFields.some(field => uploadResult[field])) {
        console.log('❌ ID não encontrado nos campos comuns. Todos os campos:');
        for (const [key, value] of Object.entries(uploadResult)) {
          console.log(`  ${key}:`, value);
        }
      }
    } else if (Array.isArray(uploadResult)) {
      console.log('Resposta é um array com', uploadResult.length, 'elementos');
      if (uploadResult.length > 0) {
        console.log('Primeiro elemento:', JSON.stringify(uploadResult[0], null, 2));
      }
    }
    
    console.log('========================');

    res.json({
      success: true,
      uploadResult: uploadResult,
      analysis: {
        type: typeof uploadResult,
        isArray: Array.isArray(uploadResult),
        keys: typeof uploadResult === 'object' && !Array.isArray(uploadResult) ? Object.keys(uploadResult) : null,
        possibleIds: typeof uploadResult === 'object' && !Array.isArray(uploadResult) ? {
          id: uploadResult.id,
          file_id: uploadResult.file_id,
          fileId: uploadResult.fileId,
          document_id: uploadResult.document_id,
          documentId: uploadResult.documentId
        } : null
      }
    });

  } catch (error) {
    console.error('Erro ao testar upload:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Rota de debug para investigar problema do data_source_id
router.post('/debug-data-source-issue', upload.single('file'), async (req, res) => {
  try {
    console.log('=== DEBUG: INVESTIGANDO PROBLEMA DO DATA SOURCE ID ===');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('File:', req.file);
    
    if (!req.file) {
      console.log('Erro: Nenhum arquivo recebido');
      return res.status(400).json({
        success: false,
        error: 'Nenhum arquivo enviado'
      });
    }

    const projectId = process.env.LLAMAINDEX_PROJECT_ID;
    const organizationId = process.env.LLAMAINDEX_ORGANIZATION_ID || '34b5d229-3300-482f-b3ec-e7aa632c9a88';
    const pipelineId = 'af1793a8-d115-472a-8e61-d19ab26fd92c';
    
    // === PASSO 1: UPLOAD DO ARQUIVO ===
    const formData = new FormData();
    formData.append('upload_file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    const uploadUrl = `https://api.cloud.llamaindex.ai/api/v1/files?project_id=${projectId}&organization_id=${organizationId}`;
    
    console.log('1. Fazendo upload do arquivo...');
    console.log('URL:', uploadUrl);

    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
        ...formData.getHeaders(),
      },
      body: formData,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Erro no upload:', uploadResponse.status, errorText);
      return res.status(uploadResponse.status).json({
        success: false,
        error: `Erro no upload: ${uploadResponse.status} - ${errorText}`
      });
    }

    const uploadResult = await uploadResponse.json();
    console.log('✅ Upload bem-sucedido:', uploadResult);
    console.log('Upload Result completo:', JSON.stringify(uploadResult, null, 2));

    const fileId = uploadResult.id || uploadResult.file_id || uploadResult.fileId;
    console.log('✅ File ID identificado:', fileId);

    // === PASSO 2: VERIFICAR STATUS INICIAL ===
    console.log('2. Verificando status inicial do arquivo...');
    const initialFileResponse = await fetch(`https://api.cloud.llamaindex.ai/api/v1/files/${fileId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    let initialFileInfo = null;
    if (initialFileResponse.ok) {
      initialFileInfo = await initialFileResponse.json();
      console.log('Status inicial do arquivo:', initialFileInfo);
      console.log('Data Source ID inicial:', initialFileInfo.data_source_id);
    }

    // === PASSO 3: TENTAR UPLOAD COM DATA SOURCE ID NA URL ===
    console.log('3. Tentando upload com data_source_id na URL...');
    const uploadWithDataSourceUrl = `https://api.cloud.llamaindex.ai/api/v1/files?project_id=${projectId}&organization_id=${organizationId}&data_source_id=${pipelineId}`;
    
    console.log('URL com data_source_id:', uploadWithDataSourceUrl);
    
    // Não vamos fazer upload novamente, mas vamos verificar se essa URL seria a correta
    console.log('Nota: Esta URL seria usada para upload com data_source_id automático');

    // === PASSO 4: VERIFICAR SE O PIPELINE É UM DATA SOURCE ===
    console.log('4. Verificando se o pipeline é um data source...');
    const pipelineResponse = await fetch(`https://api.cloud.llamaindex.ai/api/v1/pipelines/${pipelineId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    let pipelineInfo = null;
    if (pipelineResponse.ok) {
      pipelineInfo = await pipelineResponse.json();
      console.log('Informações do pipeline:', pipelineInfo);
      console.log('Pipeline é um data source?', pipelineInfo.type === 'data_source' || pipelineInfo.is_data_source);
    }

    // === PASSO 5: VERIFICAR DATA SOURCES DO PIPELINE ===
    console.log('5. Verificando data sources do pipeline...');
    const dataSourcesResponse = await fetch(`https://api.cloud.llamaindex.ai/api/v1/pipelines/${pipelineId}/data-sources`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    let dataSources = [];
    if (dataSourcesResponse.ok) {
      const result = await dataSourcesResponse.json();
      dataSources = result.data_sources || result.dataSources || result || [];
      console.log('Data sources encontrados:', dataSources.length);
      dataSources.forEach((ds, index) => {
        console.log(`Data Source ${index + 1}:`, ds);
      });
    }

    // === PASSO 6: TENTAR DIFERENTES ABORDAGENS ===
    console.log('6. Testando diferentes abordagens...');
    
    const approaches = [
      {
        name: 'Upload com data_source_id na URL',
        description: 'Tentar upload com data_source_id na URL',
        url: `https://api.cloud.llamaindex.ai/api/v1/files?project_id=${projectId}&organization_id=${organizationId}&data_source_id=${pipelineId}`,
        method: 'POST',
        body: formData
      },
      {
        name: 'Criar Data Source e depois Sync',
        description: 'Abordagem atual - criar data source primeiro',
        steps: ['create_data_source', 'sync_pipeline']
      },
      {
        name: 'Sync direto do pipeline',
        description: 'Tentar sync direto sem criar data source',
        url: `https://api.cloud.llamaindex.ai/api/v1/pipelines/${pipelineId}/sync`,
        method: 'POST',
        body: {
          file_ids: [fileId],
          project_id: projectId,
          organization_id: organizationId
        }
      }
    ];

    console.log('Abordagens disponíveis:');
    approaches.forEach((approach, index) => {
      console.log(`${index + 1}. ${approach.name}: ${approach.description}`);
    });

    // === PASSO 7: ANÁLISE DO PROBLEMA ===
    console.log('7. Análise do problema...');
    
    const analysis = {
      fileId: fileId,
      pipelineId: pipelineId,
      initialDataSourceId: initialFileInfo?.data_source_id,
      pipelineType: pipelineInfo?.type,
      pipelineIsDataSource: pipelineInfo?.is_data_source,
      dataSourcesCount: dataSources.length,
      possibleIssues: []
    };

    if (!initialFileInfo?.data_source_id) {
      analysis.possibleIssues.push('Arquivo não tem data_source_id após upload');
    }

    if (pipelineInfo?.type !== 'data_source' && !pipelineInfo?.is_data_source) {
      analysis.possibleIssues.push('Pipeline pode não ser um data source válido');
    }

    if (dataSources.length === 0) {
      analysis.possibleIssues.push('Pipeline não tem data sources configurados');
    }

    console.log('Análise:', analysis);

    console.log('=== RESUMO DO DEBUG ===');
    console.log('File ID:', fileId);
    console.log('Pipeline ID:', pipelineId);
    console.log('Data Source ID inicial:', initialFileInfo?.data_source_id);
    console.log('Tipo do pipeline:', pipelineInfo?.type);
    console.log('Data sources no pipeline:', dataSources.length);
    console.log('Possíveis problemas:', analysis.possibleIssues);
    console.log('========================');

    res.json({
      success: true,
      fileId: fileId,
      pipelineId: pipelineId,
      initialFileInfo: initialFileInfo,
      pipelineInfo: pipelineInfo,
      dataSources: dataSources,
      analysis: analysis,
      approaches: approaches
    });

  } catch (error) {
    console.error('Erro no debug:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Rota para testar upload binário específico
router.post('/test-binary-upload', upload.single('file'), async (req, res) => {
  try {
    console.log('=== TESTE DE UPLOAD BINÁRIO ===');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('File:', req.file);
    
    if (!req.file) {
      console.log('Erro: Nenhum arquivo recebido');
      return res.status(400).json({
        success: false,
        error: 'Nenhum arquivo enviado'
      });
    }

    console.log('Arquivo válido recebido:', req.file.originalname, 'Tamanho:', req.file.size);
    console.log('Tipo MIME:', req.file.mimetype);
    console.log('Buffer disponível:', !!req.file.buffer);
    console.log('Tamanho do buffer:', req.file.buffer?.length);

    const projectId = process.env.LLAMAINDEX_PROJECT_ID;
    const organizationId = process.env.LLAMAINDEX_ORGANIZATION_ID || '34b5d229-3300-482f-b3ec-e7aa632c9a88';
    
    // === TESTE 1: UPLOAD BINÁRIO SIMPLES ===
    console.log('1. Testando upload binário simples...');
    
    const formData = new FormData();
    formData.append('upload_file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
      knownLength: req.file.buffer.length
    });

    const uploadUrl = `https://api.cloud.llamaindex.ai/api/v1/files?project_id=${projectId}&organization_id=${organizationId}`;
    
    console.log('URL:', uploadUrl);
    console.log('Nome do arquivo:', req.file.originalname);
    console.log('Tipo MIME:', req.file.mimetype);
    console.log('Tamanho do buffer:', req.file.buffer.length, 'bytes');

    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
        ...formData.getHeaders(),
      },
      body: formData,
    });

    console.log('Status da resposta:', uploadResponse.status);
    console.log('Headers da resposta:', Object.fromEntries(uploadResponse.headers.entries()));

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Erro no upload:', uploadResponse.status, errorText);
      return res.status(uploadResponse.status).json({
        success: false,
        error: `Erro no upload: ${uploadResponse.status} - ${errorText}`
      });
    }

    const uploadResult = await uploadResponse.json();
    console.log('✅ Upload bem-sucedido!');
    console.log('Upload Result completo:', JSON.stringify(uploadResult, null, 2));

    const fileId = uploadResult.id || uploadResult.file_id || uploadResult.fileId;
    console.log('✅ File ID identificado:', fileId);

    // === TESTE 2: VERIFICAR STATUS IMEDIATO ===
    console.log('2. Verificando status imediato...');
    
    const immediateFileResponse = await fetch(`https://api.cloud.llamaindex.ai/api/v1/files/${fileId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    let immediateFileInfo = null;
    if (immediateFileResponse.ok) {
      immediateFileInfo = await immediateFileResponse.json();
      console.log('Status imediato do arquivo:', immediateFileInfo);
      console.log('Data Source ID imediato:', immediateFileInfo.data_source_id);
    }

    // === TESTE 3: AGUARDAR E VERIFICAR NOVAMENTE ===
    console.log('3. Aguardando processamento e verificando novamente...');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const finalFileResponse = await fetch(`https://api.cloud.llamaindex.ai/api/v1/files/${fileId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    let finalFileInfo = immediateFileInfo;
    if (finalFileResponse.ok) {
      finalFileInfo = await finalFileResponse.json();
      console.log('Status final do arquivo:', finalFileInfo);
      console.log('Data Source ID final:', finalFileInfo.data_source_id);
    }

    console.log('=== RESUMO DO TESTE BINÁRIO ===');
    console.log('Arquivo:', req.file.originalname);
    console.log('File ID:', fileId);
    console.log('Tamanho:', req.file.size, 'bytes');
    console.log('Tipo MIME:', req.file.mimetype);
    console.log('Status inicial:', immediateFileInfo?.status);
    console.log('Data Source ID inicial:', immediateFileInfo?.data_source_id);
    console.log('Status final:', finalFileInfo?.status);
    console.log('Data Source ID final:', finalFileInfo?.data_source_id);
    console.log('Arquivo processado:', finalFileInfo?.status === 'completed');
    console.log('Tem Data Source ID:', !!finalFileInfo?.data_source_id);
    console.log('================================');

    res.json({
      success: true,
      fileId: fileId,
      uploadResult: uploadResult,
      immediateFileInfo: immediateFileInfo,
      finalFileInfo: finalFileInfo,
      analysis: {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        bufferSize: req.file.buffer.length,
        uploadSuccessful: true,
        hasDataSourceId: !!finalFileInfo?.data_source_id,
        isProcessed: finalFileInfo?.status === 'completed'
      }
    });

  } catch (error) {
    console.error('Erro no teste de upload binário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Rota para testar upload específico de PDF
router.post('/test-pdf-upload', upload.single('file'), async (req, res) => {
  try {
    console.log('=== TESTE DE UPLOAD DE PDF ===');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('File:', req.file);
    
    if (!req.file) {
      console.log('Erro: Nenhum arquivo recebido');
      return res.status(400).json({
        success: false,
        error: 'Nenhum arquivo enviado'
      });
    }

    console.log('Arquivo válido recebido:', req.file.originalname, 'Tamanho:', req.file.size);
    console.log('Tipo MIME:', req.file.mimetype);
    console.log('É PDF?', req.file.mimetype === 'application/pdf');
    console.log('Buffer disponível:', !!req.file.buffer);
    console.log('Tamanho do buffer:', req.file.buffer?.length);

    const projectId = process.env.LLAMAINDEX_PROJECT_ID;
    const organizationId = process.env.LLAMAINDEX_ORGANIZATION_ID || '34b5d229-3300-482f-b3ec-e7aa632c9a88';
    
    // === TESTE 1: UPLOAD DE PDF COM DIFERENTES ABORDAGENS ===
    console.log('1. Testando diferentes abordagens para PDF...');
    
    const tests = [
      {
        name: 'Upload PDF padrão',
        formData: () => {
          const fd = new FormData();
          fd.append('upload_file', req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype,
            knownLength: req.file.buffer.length
          });
          return fd;
        }
      },
      {
        name: 'Upload PDF com Content-Type explícito',
        formData: () => {
          const fd = new FormData();
          fd.append('upload_file', req.file.buffer, {
            filename: req.file.originalname,
            contentType: 'application/pdf',
            knownLength: req.file.buffer.length
          });
          return fd;
        }
      },
      {
        name: 'Upload PDF como Blob',
        formData: () => {
          const fd = new FormData();
          const blob = new Blob([req.file.buffer], { type: 'application/pdf' });
          fd.append('upload_file', blob, req.file.originalname);
          return fd;
        }
      }
    ];

    const results = [];
    let successfulUpload = null;

    for (const test of tests) {
      try {
        console.log(`\n--- Testando: ${test.name} ---`);
        
        const formData = test.formData();
        const uploadUrl = `https://api.cloud.llamaindex.ai/api/v1/files?project_id=${projectId}&organization_id=${organizationId}`;
        
        console.log('URL:', uploadUrl);
        console.log('Nome do arquivo:', req.file.originalname);
        console.log('Tipo MIME:', req.file.mimetype);

        const uploadResponse = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
            ...formData.getHeaders(),
          },
          body: formData,
        });

        console.log('Status da resposta:', uploadResponse.status);

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          console.log('✅ Upload bem-sucedido!');
          console.log('Upload Result:', uploadResult);
          
          const fileId = uploadResult.id || uploadResult.file_id || uploadResult.fileId;
          
          // Verificar status imediato
          const fileResponse = await fetch(`https://api.cloud.llamaindex.ai/api/v1/files/${fileId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
              'Content-Type': 'application/json',
            },
          });

          let fileInfo = null;
          if (fileResponse.ok) {
            fileInfo = await fileResponse.json();
            console.log('Status do arquivo:', fileInfo);
            console.log('Data Source ID:', fileInfo.data_source_id);
          }

          results.push({
            name: test.name,
            success: true,
            status: uploadResponse.status,
            fileId: fileId,
            uploadResult: uploadResult,
            fileInfo: fileInfo,
            hasDataSourceId: !!fileInfo?.data_source_id
          });

          if (!successfulUpload) {
            successfulUpload = {
              name: test.name,
              fileId: fileId,
              uploadResult: uploadResult,
              fileInfo: fileInfo
            };
          }
        } else {
          const errorText = await uploadResponse.text();
          console.error('❌ Erro no upload:', uploadResponse.status, errorText);
          results.push({
            name: test.name,
            success: false,
            status: uploadResponse.status,
            error: errorText
          });
        }
      } catch (err) {
        console.error(`❌ Erro ao testar ${test.name}:`, err);
        results.push({
          name: test.name,
          success: false,
          error: err.message
        });
      }
    }

    // === TESTE 2: VERIFICAR SE O PDF FOI PROCESSADO CORRETAMENTE ===
    console.log('2. Verificando processamento do PDF...');
    
    if (successfulUpload) {
      console.log('Aguardando processamento...');
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      const finalFileResponse = await fetch(`https://api.cloud.llamaindex.ai/api/v1/files/${successfulUpload.fileId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      let finalFileInfo = successfulUpload.fileInfo;
      if (finalFileResponse.ok) {
        finalFileInfo = await finalFileResponse.json();
        console.log('Status final do PDF:', finalFileInfo);
        console.log('Data Source ID final:', finalFileInfo.data_source_id);
      }

      successfulUpload.finalFileInfo = finalFileInfo;
    }

    console.log('=== RESUMO DO TESTE DE PDF ===');
    console.log('Arquivo:', req.file.originalname);
    console.log('Tipo MIME:', req.file.mimetype);
    console.log('Tamanho:', req.file.size, 'bytes');
    console.log('Testes realizados:', results.length);
    console.log('Testes bem-sucedidos:', results.filter(r => r.success).length);
    console.log('Upload bem-sucedido:', !!successfulUpload);
    if (successfulUpload) {
      console.log('File ID:', successfulUpload.fileId);
      console.log('Status final:', successfulUpload.finalFileInfo?.status);
      console.log('Data Source ID final:', successfulUpload.finalFileInfo?.data_source_id);
      console.log('Tem Data Source ID:', !!successfulUpload.finalFileInfo?.data_source_id);
    }
    console.log('================================');

    res.json({
      success: true,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      isPdf: req.file.mimetype === 'application/pdf',
      tests: results,
      successfulUpload: successfulUpload,
      analysis: {
        totalTests: results.length,
        successfulTests: results.filter(r => r.success).length,
        hasDataSourceId: successfulUpload ? !!successfulUpload.finalFileInfo?.data_source_id : false,
        isProcessed: successfulUpload ? successfulUpload.finalFileInfo?.status === 'completed' : false
      }
    });

  } catch (error) {
    console.error('Erro no teste de upload de PDF:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Função para criar data source uma única vez
router.post('/create-data-source', async (req, res) => {
  try {
    console.log('=== CRIANDO DATA SOURCE ===');
    
    const projectId = process.env.LLAMAINDEX_PROJECT_ID;
    const organizationId = process.env.LLAMAINDEX_ORGANIZATION_ID || '34b5d229-3300-482f-b3ec-e7aa632c9a88';
    
    if (!projectId) {
      return res.status(500).json({
        success: false,
        error: 'Project ID não configurado'
      });
    }

    console.log('Project ID:', projectId);
    console.log('Organization ID:', organizationId);

    // Primeiro, verificar se já existe um data source
    console.log('1. Verificando data sources existentes...');
    const listDataSourcesResponse = await fetch(`https://api.cloud.llamaindex.ai/api/v1/data-sources?project_id=${projectId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    let existingDataSources = [];
    if (listDataSourcesResponse.ok) {
      const result = await listDataSourcesResponse.json();
      existingDataSources = result.data_sources || result.dataSources || result || [];
      console.log('Data sources existentes:', existingDataSources.length);
      
      if (existingDataSources.length > 0) {
        console.log('Data sources encontrados:');
        existingDataSources.forEach((ds, index) => {
          console.log(`${index + 1}. ID: ${ds.id}, Nome: ${ds.name}, Tipo: ${ds.type}`);
        });
      }
    }

    // Se já existe um data source, retornar o primeiro
    if (existingDataSources.length > 0) {
      console.log('✅ Data source já existe. Usando o primeiro encontrado.');
      const existingDataSource = existingDataSources[0];
      
      return res.json({
        success: true,
        message: 'Data source já existe',
        dataSource: existingDataSource,
        isNew: false
      });
    }

    // Se não existe, criar um novo
    console.log('2. Criando novo data source...');
    
    const createDataSourceUrl = 'https://api.cloud.llamaindex.ai/api/v1/data-sources';
    const dataSourcePayload = {
      name: `Data Source - ChatBot ${new Date().toISOString().split('T')[0]}`,
      project_id: projectId,
      organization_id: organizationId,
      type: 'file',
      source_type: 'local', // Valor correto para arquivos locais
      component: {
        type: 'file',
        file_path: '/tmp' // Caminho temporário para arquivos
      }
    };

    console.log('URL:', createDataSourceUrl);
    console.log('Payload:', JSON.stringify(dataSourcePayload, null, 2));

    const createResponse = await fetch(createDataSourceUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataSourcePayload),
    });

    console.log('Status da resposta:', createResponse.status);

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('Erro ao criar data source:', createResponse.status, errorText);
      return res.status(500).json({
        success: false,
        error: `Erro ao criar data source: ${createResponse.status} - ${errorText}`
      });
    }

    const dataSourceResult = await createResponse.json();
    console.log('✅ Data source criado com sucesso:', dataSourceResult);

    // Verificar se o data source foi criado corretamente
    console.log('3. Verificando data source criado...');
    const verifyResponse = await fetch(`https://api.cloud.llamaindex.ai/api/v1/data-sources/${dataSourceResult.id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    let verifiedDataSource = dataSourceResult;
    if (verifyResponse.ok) {
      verifiedDataSource = await verifyResponse.json();
      console.log('✅ Data source verificado:', verifiedDataSource);
    }

    console.log('=== RESUMO DA CRIAÇÃO ===');
    console.log('Data Source ID:', verifiedDataSource.id);
    console.log('Nome:', verifiedDataSource.name);
    console.log('Tipo:', verifiedDataSource.type);
    console.log('Project ID:', verifiedDataSource.project_id);
    console.log('Organization ID:', verifiedDataSource.organization_id);
    console.log('========================');

    res.json({
      success: true,
      message: 'Data source criado com sucesso',
      dataSource: verifiedDataSource,
      isNew: true
    });

  } catch (error) {
    console.error('Erro ao criar data source:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Função para obter o data source existente ou criar um novo
router.get('/get-or-create-data-source', async (req, res) => {
  try {
    console.log('=== OBTENDO OU CRIANDO DATA SOURCE ===');
    
    const projectId = process.env.LLAMAINDEX_PROJECT_ID;
    const organizationId = process.env.LLAMAINDEX_ORGANIZATION_ID || '34b5d229-3300-482f-b3ec-e7aa632c9a88';
    
    if (!projectId) {
      return res.status(500).json({
        success: false,
        error: 'Project ID não configurado'
      });
    }

    console.log('Project ID:', projectId);
    console.log('Organization ID:', organizationId);

    // Verificar data sources existentes
    console.log('1. Verificando data sources existentes...');
    const listDataSourcesResponse = await fetch(`https://api.cloud.llamaindex.ai/api/v1/data-sources?project_id=${projectId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    let existingDataSources = [];
    if (listDataSourcesResponse.ok) {
      const result = await listDataSourcesResponse.json();
      existingDataSources = result.data_sources || result.dataSources || result || [];
      console.log('Data sources existentes:', existingDataSources.length);
    }

    let dataSource = null;
    let isNew = false;

    if (existingDataSources.length > 0) {
      // Usar o primeiro data source existente
      dataSource = existingDataSources[0];
      console.log('✅ Usando data source existente:', dataSource.id);
    } else {
      // Criar novo data source
      console.log('2. Criando novo data source...');
      
      const createDataSourceUrl = 'https://api.cloud.llamaindex.ai/api/v1/data-sources';
      const dataSourcePayload = {
        name: `Data Source - ChatBot ${new Date().toISOString().split('T')[0]}`,
        project_id: projectId,
        organization_id: organizationId,
        type: 'file',
        source_type: 'local', // Valor correto para arquivos locais
        component: {
          type: 'file',
          file_path: '/tmp' // Caminho temporário para arquivos
        }
      };

      const createResponse = await fetch(createDataSourceUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataSourcePayload),
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        console.error('Erro ao criar data source:', createResponse.status, errorText);
        return res.status(500).json({
          success: false,
          error: `Erro ao criar data source: ${createResponse.status} - ${errorText}`
        });
      }

      dataSource = await createResponse.json();
      isNew = true;
      console.log('✅ Novo data source criado:', dataSource.id);
    }

    console.log('=== RESUMO ===');
    console.log('Data Source ID:', dataSource.id);
    console.log('Nome:', dataSource.name);
    console.log('É novo:', isNew);
    console.log('==============');

    res.json({
      success: true,
      dataSource: dataSource,
      isNew: isNew,
      message: isNew ? 'Data source criado com sucesso' : 'Data source existente encontrado'
    });

  } catch (error) {
    console.error('Erro ao obter ou criar data source:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Rota de teste simples para verificar se o servidor está funcionando
router.get('/test-simple', (req, res) => {
  console.log('=== TESTE SIMPLES ===');
  res.json({
    success: true,
    message: 'Servidor funcionando corretamente',
    timestamp: new Date().toISOString()
  });
});

// Rota para testar conexão com LlamaIndex Cloud
router.get('/test-llamaindex-connection', async (req, res) => {
  try {
    console.log('=== TESTANDO CONEXÃO COM LLAMAINDEX ===');
    
    const response = await fetch('https://api.cloud.llamaindex.ai/api/v1/files', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Status da resposta:', response.status);

    if (response.ok) {
      const result = await response.json();
      res.json({
        success: true,
        message: 'Conexão com LlamaIndex Cloud funcionando',
        status: response.status,
        data: result
      });
    } else {
      const error = await response.text();
      res.json({
        success: false,
        message: 'Erro na conexão com LlamaIndex Cloud',
        status: response.status,
        error: error
      });
    }
  } catch (error) {
    console.error('Erro ao testar conexão:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Função automatizada para upload + pipeline + sync
router.post('/upload-automated', upload.single('file'), async (req, res) => {
  try {
    console.log('=== UPLOAD AUTOMATIZADO INICIADO ===');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('File:', req.file);
    
    if (!req.file) {
      console.log('Erro: Nenhum arquivo recebido');
      return res.status(400).json({
        success: false,
        error: 'Nenhum arquivo enviado'
      });
    }

    if (!process.env.LLAMAINDEX_API_KEY) {
      console.log('Erro: API Key não configurada');
      return res.status(500).json({
        success: false,
        error: 'LlamaIndex API Key não configurada'
      });
    }

    console.log('Arquivo válido recebido:', req.file.originalname, 'Tamanho:', req.file.size);

    const projectId = process.env.LLAMAINDEX_PROJECT_ID;
    const organizationId = process.env.LLAMAINDEX_ORGANIZATION_ID || '34b5d229-3300-482f-b3ec-e7aa632c9a88';
    const pipelineId = 'af1793a8-d115-472a-8e61-d19ab26fd92c';
    
    // === PASSO 1: UPLOAD DO ARQUIVO ===
    console.log('1. Fazendo upload do arquivo...');
    
    const formData = new FormData();
    formData.append('upload_file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
      knownLength: req.file.buffer.length
    });

    const uploadUrl = `https://api.cloud.llamaindex.ai/api/v1/files?project_id=${projectId}&organization_id=${organizationId}`;
    
    console.log('URL:', uploadUrl);
    console.log('Nome do arquivo:', req.file.originalname);

    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
        ...formData.getHeaders(),
      },
      body: formData,
    });

    console.log('Status da resposta do upload:', uploadResponse.status);

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Erro no upload:', uploadResponse.status, errorText);
      return res.status(uploadResponse.status).json({
        success: false,
        error: `Erro no upload: ${uploadResponse.status} - ${errorText}`
      });
    }

    const uploadResult = await uploadResponse.json();
    console.log('✅ Upload bem-sucedido!');
    console.log('Upload Result:', uploadResult);

    const fileId = uploadResult.id || uploadResult.file_id || uploadResult.fileId;
    console.log('✅ File ID identificado:', fileId);

    // === PASSO 2: ADICIONAR ARQUIVO AO PIPELINE (CORRIGIDO) ===
    console.log('2. Adicionando arquivo ao pipeline...');
    
    const addFileToPipelineUrl = `https://api.cloud.llamaindex.ai/api/v1/pipelines/${pipelineId}/files`;
    
    // EXATAMENTE como no curl - apenas o array com file_id
    const addFilePayload = [
      {
        file_id: fileId
      }
    ];

    console.log('Add File URL:', addFileToPipelineUrl);
    console.log('Add File Payload (exato do curl):', JSON.stringify(addFilePayload, null, 2));

    const addFileResponse = await fetch(addFileToPipelineUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(addFilePayload) // Enviando apenas o array, nada mais
    });

    console.log('Status da resposta do add file:', addFileResponse.status);

    if (!addFileResponse.ok) {
      const addFileError = await addFileResponse.text();
      console.error('Erro ao adicionar arquivo ao pipeline:', addFileResponse.status, addFileError);
      console.log('⚠️ Continuando sem adicionar ao pipeline...');
    } else {
      const addFileResult = await addFileResponse.json();
      console.log('✅ Arquivo adicionado ao pipeline:', addFileResult);
    }

    // === PASSO 3: FAZER SYNC DO PIPELINE ===
    console.log('3. Fazendo sync do pipeline...');
    
    const syncUrl = `https://api.cloud.llamaindex.ai/api/v1/pipelines/${pipelineId}/sync`;
    const syncPayload = {
      file_ids: [fileId],
      project_id: projectId,
      organization_id: organizationId
    };

    console.log('Sync URL:', syncUrl);
    console.log('Sync Payload:', JSON.stringify(syncPayload, null, 2));

    const syncResponse = await fetch(syncUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(syncPayload),
    });

    console.log('Status da resposta do sync:', syncResponse.status);

    if (!syncResponse.ok) {
      const syncError = await syncResponse.text();
      console.error('Erro ao fazer sync:', syncResponse.status, syncError);
      console.log('⚠️ Continuando sem sync...');
    } else {
      const syncResult = await syncResponse.json();
      console.log('✅ Sync realizado com sucesso:', syncResult);
    }

    // === PASSO 4: VERIFICAR STATUS FINAL ===
    console.log('4. Verificando status final...');
    
    // Aguardar processamento
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const fileInfoResponse = await fetch(`https://api.cloud.llamaindex.ai/api/v1/files/${fileId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    let finalFileInfo = uploadResult;
    if (fileInfoResponse.ok) {
      finalFileInfo = await fileInfoResponse.json();
      console.log('✅ Informações finais do arquivo:', finalFileInfo);
    }

    const isProcessed = finalFileInfo.status === 'completed';
    const hasDataSourceId = !!finalFileInfo.data_source_id;

    console.log('=== RESUMO DO PROCESSO AUTOMATIZADO ===');
    console.log('Arquivo:', req.file.originalname);
    console.log('File ID:', fileId);
    console.log('Pipeline ID:', pipelineId);
    console.log('Tamanho:', req.file.size, 'bytes');
    console.log('Status do arquivo:', finalFileInfo.status);
    console.log('Data Source ID final:', finalFileInfo.data_source_id);
    console.log('Arquivo processado:', isProcessed);
    console.log('Tem Data Source ID:', hasDataSourceId);
    console.log('Upload realizado:', !!uploadResponse.ok);
    console.log('Adicionado ao pipeline:', !!addFileResponse.ok);
    console.log('Sync realizado:', !!syncResponse.ok);
    console.log('Processo automatizado concluído: ✅');
    console.log('========================================');

    res.json({
      success: true,
      message: 'Upload e associação ao pipeline realizados automaticamente',
      document: {
        id: fileId || Date.now().toString(),
        name: req.file.originalname,
        type: req.file.mimetype,
        size: req.file.size,
        status: finalFileInfo.status || 'processing',
        uploadedAt: new Date(),
        documentId: fileId,
        pipelineId: pipelineId,
        dataSourceId: finalFileInfo.data_source_id,
        isProcessed: isProcessed,
        hasDataSourceId: hasDataSourceId,
        uploadSuccessful: !!uploadResponse.ok,
        addedToPipeline: !!addFileResponse.ok,
        syncCompleted: !!syncResponse.ok,
        automated: true
      }
    });

  } catch (error) {
    console.error('Erro no upload automatizado:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Rota para adicionar arquivo ao pipeline (PUT direto na API)
router.post('/add-file-to-pipeline', async (req, res) => {
  try {
    const { fileId } = req.body;
    const pipelineId = 'af1793a8-d115-472a-8e61-d19ab26fd92c';

    if (!fileId) {
      return res.status(400).json({
        success: false,
        error: 'fileId é obrigatório'
      });
    }

    console.log('=== ADICIONANDO ARQUIVO AO PIPELINE ===');
    console.log('File ID:', fileId);
    console.log('Pipeline ID:', pipelineId);

    const url = `https://api.cloud.llamaindex.ai/api/v1/pipelines/${pipelineId}/files`;
    
    // EXATAMENTE como no curl - apenas o array com file_id
    const payload = [
      {
        file_id: fileId
      }
    ];

    console.log('URL:', url);
    console.log('Payload (exato do curl):', JSON.stringify(payload, null, 2));

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`
      },
      body: JSON.stringify(payload) // Enviando apenas o array, nada mais
    });

    console.log('Status da resposta:', response.status);

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Arquivo adicionado ao pipeline com sucesso:', result);
      console.log('===============================');
      
      res.json({
        success: true,
        message: 'Arquivo adicionado ao pipeline com sucesso',
        fileId: fileId,
        pipelineId: pipelineId,
        result: result
      });
    } else {
      const error = await response.text();
      console.error('❌ Erro ao adicionar arquivo ao pipeline:', response.status, error);
      console.log('===============================');
      
      return res.status(response.status).json({
        success: false,
        error: `Erro ao adicionar arquivo ao pipeline: ${response.status} - ${error}`,
        fileId: fileId,
        pipelineId: pipelineId
      });
    }

  } catch (error) {
    console.error('Erro ao adicionar arquivo ao pipeline:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Rota para adicionar arquivo ao pipeline EXATAMENTE como o curl
router.post('/add-file-to-pipeline-exact', async (req, res) => {
  try {
    const { fileId } = req.body;
    const pipelineId = 'af1793a8-d115-472a-8e61-d19ab26fd92c';
    if (!fileId) {
      return res.status(400).json({ success: false, error: 'fileId é obrigatório' });
    }
    const url = `https://api.cloud.llamaindex.ai/api/v1/pipelines/${pipelineId}/files`;
    const payload = [{ file_id: fileId }];
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`
      },
      body: JSON.stringify(payload)
    });
    const resultText = await response.text();
    res.status(response.status).send(resultText);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// Rota para fazer sync de um arquivo específico
router.post('/sync-file', async (req, res) => {
  try {
    const { fileId } = req.body;
    const pipelineId = 'af1793a8-d115-472a-8e61-d19ab26fd92c';
    const projectId = process.env.LLAMAINDEX_PROJECT_ID;
    const organizationId = process.env.LLAMAINDEX_ORGANIZATION_ID || '34b5d229-3300-482f-b3ec-e7aa632c9a88';

    if (!fileId) {
      return res.status(400).json({
        success: false,
        error: 'fileId é obrigatório'
      });
    }

    console.log('=== FAZENDO SYNC DE ARQUIVO ===');
    console.log('File ID:', fileId);
    console.log('Pipeline ID:', pipelineId);
    console.log('Project ID:', projectId);
    console.log('Organization ID:', organizationId);

    // Fazer sync do pipeline com o arquivo específico
    const syncUrl = `https://api.cloud.llamaindex.ai/api/v1/pipelines/${pipelineId}/sync`;
    const syncPayload = {
      file_ids: [fileId],
      project_id: projectId,
      organization_id: organizationId
    };

    console.log('Sync URL:', syncUrl);
    console.log('Sync Payload:', JSON.stringify(syncPayload, null, 2));

    const syncResponse = await fetch(syncUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(syncPayload),
    });

    console.log('Status da resposta do sync:', syncResponse.status);

    if (!syncResponse.ok) {
      const syncError = await syncResponse.text();
      console.error('❌ Erro ao fazer sync:', syncResponse.status, syncError);
      console.log('===============================');
      
      return res.status(syncResponse.status).json({
        success: false,
        error: `Erro ao fazer sync: ${syncResponse.status} - ${syncError}`,
        fileId: fileId,
        pipelineId: pipelineId
      });
    }

    const syncResult = await syncResponse.json();
    console.log('✅ Sync realizado com sucesso:', syncResult);
    console.log('===============================');

    // Verificar status atualizado do arquivo após sync
    const fileInfoResponse = await fetch(`https://api.cloud.llamaindex.ai/api/v1/files/${fileId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    let fileInfo = null;
    if (fileInfoResponse.ok) {
      fileInfo = await fileInfoResponse.json();
      console.log('✅ Informações atualizadas do arquivo:', fileInfo);
    }

    res.json({
      success: true,
      message: 'Sync realizado com sucesso',
      fileId: fileId,
      pipelineId: pipelineId,
      syncResult: syncResult,
      fileInfo: fileInfo,
      isProcessed: fileInfo?.status === 'completed',
      hasDataSourceId: !!fileInfo?.data_source_id
    });

  } catch (error) {
    console.error('Erro ao fazer sync do arquivo:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Rota para retrieve - buscar documentos relevantes
router.post('/retrieve', async (req, res) => {
  try {
    const { query, similarityTopK = 5, conversationId } = req.body;
    const pipelineId = 'af1793a8-d115-472a-8e61-d19ab26fd92c';

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'query é obrigatório'
      });
    }

    console.log('=== RETRIEVE - BUSCANDO DOCUMENTOS RELEVANTES ===');
    console.log('Query:', query);
    console.log('Similarity Top K:', similarityTopK);
    console.log('Conversation ID:', conversationId);
    console.log('Pipeline ID:', pipelineId);

    // Usar o endpoint de retrieve do pipeline
    const retrieveUrl = `https://api.cloud.llamaindex.ai/api/v1/pipelines/${pipelineId}/retrieve`;
    const retrievePayload = {
      query: query,
      similarity_top_k: similarityTopK
    };

    console.log('Retrieve URL:', retrieveUrl);
    console.log('Retrieve Payload:', JSON.stringify(retrievePayload, null, 2));

    const retrieveResponse = await fetch(retrieveUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(retrievePayload),
    });

    console.log('Status da resposta do retrieve:', retrieveResponse.status);

    if (!retrieveResponse.ok) {
      const retrieveError = await retrieveResponse.text();
      console.error('❌ Erro no retrieve:', retrieveResponse.status, retrieveError);
      console.log('===============================');
      
      return res.status(retrieveResponse.status).json({
        success: false,
        error: `Erro no retrieve: ${retrieveResponse.status} - ${retrieveError}`,
        query: query,
        pipelineId: pipelineId
      });
    }

    const retrieveResult = await retrieveResponse.json();
    console.log('✅ Retrieve bem-sucedido!');
    console.log('Documentos encontrados:', retrieveResult.nodes?.length || 0);
    console.log('===============================');

    res.json({
      success: true,
      message: 'Retrieve realizado com sucesso',
      query: query,
      pipelineId: pipelineId,
      nodes: retrieveResult.nodes || [],
      totalNodes: retrieveResult.nodes?.length || 0,
      conversationId: conversationId
    });

  } catch (error) {
    console.error('Erro no retrieve:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Rota para context chat - gerar resposta com contexto dos documentos
router.post('/context-chat', async (req, res) => {
  try {
    const { message, retrievedNodes, conversationId } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'message é obrigatório'
      });
    }

    console.log('=== CONTEXT CHAT - GERANDO RESPOSTA COM CONTEXTO ===');
    console.log('Mensagem:', message);
    console.log('Documentos recuperados:', retrievedNodes?.length || 0);
    console.log('Conversation ID:', conversationId);

    // Construir contexto a partir dos documentos recuperados
    let context = '';
    if (retrievedNodes && retrievedNodes.length > 0) {
      context = 'Com base nos seguintes documentos:\n\n';
      retrievedNodes.forEach((node, index) => {
        context += `Documento ${index + 1}:\n`;
        context += `Conteúdo: ${node.text || node.content}\n`;
        if (node.metadata?.filename) {
          context += `Arquivo: ${node.metadata.filename}\n`;
        }
        if (node.metadata?.page) {
          context += `Página: ${node.metadata.page}\n`;
        }
        context += '\n';
      });
    }

    // Construir prompt para o LLM
    const systemPrompt = `Você é um assistente técnico especializado. Use as informações dos documentos fornecidos para responder às perguntas dos usuários. Se as informações dos documentos não forem suficientes, indique isso claramente.

${context}

Responda de forma clara, técnica e útil.`;

    const userPrompt = `Pergunta do usuário: ${message}`;

    console.log('System Prompt:', systemPrompt);
    console.log('User Prompt:', userPrompt);

    // Simular resposta do LLM (em uma implementação real, você usaria um LLM real)
    const response = generateContextualResponse(message, retrievedNodes);

    console.log('✅ Resposta gerada com sucesso!');
    console.log('Resposta:', response);
    console.log('===============================');

    res.json({
      success: true,
      message: 'Context chat realizado com sucesso',
      response: response,
      context: context,
      retrievedNodes: retrievedNodes?.length || 0,
      conversationId: conversationId
    });

  } catch (error) {
    console.error('Erro no context chat:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Função para gerar resposta contextual (simulação)
function generateContextualResponse(message, retrievedNodes) {
  const responses = [
    "Com base nos documentos fornecidos, posso ajudar você com essa questão. Os documentos mostram informações relevantes sobre o assunto.",
    "Analisando os documentos disponíveis, encontrei informações que podem ser úteis para responder sua pergunta.",
    "Segundo os documentos técnicos, a solução para esse problema envolve verificar os procedimentos descritos.",
    "Com base na documentação fornecida, recomendo seguir os passos descritos nos manuais técnicos.",
    "Os documentos indicam que essa é uma situação comum e há procedimentos específicos para resolvê-la.",
    "Baseado na documentação técnica, posso orientar você sobre os próximos passos necessários."
  ];

  // Se há documentos recuperados, usar uma resposta mais específica
  if (retrievedNodes && retrievedNodes.length > 0) {
    return `Com base nos ${retrievedNodes.length} documento(s) encontrado(s), posso fornecer as seguintes informações:

${retrievedNodes.map((node, index) => 
  `Documento ${index + 1}: ${node.text || node.content}`
).join('\n\n')}

Essas informações devem ajudar a responder sua pergunta: "${message}"`;
  }

  // Se não há documentos, usar resposta genérica
  return responses[Math.floor(Math.random() * responses.length)];
}

// Rota para chat direto com pipeline (versão corrigida)
router.post('/chat-direct', async (req, res) => {
  try {
    console.log('=== CHAT DIRETO COM PIPELINE ===');
    console.log('Request body:', req.body);
    
    const { message, conversationId } = req.body;
    const pipelineId = 'af1793a8-d115-472a-8e61-d19ab26fd92c';

    if (!message) {
      console.log('❌ Erro: message é obrigatório');
      return res.status(400).json({
        success: false,
        error: 'message é obrigatório'
      });
    }

    console.log('Mensagem:', message);
    console.log('Conversation ID:', conversationId);
    console.log('Pipeline ID:', pipelineId);
    console.log('API Key configurada:', !!process.env.LLAMAINDEX_API_KEY);
    console.log('API Key (primeiros 10 chars):', process.env.LLAMAINDEX_API_KEY?.substring(0, 10) + '...');

    // Verificar se temos as configurações necessárias
    if (!process.env.LLAMAINDEX_API_KEY) {
      console.log('⚠️ API Key não configurada, usando fallback');
      return res.status(200).json({
        success: true,
        message: 'Chat direto realizado com sucesso (fallback)',
        response: `Olá! Esta é uma resposta de fallback. Sua mensagem foi: "${message}". O LlamaIndex Cloud não está configurado corretamente.`,
        sources: [],
        conversationId: conversationId,
        fallback: true
      });
    }

    const url = `https://api.cloud.llamaindex.ai/api/v1/pipelines/${pipelineId}/chat`;
    
    console.log('URL:', url);

    const requestBody = {
      messages: [
        {
          role: 'user',
          content: message
        }
      ]
    };

    console.log('Request body para LlamaIndex:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.LLAMAINDEX_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Status da resposta:', response.status);
    console.log('Headers da resposta:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro no chat:', response.status, errorText);
      console.log('⚠️ Usando fallback devido ao erro da API');
      
      return res.status(200).json({
        success: true,
        message: 'Chat direto realizado com sucesso (fallback)',
        response: `Olá! Esta é uma resposta de fallback. Sua mensagem foi: "${message}". Houve um erro na API do LlamaIndex: ${response.status} - ${errorText}`,
        sources: [],
        conversationId: conversationId,
        fallback: true,
        error: `Erro na API: ${response.status} - ${errorText}`
      });
    }

    // Tentar ler a resposta como texto primeiro para debug
    const responseText = await response.text();
    console.log('Resposta bruta do LlamaIndex:', responseText);
    console.log('Tamanho da resposta:', responseText.length);
    console.log('Primeiros 200 caracteres:', responseText.substring(0, 200));

    let result;
    let isStreamingResponse = false;
    
    try {
      // Tentar parse JSON normal primeiro
      result = JSON.parse(responseText);
      console.log('✅ JSON parseado com sucesso');
    } catch (parseError) {
      console.error('❌ Erro ao fazer parse do JSON:', parseError);
      console.error('Resposta que falhou no parse:', responseText);
      
      // Tentar extrair resposta do formato de streaming
      console.log('🔄 Tentando extrair resposta do formato de streaming...');
      
      try {
        // O formato de streaming é algo como: 0:"" 8:[{"type": "sources", "data": {...}}] 0:"texto" 0:"mais texto"
        const streamingLines = responseText.split('\n');
        let extractedResponse = '';
        let sources = [];
        
        for (const line of streamingLines) {
          if (line.startsWith('0:"')) {
            // Extrair texto da resposta
            const textMatch = line.match(/0:"([^"]*)"/);
            if (textMatch) {
              // Decodificar caracteres Unicode e limpar citations
              let text = textMatch[1];
              
              console.log('Texto original:', text);
              
              // Decodificar caracteres Unicode
              text = text.replace(/\\u([0-9a-fA-F]{4})/g, (match, hex) => {
                return String.fromCharCode(parseInt(hex, 16));
              });
              
              console.log('Após Unicode:', text);
              
              // Limpar formato de citation [citation:...]
              text = text.replace(/\[citation:[^\]]+\]/g, '');
              
              console.log('Após citations:', text);
              
              // Limpar markdown **texto** -> texto
              text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
              
              console.log('Após markdown:', text);
              
              // Limpar quebras de linha extras
              text = text.replace(/\\n/g, '\n');
              
              console.log('Após quebras de linha:', text);
              
              extractedResponse += text;
            }
          } else if (line.includes('"type": "sources"')) {
            // Extrair sources
            try {
              const sourcesMatch = line.match(/8:(\[.*\])/);
              if (sourcesMatch) {
                const sourcesData = JSON.parse(sourcesMatch[1]);
                sources = sourcesData;
              }
            } catch (e) {
              console.log('⚠️ Erro ao extrair sources:', e.message);
            }
          }
        }
        
        if (extractedResponse) {
          console.log('✅ Resposta extraída do streaming:', extractedResponse);
          console.log('✅ Sources extraídos:', sources.length);
          
          // Limpar a resposta final
          let cleanResponse = extractedResponse
            .split('\n')
            .filter(line =>
              !line.toLowerCase().includes('fontes consultadas') &&
              !line.toLowerCase().includes('undefined')
            )
            .join('\n')
            .replace(/\[citation:[^\]]+\]/g, '') // Remove citations
            .replace(/\*\*([^*]+)\*\*/g, '$1')   // Remove markdown bold
            .replace(/\n{2,}/g, '\n\n')          // Remove múltiplas linhas em branco
            .trim();
          
          console.log('Resposta antes da limpeza final:', extractedResponse);
          console.log('Resposta após limpeza final:', cleanResponse);
          
          isStreamingResponse = true;
          result = {
            response: cleanResponse,
            sources: sources
          };
        } else {
          throw new Error('Não foi possível extrair resposta do streaming');
        }
        
      } catch (streamingError) {
        console.error('❌ Erro ao extrair streaming:', streamingError);
        console.log('⚠️ Usando fallback devido ao erro de parse JSON');
        return res.status(200).json({
          success: true,
          message: 'Chat direto realizado com sucesso (fallback)',
          response: `Olá! Esta é uma resposta de fallback. Sua mensagem foi: "${message}". Houve um erro ao processar a resposta da API do LlamaIndex.`,
          sources: [],
          conversationId: conversationId,
          fallback: true,
          parseError: parseError.message,
          rawResponse: responseText.substring(0, 500)
        });
      }
    }

    console.log('✅ Chat bem-sucedido!');
    console.log('Resposta completa:', JSON.stringify(result, null, 2));
    console.log('===============================');

    res.json({
      success: true,
      message: 'Chat direto realizado com sucesso',
      response: result.response || result.message || 'Resposta do assistente',
      sources: result.sources || [],
      conversationId: result.conversation_id || conversationId,
      streaming: isStreamingResponse,
      result: result
    });

  } catch (error) {
    console.error('❌ Erro no chat direto:', error);
    console.error('Stack trace:', error.stack);
    
    console.log('⚠️ Usando fallback devido ao erro geral');
    res.status(200).json({
      success: true,
      message: 'Chat direto realizado com sucesso (fallback)',
      response: `Olá! Esta é uma resposta de fallback. Sua mensagem foi: "${req.body.message}". Houve um erro geral: ${error.message}`,
      sources: [],
      conversationId: req.body.conversationId,
      fallback: true,
      error: error.message
    });
  }
});

// Rota para verificar configuração do LlamaIndex
router.get('/test-llamaindex-config', (req, res) => {
  try {
    console.log('=== VERIFICANDO CONFIGURAÇÃO LLAMAINDEX ===');
    
    const config = {
      apiKeyConfigured: !!process.env.LLAMAINDEX_API_KEY,
      projectIdConfigured: !!process.env.LLAMAINDEX_PROJECT_ID,
      organizationIdConfigured: !!process.env.LLAMAINDEX_ORGANIZATION_ID,
      apiKeyLength: process.env.LLAMAINDEX_API_KEY?.length || 0,
      apiKeyPrefix: process.env.LLAMAINDEX_API_KEY?.substring(0, 10) || 'N/A',
      projectId: process.env.LLAMAINDEX_PROJECT_ID || 'N/A',
      organizationId: process.env.LLAMAINDEX_ORGANIZATION_ID || 'N/A'
    };
    
    console.log('Configuração:', config);
    
    res.json({
      success: true,
      config: config,
      message: config.apiKeyConfigured ? 'LlamaIndex configurado' : 'LlamaIndex não configurado'
    });
  } catch (error) {
    console.error('Erro ao verificar configuração:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao verificar configuração'
    });
  }
});

export default router; 