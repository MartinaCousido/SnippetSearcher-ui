import {CreateSnippet, PaginatedSnippets, Snippet, SnippetFile, SnippetFilters, UpdateSnippet} from './snippet'
import {PaginatedUsers} from "./users.ts";
import {TestCase} from "../types/TestCase.ts";
import {TestCaseResult} from "./queries.tsx";
import {FileType} from "../types/FileType.ts";
import {Rule} from "../types/Rule.ts";

// Los métodos de tests y de formateo reciben el snippetId (cambio nuestro a la
// interfaz de la cátedra): sin él no se sabe a qué snippet pertenece un test ni
// con qué lenguaje y reglas formatear. Ver "Contrato con la UI" en SnippetSearcher.
export interface SnippetOperations {
  // filters es un cambio nuestro (US-5): relación, lenguaje, validez y orden.
  listSnippetDescriptors(page: number,pageSize: number,sippetName?: string, filters?: SnippetFilters): Promise<PaginatedSnippets>

  createSnippet(createSnippet: CreateSnippet): Promise<Snippet>

  getSnippetById(id: string): Promise<Snippet | undefined>

  updateSnippetById(id: string, updateSnippet: UpdateSnippet): Promise<Snippet>

  getUserFriends(name?: string,page?: number,pageSize?: number): Promise<PaginatedUsers>

  shareSnippet(snippetId: string,userId: string): Promise<Snippet>

  getFormatRules(): Promise<Rule[]>

  getLintingRules(): Promise<Rule[]>

  getTestCases(snippetId: string): Promise<TestCase[]>

  formatSnippet(snippetId: string, snippet: string): Promise<string>

  postTestCase(snippetId: string, testCase: Partial<TestCase>): Promise<TestCase>

  removeTestCase(snippetId: string, id: string): Promise<string>

  deleteSnippet(id: string): Promise<string>

  testSnippet(snippetId: string, testCase: Partial<TestCase>): Promise<TestCaseResult>

  getFileTypes(): Promise<FileType[]>

  // Agregado por Snippet Searcher (US-13): el archivo original o el formateado.
  downloadSnippet(snippetId: string, formatted: boolean): Promise<SnippetFile>

  modifyFormatRule(newRules: Rule[]): Promise<Rule[]>

  modifyLintingRule(newRules: Rule[]): Promise<Rule[]>
}
