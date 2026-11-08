import {auth0Origin} from "../support/auth-provider-commands/auth0";

describe('Protected routes test', () => {
  it('should redirect to login when accessing a protected route unauthenticated', () => {
    // Visit the protected route
    cy.visit('/');

    cy.wait(1000)

    // Check if the URL is redirected to the login page
    // La página de login es la de Auth0, en otro dominio: se lee con cy.origin.
    cy.origin(auth0Origin(), () => {
      cy.url().should('include', '/login');
    })
  });

  it('should display login content', () => {
    // Visit the login page
    cy.visit('/login');

    // Look for text that is likely to appear on a login page
    // Sin sesión, /login (como cualquier ruta) lleva a la página de Auth0.
    cy.origin(auth0Origin(), () => {
      cy.contains('Log in').should('exist');
      cy.contains('Password').should('exist'); // Adjust the text based on actual content
    })
  });

  it('should not redirect to login when the user is already authenticated', () => {
    // Usuario de prueba de Auth0 (ver Cypress en el README).
    cy.loginToAuth0(
        Cypress.env('AUTH0_USERNAME'),
        Cypress.env('AUTH0_PASSWORD')
    )

    cy.visit('/');

    cy.wait(1000)

    // Check if the URL is redirected to the login page
    cy.url().should('not.include', '/login');
  });

})
