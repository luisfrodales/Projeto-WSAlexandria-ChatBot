// ============================================================================
// EXEMPLO DE CHAT DIRETO COM PIPELINE LLAMAINDEX
// ============================================================================
// 
// Este exemplo demonstra como usar o chat direto com o pipeline,
// exatamente como no exemplo fornecido pelo usuário.
//
// Para testar, execute: node exemplo-chat-direto.js
// ============================================================================

const fetch = require('node-fetch');

async function testChatDireto() {
  try {
    console.log('=== TESTANDO CHAT DIRETO COM PIPELINE ===');
    
    const pipelineId = 'af1793a8-d115-472a-8e61-d19ab26fd92c';
    const apiKey = process.env.LLAMAINDEX_API_KEY || 'sua_api_key_aqui';
    
    const question = 'Qual é o procedimento descrito nesse documento?'; // sua pergunta
    
    console.log('Pipeline ID:', pipelineId);
    console.log('API Key configurada:', !!apiKey);
    console.log('Pergunta:', question);
    
    const url = `https://api.cloud.llamaindex.ai/api/v1/pipelines/${pipelineId}/chat`;
    
    console.log('URL:', url);
    console.log('Fazendo requisição...');
    
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
            content: question
          }
        ]
      }),
    });
    
    console.log('Status da resposta:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro na resposta:', response.status, errorText);
      return;
    }
    
    const result = await response.json();
    console.log('✅ Chat bem-sucedido!');
    console.log('Resposta:', result.response || result.message);
    
    if (result.sources && result.sources.length > 0) {
      console.log('\n📚 Fontes consultadas:');
      result.sources.forEach((source, index) => {
        console.log(`${index + 1}. ${source.documentName || 'Documento'}`);
        if (source.page) {
          console.log(`   Página: ${source.page}`);
        }
      });
    }
    
    console.log('\n=== RESUMO ===');
    console.log('Pergunta:', question);
    console.log('Resposta gerada:', result.response?.length || 0, 'caracteres');
    console.log('Fontes consultadas:', result.sources?.length || 0);
    console.log('================');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

async function testChatViaBackend() {
  try {
    console.log('\n=== TESTANDO CHAT VIA BACKEND ===');
    
    const question = 'Como configurar o equipamento?';
    
    console.log('Pergunta:', question);
    console.log('Fazendo requisição para backend...');
    
    const response = await fetch('http://localhost:3001/api/config/chat-direct', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: question
      }),
    });
    
    console.log('Status da resposta:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro na resposta:', response.status, errorText);
      return;
    }
    
    const result = await response.json();
    console.log('✅ Chat via backend bem-sucedido!');
    console.log('Resposta:', result.response);
    
    console.log('\n=== RESUMO BACKEND ===');
    console.log('Pergunta:', question);
    console.log('Resposta gerada:', result.response?.length || 0, 'caracteres');
    console.log('Sucesso:', result.success);
    console.log('========================');
    
  } catch (error) {
    console.error('❌ Erro no teste via backend:', error);
  }
}

async function runTests() {
  console.log('🚀 Iniciando testes de chat direto...\n');
  
  // Teste 1: Chat direto com API
  await testChatDireto();
  
  // Teste 2: Chat via backend
  await testChatViaBackend();
  
  console.log('\n✅ Testes concluídos!');
}

// Executar testes se o arquivo for executado diretamente
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testChatDireto,
  testChatViaBackend,
  runTests
}; 