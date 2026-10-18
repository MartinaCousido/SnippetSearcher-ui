import {SnippetOperations} from './snippetOperations'
import {FakeSnippetOperations} from './mock/fakeSnippetOperations'
import {CreateSnippet, PaginatedSnippets, Snippet, UpdateSnippet} from './snippet'
import autoBind from 'auto-bind'
import {PaginatedUsers} from "./users.ts";
import {TestCase} from "../types/TestCase.ts";
import {TestCaseResult} from "./queries.tsx";
import {FileType} from "../types/FileType.ts";
import {Rule} from "../types/Rule.ts";

// Nuestra implementación de SnippetOperations: llama a Snippet Service y a
// Permission Service a través del reverse proxy (BACKEND_URL).
// El contrato de cada método está en "Contrato con la UI" de SnippetSearcher.
//
// Los métodos cuyo endpoint todavía no existe le pasan el pedido a la
// implementación falsa de la cátedra (`fake`), así la UI nunca se rompe.
// Cuando un endpoint está listo, su método pasa a llamar al backend.
export class ApiSnippetOperations implements SnippetOperations {
  private readonly fake: SnippetOperations = new FakeSnippetOperations()

  constructor() {
    autoBind(this)
  }

  // --- Snippets (Snippet Service) ---

  // Sin backend todavía: GET /snippets?page=&page_size=&name=
  listSnippetDescriptors(page: number, pageSize: number, snippetName?: string): Promise<PaginatedSnippets> {
    return this.fake.listSnippetDescriptors(page, pageSize, snippetName)
  }

  // Sin backend todavía: POST /snippets
  createSnippet(createSnippet: CreateSnippet): Promise<Snippet> {
    return this.fake.createSnippet(createSnippet)
  }

  // Sin backend todavía: GET /snippets/{id}
  getSnippetById(id: string): Promise<Snippet | undefined> {
    return this.fake.getSnippetById(id)
  }

  // Sin backend todavía: PUT /snippets/{id}
  updateSnippetById(id: string, updateSnippet: UpdateSnippet): Promise<Snippet> {
    return this.fake.updateSnippetById(id, updateSnippet)
  }

  // Sin backend todavía: DELETE /snippets/{id}
  deleteSnippet(id: string): Promise<string> {
    return this.fake.deleteSnippet(id)
  }

  // Sin backend todavía: GET /languages
  getFileTypes(): Promise<FileType[]> {
    return this.fake.getFileTypes()
  }

  // Sin backend todavía: POST /snippets/{id}/format
  formatSnippet(snippetId: string, snippet: string): Promise<string> {
    return this.fake.formatSnippet(snippetId, snippet)
  }

  // --- Reglas (Snippet Service) ---

  // Sin backend todavía: GET /rules/format
  getFormatRules(): Promise<Rule[]> {
    return this.fake.getFormatRules()
  }

  // Sin backend todavía: PUT /rules/format
  modifyFormatRule(newRules: Rule[]): Promise<Rule[]> {
    return this.fake.modifyFormatRule(newRules)
  }

  // Sin backend todavía: GET /rules/lint
  getLintingRules(): Promise<Rule[]> {
    return this.fake.getLintingRules()
  }

  // Sin backend todavía: PUT /rules/lint
  modifyLintingRule(newRules: Rule[]): Promise<Rule[]> {
    return this.fake.modifyLintingRule(newRules)
  }

  // --- Tests (Snippet Service) ---

  // Sin backend todavía: GET /snippets/{id}/tests
  getTestCases(snippetId: string): Promise<TestCase[]> {
    return this.fake.getTestCases(snippetId)
  }

  // Sin backend todavía: POST /snippets/{id}/tests
  postTestCase(snippetId: string, testCase: Partial<TestCase>): Promise<TestCase> {
    return this.fake.postTestCase(snippetId, testCase)
  }

  // Sin backend todavía: DELETE /snippets/{id}/tests/{testId}
  removeTestCase(snippetId: string, id: string): Promise<string> {
    return this.fake.removeTestCase(snippetId, id)
  }

  // Sin backend todavía: POST /snippets/{id}/tests/run
  testSnippet(snippetId: string, testCase: Partial<TestCase>): Promise<TestCaseResult> {
    return this.fake.testSnippet(snippetId, testCase)
  }

  // --- Compartir (Permission Service) ---

  // Sin backend todavía: POST /permissions/{snippetId}/share y GET /snippets/{snippetId}
  shareSnippet(snippetId: string, userId: string): Promise<Snippet> {
    return this.fake.shareSnippet(snippetId, userId)
  }

  // --- Usuarios ---

  // Sigue con datos falsos mientras el módulo User esté en standby.
  getUserFriends(name?: string, page?: number, pageSize?: number): Promise<PaginatedUsers> {
    return this.fake.getUserFriends(name, page, pageSize)
  }
}
