import Editor from '@monaco-editor/react';
import { HelpPopupButton } from './HelpPopupButton';
import type { OutputLanguage, ThemeMode } from '../../types';

type PrivacyWorkspaceProps = {
  theme: ThemeMode;
  input: string;
  privacyRulesInput: string;
  output: string;
  outputLanguage: OutputLanguage;
  onInputChange: (value: string) => void;
  onPrivacyRulesInputChange: (value: string) => void;
  onInputValidate: (markers: any[]) => void;
  onPrivacyRulesValidate: (markers: any[]) => void;
  onInputEditorMount: (editor: any) => void;
  onPrivacyRulesEditorMount: (editor: any) => void;
  onOutputEditorMount: (editor: any) => void;
};

export function PrivacyWorkspace({
  theme,
  input,
  privacyRulesInput,
  output,
  outputLanguage,
  onInputChange,
  onPrivacyRulesInputChange,
  onInputValidate,
  onPrivacyRulesValidate,
  onInputEditorMount,
  onPrivacyRulesEditorMount,
  onOutputEditorMount,
}: PrivacyWorkspaceProps) {
  return (
    <div className="col-span-1 md:col-span-2 grid grid-cols-1 xl:grid-cols-3 min-h-0">
      <section className="flex min-h-[240px] xl:min-h-0 flex-col border-b border-[#262626] xl:border-b-0 xl:border-r">
        <div className="flex items-center justify-between px-4 py-2 bg-[#121214] text-[10px] font-mono text-[#606060] border-b border-[#262626]">
          <span>PRIVACY_INPUT</span>
          <span>JSON</span>
        </div>
        <div className="flex-1 bg-[#0F0F11]">
          <Editor
            height="100%"
            language="json"
            theme={theme}
            value={input}
            onChange={(value) => onInputChange(value || '')}
            onValidate={onInputValidate}
            onMount={onInputEditorMount}
            options={{
              minimap: { enabled: false },
              fontFamily: "'JetBrains Mono', 'Courier New', monospace",
              fontSize: 13,
              lineNumbers: 'on',
              folding: true,
              wordWrap: 'on',
              scrollBeyondLastLine: false,
              padding: { top: 16 },
            }}
          />
        </div>
      </section>

      <section className="flex min-h-[240px] xl:min-h-0 flex-col border-b border-[#262626] xl:border-b-0 xl:border-r">
        <div className="flex items-center justify-between px-4 py-2 bg-[#121214] text-[10px] font-mono text-[#606060] border-b border-[#262626]">
          <span>MASK_RULES</span>
          <span>JSON</span>
        </div>
        <div className="flex-1 bg-[#0F0F11]">
          <Editor
            height="100%"
            language="json"
            theme={theme}
            value={privacyRulesInput}
            onChange={(value) => onPrivacyRulesInputChange(value || '')}
            onValidate={onPrivacyRulesValidate}
            onMount={onPrivacyRulesEditorMount}
            options={{
              minimap: { enabled: false },
              fontFamily: "'JetBrains Mono', 'Courier New', monospace",
              fontSize: 13,
              lineNumbers: 'on',
              folding: true,
              wordWrap: 'on',
              scrollBeyondLastLine: false,
              padding: { top: 16 },
            }}
          />
        </div>
        <div className="border-t border-[#262626] bg-[#121214] px-3 py-2 text-[10px] font-mono text-[#8D95A3] space-y-1">
          <div className="flex items-center justify-between gap-3">
            <div className="uppercase tracking-wide text-[#A2AAB8]">Need help with rules?</div>
            <HelpPopupButton title="Supported rule types" buttonLabel="View Guide">
              <div className="space-y-1">
                <div>`key`: {`{ "keys": ["password", "token"] }`}</div>
                <div>`jsonPath`: {`{ "jsonPathPatterns": ["$.users[*].email", "$..secret"] }`}</div>
                <div className="pt-1 uppercase tracking-wide text-[#A2AAB8]">Supported properties</div>
                <div>`maskText`: {`{ "maskText": "***REDACTED***" }`}</div>
                <div>`keepStartVisible`: {`{ "keepStartVisible": 2 }`} (integer, &gt;= 0)</div>
                <div>`keepEndVisible`: {`{ "keepEndVisible": 4 }`} (integer, &gt;= 0)</div>
              </div>
            </HelpPopupButton>
          </div>
        </div>
      </section>

      <section className="flex min-h-[240px] xl:min-h-0 flex-col">
        <div className="flex items-center justify-between px-4 py-2 bg-[#121214] text-[10px] font-mono text-[#606060] border-b border-[#262626]">
          <span className="text-blue-400 border-b border-blue-500 pb-1">MASKED_OUTPUT</span>
          <span>{outputLanguage.toUpperCase()}</span>
        </div>
        <div className="flex-1 bg-[#0F0F11]">
          <Editor
            height="100%"
            language={outputLanguage === 'plaintext' ? 'plaintext' : outputLanguage}
            theme={theme}
            value={output}
            onMount={onOutputEditorMount}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontFamily: "'JetBrains Mono', 'Courier New', monospace",
              fontSize: 13,
              lineNumbers: 'on',
              folding: true,
              wordWrap: 'on',
              scrollBeyondLastLine: false,
              padding: { top: 12 },
            }}
          />
        </div>
      </section>
    </div>
  );
}
