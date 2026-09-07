/// <reference types="cypress" />
// Funcionalidade: Flag `sold` + API do store (setSold/toggleSold).
// Ao alternar vendido/nao-vendido, o card deve MUDAR de formato e a lista REORDENAR.

describe('Flag sold e API de toggle (reordena + re-renderiza)', () => {
  beforeEach(() => cy.visitBrecho());

  it('vendido tem badge cinza + overlay; nao-vendido nao tem overlay', () => {
    cy.get('#products-grid .product-card.vendido').first().within(() => {
      cy.get('.badge.vendido').should('contain', 'Vendido');
      cy.get('.sold-overlay').should('exist');
    });
    cy.get('#products-grid .product-card:not(.vendido)').first().within(() => {
      cy.get('.sold-overlay').should('not.exist');
    });
  });

  it('setSold(id,true) move o anuncio para o grupo de vendidos e troca o formato', () => {
    cy.window().then((win) => {
      // pega um anuncio nao-vendido de maior preco (topo)
      const alvo = win.brechoStore.render().find((p) => !p.sold);
      const id = alvo.id;
      const soldAntes = win.document.querySelectorAll('#products-grid .product-card.vendido').length;

      win.brechoStore.setSold(id, true);

      cy.get('#products-grid .product-card.vendido').should('have.length', soldAntes + 1);
      cy.get(`#products-grid .product-card[data-id="${id}"]`)
        .should('have.class', 'vendido')
        .within(() => cy.get('.sold-overlay').should('exist'));
    });
  });

  it('toggleSold devolve o anuncio para nao-vendido e reordena por preco', () => {
    cy.window().then((win) => {
      const alvo = win.brechoStore.render().find((p) => !p.sold);
      const id = alvo.id;
      win.brechoStore.setSold(id, true);   // vira vendido
      win.brechoStore.toggleSold(id);       // volta a nao-vendido

      cy.get(`#products-grid .product-card[data-id="${id}"]`)
        .should('not.have.class', 'vendido')
        .within(() => cy.get('.sold-overlay').should('not.exist'));

      // reordenacao mantida: nao-vendidos por preco desc
      cy.get('#products-grid .product-card:not(.vendido)').then(($c) => {
        const p = Cypress._.map($c.toArray(), (el) =>
          parseInt(el.querySelector('.product-price').innerText.replace(/[^\d]/g, ''), 10));
        expect(p).to.deep.equal([...p].sort((a, b) => b - a));
      });
    });
  });
});
