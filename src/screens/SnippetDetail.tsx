import {useEffect, useRef, useState} from "react";
import Editor from "react-simple-code-editor";
import {highlight, languages} from "prismjs";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/themes/prism-okaidia.css";
import {Alert, Box, CircularProgress, IconButton, Menu, MenuItem, Tooltip, Typography} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import {
  useUpdateSnippetById
} from "../utils/queries.tsx";
import {useFormatSnippet, useGetSnippetById, useShareSnippet, useSnippetsOperations} from "../utils/queries.tsx";
import {Bòx} from "../components/snippet-table/SnippetBox.tsx";
import {BugReport, Delete, Download, Edit, PlayArrow, Save, Share, StopRounded, UploadFile} from "@mui/icons-material";
import {EditSnippetModal} from "../components/snippet-detail/EditSnippetModal.tsx";
import {UpdateSnippet} from "../utils/snippet.ts";
import {ShareSnippetModal} from "../components/snippet-detail/ShareSnippetModal.tsx";
import {TestSnippetModal} from "../components/snippet-test/TestSnippetModal.tsx";
import {Snippet} from "../utils/snippet.ts";
import {SnippetExecution} from "./SnippetExecution.tsx";
import ReadMoreIcon from '@mui/icons-material/ReadMore';
import {queryClient} from "../App.tsx";
import {useSnackbarContext} from "../contexts/snackbarContext.tsx";
import {backendErrorMessage} from "../utils/backendError.ts";
import {DeleteConfirmationModal} from "../components/snippet-detail/DeleteConfirmationModal.tsx";

type SnippetDetailProps = {
  id: string;
  handleCloseModal: () => void;
}

// Descarga el snippet original o la versión formateada (US-13). Los dos se
// piden al backend con el token; la formateada puede no existir todavía.
const DownloadButton = ({snippet}: { snippet?: Snippet }) => {
  const snippetOperations = useSnippetsOperations()
  const {createSnackbar} = useSnackbarContext()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  if (!snippet) return null;

  const download = async (formatted: boolean) => {
    setAnchor(null)
    try {
      const file = await snippetOperations.downloadSnippet(snippet.id, formatted)
      const url = URL.createObjectURL(new Blob([file.content], {type: 'text/plain'}))
      const link = document.createElement('a')
      link.href = url
      link.download = file.filename
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      createSnackbar('error', backendErrorMessage(error))
    }
  }

  return (
    <>
      <Tooltip title={"Download"}>
        <IconButton onClick={event => setAnchor(event.currentTarget)}>
          <Download/>
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
        <MenuItem onClick={() => download(false)}>Original</MenuItem>
        <MenuItem onClick={() => download(true)}>Formateada</MenuItem>
      </Menu>
    </>
  )
}

