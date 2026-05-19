import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ActionBar } from './ActionBar';
import { DiffActionBar } from './DiffActionBar';
import { DiffWorkspace } from './DiffWorkspace';
import { EditorWorkspace } from './EditorWorkspace';
import { MODE_PATHS, getModeFromPathname, isValidModePath } from './modeRoutes';
import { PatchActionBar } from './PatchActionBar';
import { PatchWorkspace } from './PatchWorkspace';
import { SchemaValidateWorkspace } from './SchemaValidateWorkspace';
import { TopNavigation } from './TopNavigation';
import { getPersistedLastMode, useJsonToolState } from './useJsonToolState';

export function JsonToolPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const mode = getModeFromPathname(location.pathname) ?? 'format';

  useEffect(() => {
    if (!isValidModePath(location.pathname)) {
      const persistedMode = getPersistedLastMode();
      navigate(MODE_PATHS[persistedMode ?? 'format'], { replace: true });
    }
  }, [location.pathname, navigate]);

  const {
    input,
    setInput,
    schemaInput,
    setSchemaInput,
    output,
    outputLanguage,
    convertSourceFormat,
    convertTargetFormat,
    setConvertTargetFormat,
    diffOriginal,
    setDiffOriginal,
    diffModified,
    setDiffModified,
    diffReport,
    diffParseError,
    jsonPath,
    setJsonPath,
    syncInputAcrossModes,
    setSyncInputAcrossModes,
    showArrayHints,
    setShowArrayHints,
    theme,
    setTheme,
    csvInputLooksLikeJson,
    errorStatus,
    csvOptions,
    setCsvOptions,
    schemaDraft,
    setSchemaDraft,
    schemaCustomKeywordsInput,
    setSchemaCustomKeywordsInput,
    schemaValidationIssues,
    patchBaseInput,
    setPatchBaseInput,
    patchTargetInput,
    setPatchTargetInput,
    patchOperationsInput,
    setPatchOperationsInput,
    inputEditorRef,
    outputEditorRef,
    schemaEditorRef,
    handleEditorValidation,
    handleSchemaEditorValidation,
    handleFormat,
    handleMinify,
    handleValidate,
    handleGeneratePatch,
    handleApplyPatch,
    handleFormatDiff,
    handleExpandAll,
    handleCollapseAll,
    copyToClipboard,
    downloadFile,
    importInputFile,
    importPatchBaseFile,
    importPatchTargetFile,
    importPatchOperationsFile,
  } = useJsonToolState(mode);

  useEffect(() => {
    if (theme === 'vs-dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <div className="h-screen w-full flex flex-col bg-[#0F0F11] text-[#E0E0E0] font-sans overflow-hidden">
      <TopNavigation
        mode={mode}
        onNavigateMode={(nextMode) => navigate(MODE_PATHS[nextMode])}
        syncInputAcrossModes={syncInputAcrossModes}
        onSyncInputAcrossModesChange={setSyncInputAcrossModes}
        showArrayHints={showArrayHints}
        onShowArrayHintsChange={setShowArrayHints}
        theme={theme}
        onToggleTheme={() => setTheme((currentTheme) => (currentTheme === 'vs-dark' ? 'light' : 'vs-dark'))}
      />

      <div className="flex-1 flex flex-col min-h-0">
        {mode === 'diff' ? (
          <DiffActionBar diffReport={diffReport} diffParseError={diffParseError} onFormat={handleFormatDiff} />
        ) : mode === 'patch' ? (
          <PatchActionBar
            output={output}
            errorStatus={errorStatus}
            onGeneratePatch={handleGeneratePatch}
            onApplyPatch={handleApplyPatch}
            onCopy={copyToClipboard}
            onDownload={downloadFile}
            onImportBaseFile={importPatchBaseFile}
            onImportTargetFile={importPatchTargetFile}
            onImportPatchFile={importPatchOperationsFile}
          />
        ) : (
          <ActionBar
            mode={mode}
            convertSourceFormat={convertSourceFormat}
            convertTargetFormat={convertTargetFormat}
            errorStatus={errorStatus}
            jsonPath={jsonPath}
            output={output}
            outputLanguage={outputLanguage}
            csvOptions={csvOptions}
            schemaDraft={schemaDraft}
            schemaCustomKeywordsInput={schemaCustomKeywordsInput}
            onJsonPathChange={setJsonPath}
            onConvertTargetFormatChange={setConvertTargetFormat}
            onFormat={handleFormat}
            onMinify={handleMinify}
            onValidate={handleValidate}
            onCopy={copyToClipboard}
            onDownload={downloadFile}
            onImportInputFile={importInputFile}
            onCsvDelimiterChange={(delimiter) => setCsvOptions((previous) => ({ ...previous, delimiter }))}
            onCsvHeaderRowChange={(hasHeaderRow) => setCsvOptions((previous) => ({ ...previous, hasHeaderRow }))}
            onCsvQuoteStrategyChange={(quoteStrategy) => setCsvOptions((previous) => ({ ...previous, quoteStrategy }))}
            onCsvEscapeStrategyChange={(escapeStrategy) => setCsvOptions((previous) => ({ ...previous, escapeStrategy }))}
            onSchemaDraftChange={setSchemaDraft}
            onSchemaCustomKeywordsInputChange={setSchemaCustomKeywordsInput}
          />
        )}

        <main className="flex-1 grid grid-cols-2 bg-[#0F0F11] overflow-hidden">
          {mode === 'diff' ? (
            <DiffWorkspace
              theme={theme}
              diffOriginal={diffOriginal}
              diffModified={diffModified}
              diffReport={diffReport}
              diffParseError={diffParseError}
              onDiffOriginalChange={setDiffOriginal}
              onDiffModifiedChange={setDiffModified}
            />
          ) : mode === 'patch' ? (
            <PatchWorkspace
              theme={theme}
              patchBaseInput={patchBaseInput}
              patchTargetInput={patchTargetInput}
              patchOperationsInput={patchOperationsInput}
              output={output}
              onPatchBaseInputChange={setPatchBaseInput}
              onPatchTargetInputChange={setPatchTargetInput}
              onPatchOperationsInputChange={setPatchOperationsInput}
            />
          ) : mode === 'schemaValidate' ? (
            <SchemaValidateWorkspace
              theme={theme}
              input={input}
              schemaInput={schemaInput}
              output={output}
              outputLanguage={outputLanguage}
              schemaValidationIssues={schemaValidationIssues}
              onInputChange={setInput}
              onSchemaInputChange={setSchemaInput}
              onInputValidate={handleEditorValidation}
              onSchemaValidate={handleSchemaEditorValidation}
              onInputEditorMount={(editor) => {
                inputEditorRef.current = editor;
              }}
              onSchemaEditorMount={(editor) => {
                schemaEditorRef.current = editor;
              }}
              onOutputEditorMount={(editor) => {
                outputEditorRef.current = editor;
              }}
            />
          ) : (
            <EditorWorkspace
              mode={mode}
              theme={theme}
              input={input}
              output={output}
              outputLanguage={outputLanguage}
              csvInputLooksLikeJson={csvInputLooksLikeJson}
              showArrayHints={showArrayHints}
              onInputChange={setInput}
              onInputValidate={handleEditorValidation}
              onExpandAll={handleExpandAll}
              onCollapseAll={handleCollapseAll}
              onInputEditorMount={(editor) => {
                inputEditorRef.current = editor;
              }}
              onOutputEditorMount={(editor) => {
                outputEditorRef.current = editor;
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
}
