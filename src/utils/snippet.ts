import {Pagination} from "./pagination.ts";
import {FileType} from "../types/FileType.ts";

export type ComplianceEnum =
    'pending' |
    'failed' |
    'not-compliant' |
    'compliant'


// Filtros y orden del listado (US-5). Ver la fila de listSnippetDescriptors en
// "Contrato con la UI" de SnippetSearcher. Sin un valor, el backend no filtra
// por eso; sin sort, ordena por nombre.
export type SnippetFilters = {
  relation?: 'all' | 'owner' | 'shared'
  language?: string
  compliance?: ComplianceEnum
  sort?: 'name' | 'language' | 'compliance'
  order?: 'asc' | 'desc'
}

export type CreateSnippet = {
  name: string;
  content: string;
  language: string;
  extension: string;
  // US-1 y US-3: el backend los acepta; sin versión usa la por defecto.
  description?: string;
  version?: string;
}

export type CreateSnippetWithLang = CreateSnippet & { language: string }

// US-2 y US-4: el código es obligatorio; los datos que no vienen quedan como
// estaban.
export type UpdateSnippet = {
  content: string
  name?: string
  description?: string
  language?: string
  version?: string
}

export type Snippet = CreateSnippet & {
  id: string
} & SnippetStatus

type SnippetStatus = {
  compliance: ComplianceEnum;
  author: string;
  // Las reglas de lint que incumple, del último lint (US-6). Lo agrega
  // Snippet Searcher: la UI original no lo tiene.
  lintViolations?: LintViolation[];
}

// Un snippet para descargar (US-13).
export type SnippetFile = {
  filename: string;
  content: string;
}

export type LintViolation = {
  rule: string;
  message: string;
  range: { start: { line: number, column: number }, end: { line: number, column: number } };
}
export type PaginatedSnippets = Pagination & {
  snippets: Snippet[]
}

export const getFileLanguage = (fileTypes: FileType[], fileExt?: string) => {
  return fileExt && fileTypes?.find(x => x.extension == fileExt)
}