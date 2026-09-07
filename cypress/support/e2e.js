// Suporte global do Cypress. Carregado antes de cada spec.
Cypress.on('uncaught:exception', () => true);

// Metadados das paginas data-driven do site.
const PAGES = [
  { name: 'index', url: '/index.html', store: 'indexStore', data: 'INDEX_PRODUCTS' },
  { name: 'brecho', url: '/brecho.html', store: 'brechoStore', data: 'BRECHO_PRODUCTS' },
  { name: 'cozinha', url: '/cozinha.html', store: 'cozinhaStore', data: 'COZINHA_PRODUCTS' },
];
Cypress.PAGES = PAGES;

// Visita uma pagina e espera os anuncios renderizarem.
Cypress.Commands.add('visitPage', (url) => {
  cy.visit(url);
  cy.get('#products-grid .product-card', { timeout: 10000 }).should('have.length.greaterThan', 0);
});
