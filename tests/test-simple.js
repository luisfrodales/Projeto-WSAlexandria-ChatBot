// Teste simples para verificar o backend
const fetch = require('node-fetch');

async function testBackend() {
  try {
    console.log('Testando backend...');
    
    // Teste 1: Status do servidor
    const response = await fetch('http://localhost:3001/api/config/test-simple');
    console.log('Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend funcionando:', data);
    } else {
      console.error('❌ Backend não está respondendo');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testBackend(); 