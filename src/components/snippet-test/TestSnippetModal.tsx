import {Box, Chip, Divider, IconButton, Tab, Tabs, Typography} from "@mui/material";
import {ModalWrapper} from "../common/ModalWrapper.tsx";
import {SyntheticEvent, useState} from "react";
import {AddRounded} from "@mui/icons-material";
import {useGetTestCases, usePostTestCase, useRemoveTestCase} from "../../utils/queries.tsx";
import {TabPanel} from "./TabPanel.tsx";
import {TestCase} from "../../types/TestCase.ts";
import {queryClient} from "../../App.tsx";
import {useSnackbarContext} from "../../contexts/snackbarContext.tsx";
import {backendErrorMessage} from "../../utils/backendError.ts";

type TestSnippetModalProps = {
    snippetId: string
    open: boolean
    onClose: () => void
}

export const TestSnippetModal = ({snippetId, open, onClose}: TestSnippetModalProps) => {
    const [value, setValue] = useState(0);

    const {data: testCases} = useGetTestCases(snippetId);
    const {mutateAsync: postTestCase} = usePostTestCase(snippetId);
    const {mutateAsync: removeTestCase} = useRemoveTestCase({
        snippetId,
        onSuccess: () => queryClient.invalidateQueries(['testCases', snippetId])
    });

    // Avisa si el backend rechaza el pedido, por ejemplo un 403 cuando quien
    // guarda o borra no es el owner.
    const {createSnackbar} = useSnackbarContext()
    const showError = (error: unknown) => createSnackbar('error', backendErrorMessage(error))
    const saveTestCase = (tc: Partial<TestCase>) =>
        postTestCase(tc).then(() => createSnackbar('success', 'Test guardado')).catch(showError)
    const deleteTestCase = (id: string) => removeTestCase(id).catch(showError)

    const handleChange = (_: SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    return (
        <ModalWrapper open={open} onClose={onClose}>
            <Typography variant={"h5"}>Test snippet</Typography>
            <Divider/>
            <Box mt={2} display="flex">
                <Tabs
                    orientation="vertical"
                    variant="scrollable"
                    value={value}
                    onChange={handleChange}
                    aria-label="Vertical tabs example"
                    sx={{borderRight: 1, borderColor: 'divider'}}
                >
                    {testCases?.map((testCase) => (
                        // Al lado del nombre, el resultado de la última corrida
                        // automática (US-16), si ya se corrió.
                        <Tab key={testCase.id} label={testCase.name} iconPosition="end"
                             icon={testCase.lastResult ? <Chip size="small" label={testCase.lastResult === "success" ? "Pass" : "Fail"}
                                                               color={testCase.lastResult === "success" ? "success" : "error"}/> : undefined}/>
                    ))}
                    <IconButton disableRipple onClick={() => setValue((testCases?.length ?? 0) + 1)}>
                        <AddRounded />
                    </IconButton>
                </Tabs>
                {testCases?.map((testCase, index) => (
                    <TabPanel snippetId={snippetId} index={index} value={value} test={testCase}
                              setTestCase={saveTestCase}
                              removeTestCase={deleteTestCase}
                    />
                ))}
                <TabPanel snippetId={snippetId} index={(testCases?.length ?? 0) + 1} value={value}
                          setTestCase={saveTestCase}
                />
            </Box>
        </ModalWrapper>
    )
}
