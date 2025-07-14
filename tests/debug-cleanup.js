// Debug script para verificar o processo de limpeza
import fetch from 'node-fetch';

async function debugCleanup() {
  try {
    console.log('=== DEBUG LIMPEZA DE TEXTO ===');
    
    const response = await fetch('http://localhost:3001/api/config/chat-direct', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Como cadastrar um navio no N4?',
        conversationId: 'debug-cleanup'
      }),
    });

    console.log('Status:', response.status);
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Chat funcionando!');
      console.log('\n=== RESPOSTA FINAL ===');
      console.log(result.response);
      console.log('=== FIM DA RESPOSTA ===\n');
      
      // Verificar problemas específicos
      const citations = (result.response.match(/\[citation:[^\]]+\]/g) || []);
      const markdown = (result.response.match(/\*\*[^*]+\*\*/g) || []);
      const fontes = result.response.includes('Fontes consultadas');
      const undefineds = result.response.includes('undefined');
      
      console.log('=== PROBLEMAS ENCONTRADOS ===');
      console.log('Citations encontradas:', citations.length);
      citations.forEach((citation, i) => console.log(`  ${i+1}. ${citation}`));
      
      console.log('Markdown encontrado:', markdown.length);
      markdown.forEach((md, i) => console.log(`  ${i+1}. ${md}`));
      
      console.log('Linha de fontes:', fontes ? '❌ AINDA HÁ' : '✅ REMOVIDA');
      console.log('Undefined:', undefineds ? '❌ AINDA HÁ' : '✅ REMOVIDO');
      
    } else {
      console.error('❌ Erro no chat:', result);
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

debugCleanup(); 