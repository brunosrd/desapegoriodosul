/**
 * render.js — Renderizacao data-driven dos anuncios.
 *
 * Regras de negocio (ver PROJECT_STANDARDS.md):
 *  - Anuncios NAO vendidos aparecem primeiro, ordenados por preco DECRESCENTE.
 *  - Anuncios vendidos ficam agrupados no FINAL.
 *  - Empates de preco preservam a ordem original do array (ordenacao estavel).
 *  - Para marcar/desmarcar vendido, basta alterar `sold: true|false` no dado.
 *
 * Uso:
 *   renderProducts(document.querySelector('.products-grid'), window.BRECHO_PRODUCTS);
 */
(function (global) {
  'use strict';

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /**
   * Ordena os anuncios seguindo a regra unica do site:
   *  1. Nao-vendidos primeiro; vendidos no final.
   *  2. Dentro de cada grupo, preco DECRESCENTE.
   *  3. Itens fixados (`pinTop: true`) ou sem preco numerico ficam no topo do
   *     seu grupo (ex.: cards de entrada "Brecho"/"Cozinha" sem preco).
   *  4. Ordenacao estavel: empates mantem a ordem original do array.
   */
  function sortProducts(items) {
    function priceValue(p) {
      // pinTop ou preco nao-numerico => topo do grupo (Infinity).
      if (p.pinTop) return Infinity;
      var n = typeof p.price === 'number' ? p.price : NaN;
      return isNaN(n) ? Infinity : n;
    }
    var indexed = items.map(function (p, i) { return { p: p, i: i }; });
    indexed.sort(function (a, b) {
      // vendidos por ultimo
      if (!!a.p.sold !== !!b.p.sold) return a.p.sold ? 1 : -1;
      // dentro do mesmo grupo, preco desc
      var pa = priceValue(a.p), pb = priceValue(b.p);
      if (pb !== pa) return pb - pa;
      // empate: ordem original (estavel)
      return a.i - b.i;
    });
    return indexed.map(function (x) { return x.p; });
  }

  function buildCarousel(product) {
    var imgs = product.images || [];
    var slides = imgs.map(function (img) {
      var style = img.style ? ' style="' + escapeHtml(img.style) + '"' : '';
      // cards de entrada (link) nao abrem modal: imagem sem onclick.
      var onclick = (img.noZoom || product.link) ? '' : ' onclick="openModal(this)"';
      return '<img src="' + escapeHtml(img.src) + '" alt="' + escapeHtml(img.alt) + '"' +
        onclick + style + '>';
    }).join('\n                    ');

    var dots = imgs.map(function (_, i) {
      return '<span class="dot' + (i === 0 ? ' active' : '') + '"></span>';
    }).join('');

    var badgeHtml = '';
    if (product.sold) {
      badgeHtml = '<span class="badge vendido">Vendido</span>\n' +
        '                <div class="sold-overlay"><span>Vendido</span></div>';
    } else if (product.badge) {
      var cls = product.badge.cls ? ' ' + escapeHtml(product.badge.cls) : '';
      badgeHtml = '<span class="badge' + cls + '">' + escapeHtml(product.badge.text) + '</span>';
    }

    // Botoes/dots so aparecem quando ha mais de uma imagem (comportamento visual identico).
    var controls = imgs.length > 1
      ? '<button class="carousel-btn prev" onclick="slide(this,-1)">\u2039</button>\n' +
        '                <button class="carousel-btn next" onclick="slide(this,1)">\u203a</button>\n' +
        '                <div class="carousel-dots">' + dots + '</div>'
      : '';

    return '' +
      '<div class="carousel">\n' +
      (badgeHtml ? '                ' + badgeHtml + '\n' : '') +
      '                <div class="carousel-track">\n' +
      '                    ' + slides + '\n' +
      '                </div>\n' +
      (controls ? '                ' + controls + '\n' : '') +
      '            </div>';
  }

  function buildInfo(product) {
    var parts = [];
    if (product.type) parts.push('<div class="product-type">' + escapeHtml(product.type) + '</div>');
    if (product.name) {
        var nameStyle = product.nameStyle ? ' style="' + escapeHtml(product.nameStyle) + '"' : '';
        parts.push('<div class="product-name"' + nameStyle + '>' + escapeHtml(product.name) + '</div>');
    }
    if (product.brand) parts.push('<div class="product-brand">' + escapeHtml(product.brand) + '</div>');
    if (product.size) parts.push('<span class="product-size">' + escapeHtml(product.size) + '</span>');

    // Preco: aceita priceText (rotulo livre) ou priceLabel (numerico formatado).
    var priceLabel = product.priceText || product.priceLabel;
    if (priceLabel) {
      var priceStyle = product.priceStyle ? ' style="' + escapeHtml(product.priceStyle) + '"' : '';
      var priceHtml = '<div class="product-price"' + priceStyle + '>' + escapeHtml(priceLabel) + '</div>';
      // link de comparacao de preco (opcional)
      if (product.compareUrl) {
        priceHtml += '<div class="product-compare"><a href="' + escapeHtml(product.compareUrl) +
          '" target="_blank">' + escapeHtml(product.compareLabel || 'Comparar') + '</a></div>';
      }
      // price-row envolve preco + comparacao (usado no index)
      if (product.priceRow) {
        parts.push('<div class="price-row">' + priceHtml + '</div>');
      } else {
        parts.push(priceHtml);
      }
    }
    // conteudo extra (ex.: paragrafo dos cards de entrada Brecho/Cozinha)
    if (product.extraHtml) parts.push(product.extraHtml);

    return '<div class="product-info">\n                ' +
      parts.join('\n                ') +
      '\n            </div>';
  }

  function buildCard(product) {
    var cls = 'product-card' + (product.sold ? ' vendido' : '');
    var attrs = '';
    if (product.cardStyle) attrs += ' style="' + escapeHtml(product.cardStyle) + '"';
    if (product.link) attrs += ' onclick="window.location=\'' + escapeHtml(product.link) + '\'"';
    return '<div class="' + cls + '"' + attrs +
      ' data-id="' + escapeHtml(product.id) +
      '" data-price="' + escapeHtml(typeof product.price === 'number' ? product.price : '') +
      '" data-sold="' + (product.sold ? 'true' : 'false') + '">\n            ' +
      buildCarousel(product) + '\n            ' +
      buildInfo(product) + '\n        </div>';
  }

  /**
   * Renderiza os anuncios dentro do container informado.
   * @returns {Array} lista ordenada de produtos (util para testes).
   */
  function renderProducts(container, items) {
    if (!container) throw new Error('renderProducts: container inexistente');
    if (!Array.isArray(items)) throw new Error('renderProducts: items deve ser um array');
    var ordered = sortProducts(items);
    container.innerHTML = ordered.map(buildCard).join('\n\n        ');
    return ordered;
  }

  /**
   * "Store" reativo dos anuncios.
   *
   * Cria um controlador ligado a um container + array de anuncios. Ao alternar
   * um anuncio entre vendido/nao-vendido, o store JA reaplica a ordenacao
   * (nao-vendidos por preco desc, vendidos ao final) e re-renderiza os cards
   * nos formatos corretos (badge original vs. badge "Vendido" + overlay).
   *
   * Uso:
   *   var store = createProductStore(grid, window.BRECHO_PRODUCTS, initInteractions);
   *   store.setSold(3, true);   // marca o anuncio id=3 como vendido -> reordena/re-renderiza
   *   store.toggleSold(3);      // alterna -> reordena/re-renderiza
   *
   * @param {Element} container   Elemento onde os cards sao injetados.
   * @param {Array}   items       Array de anuncios (mutado in-place na flag sold).
   * @param {Function} [onRender] Callback chamado apos cada render (ex.: religar interacoes).
   */
  function createProductStore(container, items, onRender) {
    if (!Array.isArray(items)) throw new Error('createProductStore: items deve ser um array');

    function findIndexById(id) {
      for (var i = 0; i < items.length; i++) {
        // comparacao frouxa: aceita id numerico ou string
        if (String(items[i].id) === String(id)) return i;
      }
      return -1;
    }

    function render() {
      var ordered = renderProducts(container, items);
      if (typeof onRender === 'function') onRender(container);
      return ordered;
    }

    /**
     * Define explicitamente o estado de vendido de um anuncio e re-renderiza.
     * @returns {boolean} true se o anuncio foi encontrado e atualizado.
     */
    function setSold(id, sold) {
      var idx = findIndexById(id);
      if (idx === -1) return false;
      var next = !!sold;
      if (items[idx].sold === next) return true; // sem mudanca, mas id valido
      items[idx].sold = next;
      render();
      return true;
    }

    /** Alterna vendido/nao-vendido e re-renderiza. @returns {boolean|null} novo estado ou null se nao achou. */
    function toggleSold(id) {
      var idx = findIndexById(id);
      if (idx === -1) return null;
      items[idx].sold = !items[idx].sold;
      render();
      return items[idx].sold;
    }

    return {
      items: items,
      render: render,
      setSold: setSold,
      toggleSold: toggleSold,
      get: function (id) { var i = findIndexById(id); return i === -1 ? null : items[i]; },
    };
  }

  global.sortProducts = sortProducts;
  global.renderProducts = renderProducts;
  global.createProductStore = createProductStore;
})(typeof window !== 'undefined' ? window : this);

// Suporte a testes em Node (Cypress/unit) sem quebrar o uso no browser.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    sortProducts: this.sortProducts,
    renderProducts: this.renderProducts,
    createProductStore: this.createProductStore,
  };
}
