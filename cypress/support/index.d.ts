declare namespace Cypress {
  interface Chainable {
    /**
     * Custom command to log in using Auth0.
     * @example cy.loginToAuth0('username', 'password')
     */
    loginToAuth0(username: string, password: string): Chainable<void>
    /**
     * Header Authorization con el token de Auth0 del usuario, para cy.request.
     * Hay que llamarlo después de cy.loginToAuth0 y de cy.visit.
     */
    authHeaders(): Chainable<{ Authorization: string }>
  }
}
