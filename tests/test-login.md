# Teste de Login dos Usuários Administradores

## 🔐 Credenciais de Login

### Felippe Admin
- **Email:** felippe@chatbot.com
- **Senha:** 2025@chatbot

### Nicholas Admin
- **Email:** nicholas@chatbot.com
- **Senha:** 2025@chatbot

## 🧪 Como Testar

### 1. Iniciar o Servidor
```bash
npm run dev:full
```

### 2. Testar Login via cURL

#### Login do Felippe:
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "felippe@chatbot.com",
    "password": "2025@chatbot"
  }'
```

#### Login do Nicholas:
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nicholas@chatbot.com",
    "password": "2025@chatbot"
  }'
```

### 3. Testar via JavaScript/Fetch

```javascript
// Login do Felippe
const loginFelippe = async () => {
  const response = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'felippe@chatbot.com',
      password: '2025@chatbot'
    })
  });

  const data = await response.json();
  console.log('Login response:', data);
  
  if (data.token) {
    localStorage.setItem('token', data.token);
    console.log('✅ Login successful! Token saved.');
  }
};

// Login do Nicholas
const loginNicholas = async () => {
  const response = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'nicholas@chatbot.com',
      password: '2025@chatbot'
    })
  });

  const data = await response.json();
  console.log('Login response:', data);
  
  if (data.token) {
    localStorage.setItem('token', data.token);
    console.log('✅ Login successful! Token saved.');
  }
};
```

### 4. Testar Perfil (Autenticado)

```javascript
const getProfile = async () => {
  const token = localStorage.getItem('token');
  
  const response = await fetch('http://localhost:3001/api/auth/profile', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  console.log('Profile:', data);
};
```

## 📝 Resposta Esperada do Login

```json
{
  "message": "Login successful",
  "user": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "username": "felippe_admin",
    "email": "felippe@chatbot.com",
    "firstName": "Felippe",
    "lastName": "Admin",
    "isActive": true,
    "lastLogin": "2024-01-15T10:35:00.000Z",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:35:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## 🚀 Próximos Passos

1. Teste o login com ambos os usuários
2. Verifique se o token JWT está sendo gerado corretamente
3. Teste o endpoint de perfil com o token
4. Implemente a interface de login no frontend
5. Adicione mais funcionalidades administrativas

## 🔧 Scripts Disponíveis

```bash
# Criar usuários admin
npm run backend:seed

# Testar conexão MongoDB
npm run backend:test

# Iniciar servidor completo
npm run dev:full
``` 