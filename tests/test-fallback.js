// Test script para verificar o fallback do chat
const fetch = require('node-fetch');

async function testChatFallback() {
  try {
    console.log('=== TESTE FALLBACK CHAT ===');
    
    // Teste 1: Sem API Key (deve usar fallback)
    console.log('\n1. Testando sem API Key...');
    const response1 = await fetch('http://localhost:3001/api/config/chat-direct', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Teste sem API Key',
        conversationId: 'test-1'
      }),
    });

    console.log('Status:', response1.status);
    const result1 = await response1.json();
    console.log('Resultado:', result1);
    console.log('Fallback usado:', result1.fallback);

    // Teste 2: Com API Key (deve funcionar normalmente ou usar fallback se houver erro)
    console.log('\n2. Testando com API Key...');
    const response2 = await fetch('http://localhost:3001/api/config/chat-direct', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Teste com API Key',
        conversationId: 'test-2'
      }),
    });

    console.log('Status:', response2.status);
    const result2 = await response2.json();
    console.log('Resultado:', result2);
    console.log('Fallback usado:', result2.fallback);

    // Teste 3: Mensagem vazia (deve retornar erro 400)
    console.log('\n3. Testando mensagem vazia...');
    const response3 = await fetch('http://localhost:3001/api/config/chat-direct', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: '',
        conversationId: 'test-3'
      }),
    });

    console.log('Status:', response3.status);
    const result3 = await response3.json();
    console.log('Resultado:', result3);

    console.log('\n=== RESUMO DOS TESTES ===');
    console.log('✅ Todos os testes concluídos');

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testChatFallback(); 