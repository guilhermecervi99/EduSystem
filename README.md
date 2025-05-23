# Sistema Educacional Gamificado - Frontend

Uma aplicação React moderna que oferece uma experiência de aprendizado personalizada com gamificação e inteligência artificial.

## 🚀 Funcionalidades Principais

### 🎯 Mapeamento de Interesses
- Questionário inteligente para identificar áreas de interesse
- Análise de texto com IA para personalização adicional
- Recomendação automática de trilhas de aprendizado

### 📚 Aprendizado Personalizado
- Conteúdo adaptado por IA baseado no perfil do usuário
- Professor virtual para tirar dúvidas
- Diferentes estilos de ensino (didático, socrático, storytelling, visual, gamificado, projetos)
- Aulas geradas dinamicamente

### 🏆 Sistema de Gamificação
- Sistema de XP e níveis
- Badges e conquistas
- Streak de estudos
- Leaderboards
- Progresso visual detalhado

### 📋 Gerenciamento de Projetos
- Criação e acompanhamento de projetos
- Projetos de lição, módulo e finais
- Sistema de evidências e reflexões

### 📊 Dashboard Inteligente
- Visão geral do progresso
- Próximos passos recomendados
- Estatísticas de aprendizado
- Badges recentes

## 🛠️ Tecnologias Utilizadas

- **React 18** - Framework principal
- **Tailwind CSS** - Estilização responsiva
- **Lucide React** - Ícones modernos
- **Axios** - Requisições HTTP
- **Context API** - Gerenciamento de estado global

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── common/         # Componentes base (Button, Input, Card, etc.)
│   ├── layout/         # Componentes de layout (Header, Sidebar)
│   ├── auth/           # Componentes de autenticação
│   ├── mapping/        # Componentes de mapeamento de interesses
│   ├── dashboard/      # Componentes do dashboard
│   ├── learning/       # Componentes de aprendizado
│   ├── achievements/   # Componentes de gamificação
│   └── projects/       # Componentes de projetos
├── pages/              # Páginas principais
├── context/            # Context providers (Auth, App, Notifications)
├── services/           # Serviços de API
├── hooks/              # Custom hooks
├── utils/              # Utilitários e constantes
└── styles/             # Estilos globais
```

## 🚀 Como Executar

### Pré-requisitos
- Node.js 16+ 
- npm ou yarn
- API backend rodando em `http://localhost:8000`

### Instalação

1. **Clone o repositório**
   ```bash
   git clone <repository-url>
   cd educational-frontend
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**
   ```bash
   cp .env.example .env.local
   ```
   
   Edite o arquivo `.env.local`:
   ```env
   REACT_APP_API_URL=http://localhost:8000/api/v1
   ```

4. **Execute a aplicação**
   ```bash
   npm start
   ```

A aplicação estará disponível em `http://localhost:3000`

## 🔧 Scripts Disponíveis

- **`npm start`** - Executa em modo de desenvolvimento
- **`npm build`** - Cria build para produção
- **`npm test`** - Executa os testes
- **`npm run eject`** - Ejeta configurações (irreversível)

## 📱 Responsividade

A aplicação é totalmente responsiva, funcionando em:
- **Desktop** (1024px+) - Layout completo com sidebar
- **Tablet** (768px-1023px) - Layout adaptado
- **Mobile** (320px-767px) - Layout móvel com sidebar colapsável

## 🎨 Design System

### Cores Principais
- **Primary**: Azul (#3b82f6)
- **Secondary**: Roxo (#8b5cf6)
- **Accent**: Ciano (#06b6d4)
- **Success**: Verde (#10b981)
- **Warning**: Amarelo (#f59e0b)
- **Danger**: Vermelho (#ef4444)

### Componentes Base
- **Button** - Múltiplas variantes e tamanhos
- **Input** - Com ícones e validação
- **Card** - Container flexível
- **Loading** - Estados de carregamento
- **Badge** - Indicadores visuais

## 🔐 Autenticação

O sistema suporta:
- Login com email/ID + senha (opcional)
- Registro com dados mínimos
- Tokens JWT para autenticação
- Refresh automático de tokens

## 📊 Integração com API

### Serviços Organizados
- **authAPI** - Autenticação e usuários
- **mappingAPI** - Mapeamento de interesses
- **progressAPI** - Progresso e estatísticas
- **achievementsAPI** - Gamificação
- **projectsAPI** - Gerenciamento de projetos
- **llmAPI** - Professor virtual e IA
- **resourcesAPI** - Recursos educacionais
- **usersAPI** - Perfil e preferências

### Interceptadores
- Adiciona automaticamente tokens de autenticação
- Trata erros HTTP de forma centralizada
- Redirect automático em caso de token expirado

## 🎯 Estado da Aplicação

### Context Providers
- **AuthContext** - Estado de autenticação
- **AppContext** - Dados globais e cache
- **NotificationContext** - Sistema de notificações

### Cache Inteligente
- Cache de 5 minutos para dados que mudam pouco
- Invalidação automática em ações importantes
- Refresh manual disponível

## 🔔 Sistema de Notificações

- Notificações toast automáticas
- Tipos: success, error, warning, info
- Auto-dismiss configurável
- Ações customizáveis

## 🏗️ Componentes Principais

### WelcomePage
- Landing page com introdução
- Formulários de login/registro
- Explicação das funcionalidades

### MappingPage
- Wizard de mapeamento de interesses
- Questionário interativo
- Análise de texto opcional
- Resultados detalhados

### DashboardPage
- Visão geral do progresso
- Estatísticas de aprendizado
- Próximos passos recomendados
- Badges recentes

### LearningPage
- Visualização de conteúdo
- Chat com professor virtual
- Controles de progresso
- Geração de lições com IA

## 🚦 Fluxo de Usuário

1. **Boas-vindas** - Landing page explicativa
2. **Registro/Login** - Criação de conta ou acesso
3. **Mapeamento** - Descoberta de interesses
4. **Dashboard** - Visão geral personalizada
5. **Aprendizado** - Consumo de conteúdo
6. **Gamificação** - Conquistas e progresso

## 🔒 Segurança

- Validação de dados no frontend
- Sanitização de inputs
- Proteção contra XSS
- Tokens JWT seguros
- HTTPS recomendado em produção

## 📈 Performance

- Lazy loading de componentes
- Cache inteligente de dados
- Imagens otimizadas
- Bundle splitting automático
- Service workers (PWA ready)

## 🌐 Internacionalização

Preparado para suporte a múltiplos idiomas:
- Estrutura de constantes organizadas
- Mensagens centralizadas
- Formatação de datas e números

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🐛 Reportando Bugs

Para reportar bugs, abra uma issue com:
- Descrição detalhada do problema
- Passos para reproduzir
- Screenshots se aplicável
- Informações do ambiente (browser, OS, etc.)

## 📞 Suporte

Para dúvidas ou suporte:
- Abra uma issue no GitHub
- Consulte a documentação da API
- Verifique os logs do console do browser