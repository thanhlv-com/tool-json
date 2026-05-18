import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ActionBar } from './ActionBar';
import { DiffActionBar } from './DiffActionBar';
import { DiffWorkspace } from './DiffWorkspace';
import { EditorWorkspace } from './EditorWorkspace';
import { MODE_PATHS, getModeFromPathname, isValidModePath } from './modeRoutes';
import { TopNavigation } from './TopNavigation';
import { useJsonToolState } from './useJsonToolState';

export function JsonToolPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const mode = getModeFromPathname(location.pathname) ?? 'format';

  useEffect(() => {
    if (!isValidModePath(location.pathname)) {
      navigate(MODE_PATHS.format, { replace: true });
    }
  }, [location.pathname, navigate]);

  const {
    input,
    setInput,
    output,
    outputLanguage,
    convertSourceFormat,
    diffOriginal,
    setDiffOriginal,
    diffModified,
    setDiffModified,
    jsonPath,
    setJsonPath,
    theme,
    setTheme,
    errorStatus,
    inputEditorRef,
    outputEditorRef,
    handleEditorValidation,
    handleFormat,
    handleMinify,
    handleValidate,
    handleExpandAll,
    handleCollapseAll,
    copyToClipboard,
    downloadFile,
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
        theme={theme}
        onToggleTheme={() => setTheme((currentTheme) => (currentTheme === 'vs-dark' ? 'light' : 'vs-dark'))}
      />

      <div className="flex-1 flex flex-col min-h-0">
        {mode !== 'diff' ? (
          <ActionBar
            mode={mode}
            convertSourceFormat={convertSourceFormat}
            errorStatus={errorStatus}
            jsonPath={jsonPath}
            output={output}
            outputLanguage={outputLanguage}
            onJsonPathChange={setJsonPath}
            onFormat={handleFormat}
            onMinify={handleMinify}
            onValidate={handleValidate}
            onCopy={copyToClipboard}
            onDownload={downloadFile}
          />
        ) : (
          <DiffActionBar />
        )}

        <main className="flex-1 grid grid-cols-2 bg-[#0F0F11] overflow-hidden">
          {mode === 'diff' ? (
            <DiffWorkspace
              theme={theme}
              diffOriginal={diffOriginal}
              diffModified={diffModified}
              onDiffOriginalChange={setDiffOriginal}
              onDiffModifiedChange={setDiffModified}
            />
          ) : (
            <EditorWorkspace
              mode={mode}
              theme={theme}
              input={input}
              output={output}
              outputLanguage={outputLanguage}
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
