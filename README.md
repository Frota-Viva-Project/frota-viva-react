# 🚛 Frota Viva - Sistema de Gestão de Frota

<div align="center">

![Frota Viva Logo](public/frota-logo.svg)

**Sistema completo de gestão de frota com React + Vite**

[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0.0-646CFF.svg)](https://vitejs.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-10.0.0-orange.svg)](https://firebase.google.com/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black.svg)](https://vercel.com/)

</div>

## 📋 Sobre o Projeto

O **Frota Viva** é um sistema completo de gestão de frota desenvolvido em React com Vite. O sistema permite o controle total de veículos, manutenções, entregas, rotas e análises de business intelligence, oferecendo uma interface moderna e intuitiva para gestores de frota.

### Principais Características:
- 🚛 **Gestão de Veículos**: Controle completo da frota
- 🔧 **Manutenções**: Histórico e agendamento de manutenções
- 📦 **Entregas**: Gerenciamento de entregas e rotas
- 📊 **Business Intelligence**: Dashboards e relatórios com Power BI
- 👤 **Perfil de Usuário**: Sistema completo de autenticação e perfis
- 📱 **Responsivo**: Interface adaptável para desktop e mobile

## ✨ Funcionalidades

### 🏠 Dashboard
- Visão geral da frota com métricas em tempo real
- Calendário de manutenções agendadas
- Geração de relatórios com IA
- Sistema de alertas e notificações

### 🚛 Gestão de Veículos
- Cadastro e controle completo da frota
- Monitoramento de status, combustível e quilometragem
- Histórico completo de manutenções
- Agendamento de manutenções preventivas

### � Enstregas e Rotas
- Gerenciamento completo de entregas
- Visualização de rotas em mapas interativos
- Rastreamento em tempo real
- Histórico de entregas realizadas

### 📊 Business Intelligence
- Dashboards Power BI integrados
- Análises de performance e custos
- Relatórios customizados
- Exportação de dados

### 👤 Perfil de Usuário
- Autenticação segura com Firebase
- Upload de foto de perfil
- Edição de dados pessoais
- Gerenciamento completo da conta

## 🛠️ Tecnologias

- **React 18.2.0** - Biblioteca JavaScript para interfaces
- **Vite 5.0.0** - Build tool moderna e rápida
- **Firebase** - Autenticação e armazenamento
- **Power BI** - Business Intelligence integrado
- **Vercel** - Deploy e hospedagem
- **CSS3** - Estilização moderna com Flexbox e Grid

## �  Pré-requisitos

- **Node.js** (versão 18.0.0 ou superior)
- **npm** ou **yarn**
- **Git**

```bash
# Verificar instalações
node --version
npm --version
git --version
```

## 🚀 Instalação

### 1. Clonar o Repositório
```bash
git clone https://github.com/seu-usuario/frota-viva-react-v2.git
cd frota-viva-react-v2
```

### 2. Instalar Dependências
```bash
npm install
# ou
yarn install
```

### 3. Configurar Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto com suas configurações do Firebase e APIs.

### 4. Executar o Projeto
```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Visualizar build
npm run preview
```

O projeto estará disponível em: **http://localhost:5173**

## 📁 Estrutura do Projeto

```
frota-viva-react-v2/
├── 📁 public/                    # Arquivos estáticos
│   ├── frota-logo.svg           # Logo do projeto
│   └── default-avatar.svg       # Avatar padrão
├── 📁 src/                      # Código fonte
│   ├── 📁 components/           # Componentes React
│   │   ├── App.jsx             # Componente principal
│   │   ├── Dashboard.jsx       # Dashboard principal
│   │   ├── Header.jsx          # Cabeçalho da aplicação
│   │   ├── Vehicles.jsx        # Gestão de veículos
│   │   ├── Deliveries.jsx      # Gestão de entregas
│   │   ├── Rotas.jsx           # Visualização de rotas
│   │   ├── BI.jsx              # Business Intelligence
│   │   ├── ProfilePage.jsx     # Página de perfil
│   │   ├── Login.jsx           # Tela de login
│   │   └── Cadastro.jsx        # Tela de cadastro
│   ├── 📁 styles/              # Arquivos CSS
│   │   ├── App.css             # Estilos globais
│   │   ├── Header.css          # Estilos do cabeçalho
│   │   ├── Vehicle.css         # Estilos dos veículos
│   │   ├── Deliveries.css      # Estilos das entregas
│   │   ├── BI.css              # Estilos do BI
│   │   └── ProfilePage.css     # Estilos do perfil
│   ├── 📁 Utils/               # Utilitários
│   │   ├── ManipuladorApi.js   # Gerenciador de APIs
│   │   ├── CloudinaryManager.js # Gerenciador Cloudinary
│   │   └── Login.js            # Utilitários de login
│   └── 📁 firebase/            # Configuração Firebase
│       └── config.js           # Configuração do Firebase
├── 📁 api/                     # Vercel API Routes
│   ├── [...path].js           # Proxy geral para APIs
│   └── auth/
│       └── login.js           # Autenticação via Vercel
├── 📄 vite.config.js          # Configuração do Vite
├── 📄 package.json            # Dependências e scripts
├── 📄 .env                    # Variáveis de ambiente
└── 📄 README.md               # Este arquivo
```

## 🚀 Deploy

### Vercel (Recomendado)
1. Conecte seu repositório no [Vercel](https://vercel.com)
2. Configure as variáveis de ambiente necessárias
3. Deploy automático a cada push

### Configurações do Build
- **Framework**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

## 📞 Suporte

Para dúvidas ou problemas:
- Abra uma [issue](https://github.com/seu-usuario/frota-viva-react-v2/issues)
- Entre em contato com a equipe de desenvolvimento

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

<div align="center">
Desenvolvido com carinho pela equipe Frota Viva
</div>
