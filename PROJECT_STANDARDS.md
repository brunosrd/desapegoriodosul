# Padrões do Projeto — Desapego Rio do Sul

Documento de referência a ser seguido em todos os próximos trabalhos neste
repositório. Descreve a arquitetura, as regras de negócio, a API de dados dos
anúncios e a estratégia de testes obrigatória antes de cada deploy.

> Regra de ouro: **nenhum deploy sem que todos os testes automatizados passem**
> (`npm test`). Cada funcionalidade tem um teste automatizado dedicado.

---

## 1. Visão geral

Site estático (HTML + CSS + JavaScript puro, sem framework) que lista anúncios
de desapego. Hospedado no **GitHub Pages**, publicado automaticamente a cada
push na branch `main`.

Páginas:

| Página         | Conteúdo                                              |
|----------------|-------------------------------------------------------|
| `index.html`   | Vitrine principal — **data-driven** (`data/index-products.js`)   |
| `brecho.html`  | Brechó de roupas/calçados — **data-driven** (`data/brecho-products.js`) |
| `cozinha.html` | Itens de cozinha — **data-driven** (`data/cozinha-products.js`)  |

As **três páginas** usam o mesmo motor de renderização (`render.js`) e o mesmo
padrão: um `data/<pagina>-products.js` + `<div id="products-grid">` vazio +
bootstrap que cria o store da página.

Idioma do conteúdo e da documentação: **pt-BR**.

---

## 2. Arquitetura

### 2.1 Renderização data-driven dos anúncios (padrão atual — `brecho.html`)

Os anúncios **não são mais HTML fixo**. São dados que viram cards em runtime:

```
data/brecho-products.js   ──▶  window.BRECHO_PRODUCTS  (array de anúncios)
render.js                 ──▶  sortProducts / renderProducts / createProductStore
brecho.html               ──▶  <div class="products-grid" id="products-grid"></div>
                               + bootstrap que cria window.brechoStore
```

Fluxo no `brecho.html`:

```html
<script src="data/brecho-products.js"></script>
<script src="render.js"></script>
<script>
  /* funções slide/openModal/closeModal + initInteractions() */
  document.addEventListener('DOMContentLoaded', function () {
    const grid = document.getElementById('products-grid');
    window.brechoStore = createProductStore(grid, window.BRECHO_PRODUCTS, initInteractions);
    window.brechoStore.render();
  });
</script>
```

> As três páginas seguem este padrão. Cada uma expõe seu store global:
> `indexStore`, `brechoStore`, `cozinhaStore`.

### 2.2 Modelo de dados de um anúncio

```js
{
  id: 1,                       // identificador único e estável (não reordenar!)
  type: "Tênis",               // categoria curta (product-type)
  name: "Kit 8 Tênis Variados",// título (product-name) — obrigatório
  brand: "Marcas variadas…",   // marca/descrição (product-brand) — opcional
  size: "Tam. G",              // tamanho (product-size) — opcional
  price: 300,                  // número inteiro em reais — usado na ordenação
  priceLabel: "R$ 300",        // rótulo exibido
  images: [                    // 1+ imagens; botões/dots só aparecem com 2+
    { src: "Brecho/...jpeg", alt: "…" }
  ],
  badge: { cls: "original", text: "Original" }, // ou { cls: "", text: "Esportiva" } ou null
  sold: false                  // ← ÚNICA flag para marcar vendido/não-vendido
}
```

**Campos opcionais/especiais** (usados sobretudo no `index.html`):

| Campo | Uso |
|-------|-----|
| `pinTop: true` | Fixa o item no topo do seu grupo (cards de entrada sem preço). |
| `priceText` | Rótulo de preço não-numérico (ex.: "Preços acessíveis"). |
| `priceRow: true` | Envolve o preço em `.price-row` (layout do index). |
| `compareUrl` / `compareLabel` | Link "comparar preço" ao lado do preço. |
| `link` | Torna o card inteiro clicável (navega para outra página). |
| `cardStyle` / `nameStyle` / `priceStyle` | Estilos inline pontuais. |
| `extraHtml` | HTML extra dentro do `.product-info` (ex.: parágrafo de brinde). |
| `images[].style` / `images[].noZoom` | Estilo por imagem / imagem que não abre modal. |

