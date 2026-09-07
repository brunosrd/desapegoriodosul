/**
 * Teste de integracao DOM (jsdom) — substituto executavel dos specs Cypress
 * em ambientes sem browser. Carrega brecho.html REAL, executa render.js + dados,
 * e valida render, ordenacao, formatos e a API do store no DOM.
 *
 * Executa: `node tests/integration/brecho.dom.test.js`
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const root = path.resolve(__dirname, '..', '..');
let failures = 0;
const assert = (c, m) => { if (!c) { console.error('  \u2717 FAIL:', m); failures++; } else { console.log('  \u2713', m); } };

const html = fs.readFileSync(path.join(root, 'brecho.html'), 'utf8');
const dom = new JSDOM(html, {
  runScripts: 'outside-only',
  resources: 'usable',
});
const { window } = dom;

// jsdom nao implementa IntersectionObserver (usado no fade-in). Polyfill minimo:
// marca os elementos como visiveis imediatamente, como um browser faria ao scrollar.
window.IntersectionObserver = class {
  constructor(cb) { this.cb = cb; }
  observe(el) { this.cb([{ isIntersecting: true, target: el }]); }
  unobserve() {}
  disconnect() {}
};

// Injeta os scripts externos na ordem correta (jsdom nao busca file:// por padrao aqui).
function injectScript(relPath) {
  const code = fs.readFileSync(path.join(root, relPath), 'utf8');
  window.eval(code);
}
injectScript('data/brecho-products.js');
injectScript('render.js');

// Executa o <script> inline do brecho.html (define openModal/closeModal/initInteractions
// e o bootstrap com DOMContentLoaded). jsdom 'outside-only' nao roda scripts embutidos.
const inlineMatch = html.match(/<script>([\s\S]*?)<\/script>\s*<\/body>/i);
if (!inlineMatch) { console.error('FAIL: nao encontrei o script inline'); process.exit(1); }
window.eval(inlineMatch[1]);

// Dispara o bootstrap (DOMContentLoaded) manualmente.
const evt = new window.Event('DOMContentLoaded', { bubbles: true });
window.document.dispatchEvent(evt);

const doc = window.document;
const grid = doc.getElementById('products-grid');

console.log('\n[DOM] Render inicial');
const cards = grid.querySelectorAll('.product-card');
assert(cards.length === 71, `71 cards renderizados no DOM (obtido ${cards.length})`);
assert(grid.querySelectorAll('.product-card.vendido').length === 18, '18 cards vendidos no DOM');
assert(grid.querySelectorAll('.sold-overlay').length === 18, '18 overlays no DOM');
assert(!!window.brechoStore, 'window.brechoStore exposto');

console.log('\n[DOM] Ordenacao por preco');
const precos = [...grid.querySelectorAll('.product-card:not(.vendido) .product-price')]
  .map((el) => parseInt(el.textContent.replace(/[^\d]/g, ''), 10));
assert(precos.length > 0 && JSON.stringify(precos) === JSON.stringify([...precos].sort((a, b) => b - a)),
  'nao-vendidos por preco desc no DOM');
const firstCardPrice = parseInt(cards[0].querySelector('.product-price').textContent.replace(/[^\d]/g, ''), 10);
assert(firstCardPrice === 300, 'primeiro card e R$300');

console.log('\n[DOM] Toggle via store re-renderiza o DOM');
const alvo = window.brechoStore.render().find((p) => !p.sold);
window.brechoStore.setSold(alvo.id, true);
const cardAlvo = grid.querySelector(`.product-card[data-id="${alvo.id}"]`);
assert(cardAlvo && cardAlvo.classList.contains('vendido'), 'card alvo virou vendido no DOM');
assert(cardAlvo.querySelector('.sold-overlay'), 'card alvo ganhou overlay');
assert(grid.querySelectorAll('.product-card.vendido').length === 19, 'DOM agora com 19 vendidos');
window.brechoStore.toggleSold(alvo.id);
const cardAlvo2 = grid.querySelector(`.product-card[data-id="${alvo.id}"]`);
assert(!cardAlvo2.classList.contains('vendido'), 'card alvo voltou a nao-vendido');
assert(!cardAlvo2.querySelector('.sold-overlay'), 'overlay removido ao desmarcar');
assert(grid.querySelectorAll('.product-card.vendido').length === 18, 'DOM de volta a 18 vendidos');

console.log('\n[DOM] Modal');
assert(typeof window.openModal === 'function' && typeof window.closeModal === 'function', 'funcoes de modal existem');
const firstImg = grid.querySelector('.carousel-track img');
window.openModal(firstImg);
assert(doc.getElementById('imageModal').classList.contains('active'), 'modal abre ao openModal');
window.closeModal();
assert(!doc.getElementById('imageModal').classList.contains('active'), 'modal fecha ao closeModal');

console.log('\n' + (failures === 0
  ? '\u2705 Integracao DOM: todos os testes passaram.'
  : `\u274c Integracao DOM: ${failures} falha(s).`));
process.exit(failures === 0 ? 0 : 1);
