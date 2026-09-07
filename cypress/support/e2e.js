// Suporte global do Cypress. Carregado antes de cada spec.
// Falha o teste se a pagina lancar erro de JS nao tratado.
Cypress.on('uncaught:exception', () => true);

// Comando util: abre a pagina do brecho e espera os anuncios renderizarem.
Cypress.Commands.add('visitBrecho', () => {
  cy.visit('/brecho.html');
  cy.get('#products-grid .product-card', { timeout: 10000 }).should('have.length.greaterThan', 0);
});