### 2.3 API pública (`render.js`)

| Função | Descrição |
|--------|-----------|
| `sortProducts(items)` | Retorna nova lista ordenada (ver regras §3). Estável. Não muta. |
| `renderProducts(container, items)` | Ordena e injeta o markup no container. Retorna a lista ordenada. |
| `createProductStore(container, items, onRender?)` | Cria o store reativo. |

O **store** (`createProductStore`) é a forma recomendada de gerenciar estado:

```js
const store = createProductStore(grid, window.BRECHO_PRODUCTS, initInteractions);
store.render();                 // render inicial
store.setSold(3, true);         // marca id=3 como VENDIDO → reordena + re-renderiza
store.setSold(3, false);        // desmarca → volta a NÃO-VENDIDO → reordena + re-renderiza
store.toggleSold(3);            // alterna → reordena + re-renderiza
store.get(3);                   // retorna o anúncio (ou null)
```

Comportamento garantido do store ao alternar `sold`:
- Atualiza a flag `sold` do anúncio.
- **Reaplica a ordenação** (§3) automaticamente.
- **Re-renderiza os cards no formato correto**: vendido ganha `badge vendido`
  cinza + `.sold-overlay`; não-vendido volta ao seu `badge` original.
- Chama `onRender(container)` para religar interações (swipe/fade-in).

---

## 3. Regras de negócio

1. **Não-vendidos primeiro, vendidos no final.**
2. **Dentro de cada grupo** (não-vendidos e vendidos), ordenar por **preço
   decrescente** (maior preço primeiro). Esta regra vale para **todas as páginas**.
3. **Itens de entrada/destaque sem preço numérico** (ex.: cards "Brechó" e
   "Cozinha" no `index.html`, com `priceText` e `pinTop: true`) ficam no **topo**
   do grupo de não-vendidos.
4. **Estabilidade**: em empate de preço, mantém-se a ordem original do array
   (ordenação estável) — evita "pulos" visuais ao editar dados.
5. **Marcar vendido/não-vendido**: alterar **apenas** o campo `sold` do anúncio
   (ou usar `store.setSold`/`store.toggleSold`). Nunca editar markup à mão.
5. **Badges**:
   - `badge original` (verde) → peça original.
   - `badge` sem modificador → "Esportiva".
   - `badge novo` (usado no `index.html`) → item novo.
   - `badge vendido` (cinza) → aplicado automaticamente quando `sold: true`,
     junto do overlay "Vendido". Substitui o badge original enquanto vendido.
6. **Carrossel**: botões de navegação e dots **só aparecem com 2+ imagens**.
7. **Imagens**: todo `src` referenciado deve existir no repositório e ser
   copiado pelo workflow de deploy (ver §5). `alt` sempre preenchido.
8. **Contato**: toda página mantém o CTA de WhatsApp (`wa.me/5547988038778`).

---

## 4. Estratégia de testes (obrigatória antes do deploy)

Princípio: **cada funcionalidade tem pelo menos um teste automatizado**, os
testes **cobrem todas as páginas** (index, brechó, cozinha), e `npm test` deve
passar **antes de qualquer deploy** (hook `predeploy`).

### 4.1 Camadas

| Camada | Ferramenta | Arquivo(s) | Cobre | Roda sem browser? |
|--------|-----------|------------|-------|-------------------|
| Unitário | Node | `tests/unit/render.test.js` | 3 datasets + store | ✅ Sim |
| Integração DOM | Node + jsdom | `tests/integration/pages.dom.test.js` | 3 páginas reais | ✅ Sim |
| E2E | Cypress | `cypress/e2e/*.cy.js` | 3 páginas (parametrizado) | ❌ Requer browser |

- **Unitário**: lógica pura de `sortProducts`/`renderProducts`/store validada
  contra os três datasets (`INDEX_PRODUCTS`, `BRECHO_PRODUCTS`, `COZINHA_PRODUCTS`).
