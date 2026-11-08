// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'
import {accessToken, hasAuth0Session, loginViaAuth0Ui} from "./auth-provider-commands/auth0";

Cypress.Commands.add('loginToAuth0', (username: string, password: string) => {
  const log = Cypress.log({
    displayName: 'AUTH0 LOGIN',
    message: [`🔐 Authenticating | ${username}`],
    autoEnd: false,
  })
  log.snapshot('before')

  cy.session(
      `auth0-${username}`,
      () => {
        loginViaAuth0Ui(username, password)
      },
      {
        validate: () => {
          // La sesión sigue si auth0-react tiene su token en localStorage.
          cy.wrap(null).then(() => expect(hasAuth0Session(localStorage)).to.eq(true))
        },
      }
  )
  log.snapshot('after')
  log.end()
})

// Header Authorization con el token del usuario, para cy.request.
Cypress.Commands.add('authHeaders', () => {
  return cy.window().then(win => ({Authorization: `Bearer ${accessToken(win.localStorage)}`}))
})
