/// <reference types="cypress" />
// Funcionalidade: Ordenacao por preco (regra unica do site) — TODAS as paginas.
// Nao-vendidos primeiro; vendidos no final; cada grupo por preco DECRESCENTE.

function precosGrupo(seletor) {
  return cy.get(seletor).then(($cards) =>
    Cypress._.map($cards.toArray(), (el) => {
      const t = el.querySelector('.product-price');
      const n = t ? t.innerText.replace(/[^\d]/g, '') : '';
      return n ? parseInt(n, 10) : null;
    }).filter((n) => n != null)
  );
}
const desc = (a) => JSON.stringify(a) === JSON.stringify([...a].sort((x, y) => y - x));

Cypress.PAGES.forEach((PAGE) => {
  describe(`Ordenacao e agrupamento [${PAGE.name}]`, () => {
    beforeEach(() => cy.visitPage(PAGE.url));

    it('vendidos aparecem depois dos nao-vendidos', () => {
      cy.get('#products-grid .product-card').then(($c) => {
        const sold = Cypress._.map($c.toArray(), (el) => el.classList.contains('vendido'));
        const firstSold = sold.indexOf(true);
        const lastNon = sold.lastIndexOf(false);
        if (firstSold !== -1) expect(firstSold).to.be.greaterThan(lastNon);
      });
    });

    it('nao-vendidos ordenados por preco desc', () => {
      precosGrupo('#products-grid .product-card:not(.vendido)').then((p) => {
        expect(desc(p), `precos: ${p}`).to.be.true;
      });
    });

    it('vendidos ordenados por preco desc', () => {
      precosGrupo('#products-grid .product-card.vendido').then((p) => {
        expect(desc(p), `precos: ${p}`).to.be.true;
      });
    });
  });
});
