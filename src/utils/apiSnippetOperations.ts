import {SnippetOperations} from './snippetOperations'
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
// Todos los métodos llaman al backend: ya no usa la implementación falsa de la
// cátedra (FakeSnippetOperations).
export class ApiSnippetOperations implements SnippetOperations {
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

  // POST /snippets/{id}/format: formatea el código del editor con las reglas
  // del owner, sin guardar. Si el formateador falla, 400 con los diagnostics.
  async formatSnippet(snippetId: string, snippet: string): Promise<string> {
    const response = await this.http.post<{ content: string }>(`/snippets/${snippetId}/format`, {content: snippet})
    return response.data.content
  }

  // --- Reglas (Snippet Service) ---

  // GET /rules/format: las reglas de formateo del usuario (US-11).
  async getFormatRules(): Promise<Rule[]> {
    const response = await this.http.get<Rule[]>('/rules/format')
    return response.data
  }

  // PUT /rules/format. 400 si activa dos reglas opuestas o un valor no sirve.
  async modifyFormatRule(newRules: Rule[]): Promise<Rule[]> {
    const response = await this.http.put<Rule[]>('/rules/format', newRules)
    return response.data
  }

  // GET /rules/lint: las reglas de lint del usuario (US-14).
  async getLintingRules(): Promise<Rule[]> {
    const response = await this.http.get<Rule[]>('/rules/lint')
    return response.data
  }

  // PUT /rules/lint. 400 si un valor no sirve.
  async modifyLintingRule(newRules: Rule[]): Promise<Rule[]> {
    const response = await this.http.put<Rule[]>('/rules/lint', newRules)
    return response.data
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
  // snippet. Un error al ejecutar es "fail". Si el test ya está guardado
  // (tiene id) y no tiene cambios, el backend guarda el resultado.
  async testSnippet(snippetId: string, testCase: Partial<TestCase>): Promise<TestCaseResult> {
    const {id, input, output} = testCase
    const response = await this.http.post<{ result: TestCaseResult }>(`/snippets/${snippetId}/tests/run`, {id, input, output})
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
