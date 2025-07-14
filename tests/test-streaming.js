// Test script para verificar o parsing de streaming
const fetch = require('node-fetch');

async function testStreamingParsing() {
  try {
    console.log('=== TESTE PARSING DE STREAMING ===');
    
    const response = await fetch('http://localhost:3001/api/config/chat-direct', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Como cadastrar um navio no N4?',
        conversationId: 'test-streaming'
      }),
    });

    console.log('Status:', response.status);
    
    const result = await response.json();
    console.log('Resultado:', result);
    
    if (result.success) {
      console.log('✅ Chat funcionando!');
      console.log('Resposta:', result.response);
      console.log('Streaming:', result.streaming);
      console.log('Fallback:', result.fallback);
      console.log('Sources:', result.sources?.length || 0);
    } else {
      console.error('❌ Erro no chat:', result);
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testStreamingParsing(); 