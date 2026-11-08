import {Pagination} from "./pagination.ts";
import {FileType} from "../types/FileType.ts";

export type ComplianceEnum =
    'pending' |
    'failed' |
    'not-compliant' |
    'compliant'


export type CreateSnippet = {
  name: string;
  content: string;
  language: string;
  extension: string;
}

export type CreateSnippetWithLang = CreateSnippet & { language: string }

export type UpdateSnippet = {
  content: string
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