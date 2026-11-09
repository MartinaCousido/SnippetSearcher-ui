import {useState} from "react";
import {useAuth0} from "@auth0/auth0-react";
import {useQueryClient} from "react-query";
import {TestCase} from "../../types/TestCase.ts";
import {Autocomplete, Box, Button, Chip, TextField, Typography} from "@mui/material";
import {BugReport, Delete, Save} from "@mui/icons-material";
import {TestCaseResult, useTestSnippet} from "../../utils/queries.tsx";
import {startLiveExecution} from "../../utils/liveExecution.ts";
import {useSnackbarContext} from "../../contexts/snackbarContext.tsx";
import {backendErrorMessage} from "../../utils/backendError.ts";

type TabPanelProps = {
    snippetId: string;
    index: number;
    value: number;
    test?: TestCase;
    setTestCase: (test: Partial<TestCase>) => void;
    removeTestCase?: (testIndex: string) => void;
}

export const TabPanel = ({snippetId, value, index, test: initialTest, setTestCase, removeTestCase}: TabPanelProps) => {
    const [testData, setTestData] = useState<Partial<TestCase> | undefined>(initialTest);

    const {mutateAsync: testSnippet, data} = useTestSnippet(snippetId);
    // Si no se puede correr el test (por ejemplo, PrintScript no responde),
    // avisa en lugar de no hacer nada.
    const {createSnackbar} = useSnackbarContext()
    const {getAccessTokenSilently} = useAuth0()
    const queryClient = useQueryClient()
    // Correr el test en vivo (US-9): los outputs aparecen a medida que salen.
    const [liveOutputs, setLiveOutputs] = useState<string[]>()
    const [liveResult, setLiveResult] = useState<TestCaseResult>()
    const [running, setRunning] = useState(false)

    // En vivo se corre el test tal como está guardado. Con cambios sin
    // guardar, se corre con POST /tests/run, que responde al final.
    const sameList = (a?: string[], b?: string[]) => JSON.stringify(a ?? []) === JSON.stringify(b ?? [])
    const savedAsIs = !!initialTest?.id && testData?.id === initialTest.id
        && sameList(testData?.input, initialTest.input) && sameList(testData?.output, initialTest.output)

    const runTest = async () => {
        setLiveResult(undefined)
        setLiveOutputs(undefined)
        if (!savedAsIs || !testData?.id) {
            testSnippet(testData ?? {}).catch(error => createSnackbar('error', backendErrorMessage(error)))
            return
        }
        setRunning(true)
        setLiveOutputs([])
        try {
            const token = await getAccessTokenSilently()
            startLiveExecution(snippetId, token, {
                onMessage: (message) => {
                    if (message.type === "output") setLiveOutputs(previous => [...(previous ?? []), message.value])
                    if (message.type === "error") {
                        const {rule, range} = message.diagnostic
                        setLiveOutputs(previous => [...(previous ?? []),
                            `Error ${rule} (línea ${range.start.line}, columna ${range.start.column})`])
                    }
                    if (message.type === "end" && message.result) setLiveResult(message.result)
                },
                onClose: (error) => {
                    setRunning(false)
                    if (error) createSnackbar('error', error)
                    // El resultado quedó guardado: se vuelve a pedir la lista.
                    queryClient.invalidateQueries(['testCases', snippetId])
                },
            }, testData.id)
        } catch {
            setRunning(false)
            createSnackbar('error', 'No se pudo conseguir tu sesión: volvé a entrar.')
        }
    }
    const result = liveResult ?? (liveOutputs ? undefined : data)


    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`vertical-tabpanel-${index}`}
            aria-labelledby={`vertical-tab-${index}`}
            style={{width: '100%', height: '100%'}}
        >
            {value === index && (
                <Box sx={{px: 3}} display="flex" flexDirection="column" gap={2}>
                    <Box display="flex" flexDirection="column" gap={1}>
                        <Typography fontWeight="bold">Name</Typography>
                        <TextField size="small" value={testData?.name}
                                   onChange={(e) => setTestData({...testData, name: e.target.value})}/>
                    </Box>
                    <Box display="flex" flexDirection="column" gap={1}>
                        <Typography fontWeight="bold">Input</Typography>
                        <Autocomplete
                            multiple
                            size="small"
                            id="tags-filled"
                            freeSolo
                            value={testData?.input ?? []}
                            onChange={(_, value) => setTestData({...testData, input: value})}
                            renderTags={(value: readonly string[], getTagProps) =>
                                value.map((option: string, index: number) => (
                                    <Chip variant="outlined" label={option} {...getTagProps({index})} />
                                ))
                            }
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                />
                            )}
                            options={[]}
                        />
                    </Box>
                    <Box display="flex" flexDirection="column" gap={1}>
                        <Typography fontWeight="bold">Output</Typography>
                        <Autocomplete
                            multiple
                            size="small"
                            id="tags-filled"
                            freeSolo
                            value={testData?.output ?? []}
                            onChange={(_, value) => setTestData({...testData, output: value})}
                            renderTags={(value: readonly string[], getTagProps) =>
                                value.map((option: string, index: number) => (
                                    <Chip variant="outlined" label={option} {...getTagProps({index})} />
                                ))
                            }
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                />
                            )}
                            options={[]}
                        />
                    </Box>
                    <Box display="flex" flexDirection="row" gap={1}>
                        {
                            (testData?.id && removeTestCase) && (
                            <Button onClick={() => removeTestCase(testData?.id ?? "")} variant={"outlined"} color={"error"}
                                    startIcon={<Delete/>}>
                                Remove
                            </Button>)
                        }
                        <Button disabled={!testData?.name} onClick={() => setTestCase(testData ?? {})} variant={"outlined"} startIcon={<Save/>}>
                            Save
                        </Button>
                        <Button onClick={runTest} disabled={running} variant={"contained"} startIcon={<BugReport/>}
                                disableElevation>
                            Test
                        </Button>
                        {result && (result === "success" ? <Chip label="Pass" color="success"/> :
                            <Chip label="Fail" color="error"/>)}
                    </Box>
                    {liveOutputs && (
                        <Box display="flex" flexDirection="column" gap={1}>
                            <Typography fontWeight="bold">Outputs de esta corrida</Typography>
                            <Box component="pre" sx={{margin: 0, padding: 1, bgcolor: 'black', color: 'white', fontFamily: 'monospace', minHeight: 40}}>
                                {liveOutputs.join("\n")}{running ? "\n…" : ""}
                            </Box>
                        </Box>
                    )}
                </Box>
            )}
        </div>
    );
}