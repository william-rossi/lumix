# LUMIX

Plataforma imobiliária multi-tenant com foco em **maquetes 3D interativas**. O visitante explora o edifício, clica em uma unidade e vê preço, metragem, fotos e detalhes no mesmo fluxo. Cada imobiliária gerencia seus empreendimentos e cada projeto ganha uma página pública (microsite) com subdomínio próprio.

Stack: **Next.js 16 (App Router, Cache Components)**, **React 19**, **Tailwind CSS 4**, **Three.js / React Three Fiber**, **MongoDB + GridFS** (opcional), **Zod**.

---

## Rodando o projeto

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

O projeto funciona **sem banco de dados**: na ausência de `MONGODB_URI`, as leituras e escritas usam um store local persistido em `.data/lumix-store.json`, inicializado com `src/data/seed.ts`. O arquivo é compartilhado entre as páginas e as rotas de API, então criação de empreendimentos, edição de unidades e leads aparecem imediatamente em todo o app e sobrevivem a reinícios do servidor. Apague `.data/` para voltar ao dataset inicial.

O fallback em arquivo é destinado ao desenvolvimento local. Em produção, configure `MONGODB_URI`: ambientes serverless com sistema de arquivos somente leitura não conseguem persistir o store local.

```bash
npx tsc --noEmit   # typecheck
npm run build      # build de produção
npm run start      # servir o build
npm run lint       # ESLint
```

### MongoDB (opcional)

```bash
cp .env.example .env.local
# edite MONGODB_URI e MONGODB_DB
```

Com `MONGODB_URI` configurado, o repositório passa a usar MongoDB automaticamente. O banco começa vazio; para inserir o dataset de demonstração uma única vez:

```bash
# no .env.local: LUMIX_ALLOW_SEED=true
curl -X POST http://localhost:3000/api/dev/seed
```

A rota é bloqueada (403) quando `LUMIX_ALLOW_SEED` não é exatamente `true`. Remova a variável após o seed.

### Variáveis de ambiente

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `MONGODB_URI` | — | Habilita persistência real. Sem ela, store local em `.data/`. |
| `MONGODB_DB` | `lumix` | Nome do banco. |
| `LUMIX_STORE_FILE` | `.data/lumix-store.json` | Caminho do store local quando não há MongoDB. |
| `LUMIX_ALLOW_SEED` | — | `true` habilita `POST /api/dev/seed`. |
| `NEXT_PUBLIC_USE_SUBDOMAINS` | `false` | Usa links de subdomínio em vez de `/sites/[slug]`. |
| `NEXT_PUBLIC_ROOT_DOMAIN` | `lumix.com.br` | Domínio raiz para os microsites. |

---

## Rotas principais

| Rota | Descrição |
| --- | --- |
| `/` | Landing editorial com maquete 3D ao vivo, destaque, cidades e imobiliárias. |
| `/explorar` | Diretório público filtrável por região, tipologia, estágio e busca. |
| `/imobiliarias/[slug]` | Perfil da imobiliária com portfólio, contato e cobertura. |
| `/sites/[slug]` | Microsite do empreendimento: 3D, unidades, galeria, localização, lead. |
| `/entrar`, `/criar-conta` | Autenticação demonstrativa (client-side). |
| `/painel` | Visão geral da imobiliária demo: portfólio, leads, estoque, armazenamento. |
| `/painel/empreendimentos` | Lista de projetos com status, unidades e atalhos. |
| `/painel/empreendimentos/novo` | Cadastro inicial; gera 40 unidades e maquete procedural. |
| `/painel/empreendimentos/[id]` | Editor: visão geral, maquete, unidades e SEO/galeria. |
| `/painel/leads` | Funil de leads com detalhe, status e atalhos de contato. |
| `/painel/configuracoes` | Perfil da imobiliária, contato, endereço e integrações. |
| `/sobre`, `/privacidade`, `/termos` | Páginas institucionais e legais. |

### Demonstração

- O painel usa a imobiliária `agency_almeida` (**Almeida Vasconcelos**) como tenant fixo.
- Login/cadastro são simulados: `AuthForm` valida no cliente, grava `lumix:demo-session` no `localStorage` e navega para `/painel`. **Não há guarda de autenticação no servidor ainda.**
- Imagens de apartamento vêm de `public/examples` apenas como placeholders de demonstração.

---

## Arquitetura

```text
app/
  api/                     route handlers (developments, units, leads, models, agencies, dev/seed)
  painel/                  dashboard da imobiliária
  sites/[slug]/            microsite público do empreendimento
  explorar/                diretório público
  imobiliarias/[slug]/     perfil público da imobiliária
src/
  components/
    dashboard/             editor, modelos, unidades, leads, configurações
    development/           explorador 3D, diretório de unidades, detalhe, lead form
    marketing/             header/footer, cards, páginas legais
    viewer/                cena Three.js procedural + loader
    ui/                    primitivas editoriais
  data/seed.ts             dataset demo (agências, empreendimentos, unidades, leads)
  lib/
    db/mongodb.ts          conexão, índices e GridFS
    db/repository.ts       fronteira única de leitura/escrita (Mongo ou arquivo)
    glb.ts                 validação de GLB e sugestão de mapeamento de nós
    massing.ts             geração procedural de massa/posições
    store.ts               store local em arquivo + geração de unidades
    format.ts / utils.ts   formatação BRL/área/datas e helpers
  models/index.ts          tipos de domínio
```

