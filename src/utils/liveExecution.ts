import {BACKEND_URL} from "./constants.ts";
// Un Diagnostic tiene la misma forma que una regla de lint incumplida.
import {LintViolation as Diagnostic} from "./snippet.ts";
import {TestCaseResult} from "./queries.tsx";

// Ejecución en vivo de un snippet por WebSocket (US-9, US-10). Ver "Ejecución
// en vivo" en Decisiones técnicas de SnippetSearcher.
//   - Sin testId, es interactiva: el backend pide cada input con input-request.
//   - Con testId, corre ese test guardado y al final manda su resultado.

export type LiveMessage =
    | { type: "output", value: string }
    | { type: "input-request", prompt: string }
    | { type: "error", diagnostic: Diagnostic }
    | { type: "end", result?: TestCaseResult }

export type LiveExecutionHandlers = {
  onMessage: (message: LiveMessage) => void
  // Se llama una vez, cuando se cierra la conexión. error es el mensaje para
  // el usuario si la ejecución no terminó bien.
  onClose: (error?: string) => void
}

export type LiveExecution = {
  sendInput: (value: string) => void
  stop: () => void
}

// Por qué se cerró la conexión, en palabras para el usuario. Los 44xx son los
// 401, 403 y 404 de HTTP.
const closeMessage = (code: number, reason: string): string | undefined => {
  switch (code) {
    case 1000:
      return undefined
    case 4401:
      return "Tu sesión no es válida o venció: volvé a entrar."
    case 4403:
      return "No tenés acceso a este snippet."
    case 4404:
      return reason || "El snippet o el test no existe."
    default:
      return reason ? `No se pudo ejecutar el snippet: ${reason}` : "No se pudo ejecutar el snippet."
  }
}

// La dirección del WebSocket: la misma que la API (BACKEND_URL, relativa a la
// página), con ws:// o wss:// según la página use HTTP o HTTPS.
const executeUrl = (snippetId: string): string => {
  const url = new URL(`${BACKEND_URL}/snippets/${snippetId}/execute`, window.location.href)
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:"
  return url.toString()
}

// Abre la conexión y manda el start con el token (el navegador no deja mandar
// el header Authorization por WebSocket).
export const startLiveExecution = (snippetId: string, token: string, handlers: LiveExecutionHandlers,
                                   testId?: string): LiveExecution => {
  const socket = new WebSocket(executeUrl(snippetId))
  let ended = false

  socket.onopen = () => socket.send(JSON.stringify(testId ? {type: "start", token, testId} : {type: "start", token}))
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data) as LiveMessage
    if (message.type === "end") ended = true
    handlers.onMessage(message)
  }
  socket.onclose = (event) => {
    const error = ended ? undefined : closeMessage(event.code, event.reason) ?? "La ejecución se cortó."
    handlers.onClose(error)
  }

  return {
    sendInput: (value) => {
      if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({type: "input", value}))
    },
    stop: () => {
      ended = true
      socket.close(1000)
    },
  }
}
