# Script para testar as APIs do backend
Write-Host "Testando API de listar data sources..."

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/config/list-data-sources" -Method GET
    Write-Host "Resposta:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Erro:" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

Write-Host "`nTestando API de criar data source..."

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/config/create-data-source" -Method POST
    Write-Host "Resposta:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Erro:" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

Write-Host "`nTestando API de teste simples..."

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/config/test-simple" -Method GET
    Write-Host "Resposta:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Erro:" -ForegroundColor Red
    Write-Host $_.Exception.Message
} 