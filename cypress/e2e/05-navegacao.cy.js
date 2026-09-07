/// <reference types="cypress" />
// Funcionalidade: Navegacao entre paginas (index <-> brecho <-> cozinha) e WhatsApp.

describe('Navegacao entre paginas', () => {
  it('index carrega e tem cards que levam a brecho e cozinha', () => {
    cy.visit('/index.html');
    cy.get('.product-card').should('have.length.greaterThan', 0);
    cy.get("[onclick*=\"brecho.html\"]").should('exist');
    cy.get("[onclick*=\"cozinha.html\"]").should('exist');
  });

  it('brecho tem link de volta para index', () => {
    cy.visit('/brecho.html');
    cy.get('a[href="index.html"]').should('exist');
  });

  it('cozinha tem link de volta para index', () => {
    cy.visit('/cozinha.html');
    cy.get('a[href="index.html"]').should('exist');
  });

  it('todas as paginas tem CTA de WhatsApp', () => {
    ['/index.html', '/brecho.html', '/cozinha.html'].forEach((p) => {
      cy.visit(p);
      cy.get('a[href*="wa.me"]').should('exist');
    });
  });
});
