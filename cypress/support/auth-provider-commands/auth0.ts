// Login por la página real de Auth0 (Universal Login). El dominio del tenant
// sale de VITE_AUTH0_DOMAIN, la misma variable que usa la UI (ver .env.example).
export function loginViaAuth0Ui(username: string, password: string) {
  // Sin sesión, la UI redirige al login de Auth0.
  cy.visit('/')

  // Login en Auth0, que está en otro dominio.
  cy.origin(
      auth0Origin(),
      { args: { username, password } },
      ({ username, password }) => {
        cy.get('input#username').type(username)
        cy.get('input#password').type(password, { log: false })
        cy.contains('button[value=default]', 'Continue').click()
      }
  )

  // Auth0 vuelve a la UI, y auth0-react cambia el código por el token. Recién
  // cuando el token está en localStorage, cy.session puede guardar la sesión.
  cy.location('origin').should('equal', new URL(Cypress.config('baseUrl') ?? '').origin)
  cy.window().should(win => expect(hasAuth0Session(win.localStorage), 'token de Auth0 en localStorage').to.eq(true))
}

// La URL de la página de login de Auth0 (otro dominio), para cy.origin.
export const auth0Origin = () => `https://${Cypress.env('VITE_AUTH0_DOMAIN')}`

// auth0-react guarda en localStorage, con claves que empiezan así, el token de
// nuestra API (cacheLocation="localstorage" en src/main.tsx).
const AUTH0_CACHE_PREFIX = '@@auth0spajs@@'

export function hasAuth0Session(storage: Storage): boolean {
  return Object.keys(storage).some(key => key.startsWith(AUTH0_CACHE_PREFIX))
}

// El access token de la API, para los pedidos que el test hace directo al
// backend con cy.request (no pasan por la UI, que lo agrega sola).
export function accessToken(storage: Storage): string {
  const key = Object.keys(storage)
      .find(key => key.startsWith(AUTH0_CACHE_PREFIX) && key.includes(Cypress.env('VITE_AUTH0_AUDIENCE')))
  if (!key) {
    throw new Error('No hay un token de Auth0 en localStorage: ¿se llamó a cy.loginToAuth0 y cy.visit?')
  }
  return JSON.parse(storage.getItem(key) ?? '{}').body.access_token
}
