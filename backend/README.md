# ChatBot Backend - MongoDB System

Este é o backend do sistema de chatbot com MongoDB, configurado para gerenciar usuários, convidados, documentos, conversas, transcrições de áudio e referências de vetores.

## Estrutura do Banco de Dados

### Coleções MongoDB

1. **users** - Usuários cadastrados com login
   - username, email, password (hash)
   - firstName, lastName
   - isActive, lastLogin
   - timestamps

2. **guests** - Convidados anônimos com sessionId/token
   - sessionId, token (UUID)
   - ipAddress, userAgent
   - isActive, lastActivity
   - timestamps

3. **documents** - Metadados dos arquivos
   - name, originalName, type, mimeType, size
   - embeddingId, userId/guestId
   - filePath, status, processingError
   - metadata, tags, isPublic

4. **conversations** - Histórico por usuário ou sessão
   - userId/guestId
   - messages array (role, content, timestamp, metadata)
   - title, isActive, lastMessageAt
   - metadata, tags

5. **audio_transcriptions** - Transcrições indexadas
   - originalFileName, transcription
   - userId/guestId, conversationId
   - filePath, duration, format, size
   - status, confidence, language
   - metadata, tags

6. **vector_refs** - Referência aos vetores gerados
   - vectorId, provider (pinecone/weaviate/openai/custom)
   - namespace, documentId/transcriptionId
   - userId/guestId, embeddingModel, dimensions
   - metadata, tags, isActive

## Configuração

### Variáveis de Ambiente

Crie um arquivo `config.env` na pasta `backend/` com:

```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://poseidasmain:<db_password>@chatbotdb.bkn055g.mongodb.net/chatbot?retryWrites=true&w=majority

# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Session Configuration
SESSION_SECRET=your-session-secret-key-change-this-in-production
```

### Instalação

```bash
cd backend
npm install
```

### Execução

```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

## Endpoints da API

### Autenticação (`/api/auth`)

- `POST /register` - Registrar novo usuário
- `POST /login` - Login de usuário
- `POST /guest-session` - Criar sessão de convidado
- `POST /guest-session/refresh` - Renovar sessão de convidado
- `GET /profile` - Obter perfil do usuário
- `PUT /profile` - Atualizar perfil
- `PUT /change-password` - Alterar senha

### Headers de Autenticação

**Para usuários:**
```
Authorization: Bearer <jwt_token>
```

**Para convidados:**
```
X-Session-Id: <session_id>
X-Guest-Token: <guest_token>
```

## Funcionalidades

### Usuários
- Registro e login com JWT
- Perfil com informações pessoais
- Alteração de senha
- Controle de sessão

### Convidados
- Sessões anônimas com UUID
- Expiração automática (24h)
- Refresh de sessão
- Rastreamento de IP e User-Agent

### Documentos
- Upload de arquivos
- Metadados completos
- Status de processamento
- Suporte a embeddings
- Tags e categorização

### Conversas
- Histórico de mensagens
- Suporte a usuários e convidados
- Metadados por mensagem
- Sistema de tags

### Transcrições
- Processamento de áudio
- Indexação de texto
- Controle de qualidade
- Múltiplos idiomas

### Vetores
- Referências a serviços externos
- Suporte a Pinecone/Weaviate
- Metadados de embeddings
- Controle de namespace

## Segurança

- Senhas hashadas com bcrypt
- JWT para autenticação
- CORS configurado
- Helmet para headers de segurança
- Validação de entrada
- Sanitização de dados

## Índices MongoDB

O sistema cria automaticamente índices para otimizar consultas:

- Usuários: email, username
- Convidados: sessionId, token
- Documentos: userId, guestId, embeddingId, status
- Conversas: userId, guestId, isActive
- Transcrições: userId, guestId, conversationId, status, language
- Vetores: vectorId, provider, namespace, documentId, transcriptionId

## Próximos Passos

1. Implementar rotas para documentos
2. Implementar rotas para conversas
3. Implementar rotas para transcrições
4. Implementar rotas para vetores
5. Adicionar upload de arquivos
6. Integrar com serviços de embedding
7. Implementar busca semântica 