# Projeto WSAlexandria - Assistente Técnico Inteligente

## 📋 Descrição

O Projeto WSAlexandria é um assistente técnico inteligente que utiliza IA para fornecer suporte técnico avançado. O sistema permite upload de documentos, processamento por IA através do LlamaIndex Cloud, e oferece uma interface amigável para técnicos de campo.

## 🚀 Funcionalidades Principais

### 🔐 Autenticação
- Sistema de login seguro
- Acesso administrativo e convidado
- Gerenciamento de sessões

### 💬 Chat Inteligente
- Interface de chat em tempo real
- Integração com LlamaIndex Cloud para IA avançada
- Histórico de conversas persistente
- Suporte a múltiplas conversas

### 📁 Upload de Documentos
- Upload de PDFs, documentos e arquivos de áudio
- Processamento automático pelo LlamaIndex Cloud
- Gerenciamento de documentos
- Status de processamento em tempo real

### 👥 Acesso Convidado
- Links temporários para acesso sem login
- Funcionalidade limitada para convidados
- Persistência de conversas por sessão

### 📊 Analytics
- Dashboard com métricas de uso
- Estatísticas de perguntas e respostas
- Monitoramento de documentos processados

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 18** com TypeScript
- **Vite** para build e desenvolvimento
- **Tailwind CSS** para estilização
- **Lucide React** para ícones
- **React Router** para navegação

### Backend
- **Node.js** com Express
- **Socket.IO** para comunicação em tempo real
- **Multer** para upload de arquivos
- **JWT** para autenticação

### IA e Processamento
- **LlamaIndex Cloud** para processamento de documentos
- **OpenAI** para geração de respostas
- **WebSocket** para streaming de respostas

## 📁 Estrutura do Projeto

```
ChatBot/
├── src/                    # Código fonte principal
│   ├── components/        # Componentes React
│   ├── pages/            # Páginas da aplicação
│   ├── context/          # Contextos React
│   ├── services/         # Serviços e APIs
│   └── types/            # Definições TypeScript
├── backend/              # Servidor Node.js
├── tests/                # Arquivos de teste
├── docs/                 # Documentação
└── dist/                 # Build de produção
```

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+
- npm ou yarn

### Instalação
```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
```

### Desenvolvimento
```bash
# Executar frontend
npm run dev

# Executar backend (em outro terminal)
cd backend
npm run dev
```

### Produção
```bash
# Build do frontend
npm run build

# Executar servidor de produção
npm run preview
```

## 🔧 Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Backend
VITE_BACKEND_URL=http://localhost:3001

# LlamaIndex Cloud
VITE_LLAMAINDEX_API_KEY=your_api_key
VITE_LLAMAINDEX_PROJECT_ID=your_project_id

# OpenAI
VITE_OPENAI_API_KEY=your_openai_key
```

## 👥 Usuários de Demonstração

### Administradores
- **Felippe Admin**: `felippe@chatbot.com`
- **Nicholas Admin**: `nicholas@chatbot.com`
- **Senha**: `2025@chatbot`

## 📚 Documentação

A documentação completa está disponível na pasta `docs/`:

- `README.md` - Este arquivo
- `AUTHENTICATION_SUMMARY.md` - Resumo do sistema de autenticação
- `LLAMAINDEX_SETUP.md` - Configuração do LlamaIndex Cloud
- `CHAT_VINCULADO_IMPLEMENTADO.md` - Implementação do chat
- `FLUXO_COMPLETO_IMPLEMENTADO.md` - Fluxo completo do sistema

## 🧪 Testes

Os arquivos de teste estão organizados na pasta `tests/`:

- Testes de API
- Testes de chat
- Testes de upload
- Testes de configuração

## 📝 Licença

Este projeto foi desenvolvido para fins educacionais e de demonstração.

## 👨‍💻 Desenvolvedores

- **Felippe** - Desenvolvimento Frontend e Backend
- **Nicholas** - Desenvolvimento Frontend e Backend

---

**Projeto WSAlexandria** - Assistente Técnico Inteligente 
