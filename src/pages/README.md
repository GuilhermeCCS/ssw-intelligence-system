# SSW INTELLIGENCE

<div align="center">

![SSW INTELLIGENCE](images/logo.ico)

**Plataforma de Auditoria Web e Benchmarking Competitivo**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/GuilhermeCCS/ssw-intelligence-system/blob/main/README.md#-licena)
[![Status](https://img.shields.io/badge/status-Active-green.svg)](https://ssw-intelligence.vercel.app)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/GuilhermeCCS/ssw-intelligence-system)

[Visitar Site](https://ssw-intelligence.vercel.app) • [Relatar Bug](https://github.com/GuilhermeCCS/ssw-intelligence-system/issues)

</div>

## 📋 Sumário

- [Sobre o Sistema](#-sobre-o-sistema)
- [🚀 Funcionalidades](#-funcionalidades)
- [🛠️ Tecnologias Utilizadas](#️-tecnologias-utilizadas)
- [📁 Estrutura do Projeto](#-estrutura-do-projeto)
- [🔧 Instalação e Configuração](#-instalação-e-configuração)
- [🚀 Deploy](#-deploy)
- [📖 Documentação da API](#-documentação-da-api)
- [ Segurança](#-segurança)
- [🤝 Contribuição](#-contribuição)
- [📄 Licença](#-licença)

## 🌟 Sobre o Sistema

O **SSW INTELLIGENCE** é uma plataforma enterprise de auditoria web e benchmarking competitivo impulsionada por inteligência artificial. Desenvolvida para ajudar empresas e profissionais a analisar sites, comparar concorrentes e gerar insights valiosos para otimização de performance e experiência do usuário.

### Principais Objetivos

- **Análise Técnica**: Auditoria completa de sites com foco em performance, SEO e acessibilidade
- **Ranking Competitivo**: Classificação e comparação de sites no mercado
- **Geração de Insights**: Relatórios detalhados com recomendações acionáveis

## 🚀 Funcionalidades

### 🎯 Módulos Principais

#### 1. **Auditoria e Análise**
- Análise automatizada de performance e SEO
- Geração de scores de qualidade
- Captura de screenshots (mobile e desktop)
- Relatórios imprimíveis em PDF

#### 2. **Ranking Global**
- Classificação de sites por nicho e performance
- Dashboard competitivo em tempo real
- Métricas comparativas do mercado

### ✨ Funcionalidades Adicionais

- **Sistema de Autenticação**: Login seguro com gerenciamento de sessão
- **Gestão de Licenças**: Sistema de créditos para análises
- **Interface Responsiva**: Design adaptativo para todos os dispositivos
- **Relatórios em PDF**: Exportação profissional dos resultados
- **Open Graph**: Compartilhamento otimizado em redes sociais

## 🛠️ Tecnologias Utilizadas

### Frontend
- **HTML5**: Estrutura semântica e acessível
- **Tailwind CSS**: Framework CSS utilitário para design moderno
- **JavaScript ES6+**: Lógica de negócio e interatividade
- **Lucide Icons**: Biblioteca de ícones modernos

### Design & UX
- **Glass Morphism**: Design moderno com efeitos de vidro
- **Dark Mode**: Interface otimizada para reduzir fadiga visual
- **Animações CSS**: Transições suaves e micro-interações
- **Responsive Design**: Experiência consistente em todos os dispositivos

### Backend & API
- **RESTful API**: Arquitetura limpa e escalável
- **JSON**: Formato de dados padrão
- **LocalStorage**: Persistência de dados no cliente

## 📁 Estrutura do Projeto

```
ssw-intelligence-system/
├── 📁 CSS/
│   └── 📄 style.css              # Estilos personalizados
├── 📁 js/
│   ├── 📄 auth.js                # Sistema de autenticação
│   ├── 📄 ranking.js             # Sistema de ranking
│   └── 📄 config.js              # Configurações globais
├── 📁 images/
│   ├── 🖼️ logo.ico               # Logo do sistema
│   └── 🖼️ og-image.svg           # Imagem para redes sociais
├── 📄 index.html                 # Aplicação principal
├── 📄 og-image-generator.html    # Gerador de imagens OG
├── 📄 OPEN_GRAPH_SETUP.md        # Documentação OG
├── 📄 .gitignore                 # Arquivos ignorados pelo Git
└── 📄 README.md                  # Este arquivo
```

## 🔧 Instalação e Configuração

### Pré-requisitos

- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Conexão com internet para acesso à API
- Servidor web para deploy (Apache, Nginx, ou similar)

### Instalação Local

1. **Clone o repositório**
   ```bash
   git clone https://github.com/GuilhermeCCS/ssw-intelligence-system.git
   cd ssw-intelligence-system
   ```

2. **Configure a API**
   - Abra `js/config.js`
   - Atualize a URL da API se necessário:
   ```javascript
   const API_URL = "https://sua-api-aqui.com";
   ```

3. **Configure o Domínio**
   - Abra `index.html`
   - Substitua `https://seu-dominio-aqui.com` pelo seu domínio real nas meta tags Open Graph (ex: https://ssw-intelligence.vercel.app)

4. **Inicie um servidor local**
   ```bash
   # Usando Python
   python -m http.server 8000
   
   # Usando Node.js (com http-server)
   npx http-server
   
   # Usando PHP
   php -S localhost:8000
   ```

5. **Acesse o sistema**
   - Abra `http://localhost:8000` no navegador
   - Crie uma conta ou faça login

## 🚀 Deploy

### Deploy em Servidor Web

1. **Upload dos arquivos**
   ```bash
   # Copie todos os arquivos para o servidor
   scp -r * usuario@servidor:/var/www/html/
   ```

2. **Configuração do servidor**
   - Garanta que o servidor sirva arquivos estáticos
   - Configure HTTPS para produção
   - Ative gzip para otimização

3. **Configuração do Domínio**
   - Atualize as meta tags Open Graph com seu domínio real
   - Configure DNS para apontar para seu servidor

### Deploy em Plataformas Cloud

#### Netlify
1. Conecte seu repositório ao Netlify
2. Configure o diretório de publicação (raiz)
3. Adicione variáveis de ambiente se necessário

#### Vercel
1. Importe o projeto no Vercel
2. Configure as configurações de build
3. Deploy automático via Git

#### GitHub Pages
1. Configure GitHub Pages no repositório
2. Selecione a branch `main`
3. Acesse via `https://username.github.io/repo`

## 📖 Documentação da API

### Endpoint Principal

```
Base URL: https://82e29984-9ee4-4727-929e-57421b477e7a-00-2bi525obh81pp.worf.replit.dev
```

### Endpoints Disponíveis

#### Autenticação
- `POST /auth/login` - Login de usuário
- `POST /auth/register` - Cadastro de novo usuário
- `GET /auth/profile` - Dados do perfil

#### Auditoria
- `POST /audit` - Iniciar nova auditoria
- `GET /audit/{id}` - Resultados da auditoria
- `GET /audit/history` - Histórico de auditorias

#### Benchmarking
- `POST /compare` - Comparar sites
- `GET /compare/{id}` - Resultados da comparação

#### Ranking
- `GET /ranking` - Ranking global
- `GET /ranking/{niche}` - Ranking por nicho

### Formato de Resposta

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "score": 85,
    "niche": "tecnologia",
    "screenshots": {
      "mobile": "url",
      "desktop": "url"
    },
    "recommendations": [...]
  },
  "message": "Análise concluída com sucesso"
}
```

##  Segurança

### Medidas Implementadas

- **Autenticação Segura**: Sistema de login com validação
- **Proteção CSRF**: Tokens de segurança em formulários
- **Sanitização de Dados**: Validação de inputs do usuário
- **HTTPS Obrigatório**: Criptografia em todas as comunicações
- **Rate Limiting**: Limite de requisições por usuário
- **CORS Configurado**: Controle de acesso entre origens

### Melhores Práticas

- Senhas armazenadas com hash
- Sessões com tempo de expiração
- Validação de dados no client-side e server-side
- Logs de auditoria para atividades suspeitas
- Backup regular dos dados

## 🤝 Contribuição

Contribuições são bem-vindas! Por favor, siga estas diretrizes:

### Como Contribuir

1. **Fork o repositório**
2. **Crie uma branch** para sua feature
   ```bash
   git checkout -b feature/nova-funcionalidade
   ```
3. **Faça commit das mudanças**
   ```bash
   git commit -m 'Adiciona nova funcionalidade'
   ```
4. **Push para a branch**
   ```bash
   git push origin feature/nova-funcionalidade
   ```
5. **Abra um Pull Request**

### Diretrizes de Código

- Use JavaScript ES6+
- Siga o padrão de nomenclatura existente
- Comente código complexo
- Mantenha a consistência de estilo
- Teste suas alterações

### Report de Issues

- Use o template de issue
- Inclua detalhes sobre o ambiente
- Adicione screenshots se aplicável
- Seja claro e conciso na descrição

## 📄 Licença

Este projeto está licenciado sob a Licença MIT.

### O que a Licença MIT Permite

- ✅ Uso comercial
- ✅ Modificação
- ✅ Distribuição
- ✅ Uso privado
- ✅ Sublicenciamento

### O que é Exigido

- ⚠️ Incluir a licença
- ⚠️ Manter o aviso de copyright


---

<div align="center">

**Desenvolvido com ❤️ por SSW INTELLIGENCE**

© 2024 SSW INTELLIGENCE. Todos os direitos reservados.

[Topo](#-ssw--intelligence)

</div>



