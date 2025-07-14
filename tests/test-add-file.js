const fetch = require('node-fetch');

async function testAddFileToPipeline() {
  try {
    console.log('=== TESTANDO ADD FILE TO PIPELINE ===');
    
    const response = await fetch('http://localhost:3001/api/config/add-file-to-pipeline', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fileId: '798b1fa1-3594-478d-ba3b-243d76720c96'
      })
    });

    console.log('Status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Sucesso:', result);
    } else {
      const error = await response.text();
      console.error('❌ Erro:', error);
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error);
  }
}

testAddFileToPipeline(); 