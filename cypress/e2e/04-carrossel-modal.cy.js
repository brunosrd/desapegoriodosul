/// <reference types="cypress" />
// Funcionalidade: Carrossel de imagens e modal de zoom.

describe('Carrossel de imagens', () => {
  beforeEach(() => cy.visitBrecho());

  it('cards com mais de uma imagem exibem botoes e dots', () => {
    cy.get('#products-grid .product-card').then(($cards) => {
      const multi = Cypress._.find($cards.toArray(), (el) =>
        el.querySelectorAll('.carousel-track img').length > 1);
      expect(multi, 'existe ao menos um card com multiplas imagens').to.exist;
      const $m = Cypress.$(multi);
      expect($m.find('.carousel-btn.next').length).to.be.greaterThan(0);
      expect($m.find('.carousel-dots .dot').length).to.be.greaterThan(1);
    });
  });

  it('clicar em "next" avanca o slide (transform muda)', () => {
    cy.get('#products-grid .product-card').then(($cards) => {
      const multi = Cypress._.find($cards.toArray(), (el) =>
        el.querySelectorAll('.carousel-track img').length > 1);
      const $track = Cypress.$(multi).find('.carousel-track');
      const antes = $track[0].style.transform;
      cy.wrap(Cypress.$(multi)).find('.carousel-btn.next').click();
      cy.wrap($track).should(($t) => {
        expect($t[0].style.transform).to.not.equal(antes);
      });
    });
  });
});

describe('Modal de zoom', () => {
  beforeEach(() => cy.visitBrecho());

  it('abre ao clicar na imagem e fecha com Esc', () => {
    cy.get('#products-grid .product-card .carousel-track img').first().click();
    cy.get('#imageModal').should('have.class', 'active');
    cy.get('#modalImage').should('have.attr', 'src').and('not.be.empty');
    cy.get('body').type('{esc}');
    cy.get('#imageModal').should('not.have.class', 'active');
  });
});
