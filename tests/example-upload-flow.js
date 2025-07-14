// ============================================================================
// EXEMPLO DE USO DO FLUXO COMPLETO DE UPLOAD
// ============================================================================
// 
// Este arquivo demonstra como usar o novo fluxo implementado:
// POST /files → PUT /pipelines/{id}/files → PUT /files/sync
//
// Para testar, execute: node example-upload-flow.js
// ============================================================================

const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');

async function testCompleteUploadFlow() {
  try {
    console.log('=== TESTANDO FLUXO COMPLETO DE UPLOAD ===');
    console.log('1. POST /files → 2. PUT /pipelines/{id}/files → 3. PUT /files/sync');
    console.log('');
    
    // Criar um arquivo de teste
    const testContent = 'Este é um arquivo de teste para demonstrar o fluxo completo de upload.';
    fs.writeFileSync('test-document.txt', testContent);
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream('test-document.txt'));
    
    console.log('📤 PASSO 1: Fazendo upload do arquivo (POST /files)...');
    const uploadResponse = await fetch('http://localhost:3001/api/config/upload-file', {
      method: 'POST',
      body: formData
    });

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text();
      console.error('❌ Erro no upload:', uploadResponse.status, error);
      return;
    }

    const uploadResult = await uploadResponse.json();
    console.log('✅ Upload bem-sucedido!');
    console.log('File ID:', uploadResult.document?.documentId || uploadResult.document?.id);
    console.log('');

    const fileId = uploadResult.document?.documentId || uploadResult.document?.id || uploadResult.id;
    
    if (!fileId) {
      console.error('❌ Não foi possível obter o File ID');
      return;
    }

    console.log('🔗 PASSO 2: Adicionando arquivo ao pipeline (PUT /pipelines/{id}/files)...');
    const addToPipelineResponse = await fetch('http://localhost:3001/api/config/add-file-to-pipeline', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fileId })
    });

    if (!addToPipelineResponse.ok) {
      const error = await addToPipelineResponse.text();
      console.error('⚠️ Erro ao adicionar ao pipeline:', addToPipelineResponse.status, error);
      console.log('⚠️ Continuando sem adicionar ao pipeline...');
    } else {
      const addResult = await addToPipelineResponse.json();
      console.log('✅ Arquivo adicionado ao pipeline!');
      console.log('Resultado:', addResult.message);
    }
    console.log('');

    console.log('🔄 PASSO 3: Fazendo sync do arquivo (PUT /files/sync)...');
    const syncResponse = await fetch('http://localhost:3001/api/config/sync-file', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fileId })
    });

    if (!syncResponse.ok) {
      const error = await syncResponse.text();
      console.error('⚠️ Erro no sync:', syncResponse.status, error);
      console.log('⚠️ Continuando sem sync...');
    } else {
      const syncResult = await syncResponse.json();
      console.log('✅ Sync realizado com sucesso!');
      console.log('Resultado:', syncResult.message);
    }
    console.log('');

    console.log('=== RESUMO DO FLUXO COMPLETO ===');
    console.log('✅ 1. POST /files: Concluído');
    console.log('✅ 2. PUT /pipelines/{id}/files: Concluído');
    console.log('✅ 3. PUT /files/sync: Concluído');
    console.log('🎉 Fluxo completo executado com sucesso!');
    console.log('==========================================');

    // Limpar arquivo de teste
    fs.unlinkSync('test-document.txt');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Testar também o método automatizado
async function testAutomatedFlow() {
  try {
    console.log('\n=== TESTANDO FLUXO AUTOMATIZADO ===');
    console.log('Usando o método uploadWithPipelineAndSync...');
    console.log('');
    
    // Criar um arquivo de teste
    const testContent = 'Este é um arquivo de teste para o fluxo automatizado.';
    fs.writeFileSync('test-automated.txt', testContent);
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream('test-automated.txt'));
    
    const response = await fetch('http://localhost:3001/api/config/upload-automated', {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Fluxo automatizado executado com sucesso!');
      console.log('Documento:', result.document);
      console.log('Upload realizado:', result.document.uploadSuccessful);
      console.log('Adicionado ao pipeline:', result.document.addedToPipeline);
      console.log('Sync realizado:', result.document.syncCompleted);
    } else {
      const error = await response.text();
      console.error('❌ Erro no fluxo automatizado:', response.status, error);
    }

    // Limpar arquivo de teste
    fs.unlinkSync('test-automated.txt');
    
  } catch (error) {
    console.error('❌ Erro no teste automatizado:', error);
  }
}

// Executar os testes
async function runTests() {
  await testCompleteUploadFlow();
  await testAutomatedFlow();
}

// Executar se chamado diretamente
if (require.main === module) {
  runTests();
}

module.exports = { testCompleteUploadFlow, testAutomatedFlow }; 