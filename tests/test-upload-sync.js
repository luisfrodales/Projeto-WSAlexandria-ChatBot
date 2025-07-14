const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');

async function testUploadAndSync() {
  try {
    console.log('=== TESTANDO UPLOAD AND SYNC ===');
    
    // Criar um arquivo de teste simples
    const testContent = 'Este é um arquivo de teste para verificar o upload e sync.';
    fs.writeFileSync('test-file.txt', testContent);
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream('test-file.txt'));
    
    const response = await fetch('http://localhost:3001/api/config/upload-and-sync', {
      method: 'POST',
      body: formData
    });

    console.log('Status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Sucesso:', result);
    } else {
      const error = await response.text();
      console.error('❌ Erro:', error);
    }
    
    // Limpar arquivo de teste
    fs.unlinkSync('test-file.txt');
  } catch (error) {
    console.error('❌ Erro na requisição:', error);
  }
}

testUploadAndSync(); 