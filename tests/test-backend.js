// ============================================================================
// TESTE DO BACKEND - VERIFICAR PROBLEMAS
// ============================================================================
// 
// Este arquivo testa o backend para identificar problemas
//
// Para testar, execute: node test-backend.js
// ============================================================================

const fetch = require('node-fetch');

async function testBackendStatus() {
  try {
    console.log('=== TESTANDO STATUS DO BACKEND ===');
    
    // Teste 1: Verificar se o servidor está rodando
    console.log('1. Testando se o servidor está rodando...');
    const statusResponse = await fetch('http://localhost:3001/api/config/test-simple');
    
    if (statusResponse.ok) {
      const statusResult = await statusResponse.json();
      console.log('✅ Servidor está rodando:', statusResult);
    } else {
      console.error('❌ Servidor não está respondendo:', statusResponse.status);
      return;
    }
    
    // Teste 2: Verificar configuração do LlamaIndex
    console.log('\n2. Verificando configuração do LlamaIndex...');
    const configResponse = await fetch('http://localhost:3001/api/config/test-llamaindex-config');
    
    if (configResponse.ok) {
      const configResult = await configResponse.json();
      console.log('✅ Configuração do LlamaIndex:', configResult);
      
      if (!configResult.config.apiKeyConfigured) {
        console.error('❌ API Key não está configurada!');
        console.log('Configure a variável de ambiente LLAMAINDEX_API_KEY');
        return;
      }
    } else {
      console.error('❌ Erro ao verificar configuração:', configResponse.status);
      return;
    }
    
    // Teste 3: Testar chat direto
    console.log('\n3. Testando chat direto...');
    const chatResponse = await fetch('http://localhost:3001/api/config/chat-direct', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Teste de chat'
      }),
    });
    
    console.log('Status da resposta do chat:', chatResponse.status);
    
    if (chatResponse.ok) {
      const chatResult = await chatResponse.json();
      console.log('✅ Chat funcionando:', chatResult);
    } else {
      const errorText = await chatResponse.text();
      console.error('❌ Erro no chat:', chatResponse.status, errorText);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

async function testLlamaIndexDirect() {
  try {
    console.log('\n=== TESTANDO LLAMAINDEX DIRETO ===');
    
    const pipelineId = 'af1793a8-d115-472a-8e61-d19ab26fd92c';
    const apiKey = process.env.LLAMAINDEX_API_KEY;
    
    if (!apiKey) {
      console.error('❌ API Key não configurada no ambiente');
      return;
    }
    
    console.log('Pipeline ID:', pipelineId);
    console.log('API Key configurada:', !!apiKey);
    console.log('API Key (primeiros 10 chars):', apiKey.substring(0, 10) + '...');
    
    const url = `https://api.cloud.llamaindex.ai/api/v1/pipelines/${pipelineId}/chat`;
    
    console.log('URL:', url);
    console.log('Fazendo requisição direta...');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: 'Teste de chat direto'
          }
        ]
      }),
    });
    
    console.log('Status da resposta:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Chat direto funcionando:', result);
    } else {
      const errorText = await response.text();
      console.error('❌ Erro no chat direto:', response.status, errorText);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste direto:', error);
  }
}

async function runAllTests() {
  console.log('🚀 Iniciando testes do backend...\n');
  
  await testBackendStatus();
  await testLlamaIndexDirect();
  
  console.log('\n✅ Testes concluídos!');
}

// Executar testes se o arquivo for executado diretamente
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testBackendStatus,
  testLlamaIndexDirect,
  runAllTests
}; 