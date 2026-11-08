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
  // Cliente HTTP hacia el reverse proxy.
  private readonly http = axios.create({baseURL: BACKEND_URL})

  // getAccessToken es getAccessTokenSilently de Auth0: devuelve el token
  // guardado, o pide uno nuevo con el refresh token si venció.
  constructor(getAccessToken: () => Promise<string>) {
    autoBind(this)
    // Interceptor: antes de mandar cada pedido, le agrega el token del usuario.
    this.http.interceptors.request.use(async config => {
      config.headers.Authorization = `Bearer ${await getAccessToken()}`
      return config
    })
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

  // GET /snippets/{id}/tests: los tests del snippet, cada uno con el
  // resultado de su última corrida automática (lastResult).
  async getTestCases(snippetId: string): Promise<TestCase[]> {
    const response = await this.http.get<TestCase[]>(`/snippets/${snippetId}/tests`)
    return response.data
  }

  // POST /snippets/{id}/tests: sin id crea el test; con id, lo cambia. Solo
  // el owner.
  async postTestCase(snippetId: string, testCase: Partial<TestCase>): Promise<TestCase> {
    const {id, name, input, output} = testCase
    const response = await this.http.post<TestCase>(`/snippets/${snippetId}/tests`, {id, name, input, output})
    return response.data
  }

  // DELETE /snippets/{id}/tests/{testId}. Solo el owner.
  async removeTestCase(snippetId: string, id: string): Promise<string> {
    await this.http.delete(`/snippets/${snippetId}/tests/${id}`)
    return id
  }

  // POST /snippets/{id}/tests/run: corre el test con el código guardado del
  // snippet, sin guardarlo. Un error al ejecutar es "fail".
  async testSnippet(snippetId: string, testCase: Partial<TestCase>): Promise<TestCaseResult> {
    const {input, output} = testCase
    const response = await this.http.post<{ result: TestCaseResult }>(`/snippets/${snippetId}/tests/run`, {input, output})
    return response.data.result
  }

  // --- Compartir (Permission Service) ---

  // POST /permissions/{snippetId}/share y después GET /snippets/{snippetId}.
  // Solo el owner comparte; el invitado queda con permiso de solo lectura.
  async shareSnippet(snippetId: string, userId: string): Promise<Snippet> {
    await this.http.post(`/permissions/${snippetId}/share`, {userId})
    const response = await this.http.get<Snippet>(`/snippets/${snippetId}`)
    return response.data
  }

  // --- Usuarios ---

  // GET /users?name=&page=&page_size=: con quién se puede compartir (módulo
  // User, en Snippet Service). Filtra por el comienzo del email y nunca
  // incluye a quien pide. name es el email, id el que se manda al compartir.
  // La UI de la cátedra cuenta las páginas de usuarios desde 1, y el backend
  // desde 0, como en el listado de snippets.
  async getUserFriends(name: string = "", page: number = 1, pageSize: number = 10): Promise<PaginatedUsers> {
    const response = await this.http.get<PaginatedUsers>('/users', {
      params: {name: name || undefined, page: Math.max(page - 1, 0), page_size: pageSize}
    })
    return response.data
  }
}
