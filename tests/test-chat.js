// Test script para verificar o endpoint chat-direct
const fetch = require('node-fetch');

async function testChatDirect() {
  try {
    console.log('=== TESTE CHAT DIRETO ===');
    
    const response = await fetch('http://localhost:3001/api/config/chat-direct', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Olá, como você está?',
        conversationId: 'test-conversation'
      }),
    });

    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('Resposta bruta:', responseText);
    console.log('Tamanho da resposta:', responseText.length);

    try {
      const jsonResponse = JSON.parse(responseText);
      console.log('✅ JSON parseado com sucesso:', jsonResponse);
    } catch (parseError) {
      console.error('❌ Erro ao fazer parse do JSON:', parseError);
      console.error('Resposta que falhou:', responseText);
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testChatDirect(); 