export const SnippetDetail = (props: SnippetDetailProps) => {
  const {id, handleCloseModal} = props;
  const [code, setCode] = useState(
      ""
  );
  const [shareModalOppened, setShareModalOppened] = useState(false)
  const [deleteConfirmationModalOpen, setDeleteConfirmationModalOpen] = useState(false)
  const [testModalOpened, setTestModalOpened] = useState(false);
  // Editar los datos del snippet (US-2 y US-4).
  const [editModalOpened, setEditModalOpened] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  // Ejecución interactiva (US-10): true mientras corre.
  const [runSnippet, setRunSnippet] = useState(false);

  const {data: snippet, isLoading} = useGetSnippetById(id);
  const {mutate: shareSnippet, isLoading: loadingShare} = useShareSnippet()
  const {mutate: formatSnippet, isLoading: isFormatLoading, data: formatSnippetData} = useFormatSnippet(id)
  // Al guardar, el backend corre todos los tests del snippet (US-16): se vuelven
  // a pedir el snippet y sus tests, para ver los resultados de la versión nueva.
  const {mutate: updateSnippet, isLoading: isUpdateSnippetLoading} = useUpdateSnippetById({
    onSuccess: () => {
      queryClient.invalidateQueries(['snippet', id])
      queryClient.invalidateQueries(['testCases', id])
    }
  })
  const {createSnackbar} = useSnackbarContext()

  // El editor toma el código guardado solo cuando cambia: si cambia otra cosa
  // (por ejemplo, llega el resultado del lint), no pisa lo que se está
  // escribiendo.
  const savedContent = snippet?.content
  useEffect(() => {
    if (savedContent !== undefined) {
      setCode(savedContent);
    }
  }, [savedContent]);

  useEffect(() => {
    if (formatSnippetData) {
      setCode(formatSnippetData)
    }
  }, [formatSnippetData])


  async function handleShareSnippet(userId: string) {
    shareSnippet({snippetId: id, userId}, {
      onSuccess: () => {
        setShareModalOppened(false)
        createSnackbar('success', 'Snippet compartido')
      },
      onError: (error) => createSnackbar('error', backendErrorMessage(error))
    })
  }

  return (
      <Box p={4} minWidth={'60vw'}>
        <Box width={'100%'} p={2} display={'flex'} justifyContent={'flex-end'}>
          <CloseIcon style={{cursor: "pointer"}} onClick={handleCloseModal}/>
        </Box>
        {
          isLoading ? (<>
            <Typography fontWeight={"bold"} mb={2} variant="h4">Loading...</Typography>
            <CircularProgress/>
          </>) : <>
            <Typography variant="h4" fontWeight={"bold"}>{snippet?.name ?? "Snippet"}</Typography>
            {/* US-6: nombre, descripción, lenguaje y versión. */}
            <Typography variant="body2" color="text.secondary">
              {snippet?.language} {snippet?.version}
            </Typography>
            {snippet?.description && <Typography mt={1}>{snippet.description}</Typography>}
            <Box display="flex" flexDirection="row" gap="8px" padding="8px">
              <Tooltip title={"Edit details"}>
                <IconButton onClick={() => setEditModalOpened(true)}>
                  <Edit/>
                </IconButton>
              </Tooltip>
              {/* US-2: reemplazar el código con un archivo. Queda en el editor
                  hasta tocar Save, como un cambio escrito a mano. */}
              <Tooltip title={"Replace code from file"}>
                <IconButton onClick={() => fileInput.current?.click()}>
                  <UploadFile/>
                </IconButton>
              </Tooltip>
              <input hidden type="file" ref={fileInput} data-testid={"replace-file-input"}
                     onChange={e => {
                       const file = e.target.files?.[0]
                       const input = e.target
                       file?.text().then(text => setCode(text)).finally(() => { input.value = "" })
                     }}/>
              <Tooltip title={"Share"}>
                <IconButton onClick={() => setShareModalOppened(true)}>
                  <Share/>
                </IconButton>
              </Tooltip>
              <Tooltip title={"Test"}>
                <IconButton onClick={() => setTestModalOpened(true)}>
                  <BugReport/>
                </IconButton>
              </Tooltip>
              <DownloadButton snippet={snippet}/>
              {/* Ejecuta en vivo el código guardado (US-10). */}
              <Tooltip title={runSnippet ? "Stop run" : "Run"}>
                <IconButton onClick={() => setRunSnippet(!runSnippet)}>
                  {runSnippet ? <StopRounded/> : <PlayArrow/>}
                </IconButton>
              </Tooltip>
              <Tooltip title={"Format"}>
                <IconButton onClick={() => formatSnippet(code, {onError: (error) => createSnackbar('error', backendErrorMessage(error))})} disabled={isFormatLoading}>
                  <ReadMoreIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title={"Save changes"}>
                <IconButton color={"primary"} onClick={() => updateSnippet({id: id, updateSnippet: {content: code}}, {onError: (error) => createSnackbar('error', backendErrorMessage(error))})} disabled={isUpdateSnippetLoading || snippet?.content === code} >
                  <Save />
                </IconButton>
              </Tooltip>
              <Tooltip title={"Delete"}>
                <IconButton onClick={() => setDeleteConfirmationModalOpen(true)} >
                  <Delete color={"error"} />
                </IconButton>
              </Tooltip>
            </Box>
            <Box display={"flex"} gap={2}>
              <Bòx flex={1} height={"fit-content"} overflow={"none"} minHeight={"500px"} bgcolor={'black'} color={'white'} code={code}>
                <Editor
                    value={code}
                    padding={10}
                    onValueChange={(code) => setCode(code)}
                    highlight={(code) => highlight(code, languages.js, "javascript")}
                    maxLength={1000}
                    style={{
                      minHeight: "500px",
                      fontFamily: "monospace",
                      fontSize: 17,
                    }}
                />
              </Bòx>
            </Box>
            {/* Las reglas de lint que incumple (US-6). El lint corre en segundo
                plano: mientras está pendiente, todavía no hay resultado. */}
            {snippet?.compliance === "pending" && (
              <Alert severity="info" sx={{marginTop: 2}}>El lint se está procesando.</Alert>
            )}
            {!!snippet?.lintViolations?.length && (
              <Alert severity="warning" sx={{marginTop: 2}}>
                <Typography fontWeight="bold">Reglas de lint incumplidas</Typography>
                {snippet.lintViolations.map(({rule, message, range}, index) => (
                  <Typography key={index} variant="body2">
                    {rule} (línea {range.start.line}, columna {range.start.column}): {message}
                  </Typography>
                ))}
              </Alert>
            )}
            <Box pt={1} flex={1} marginTop={2}>
              <Alert severity="info">Output</Alert>
              <SnippetExecution snippetId={id} running={runSnippet} onFinished={() => setRunSnippet(false)}/>
            </Box>
          </>
        }
        <ShareSnippetModal loading={loadingShare || isLoading} open={shareModalOppened}
                           onClose={() => setShareModalOppened(false)}
                           onShare={handleShareSnippet}/>
        <EditSnippetModal open={editModalOpened} onClose={() => setEditModalOpened(false)} snippet={snippet}
                          loading={isUpdateSnippetLoading}
                          onSave={(details: Omit<UpdateSnippet, 'content'>) => updateSnippet({id: id, updateSnippet: {...details, content: code}}, {
                            onSuccess: () => setEditModalOpened(false),
                            onError: (error) => createSnackbar('error', backendErrorMessage(error)),
                          })}/>
        <TestSnippetModal snippetId={id} open={testModalOpened} onClose={() => setTestModalOpened(false)}/>
        <DeleteConfirmationModal open={deleteConfirmationModalOpen} onClose={() => setDeleteConfirmationModalOpen(false)} id={snippet?.id ?? ""} setCloseDetails={handleCloseModal} />
      </Box>
  );
}

