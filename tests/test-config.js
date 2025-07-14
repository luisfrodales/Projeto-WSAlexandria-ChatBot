// Test script para verificar configuração do LlamaIndex
const fetch = require('node-fetch');

async function testLlamaIndexConfig() {
  try {
    console.log('=== TESTE CONFIGURAÇÃO LLAMAINDEX ===');
    
    // Testar configuração do backend
    console.log('1. Verificando configuração do backend...');
    const configResponse = await fetch('http://localhost:3001/api/config/test-llamaindex-config');
    const configResult = await configResponse.json();
    console.log('Configuração:', configResult);

    if (!configResult.success) {
      console.error('❌ Configuração falhou');
      return;
    }

    // Testar chamada direta para LlamaIndex
    console.log('\n2. Testando chamada direta para LlamaIndex...');
    
    const apiKey = process.env.LLAMAINDEX_API_KEY;
    const pipelineId = 'af1793a8-d115-472a-8e61-d19ab26fd92c';
    
    if (!apiKey) {
      console.error('❌ API Key não encontrada no ambiente');
      return;
    }

    console.log('API Key (primeiros 10 chars):', apiKey.substring(0, 10) + '...');
    console.log('Pipeline ID:', pipelineId);

    const url = `https://api.cloud.llamaindex.ai/api/v1/pipelines/${pipelineId}/chat`;
    console.log('URL:', url);

    const requestBody = {
      messages: [
        {
          role: 'user',
          content: 'Teste simples'
        }
      ]
    };

    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('Resposta bruta:', responseText);
    console.log('Tamanho da resposta:', responseText.length);

    if (response.ok) {
      try {
        const jsonResponse = JSON.parse(responseText);
        console.log('✅ Resposta JSON válida:', jsonResponse);
      } catch (parseError) {
        console.error('❌ Erro ao fazer parse do JSON:', parseError);
      }
    } else {
      console.error('❌ Erro na resposta:', response.status, responseText);
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testLlamaIndexConfig(); 