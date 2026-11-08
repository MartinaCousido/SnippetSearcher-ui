export type TestCase = {
    id: string;
    name: string;
    input?: string[];
    output?: string[];
    // Resultado de la última corrida automática, al actualizar el snippet
    // (US-16). null si todavía no se corrió. Lo agrega Snippet Searcher.
    lastResult?: "success" | "fail" | null;
};