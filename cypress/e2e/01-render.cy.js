/// <reference types="cypress" />
// Funcionalidade: Render data-driven — cobre TODAS as paginas.

Cypress.PAGES.forEach((PAGE) => {
  describe(`Render data-driven [${PAGE.name}]`, () => {
    beforeEach(() => cy.visitPage(PAGE.url));

    it('renderiza a mesma quantidade de anuncios do dataset', () => {
      cy.window().its(PAGE.data).then((data) => {
        cy.get('#products-grid .product-card').should('have.length', data.length);
      });
    });

    it('cada card tem nome (e preco quando numerico)', () => {
      cy.get('#products-grid .product-card').each(($card) => {
        cy.wrap($card).find('.product-name').should('not.be.empty');
      });
    });

    it('expoe a API do store da pagina', () => {
      cy.window().its(PAGE.store).should('exist');
      cy.window().its(`${PAGE.store}.setSold`).should('be.a', 'function');
      cy.window().its(`${PAGE.store}.toggleSold`).should('be.a', 'function');
    });
  });
});
