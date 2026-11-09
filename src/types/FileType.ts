export type FileType = {
    language: string;
    extension: string;
    // Las versiones que se pueden elegir y la que se usa si no se elige
    // ninguna (GET /languages, #37).
    versions?: string[];
    defaultVersion?: string;
}
