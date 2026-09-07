/// <reference types="cypress" />
// Funcionalidade: Renderizacao data-driven dos anuncios (brecho.html).
// Garante que os cards vem do array de dados e que nenhum anuncio foi perdido.

describe('Render data-driven dos anuncios', () => {
  beforeEach(() => cy.visitBrecho());

  it('renderiza a mesma quantidade de anuncios do array de dados', () => {
    cy.window().its('BRECHO_PRODUCTS').then((data) => {
      cy.get('#products-grid .product-card').should('have.length', data.length);
    });
  });

  it('cada card possui nome e preco', () => {
    cy.get('#products-grid .product-card').each(($card) => {
      cy.wrap($card).find('.product-name').should('not.be.empty');
      cy.wrap($card).find('.product-price').should('contain', 'R$');
    });
  });

  it('expoe a API global do store (brechoStore)', () => {
    cy.window().its('brechoStore').should('exist');
    cy.window().its('brechoStore.setSold').should('be.a', 'function');
    cy.window().its('brechoStore.toggleSold').should('be.a', 'function');
  });
});
