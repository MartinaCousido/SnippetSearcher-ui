import {Box, IconButton, MenuItem, TextField, Tooltip} from "@mui/material";
import {ArrowDownward, ArrowUpward} from "@mui/icons-material";
import {ComplianceEnum, SnippetFilters} from "../../utils/snippet.ts";
import {FileType} from "../../types/FileType.ts";

type SnippetFiltersBarProps = {
  filters: SnippetFilters
  onChange: (filters: SnippetFilters) => void
  fileTypes?: FileType[]
}

const compliances: ComplianceEnum[] = ['compliant', 'not-compliant', 'pending', 'failed']

// Filtros y orden del listado (US-5): relación (propios, compartidos o ambos),
// lenguaje y validez, y ordenar por nombre, lenguaje o validez. Un valor vacío
// quiere decir "todos".
export const SnippetFiltersBar = ({filters, onChange, fileTypes}: SnippetFiltersBarProps) => {
  const change = (patch: Partial<SnippetFilters>) => onChange({...filters, ...patch})
  const descending = filters.order === 'desc'

  return (
      <Box display="flex" flexDirection="row" gap={2} mt={2} flexWrap="wrap" alignItems="center">
        <TextField select size="small" label="Relation" sx={{minWidth: 150, background: 'white'}}
                   value={filters.relation ?? 'all'}
                   onChange={e => change({relation: e.target.value as SnippetFilters['relation']})}>
          <MenuItem value="all">Own and shared</MenuItem>
          <MenuItem value="owner">Own</MenuItem>
          <MenuItem value="shared">Shared with me</MenuItem>
        </TextField>
        <TextField select size="small" label="Language" sx={{minWidth: 150, background: 'white'}}
                   value={filters.language ?? ''}
                   onChange={e => change({language: e.target.value || undefined})}>
          <MenuItem value="">All</MenuItem>
          {fileTypes?.map(type => <MenuItem key={type.language} value={type.language}>{type.language}</MenuItem>)}
        </TextField>
        <TextField select size="small" label="Conformance" sx={{minWidth: 150, background: 'white'}}
                   value={filters.compliance ?? ''}
                   onChange={e => change({compliance: (e.target.value || undefined) as ComplianceEnum | undefined})}>
          <MenuItem value="">All</MenuItem>
          {compliances.map(compliance => <MenuItem key={compliance} value={compliance}>{compliance}</MenuItem>)}
        </TextField>
        <TextField select size="small" label="Sort by" sx={{minWidth: 150, background: 'white'}}
                   value={filters.sort ?? 'name'}
                   onChange={e => change({sort: e.target.value as SnippetFilters['sort']})}>
          <MenuItem value="name">Name</MenuItem>
          <MenuItem value="language">Language</MenuItem>
          <MenuItem value="compliance">Conformance</MenuItem>
        </TextField>
        <Tooltip title={descending ? "Descending" : "Ascending"}>
          <IconButton aria-label="sort order" onClick={() => change({order: descending ? 'asc' : 'desc'})}>
            {descending ? <ArrowDownward/> : <ArrowUpward/>}
          </IconButton>
        </Tooltip>
      </Box>
  )
}
