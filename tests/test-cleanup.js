// Test script para verificar a limpeza de texto
const fetch = require('node-fetch');

async function testTextCleanup() {
  try {
    console.log('=== TESTE LIMPEZA DE TEXTO ===');
    
    const response = await fetch('http://localhost:3001/api/config/chat-direct', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Como cadastrar um navio no N4?',
        conversationId: 'test-cleanup'
      }),
    });

    console.log('Status:', response.status);
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Chat funcionando!');
      console.log('Resposta limpa:');
      console.log('---');
      console.log(result.response);
      console.log('---');
      
      // Verificar se há problemas
      const hasCitations = result.response.includes('[citation:');
      const hasMarkdown = result.response.includes('**');
      const hasFontes = result.response.includes('Fontes consultadas');
      const hasUndefined = result.response.includes('undefined');
      
      console.log('\nVerificações:');
      console.log('Citations:', hasCitations ? '❌ AINDA HÁ' : '✅ REMOVIDAS');
      console.log('Markdown:', hasMarkdown ? '❌ AINDA HÁ' : '✅ REMOVIDO');
      console.log('Fontes:', hasFontes ? '❌ AINDA HÁ' : '✅ REMOVIDAS');
      console.log('Undefined:', hasUndefined ? '❌ AINDA HÁ' : '✅ REMOVIDO');
      
    } else {
      console.error('❌ Erro no chat:', result);
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testTextCleanup(); 