Toda leitura/escrita de dados passa por `src/lib/db/repository.ts`. Páginas e rotas de API não acessam o MongoDB diretamente. Quando `MONGODB_URI` existe, o repositório usa Mongo; caso contrário, delega ao store local em arquivo.

### Dados e renderização

- Páginas do painel, o diretório público, os microsites e os perfis de imobiliária chamam `await connection()` antes da consulta, garantindo renderização por request mesmo com **Cache Components** habilitado. Assim, mudanças de preço, estoque e novos empreendimentos aparecem imediatamente.
- Slugs públicos de empreendimento e imobiliária são validados no `proxy.ts` antes da renderização. Como páginas dinâmicas usam streaming, lançar `notFound()` dentro da página não altera mais o status HTTP; a validação no proxy garante 404 real para endereços inexistentes ou não publicados.
- O diretório `/explorar` e os perfis `/imobiliarias/[slug]` consultam o repositório; empreendimentos publicados em runtime entram na busca e no portfólio da imobiliária.
- A landing `/` continua usando o seed como vitrine editorial curada. O restante do app usa a mesma fonte de dados.

---

## Pipeline 3D

O formato aceito é **GLTF binário (`.glb`)**. Não há conversão server-side de OBJ/FBX.

1. O usuário arrasta um `.glb` no editor do empreendimento.
2. `validateModelFile` inspeciona o arquivo no navegador: extensão, tamanho, header glTF, chunks, extensões e possibilidade de compressão.
3. Limite rígido de **8 MB** (recomendado até 3 MB, com Draco ou Meshopt).
4. O upload multipart vai para `POST /api/models`.
5. O binário é gravado no **GridFS**, bucket `models`; o documento em `model_assets` guarda filename, content type e `gridFsId`.
6. O empreendimento é atualizado com `model3d.url`, `model3d.fileSize` e `model3d.storage`.
7. `GET /api/models/[id]` serve o arquivo com cache imutável.

Enquanto não há GLB, o visualizador gera uma massa procedural a partir de `model3d.massing` (andares, unidades por andar, dimensões). Isso mantém o fluxo completo de seleção de unidade funcional desde o primeiro cadastro.

### Mapeamento JSON

O GLB contém apenas geometria. A relação entre malhas e unidades fica em um JSON separado, dentro do documento do empreendimento:

```json
{
  "developmentId": "dev_alto",
  "model": "/api/models/66f1c2...",
  "units": [
    {
      "unitId": "dev_alto_1202",
      "meshNames": ["A_1202", "A_1202_varanda"],
      "floorLevel": 12,
      "position": { "x": 4.2, "y": 37.2, "z": 0 }
    }
  ]
}
```

Vantagens: alterar preço, status ou fotos não exige reexportar o modelo; o mesmo GLB pode ser reutilizado; o vínculo é por `unitId`, não pelo nome do nó.

---

## Subdomínios

`proxy.ts` reescreve hosts não reservados para o microsite:

- produção: `alto-do-parque.lumix.com.br` → `/sites/alto-do-parque`
- local: `alto-do-parque.localhost:3000` → `/sites/alto-do-parque`

Para ativar links de subdomínio na UI, defina `NEXT_PUBLIC_USE_SUBDOMAINS=true` e `NEXT_PUBLIC_ROOT_DOMAIN`. Sem isso, todos os links usam `/sites/[slug]`, o que funciona localmente sem DNS.

Para produção, aponte um wildcard DNS (`*.seudominio.com.br`) para a aplicação e configure TLS wildcard. Subdomínios reservados (`api`, `painel`, `www`, `admin`, etc.) nunca são reescritos.

---

## Limitações conhecidas / próximos passos

- **Autenticação real**: hoje é apenas client-side. Próximo passo: sessão assinada em cookie, middleware/`proxy` protegendo `/painel` e isolamento por `agencyId`.
- **Unificação das fontes públicas**: a landing ainda lê `src/data/seed.ts` como vitrine editorial; diretório e perfis já usam o repositório.
- **Upload de mídia**: galeria usa imagens de exemplo; o pipeline GridFS já existe para modelos e pode ser reutilizado para fotos.
- **Walkthrough em primeira pessoa**: a cena procedural já expõe unidades; falta navegação em primeira pessoa e carregamento do GLB real no viewer.
- **Mapeamento assistido**: a sugestão de nós (`suggestNodeMapping`) cobre convenções comuns de nome; em produção, permitir edição manual do JSON no painel.
- **Storage de modelos órfãos**: excluir um empreendimento não remove o arquivo do GridFS; adicionar limpeza/coleta.
- **Build/CI**: `npm run build` e `npx tsc --noEmit` passam; adicionar ESLint no CI e testes de fluxo de lead/upload.

---

Feito para o mercado brasileiro. Interface em PT-BR, código e modelos de domínio em inglês.
