/**
 * Teste unitario (Node) da logica de render/ordenacao/store — cobre os
 * datasets das TRES paginas. Gate deterministico do predeploy.
 * Executa: `node tests/unit/render.test.js`.
 */
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..', '..');

let failures = 0;
function assert(cond, msg) {
  if (!cond) { console.error('  \u2717 FAIL:', msg); failures++; }
  else { console.log('  \u2713', msg); }
}

// Carrega render.js uma vez.
const g = {}; global.window = g;
eval(fs.readFileSync(path.join(root, 'render.js'), 'utf8'));
const { sortProducts, renderProducts, createProductStore } = g;

const DATASETS = [
  { file: 'data/index-products.js', varName: 'INDEX_PRODUCTS', total: 38, sold: 24 },
  { file: 'data/brecho-products.js', varName: 'BRECHO_PRODUCTS', total: 71, sold: 19 },
  { file: 'data/cozinha-products.js', varName: 'COZINHA_PRODUCTS', total: 27, sold: 0 },
];

function loadData(file, varName) {
  const gd = {}; global.window = gd;
  eval(fs.readFileSync(path.join(root, file), 'utf8'));
  global.window = g; // restaura para render.js
  return gd[varName];
}

const isDesc = (a) => JSON.stringify(a) === JSON.stringify([...a].sort((x, y) => y - x));
const groupPrices = (ordered, sold) =>
  ordered.filter((p) => !!p.sold === sold && !p.pinTop && typeof p.price === 'number').map((p) => p.price);

for (const D of DATASETS) {
  console.log(`\n=== ${D.varName} ===`);
  const items = loadData(D.file, D.varName);

  assert(Array.isArray(items) && items.length === D.total, `${D.total} anuncios`);
  assert(items.every((p) => p.name), 'todo anuncio tem name');
  assert(items.filter((p) => p.sold).length === D.sold, `${D.sold} vendidos nos dados`);

  const ordered = sortProducts(items);
  assert(isDesc(groupPrices(ordered, false)), 'nao-vendidos por preco desc');
  assert(isDesc(groupPrices(ordered, true)), 'vendidos por preco desc');
  const firstSold = ordered.findIndex((p) => p.sold);
  const lastNon = ordered.length - 1 - [...ordered].reverse().findIndex((p) => !p.sold);
  if (firstSold !== -1) assert(firstSold > lastNon, 'vendidos agrupados no final');
  // itens pinTop no topo dos nao-vendidos
  const pinCount = items.filter((p) => p.pinTop && !p.sold).length;
  if (pinCount > 0) {
    const top = ordered.filter((p) => !p.sold).slice(0, pinCount);
    assert(top.every((p) => p.pinTop), 'itens pinTop no topo dos nao-vendidos');
  }

  const c = { innerHTML: '' };
  renderProducts(c, items);
  assert((c.innerHTML.match(/class="product-card/g) || []).length === D.total, `markup: ${D.total} cards`);
  assert((c.innerHTML.match(/product-card vendido/g) || []).length === D.sold, `markup: ${D.sold} vendidos`);
  assert(!/undefined/.test(c.innerHTML), 'markup sem "undefined"');
}

// Store: setSold/toggleSold com dataset do brecho.
console.log('\n=== Store (setSold/toggleSold) ===');
const items = loadData('data/brecho-products.js', 'BRECHO_PRODUCTS').map((p) => ({ ...p }));
const cc = { innerHTML: '' };
let renders = 0;
const store = createProductStore(cc, items, () => { renders++; });
store.render();
assert(renders === 1, 'render inicial dispara onRender');
const base = items.filter((p) => p.sold).length;
const alvo = store.render().find((p) => !p.sold);
assert(store.setSold(alvo.id, true) === true, 'setSold(id,true) => true');
assert((cc.innerHTML.match(/product-card vendido/g) || []).length === base + 1, `setSold -> ${base + 1} vendidos`);
assert(store.toggleSold(alvo.id) === false, 'toggleSold => false');
assert((cc.innerHTML.match(/product-card vendido/g) || []).length === base, `toggle -> ${base} vendidos`);
assert(store.setSold(999999, true) === false, 'id inexistente => false');
assert(store.toggleSold(999999) === null, 'toggle id inexistente => null');

console.log('\n' + (failures === 0
  ? '\u2705 Testes unitarios (3 datasets + store): todos passaram.'
  : `\u274c ${failures} teste(s) falharam.`));
process.exit(failures === 0 ? 0 : 1);
