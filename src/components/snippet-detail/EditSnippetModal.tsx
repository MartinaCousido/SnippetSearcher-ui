import {Box, Button, CircularProgress, MenuItem, TextField, Typography} from "@mui/material";
import {Save} from "@mui/icons-material";
import {useEffect, useState} from "react";
import {ModalWrapper} from "../common/ModalWrapper.tsx";
import {useGetFileTypes} from "../../utils/queries.tsx";
import {Snippet, UpdateSnippet} from "../../utils/snippet.ts";

type EditSnippetModalProps = {
  open: boolean
  onClose: () => void
  snippet?: Snippet
  loading: boolean
  // Recibe los datos nuevos. El código lo agrega la pantalla de detalle: es el
  // que está en el editor.
  onSave: (details: Omit<UpdateSnippet, 'content'>) => void
}

// Editar los datos del snippet (US-2 y US-4): nombre, descripción, lenguaje y
// versión. Solo el owner: si no lo es, el backend responde 403.
export const EditSnippetModal = ({open, onClose, snippet, loading, onSave}: EditSnippetModalProps) => {
  const {data: fileTypes} = useGetFileTypes()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [language, setLanguage] = useState("")
  const [version, setVersion] = useState("")

  // Cada vez que se abre, arranca con los datos guardados.
  useEffect(() => {
    if (open && snippet) {
      setName(snippet.name)
      setDescription(snippet.description ?? "")
      setLanguage(snippet.language)
      setVersion(snippet.version ?? "")
    }
  }, [open, snippet])

  const languageType = fileTypes?.find(type => type.language === language)
  const versions = languageType?.versions ?? (version ? [version] : [])

  return (
      <ModalWrapper open={open} onClose={onClose}>
        <Typography variant={"h5"}>Edit snippet details</Typography>
        <Box display="flex" flexDirection="column" gap={2} mt={2}>
          <TextField size="small" label="Name" value={name} onChange={e => setName(e.target.value)}/>
          <TextField size="small" label="Description" value={description} multiline minRows={2}
                     onChange={e => setDescription(e.target.value)}/>
          <TextField select size="small" label="Language" value={language}
                     onChange={e => {
                       setLanguage(e.target.value)
                       setVersion(fileTypes?.find(type => type.language === e.target.value)?.defaultVersion ?? "")
                     }}>
            {fileTypes?.map(type => <MenuItem key={type.language} value={type.language}>{type.language}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Version" value={version} onChange={e => setVersion(e.target.value)}>
            {versions.map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
          </TextField>
          <Box display="flex" justifyContent="flex-end">
            <Button variant="contained" disableElevation disabled={!name || loading}
                    startIcon={loading ? <CircularProgress size={18}/> : <Save/>}
                    onClick={() => onSave({name, description, language, version})}>
              Save details
            </Button>
          </Box>
        </Box>
      </ModalWrapper>
  )
}
