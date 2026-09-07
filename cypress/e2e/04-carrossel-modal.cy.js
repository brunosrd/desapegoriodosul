/// <reference types="cypress" />
// Funcionalidade: Carrossel e modal — TODAS as paginas.

Cypress.PAGES.forEach((PAGE) => {
  describe(`Carrossel [${PAGE.name}]`, () => {
    beforeEach(() => cy.visitPage(PAGE.url));

    it('cards com 2+ imagens exibem botoes e dots', () => {
      cy.get('#products-grid .product-card').then(($cards) => {
        const multi = Cypress._.find($cards.toArray(), (el) =>
          el.querySelectorAll('.carousel-track img').length > 1);
        if (multi) {
          const $m = Cypress.$(multi);
          expect($m.find('.carousel-btn.next').length).to.be.greaterThan(0);
          expect($m.find('.carousel-dots .dot').length).to.be.greaterThan(1);
        }
      });
    });

    it('clicar em next avanca o slide', () => {
      cy.get('#products-grid .product-card').then(($cards) => {
        const multi = Cypress._.find($cards.toArray(), (el) =>
          el.querySelectorAll('.carousel-track img').length > 1);
        if (multi) {
          const $track = Cypress.$(multi).find('.carousel-track');
          const antes = $track[0].style.transform;
          cy.wrap(Cypress.$(multi)).find('.carousel-btn.next').click();
          cy.wrap($track).should(($t) => expect($t[0].style.transform).to.not.equal(antes));
        }
      });
    });
  });

  describe(`Modal [${PAGE.name}]`, () => {
    beforeEach(() => cy.visitPage(PAGE.url));

    it('abre ao clicar em imagem com zoom e fecha com Esc', () => {
      // imagens de cards de entrada (com onclick de navegacao) nao abrem modal
      cy.get('#products-grid .product-card:not([onclick]) .carousel-track img').first().click();
      cy.get('#imageModal').should('have.class', 'active');
      cy.get('#modalImage').should('have.attr', 'src').and('not.be.empty');
      cy.get('body').type('{esc}');
      cy.get('#imageModal').should('not.have.class', 'active');
    });
  });
});
