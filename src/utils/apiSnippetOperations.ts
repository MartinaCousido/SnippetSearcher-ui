import {SnippetOperations} from './snippetOperations'
import {FakeSnippetOperations} from './mock/fakeSnippetOperations'
import {CreateSnippet, PaginatedSnippets, Snippet, UpdateSnippet} from './snippet'
import autoBind from 'auto-bind'
import axios from 'axios'
import {PaginatedUsers} from "./users.ts";
import {TestCase} from "../types/TestCase.ts";
import {TestCaseResult} from "./queries.tsx";
import {FileType} from "../types/FileType.ts";
import {Rule} from "../types/Rule.ts";
import {BACKEND_URL} from "./constants.ts";

// Nuestra implementación de SnippetOperations: llama a Snippet Service y a
// Permission Service a través del reverse proxy (BACKEND_URL).
// El contrato de cada método está en "Contrato con la UI" de SnippetSearcher.
//
// Los métodos cuyo endpoint todavía no existe le pasan el pedido a la
// implementación falsa de la cátedra (`fake`), así la UI nunca se rompe.
// Cuando un endpoint está listo, su método pasa a llamar al backend.
export class ApiSnippetOperations implements SnippetOperations {
  private readonly fake: SnippetOperations = new FakeSnippetOperations()
  // Cliente HTTP hacia el reverse proxy. Con Auth0, acá se va a sumar el token.
  private readonly http = axios.create({baseURL: BACKEND_URL})

  constructor() {
    autoBind(this)
  }

  // --- Snippets (Snippet Service) ---

  // GET /snippets?page=&page_size=&name=. Devuelve los propios y los compartidos.
  async listSnippetDescriptors(page: number, pageSize: number, snippetName?: string): Promise<PaginatedSnippets> {
    const response = await this.http.get<PaginatedSnippets>('/snippets', {
      params: {page, page_size: pageSize, name: snippetName || undefined}
    })
    return response.data
  }

  // POST /snippets. Si el código no es válido, responde 400 con los diagnostics.
  async createSnippet(createSnippet: CreateSnippet): Promise<Snippet> {
    const response = await this.http.post<Snippet>('/snippets', createSnippet)
    return response.data
  }

  // GET /snippets/{id}. Si no existe (404) devuelve undefined, como la
  // implementación falsa. Sin acceso responde 403 y se propaga el error.
  async getSnippetById(id: string): Promise<Snippet | undefined> {
    try {
      const response = await this.http.get<Snippet>(`/snippets/${id}`)
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) return undefined
      throw error
    }
  }

  // PUT /snippets/{id}. Solo el owner. Si el código no es válido, responde 400
  // con los diagnostics y no cambia nada.
  async updateSnippetById(id: string, updateSnippet: UpdateSnippet): Promise<Snippet> {
    const response = await this.http.put<Snippet>(`/snippets/${id}`, updateSnippet)
    return response.data
  }

  // DELETE /snippets/{id}. Solo el owner. Devuelve el id, como la
  // implementación falsa.
  async deleteSnippet(id: string): Promise<string> {
    await this.http.delete(`/snippets/${id}`)
    return id
  }

  // GET /languages
  async getFileTypes(): Promise<FileType[]> {
    const response = await this.http.get<FileType[]>('/languages')
    return response.data
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
