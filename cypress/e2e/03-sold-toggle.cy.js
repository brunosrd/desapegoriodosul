/// <reference types="cypress" />
// Funcionalidade: Flag sold + API setSold/toggleSold (reordena + reformata) — TODAS as paginas.

Cypress.PAGES.forEach((PAGE) => {
  describe(`Toggle vendido/nao-vendido [${PAGE.name}]`, () => {
    beforeEach(() => cy.visitPage(PAGE.url));

    it('vendido tem badge cinza + overlay; nao-vendido nao tem overlay', () => {
      cy.get('#products-grid .product-card.vendido').then(($v) => {
        if ($v.length) {
          cy.wrap($v.first()).within(() => {
            cy.get('.badge.vendido').should('contain', 'Vendido');
            cy.get('.sold-overlay').should('exist');
          });
        }
      });
      cy.get('#products-grid .product-card:not(.vendido)').first().within(() => {
        cy.get('.sold-overlay').should('not.exist');
      });
    });

    it('setSold move para vendidos e troca o formato; toggle reverte e reordena', () => {
      cy.window().then((win) => {
        const store = win[PAGE.store];
        const alvo = store.render().find((p) => !p.sold && typeof p.price === 'number');
        expect(alvo, 'ha anuncio nao-vendido com preco').to.exist;
        const id = alvo.id;
        const antes = win.document.querySelectorAll('#products-grid .product-card.vendido').length;

        store.setSold(id, true);
        cy.get('#products-grid .product-card.vendido').should('have.length', antes + 1);
        cy.get(`#products-grid .product-card[data-id="${id}"]`)
          .should('have.class', 'vendido')
          .within(() => cy.get('.sold-overlay').should('exist'));

        cy.window().then((w2) => {
          w2[PAGE.store].toggleSold(id);
          cy.get(`#products-grid .product-card[data-id="${id}"]`).should('not.have.class', 'vendido');
          cy.get('#products-grid .product-card:not(.vendido)').then(($c) => {
            const p = Cypress._.map($c.toArray(), (el) => {
              const t = el.querySelector('.product-price');
              const n = t ? t.innerText.replace(/[^\d]/g, '') : '';
              return n ? parseInt(n, 10) : null;
            }).filter((n) => n != null);
            expect(JSON.stringify(p)).to.equal(JSON.stringify([...p].sort((a, b) => b - a)));
          });
        });
      });
    });
  });
});
