# Open Graph Configuration

## Como configurar a prévia do site ao compartilhar links

O sistema agora está configurado com Open Graph meta tags que permitem que quando você compartilhar o link do seu site, apareça uma prévia personalizada com:

- ✅ Título do site
- ✅ Descrição atraente  
- ✅ Imagem personalizada (1200x630px)
- ✅ Nome do site
- ✅ URL canônico

## Arquivos criados

1. **`images/og-image.svg`** - Imagem de prévia otimizada para redes sociais
2. **`og-image-generator.html`** - Gerador visual para criar/alterar a imagem

## Configuração necessária

### 1. Atualizar o domínio

Substitua `https://seu-dominio-aqui.com` nas meta tags pelo seu domínio real:

```html
<meta property="og:url" content="https://seu-seu-dominio-real.com">
<link rel="canonical" href="https://seu-dominio-real.com">
```

### 2. Testar as meta tags

Use estas ferramentas para testar:

- **Facebook Debugger**: https://developers.facebook.com/tools/debug/
- **Twitter Card Validator**: https://cards-dev.twitter.com/validator
- **LinkedIn Post Inspector**: https://www.linkedin.com/post-inspector/

### 3. Personalizar a imagem (opcional)

Abra `og-image-generator.html` no navegador para visualizar e modificar a imagem de prévia. Quando estiver satisfeito, faça print da tela ou converta para JPG/PNG.

## Meta tags incluídas

### Open Graph (Facebook, LinkedIn, etc.)
- `og:title` - Título principal
- `og:description` - Descrição do site
- `og:image` - Imagem de prévia
- `og:image:width` - Largura da imagem (1200px)
- `og:image:height` - Altura da imagem (630px)
- `og:image:type` - Tipo da imagem (SVG)
- `og:url` - URL canonical
- `og:type` - Tipo de conteúdo (website)
- `og:site_name` - Nome do site
- `og:locale` - Idioma (pt_BR)

### Twitter Cards
- `twitter:card` - Tipo de card (summary_large_image)
- `twitter:title` - Título para Twitter
- `twitter:description` - Descrição para Twitter
- `twitter:image` - Imagem para Twitter

### SEO
- `description` - Meta descrição para motores de busca
- `keywords` - Palavras-chave
- `author` - Autor do conteúdo
- `canonical` - URL canonical

## Dimensões recomendadas

- **Imagem**: 1200x630px (proporção 1.91:1)
- **Título**: Até 60 caracteres
- **Descrição**: Até 155 caracteres

## Resultado esperado

Ao compartilhar o link, aparecerá:

```
┌─────────────────────────────────────────────────────┐
│  [IMAGEM 1200x630]                                  │
│                                                     │
│  S.S.W | INTELLIGENCE - Plataforma de Auditoria Web │
│  Plataforma de auditoria web e benchmarking         │
│  competitivo impulsionada por IA...                  │
│                                                     │
│  seu-dominio.com                                    │
└─────────────────────────────────────────────────────┘
```

## Deploy

Após configurar as meta tags com seu domínio real:

1. Faça commit das alterações
2. Faça deploy para seu servidor
3. Aguarde alguns minutos para que as redes sociais atualizem o cache
4. Teste o compartilhamento

## Dicas adicionais

- Use imagens de alta qualidade
- Mantenha o texto curto e impactante
- Inclua elementos visuais da sua marca
- Teste em diferentes plataformas (WhatsApp, Facebook, LinkedIn, Twitter)
