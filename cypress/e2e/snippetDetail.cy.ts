import {BACKEND_URL} from "../../src/utils/constants";
import {FakeSnippetStore} from "../../src/utils/mock/fakeSnippetStore";

describe('Add snippet tests', () => {
  const fakeStore = new FakeSnippetStore()
  beforeEach(() => {
    // Usuario de prueba de Auth0 (ver Cypress en el README).
    cy.loginToAuth0(
        Cypress.env('AUTH0_USERNAME'),
        Cypress.env('AUTH0_PASSWORD')
    )
    cy.intercept('GET', BACKEND_URL+"/snippets/*", {
      statusCode: 201,
      body: fakeStore.getSnippetById("1"),
    }).as("getSnippetById")
    cy.intercept('GET', BACKEND_URL+"/snippets").as("getSnippets")

    cy.visit("/")

    // cy.wait("@getSnippets")
    cy.wait(2000) // TODO comment this line and uncomment 19 to wait for the real data
    cy.get('.MuiTableBody-root > :nth-child(1) > :nth-child(1)').click();
  })

  it('Can share a snippet ', () => {
    cy.get('[aria-label="Share"]').click();
    cy.get('#share-user').click();
    cy.get('#share-user-option-0').click();
    cy.get('.css-1yuhvjn > .MuiBox-root > .MuiButton-contained').click();
    cy.wait(2000)
  })

  it('Can run snippets', function() {
    cy.get('[data-testid="PlayArrowIcon"]').click();
    cy.get('.css-1hpabnv > .MuiBox-root > div > .npm__react-simple-code-editor__textarea').should("have.length.greaterThan",0);
  });

  it('Can format snippets', function() {
    cy.get('[data-testid="ReadMoreIcon"] > path').click();
  });

  it('Can save snippets', function() {
    cy.get('.css-10egq61 > .MuiBox-root > div > .npm__react-simple-code-editor__textarea').click();
    cy.get('.css-10egq61 > .MuiBox-root > div > .npm__react-simple-code-editor__textarea').type("Some new line");
    cy.get('[data-testid="SaveIcon"] > path').click();
  });

  it('Can delete snippets', function() {
    cy.get('[data-testid="DeleteIcon"] > path').click();
  });
})
