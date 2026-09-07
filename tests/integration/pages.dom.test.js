/**
 * Teste de integracao DOM (jsdom) — cobre TODAS as paginas do site.
 * Carrega cada HTML real, executa scripts e valida render, ordenacao,
 * agrupamento de vendidos, formatos e (quando aplicavel) a API do store.
 *
 * Executa: `node tests/integration/pages.dom.test.js`
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const root = path.resolve(__dirname, '..', '..');
let failures = 0;
const assert = (c, m) => { if (!c) { console.error('  \u2717 FAIL:', m); failures++; } else { console.log('  \u2713', m); } };

const PAGES = [
  { file: 'index.html', store: 'indexStore', total: 38, sold: 24 },
  { file: 'brecho.html', store: 'brechoStore', total: 71, sold: 19 },
  { file: 'cozinha.html', store: 'cozinhaStore', total: 27, sold: 0 },
];

function loadPage(file) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const dom = new JSDOM(html, { runScripts: 'outside-only' });
  const { window } = dom;
  // Polyfill IntersectionObserver (jsdom nao implementa).
  window.IntersectionObserver = class {
    constructor(cb) { this.cb = cb; }
    observe(el) { this.cb([{ isIntersecting: true, target: el }]); }
    unobserve() {} disconnect() {}
  };
  // injeta os <script src="..."> externos na ordem de aparicao no HTML
  const srcs = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);
  for (const src of srcs) window.eval(fs.readFileSync(path.join(root, src), 'utf8'));
  // executa o <script> inline (bootstrap)
  const inline = html.match(/<script>([\s\S]*?)<\/script>\s*<\/body>/i);
  if (inline) window.eval(inline[1]);
  window.document.dispatchEvent(new window.Event('DOMContentLoaded', { bubbles: true }));
  return window;
}

function precosGrupo(grid, sold) {
  return [...grid.querySelectorAll('.product-card')]
    .filter((c) => c.classList.contains('vendido') === sold)
    .map((c) => {
      const el = c.querySelector('.product-price');
      const raw = el ? el.textContent.replace(/[^\d]/g, '') : '';
      return raw ? parseInt(raw, 10) : null;
    })
    .filter((n) => n != null);
}
const isDesc = (a) => JSON.stringify(a) === JSON.stringify([...a].sort((x, y) => y - x));

for (const P of PAGES) {
  console.log(`\n=== ${P.file} ===`);
  const win = loadPage(P.file);
  const grid = win.document.getElementById('products-grid');
  assert(!!grid, 'existe #products-grid');
  const cards = grid.querySelectorAll('.product-card');
  assert(cards.length === P.total, `${P.total} cards renderizados (obtido ${cards.length})`);
  assert(grid.querySelectorAll('.product-card.vendido').length === P.sold, `${P.sold} vendidos`);
  assert(grid.querySelectorAll('.sold-overlay').length === P.sold, `${P.sold} overlays`);

  // vendidos apos nao-vendidos
  const arr = [...cards].map((c) => c.classList.contains('vendido'));
  const firstSold = arr.indexOf(true);
  const lastNon = arr.lastIndexOf(false);
  if (firstSold !== -1) assert(firstSold > lastNon, 'vendidos agrupados apos nao-vendidos');

  // ordenacao por preco desc em cada grupo
  assert(isDesc(precosGrupo(grid, false)), 'nao-vendidos por preco desc');
  assert(isDesc(precosGrupo(grid, true)), 'vendidos por preco desc');

  // modal
  assert(typeof win.openModal === 'function', 'openModal existe');
  const zoomImg = grid.querySelector('.product-card:not([onclick]) .carousel-track img');
  if (zoomImg) {
    win.openModal(zoomImg);
    assert(win.document.getElementById('imageModal').classList.contains('active'), 'modal abre');
    win.closeModal();
    assert(!win.document.getElementById('imageModal').classList.contains('active'), 'modal fecha');
  }

  // store: toggle reordena e re-renderiza (quando ha store)
  const store = win[P.store];
  assert(!!store, `window.${P.store} exposto`);
  if (store) {
    const alvo = store.render().find((p) => !p.sold && typeof p.price === 'number');
    if (alvo) {
      const soldAntes = grid.querySelectorAll('.product-card.vendido').length;
      store.setSold(alvo.id, true);
      assert(grid.querySelectorAll('.product-card.vendido').length === soldAntes + 1,
        'setSold adiciona 1 vendido no DOM');
      const cardAlvo = grid.querySelector(`.product-card[data-id="${alvo.id}"]`);
      assert(cardAlvo && cardAlvo.classList.contains('vendido') && cardAlvo.querySelector('.sold-overlay'),
        'card alvo reformatado como vendido');
      store.toggleSold(alvo.id);
      assert(grid.querySelectorAll('.product-card.vendido').length === soldAntes,
        'toggle volta ao estado anterior');
      assert(isDesc(precosGrupo(grid, false)), 'reordenacao mantida apos toggle');
    }
  }
}

console.log('\n' + (failures === 0
  ? '\u2705 Integracao DOM (3 paginas): todos os testes passaram.'
  : `\u274c Integracao DOM: ${failures} falha(s).`));
process.exit(failures === 0 ? 0 : 1);
