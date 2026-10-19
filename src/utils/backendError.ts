import axios from 'axios'

// Un problema en el código, como lo devuelve Snippet Service (Diagnostic).
type Diagnostic = {
  rule: string
  message: string
  range: { start: { line: number, column: number }, end: { line: number, column: number } }
}

// Arma el texto que se le muestra al usuario cuando falla un pedido al backend.
// Si el código no es válido, dice la regla, la línea y la columna (US-1).
export const backendErrorMessage = (error: unknown): string => {
  if (!axios.isAxiosError(error)) {
    return 'Algo salió mal. Probá de nuevo.'
  }
  const diagnostics: Diagnostic[] | undefined = error.response?.data?.diagnostics
  if (diagnostics?.length) {
    return diagnostics
        .map(({rule, message, range}) => `${rule} (línea ${range.start.line}, columna ${range.start.column}): ${message}`)
        .join(' · ')
  }
  const detail: string | undefined = error.response?.data?.detail
  return detail ?? 'No se pudo conectar con el servidor. Probá de nuevo.'
}
