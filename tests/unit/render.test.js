/**
 * Teste unitario (Node, sem browser) da logica de render/ordenacao/store.
 * Executa: `npm run test:unit` ou `node tests/unit/render.test.js`.
 * Este e' o gate deterministico que roda antes do deploy (predeploy).
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const glob = {};
global.window = glob;

// Carrega dados + render no escopo global (mesmo modelo do browser).
eval(fs.readFileSync(path.join(root, 'data/brecho-products.js'), 'utf8'));
eval(fs.readFileSync(path.join(root, 'render.js'), 'utf8'));

const products = glob.BRECHO_PRODUCTS;
const { sortProducts, renderProducts, createProductStore } = glob;

let failures = 0;
function assert(cond, msg) {
  if (!cond) { console.error('  \u2717 FAIL:', msg); failures++; }
  else { console.log('  \u2713', msg); }
}

console.log('\n[1] Dados e paridade');
assert(Array.isArray(products) && products.length === 71, 'array com 71 anuncios');
assert(products.every((p) => p.name && p.price >= 0), 'todo anuncio tem name e price');
assert(products.filter((p) => p.sold).length === 18, '18 vendidos nos dados');

console.log('\n[2] Ordenacao (sortProducts)');
const ordered = sortProducts(products);
const nonSold = ordered.filter((p) => !p.sold).map((p) => p.price);
assert(JSON.stringify(nonSold) === JSON.stringify([...nonSold].sort((a, b) => b - a)),
  'nao-vendidos por preco desc');
const firstSold = ordered.findIndex((p) => p.sold);
const lastNonSold = ordered.length - 1 - [...ordered].reverse().findIndex((p) => !p.sold);
assert(firstSold > lastNonSold, 'vendidos agrupados no final');
assert(ordered[0].price === 300, 'topo e o maior preco (R$300)');

console.log('\n[3] Estabilidade da ordenacao (empates preservam ordem)');
const empatePrices = products.filter((p) => !p.sold && p.price === 50).map((p) => p.id);
const orderedEmpate = sortProducts(products).filter((p) => !p.sold && p.price === 50).map((p) => p.id);
assert(JSON.stringify(empatePrices) === JSON.stringify(orderedEmpate), 'empate de R$50 mantem ordem original');

console.log('\n[4] Render (markup)');
const container = { innerHTML: '' };
renderProducts(container, products);
assert((container.innerHTML.match(/class="product-card/g) || []).length === 71, 'markup: 71 cards');
assert((container.innerHTML.match(/product-card vendido/g) || []).length === 18, 'markup: 18 vendidos');
assert((container.innerHTML.match(/sold-overlay/g) || []).length === 18, 'markup: 18 overlays');
assert(!/undefined/.test(container.innerHTML), 'markup nao contem "undefined"');

console.log('\n[5] Store: setSold / toggleSold (reordena + re-renderiza)');
const items = products.map((p) => ({ ...p }));
const c2 = { innerHTML: '' };
let renders = 0;
const store = createProductStore(c2, items, () => { renders++; });
store.render();
assert(renders === 1, 'render inicial dispara onRender');
const alvo = store.render().find((p) => !p.sold);
assert(store.setSold(alvo.id, true) === true, 'setSold(id,true) retorna true');
assert((c2.innerHTML.match(/product-card vendido/g) || []).length === 19, 'apos setSold -> 19 vendidos no markup');
assert(new RegExp(`data-id="${alvo.id}"[^>]*class="[^"]*vendido`).test(c2.innerHTML) ||
       /product-card vendido"[^>]*data-id="' + alvo.id/.test(c2.innerHTML) ||
       c2.innerHTML.includes(`data-id="${alvo.id}"`), 'card alvo presente apos re-render');
assert(store.toggleSold(alvo.id) === false, 'toggleSold devolve novo estado (false)');
assert((c2.innerHTML.match(/product-card vendido/g) || []).length === 18, 'apos toggle volta a 18 vendidos');
assert(store.setSold(999999, true) === false, 'id inexistente -> false');
assert(store.toggleSold(999999) === null, 'toggle id inexistente -> null');

console.log('\n' + (failures === 0
  ? '\u2705 Todos os testes unitarios passaram.'
  : `\u274c ${failures} teste(s) falharam.`));
process.exit(failures === 0 ? 0 : 1);
