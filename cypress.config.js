const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://127.0.0.1:8080',
    specPattern: 'cypress/e2e/**/*.cy.js',
    supportFile: 'cypress/support/e2e.js',
    fixturesFolder: false,
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 8000,
    viewportWidth: 1280,
    viewportHeight: 800,
  },
});
