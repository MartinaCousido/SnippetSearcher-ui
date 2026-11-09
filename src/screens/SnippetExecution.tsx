import {Alert, OutlinedInput} from "@mui/material";
import {highlight, languages} from "prismjs";
import Editor from "react-simple-code-editor";
import {Bòx} from "../components/snippet-table/SnippetBox.tsx";
import {useEffect, useRef, useState} from "react";
import {useAuth0} from "@auth0/auth0-react";
import {LiveExecution, startLiveExecution} from "../utils/liveExecution.ts";

type SnippetExecutionProps = {
  snippetId: string
  // true mientras el usuario quiere que corra. Cuando termina, se avisa con onFinished.
  running: boolean
  onFinished: () => void
}

// Ejecución interactiva (US-10): corre el código guardado del snippet. Los
// outputs aparecen a medida que se imprimen, y cada readInput pide su input acá.
export const SnippetExecution = ({snippetId, running, onFinished}: SnippetExecutionProps) => {
  const {getAccessTokenSilently} = useAuth0()
  const [input, setInput] = useState<string>("")
  const [lines, setLines] = useState<string[]>([])
  const [waitingInput, setWaitingInput] = useState(false)
  const [error, setError] = useState<string>()
  const execution = useRef<LiveExecution>()

  useEffect(() => {
    if (!running) {
      execution.current?.stop()
      execution.current = undefined
      setWaitingInput(false)
      return
    }
    let cancelled = false
    setLines([])
    setError(undefined)
    getAccessTokenSilently().then(token => {
      if (cancelled) return
      execution.current = startLiveExecution(snippetId, token, {
        onMessage: (message) => {
          switch (message.type) {
            case "output":
              setLines(previous => [...previous, message.value])
              break
            case "input-request":
              setLines(previous => [...previous, `> ${message.prompt}`])
              setWaitingInput(true)
              break
            case "error": {
              const {rule, message: text, range} = message.diagnostic
              setLines(previous => [...previous,
                `Error ${rule} (línea ${range.start.line}, columna ${range.start.column}): ${text}`])
              break
            }
            case "end":
              break
          }
        },
        onClose: (closeError) => {
          setWaitingInput(false)
          setError(closeError)
          execution.current = undefined
          onFinished()
        },
      })
    }).catch(() => {
      setError("No se pudo conseguir tu sesión: volvé a entrar.")
      onFinished()
    })
    return () => {
      cancelled = true
      execution.current?.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, snippetId])

  const code = lines.join("\n")

  const handleEnter = (event: { key: string }) => {
    if (event.key === 'Enter' && waitingInput) {
      execution.current?.sendInput(input)
      setLines(previous => [...previous, `  ${input}`])
      setWaitingInput(false)
      setInput("")
    }
  };

  return (
    <>
      {error && <Alert severity="error" sx={{marginBottom: 1}}>{error}</Alert>}
      <Bòx flex={1} overflow={"none"} minHeight={200} bgcolor={'black'} color={'white'} code={code}>
        <Editor
          value={code}
          padding={10}
          onValueChange={() => {}}
          readOnly
          highlight={(code) => highlight(code, languages.js, 'javascript')}
          maxLength={1000}
          style={{
            fontFamily: "monospace",
            fontSize: 17,
          }}
        />
      </Bòx>
      <OutlinedInput onKeyDown={handleEnter} value={input} onChange={e => setInput(e.target.value)}
                     disabled={!waitingInput}
                     placeholder={waitingInput ? "Escribí el input y apretá Enter" : "Tocá Run para ejecutar"}
                     fullWidth/>
    </>
  )
}
