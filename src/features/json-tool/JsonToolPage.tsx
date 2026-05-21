import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ActionBar, DiffActionBar, MergeActionBar, PatchActionBar } from './components/action-bars';
import { TopNavigation, WorkspaceHistoryBar } from './components/navigation';
import {
  DiffWorkspace,
  EditorWorkspace,
  MergeWorkspace,
  PatchWorkspace,
  PipelineWorkspace,
  PrivacyWorkspace,
  SchemaValidateWorkspace,
  TreeExplorerWorkspace,
} from './components/workspaces';
import { MODE_PATHS, getModeFromPathname, isValidModePath } from './modeRoutes';
import { applySeoForMode } from './seo';
import { getPersistedLastMode, getSharedModeFromSearch, useJsonToolState } from './useJsonToolState';

export function JsonToolPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const mode = getModeFromPathname(location.pathname) ?? 'format';

  useEffect(() => {
    const normalizedPath = location.pathname.endsWith('/') && location.pathname !== '/' ? location.pathname.slice(0, -1) : location.pathname;
    const sharedMode = getSharedModeFromSearch(location.search);

    if (sharedMode) {
      const sharedModePath = MODE_PATHS[sharedMode];
      if (normalizedPath !== sharedModePath) {
        navigate(
          {
            pathname: sharedModePath,
            search: location.search,
            hash: location.hash,
          },
          { replace: true },
        );
        return;
      }
    }

    if (!isValidModePath(location.pathname)) {
      const persistedMode = getPersistedLastMode();
      navigate(
        {
          pathname: MODE_PATHS[persistedMode ?? 'format'],
          search: location.search,
          hash: location.hash,
        },
        { replace: true },
      );
      return;
    }

    const currentMode = getModeFromPathname(location.pathname);
    if (!currentMode) {
      return;
    }

    const canonicalPath = MODE_PATHS[currentMode];
    if (normalizedPath !== canonicalPath) {
      navigate(
        {
          pathname: canonicalPath,
          search: location.search,
          hash: location.hash,
        },
        { replace: true },
      );
    }
  }, [location.hash, location.pathname, location.search, navigate]);

  const {
    input,
    setInput,
    schemaInput,
    setSchemaInput,
    schemaImportsInput,
    setSchemaImportsInput,
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
    historyEnabled,
    setHistoryEnabled,
    canUndoWorkspaceHistory,
    canRedoWorkspaceHistory,
    activeWorkspaceSnapshotId,
    workspaceHistorySnapshots,
    undoWorkspaceHistory,
    redoWorkspaceHistory,
    saveWorkspaceSnapshot,
    restoreWorkspaceSnapshotById,
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
    mockDataCount,
    setMockDataCount,
    pipelineStepsInput,
    setPipelineStepsInput,
    privacyRulesInput,
    setPrivacyRulesInput,
    privacyPreviewMaskedOnly,
    setPrivacyPreviewMaskedOnly,
    schemaValidationIssues,
    patchBaseInput,
    setPatchBaseInput,
    patchTargetInput,
    setPatchTargetInput,
    patchOperationsInput,
    setPatchOperationsInput,
    mergeLeftInput,
    setMergeLeftInput,
    mergeRightInput,
    setMergeRightInput,
    inputEditorRef,
    outputEditorRef,
    schemaEditorRef,
    schemaImportsEditorRef,
    pipelineStepsEditorRef,
    privacyRulesEditorRef,
    handleEditorValidation,
    handleSchemaEditorValidation,
    handleSchemaImportsEditorValidation,
    handlePipelineStepsEditorValidation,
    handlePrivacyRulesEditorValidation,
    handleFormat,
    handleMinify,
    handleValidate,
    handleGeneratePatch,
    handleApplyPatch,
    handleMergeJson,
    handleFormatMerge,
    handleFormatDiff,
    handleExpandAll,
    handleCollapseAll,
    copyToClipboard,
    handleShare,
    downloadFile,
    importInputFile,
    importPatchBaseFile,
    importPatchTargetFile,
    importPatchOperationsFile,
    importMergeLeftFile,
    importMergeRightFile,
  } = useJsonToolState(mode);

  useEffect(() => {
    if (theme === 'vs-dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    applySeoForMode(mode);
  }, [mode]);

  return (
    <div className="min-h-[100dvh] w-full bg-[#0F0F11] text-[#E0E0E0] font-sans">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[2200px] flex-col overflow-hidden">
        <TopNavigation
          mode={mode}
          onNavigateMode={(nextMode) => navigate(MODE_PATHS[nextMode])}
          syncInputAcrossModes={syncInputAcrossModes}
          onSyncInputAcrossModesChange={setSyncInputAcrossModes}
          showArrayHints={showArrayHints}
          onShowArrayHintsChange={setShowArrayHints}
          historyEnabled={historyEnabled}
          onHistoryEnabledChange={setHistoryEnabled}
          theme={theme}
          onToggleTheme={() => setTheme((currentTheme) => (currentTheme === 'vs-dark' ? 'light' : 'vs-dark'))}
        />
        {historyEnabled && (
          <WorkspaceHistoryBar
            historyEnabled={historyEnabled}
            canUndo={canUndoWorkspaceHistory}
            canRedo={canRedoWorkspaceHistory}
            activeSnapshotId={activeWorkspaceSnapshotId}
            snapshots={workspaceHistorySnapshots}
            onUndo={undoWorkspaceHistory}
            onRedo={redoWorkspaceHistory}
            onSaveSnapshot={saveWorkspaceSnapshot}
            onRestoreSnapshot={restoreWorkspaceSnapshotById}
          />
        )}

        <div className="flex-1 flex flex-col min-h-0">
          {mode === 'diff' ? (
            <DiffActionBar
              diffReport={diffReport}
              diffParseError={diffParseError}
              errorStatus={errorStatus}
              onFormat={handleFormatDiff}
              onShare={handleShare}
            />
          ) : mode === 'merge' ? (
            <MergeActionBar
              output={output}
              errorStatus={errorStatus}
              onMerge={handleMergeJson}
              onFormat={handleFormatMerge}
              onShare={handleShare}
              onCopy={copyToClipboard}
              onDownload={downloadFile}
              onImportLeftFile={importMergeLeftFile}
              onImportRightFile={importMergeRightFile}
            />
          ) : mode === 'patch' ? (
            <PatchActionBar
              output={output}
              errorStatus={errorStatus}
              onGeneratePatch={handleGeneratePatch}
              onApplyPatch={handleApplyPatch}
              onShare={handleShare}
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
              mockDataCount={mockDataCount}
              privacyPreviewMaskedOnly={privacyPreviewMaskedOnly}
              onJsonPathChange={setJsonPath}
              onConvertTargetFormatChange={setConvertTargetFormat}
              onFormat={handleFormat}
              onMinify={handleMinify}
              onValidate={handleValidate}
              onShare={handleShare}
              onCopy={copyToClipboard}
              onDownload={downloadFile}
              onImportInputFile={importInputFile}
              onCsvDelimiterChange={(delimiter) => setCsvOptions((previous) => ({ ...previous, delimiter }))}
              onCsvHeaderRowChange={(hasHeaderRow) => setCsvOptions((previous) => ({ ...previous, hasHeaderRow }))}
              onCsvQuoteStrategyChange={(quoteStrategy) => setCsvOptions((previous) => ({ ...previous, quoteStrategy }))}
              onCsvEscapeStrategyChange={(escapeStrategy) => setCsvOptions((previous) => ({ ...previous, escapeStrategy }))}
              onSchemaDraftChange={setSchemaDraft}
              onSchemaCustomKeywordsInputChange={setSchemaCustomKeywordsInput}
              onMockDataCountChange={setMockDataCount}
              onPrivacyPreviewMaskedOnlyChange={setPrivacyPreviewMaskedOnly}
            />
          )}

          <main className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 bg-[#0F0F11] overflow-hidden">
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
            ) : mode === 'merge' ? (
              <MergeWorkspace
                theme={theme}
                mergeLeftInput={mergeLeftInput}
                mergeRightInput={mergeRightInput}
                output={output}
                onMergeLeftInputChange={setMergeLeftInput}
                onMergeRightInputChange={setMergeRightInput}
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
            ) : mode === 'tree' ? (
              <TreeExplorerWorkspace
                theme={theme}
                input={input}
                onInputChange={setInput}
                onInputValidate={handleEditorValidation}
                onInputEditorMount={(editor) => {
                  inputEditorRef.current = editor;
                }}
              />
            ) : mode === 'pipeline' ? (
              <PipelineWorkspace
                theme={theme}
                input={input}
                pipelineStepsInput={pipelineStepsInput}
                output={output}
                outputLanguage={outputLanguage}
                onInputChange={setInput}
                onPipelineStepsInputChange={setPipelineStepsInput}
                onInputValidate={handleEditorValidation}
                onPipelineStepsValidate={handlePipelineStepsEditorValidation}
                onInputEditorMount={(editor) => {
                  inputEditorRef.current = editor;
                }}
                onPipelineStepsEditorMount={(editor) => {
                  pipelineStepsEditorRef.current = editor;
                }}
                onOutputEditorMount={(editor) => {
                  outputEditorRef.current = editor;
                }}
              />
            ) : mode === 'privacy' ? (
              <PrivacyWorkspace
                theme={theme}
                input={input}
                privacyRulesInput={privacyRulesInput}
                output={output}
                outputLanguage={outputLanguage}
                onInputChange={setInput}
                onPrivacyRulesInputChange={setPrivacyRulesInput}
                onInputValidate={handleEditorValidation}
                onPrivacyRulesValidate={handlePrivacyRulesEditorValidation}
                onInputEditorMount={(editor) => {
                  inputEditorRef.current = editor;
                }}
                onPrivacyRulesEditorMount={(editor) => {
                  privacyRulesEditorRef.current = editor;
                }}
                onOutputEditorMount={(editor) => {
                  outputEditorRef.current = editor;
                }}
              />
            ) : mode === 'schemaValidate' ? (
              <SchemaValidateWorkspace
                theme={theme}
                input={input}
                schemaInput={schemaInput}
                schemaImportsInput={schemaImportsInput}
                output={output}
                outputLanguage={outputLanguage}
                schemaValidationIssues={schemaValidationIssues}
                onInputChange={setInput}
                onSchemaInputChange={setSchemaInput}
                onSchemaImportsInputChange={setSchemaImportsInput}
                onInputValidate={handleEditorValidation}
                onSchemaValidate={handleSchemaEditorValidation}
                onSchemaImportsValidate={handleSchemaImportsEditorValidation}
                onInputEditorMount={(editor) => {
                  inputEditorRef.current = editor;
                }}
                onSchemaEditorMount={(editor) => {
                  schemaEditorRef.current = editor;
                }}
                onSchemaImportsEditorMount={(editor) => {
                  schemaImportsEditorRef.current = editor;
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
    </div>
  );
}
