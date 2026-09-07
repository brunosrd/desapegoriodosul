/// <reference types="cypress" />
// Funcionalidade: Ordenacao por preco.
// Regra: nao-vendidos por preco DECRESCENTE; vendidos agrupados no FINAL.

describe('Ordenacao por preco e agrupamento de vendidos', () => {
  beforeEach(() => cy.visitBrecho());

  function precos($cards) {
    return Cypress._.map($cards.toArray(), (el) => {
      const txt = el.querySelector('.product-price').innerText;
      return parseInt(txt.replace(/[^\d]/g, ''), 10);
    });
  }

  it('nao-vendidos aparecem antes dos vendidos', () => {
    cy.get('#products-grid .product-card').then(($cards) => {
      const sold = Cypress._.map($cards.toArray(), (el) => el.classList.contains('vendido'));
      const firstSold = sold.indexOf(true);
      const lastNonSold = sold.lastIndexOf(false);
      if (firstSold !== -1) expect(firstSold).to.be.greaterThan(lastNonSold);
    });
  });

  it('nao-vendidos estao ordenados por preco decrescente', () => {
    cy.get('#products-grid .product-card:not(.vendido)').then(($cards) => {
      const p = precos($cards);
      const ordenado = [...p].sort((a, b) => b - a);
      expect(p).to.deep.equal(ordenado);
    });
  });

  it('o anuncio de maior preco (nao-vendido) e o primeiro card', () => {
    cy.window().its('BRECHO_PRODUCTS').then((data) => {
      const maxNonSold = Math.max(...data.filter((x) => !x.sold).map((x) => x.price));
      cy.get('#products-grid .product-card').first().find('.product-price')
        .invoke('text').then((t) => {
          expect(parseInt(t.replace(/[^\d]/g, ''), 10)).to.equal(maxNonSold);
        });
    });
  });
});
