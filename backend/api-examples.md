# Exemplos de Uso da API

## Autenticação

### 1. Registrar Novo Usuário

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "joao123",
    "email": "joao@example.com",
    "password": "senha123",
    "firstName": "João",
    "lastName": "Silva"
  }'
```

**Resposta:**
```json
{
  "message": "User registered successfully",
  "user": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "username": "joao123",
    "email": "joao@example.com",
    "firstName": "João",
    "lastName": "Silva",
    "isActive": true,
    "lastLogin": "2024-01-15T10:30:00.000Z",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. Login de Usuário

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@example.com",
    "password": "senha123"
  }'
```

**Resposta:**
```json
{
  "message": "Login successful",
  "user": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "username": "joao123",
    "email": "joao@example.com",
    "firstName": "João",
    "lastName": "Silva",
    "isActive": true,
    "lastLogin": "2024-01-15T10:35:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3. Criar Sessão de Convidado

```bash
curl -X POST http://localhost:3001/api/auth/guest-session \
  -H "Content-Type: application/json"
```

**Resposta:**
```json
{
  "message": "Guest session created",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "token": "550e8400-e29b-41d4-a716-446655440001",
  "expiresAt": "2024-01-16T10:35:00.000Z"
}
```

### 4. Renovar Sessão de Convidado

```bash
curl -X POST http://localhost:3001/api/auth/guest-session/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "token": "550e8400-e29b-41d4-a716-446655440001"
  }'
```

## Usando a API com Autenticação

### 5. Obter Perfil do Usuário (Autenticado)

```bash
curl -X GET http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 6. Atualizar Perfil

```bash
curl -X PUT http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "João Pedro",
    "lastName": "Silva Santos"
  }'
```

### 7. Alterar Senha

```bash
curl -X PUT http://localhost:3001/api/auth/change-password \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "senha123",
    "newPassword": "novaSenha456"
  }'
```

## Headers de Autenticação

### Para Usuários Logados:
```
Authorization: Bearer <jwt_token>
```

### Para Convidados:
```
X-Session-Id: <session_id>
X-Guest-Token: <guest_token>
```

## Exemplos com JavaScript/Fetch

### Registrar Usuário
```javascript
const response = await fetch('http://localhost:3001/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'joao123',
    email: 'joao@example.com',
    password: 'senha123',
    firstName: 'João',
    lastName: 'Silva'
  })
});

const data = await response.json();
console.log(data);
```

### Login
```javascript
const response = await fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'joao@example.com',
    password: 'senha123'
  })
});

const data = await response.json();
// Salvar o token para uso posterior
localStorage.setItem('token', data.token);
```

### Criar Sessão de Convidado
```javascript
const response = await fetch('http://localhost:3001/api/auth/guest-session', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
// Salvar sessionId e token para uso posterior
localStorage.setItem('sessionId', data.sessionId);
localStorage.setItem('guestToken', data.token);
```

### Requisição Autenticada (Usuário)
```javascript
const token = localStorage.getItem('token');
const response = await fetch('http://localhost:3001/api/auth/profile', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
console.log(data);
```

### Requisição Autenticada (Convidado)
```javascript
const sessionId = localStorage.getItem('sessionId');
const guestToken = localStorage.getItem('guestToken');

const response = await fetch('http://localhost:3001/api/conversations', {
  method: 'GET',
  headers: {
    'X-Session-Id': sessionId,
    'X-Guest-Token': guestToken
  }
});

const data = await response.json();
console.log(data);
```

## Testando a Conexão

Para testar se o MongoDB está conectado:

```bash
cd backend
npm run test-connection
```

## Health Check

Para verificar se o servidor está rodando:

```bash
curl http://localhost:3001/health
```

**Resposta:**
```json
{
  "status": "OK",
  "message": "Server is running",
  "timestamp": "2024-01-15T10:35:00.000Z",
  "environment": "development"
}
``` 