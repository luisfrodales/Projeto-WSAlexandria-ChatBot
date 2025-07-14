// Test script para listar pipelines disponíveis
const fetch = require('node-fetch');

async function testPipelines() {
  try {
    console.log('=== TESTE PIPELINES LLAMAINDEX ===');
    
    const apiKey = process.env.LLAMAINDEX_API_KEY;
    const projectId = process.env.LLAMAINDEX_PROJECT_ID;
    
    if (!apiKey) {
      console.error('❌ API Key não encontrada no ambiente');
      return;
    }

    if (!projectId) {
      console.error('❌ Project ID não encontrado no ambiente');
      return;
    }

    console.log('API Key (primeiros 10 chars):', apiKey.substring(0, 10) + '...');
    console.log('Project ID:', projectId);

    // Listar pipelines
    console.log('\n1. Listando pipelines...');
    const pipelinesUrl = `https://api.cloud.llamaindex.ai/api/v1/pipelines?project_id=${projectId}`;
    console.log('URL:', pipelinesUrl);

    const pipelinesResponse = await fetch(pipelinesUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Status:', pipelinesResponse.status);
    
    if (pipelinesResponse.ok) {
      const pipelinesText = await pipelinesResponse.text();
      console.log('Resposta bruta:', pipelinesText);
      
      try {
        const pipelines = JSON.parse(pipelinesText);
        console.log('✅ Pipelines encontrados:', pipelines);
        
        if (pipelines.pipelines && pipelines.pipelines.length > 0) {
          console.log('\nPipelines disponíveis:');
          pipelines.pipelines.forEach((pipeline, index) => {
            console.log(`${index + 1}. ID: ${pipeline.id}`);
            console.log(`   Nome: ${pipeline.name || 'N/A'}`);
            console.log(`   Status: ${pipeline.status || 'N/A'}`);
            console.log('---');
          });
        } else {
          console.log('❌ Nenhum pipeline encontrado');
        }
      } catch (parseError) {
        console.error('❌ Erro ao fazer parse dos pipelines:', parseError);
      }
    } else {
      const errorText = await pipelinesResponse.text();
      console.error('❌ Erro ao listar pipelines:', pipelinesResponse.status, errorText);
    }

    // Testar pipeline específico
    console.log('\n2. Testando pipeline específico...');
    const pipelineId = 'af1793a8-d115-472a-8e61-d19ab26fd92c';
    const pipelineUrl = `https://api.cloud.llamaindex.ai/api/v1/pipelines/${pipelineId}`;
    
    const pipelineResponse = await fetch(pipelineUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Status do pipeline:', pipelineResponse.status);
    
    if (pipelineResponse.ok) {
      const pipelineText = await pipelineResponse.text();
      console.log('Pipeline info:', pipelineText);
    } else {
      const errorText = await pipelineResponse.text();
      console.error('❌ Erro ao obter pipeline:', pipelineResponse.status, errorText);
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testPipelines(); 