- **Integração DOM**: carrega cada HTML real com jsdom, executa os scripts e
  valida o DOM (contagem, ordenação por grupo, agrupamento de vendidos, toggle, modal).
- **E2E (Cypress)**: os specs iteram sobre `Cypress.PAGES` — cada teste roda nas
  três páginas.

### 4.2 Mapa funcionalidade → teste (Cypress)

| Funcionalidade | Spec |
|----------------|------|
| Render data-driven dos anúncios | `cypress/e2e/01-render.cy.js` |
| Ordenação por preço + agrupamento de vendidos | `cypress/e2e/02-ordenacao.cy.js` |
| Flag `sold` + API `setSold`/`toggleSold` (reordena + reformata) | `cypress/e2e/03-sold-toggle.cy.js` |
| Carrossel e modal | `cypress/e2e/04-carrossel-modal.cy.js` |
| Navegação entre páginas + CTA WhatsApp | `cypress/e2e/05-navegacao.cy.js` |

> Ao adicionar uma nova funcionalidade, **crie o spec correspondente** e
> registre-o nesta tabela.

### 4.3 Comandos

```bash
npm install            # instala deps de teste (uma vez)

npm run test:unit         # testes unitários (Node)
npm run test:integration  # integração DOM (Node + jsdom)
npm test                  # unit + integração  ← gate mínimo de pré-deploy
npm run test:e2e          # Cypress headless (requer browser + libs de sistema)
npm run test:e2e:open     # Cypress interativo
npm run test:all          # unit + integração + e2e
```

**Padrões Cypress adotados:**
- `baseUrl` configurada; specs usam caminhos relativos.
- Comando custom `cy.visitBrecho()` aguarda os cards renderizarem (evita flakiness).
- Sem `cy.wait(<tempo fixo>)`; usar asserções que reesperam (`should`).
- Seletores por classe/estrutura semântica e `data-*` (`data-id`, `data-sold`,
  `data-price` expostos em cada card pelo `render.js`).
- Um `describe` por funcionalidade; `it` curtos e independentes.

### 4.4 Ambientes sem browser

Se o browser/libary do Cypress não estiver disponível (ex.: CI mínimo, falta de
`libnss3`), o gate de pré-deploy é `npm test` (unit + integração DOM), que cobre
as regras de negócio no DOM real. O E2E Cypress deve ser executado em ambiente
com browser antes de releases significativos.

---

## 5. Deploy

- **Gatilho**: push na branch `main` (workflow `.github/workflows/deploy.yml`).
- **Nunca** commitar direto sem rodar `npm test` antes.
- O workflow monta `_site/` copiando: HTMLs, `render.js`, `data/*.js`, e as
  imagens referenciadas (`img/`, `Brecho/`, `Cozinha/`, imagens de raiz).
- **Ao adicionar novos arquivos JS/dados/pastas de imagem, atualizar o passo
  "Prepare site files" do workflow** para copiá-los ao `_site/`.
- `_site/` e `node_modules/` estão no `.gitignore`.

Checklist de pré-deploy:

1. `npm test` verde.
2. Imagens novas existem e são copiadas pelo workflow.
3. Integridade do HTML (tags balanceadas; sem `undefined` no markup).
4. Commit apenas dos arquivos da tarefa (evitar `git add .` cego).
5. Push na `main` e confirmar o workflow "Publish Site" com sucesso.

---

## 6. Convenções de código

- HTML/CSS/JS em português nos textos; nomes de identificadores podem ser em
  inglês/português desde que consistentes com o arquivo.
- `render.js` sem dependências externas; compatível com browser e Node
  (exporta via `window` e `module.exports`).
- Escapar sempre conteúdo dinâmico inserido como HTML (há `escapeHtml` no
  `render.js`) — não introduzir XSS ao renderizar dados.
- Mudanças de dados de anúncio = editar `data/<pagina>-products.js`; mudanças de
  layout/comportamento = editar `render.js`/CSS. Não misturar dado com markup.
