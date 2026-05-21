import type { Mode } from '../../types';

type ModeGuide = {
  title: string;
  purpose: string;
  steps: string[];
};

const MODE_GUIDES: Record<Mode, ModeGuide> = {
  format: {
    title: 'Editor Guide',
    purpose: 'Format, minify, and validate JSON quickly while keeping a clean output pane.',
    steps: [
      'Paste JSON into the input editor.',
      'Click Format, Minify, or Validate based on your goal.',
      'Review output, then use Share, Copy, or Down to export.',
    ],
  },
  diff: {
    title: 'JSON Diff Guide',
    purpose: 'Compare original and modified JSON and inspect changed paths in detail.',
    steps: [
      'Put source JSON on the left and target JSON on the right.',
      'Click Format first if either side is hard to read.',
      'Check the diff summary and per-path details to understand changes.',
    ],
  },
  merge: {
    title: 'Merge Guide',
    purpose: 'Combine LEFT and RIGHT JSON into one merged result.',
    steps: [
      'Load or paste LEFT_JSON and RIGHT_JSON.',
      'Click Merge to generate the merged output.',
      'Review merge status, then Share, Copy, or Down the result.',
    ],
  },
  query: {
    title: 'Path Query Guide',
    purpose: 'Extract values from JSON using JSONPath expressions.',
    steps: [
      'Paste valid JSON in the input panel.',
      'Enter a JSONPath expression in the JSONPath field.',
      'Click Validate to run the query and inspect the output array.',
    ],
  },
  pipeline: {
    title: 'Pipeline Guide',
    purpose: 'Run multiple transformation steps in sequence on a single JSON payload.',
    steps: [
      'Paste source JSON into PIPELINE_INPUT.',
      'Provide PIPELINE_STEPS as a JSON array of step objects.',
      'Click Run Pipeline and inspect PIPELINE_RESULT.',
    ],
  },
  privacy: {
    title: 'Privacy Guide',
    purpose: 'Mask sensitive fields using key-based and JSONPath-based masking rules.',
    steps: [
      'Paste source JSON into PRIVACY_INPUT.',
      'Define masking rules in MASK_RULES (keys or jsonPathPatterns).',
      'Click Mask Data, then review output or enable masked-only preview.',
    ],
  },
  convert: {
    title: 'Convert Guide',
    purpose: 'Convert valid JSON into YAML, XML, Properties, TypeScript DTO, or Java DTO.',
    steps: [
      'Paste valid JSON input.',
      'Choose the target format in Target selector (including DTO targets).',
      'Click Convert and export the result with Copy or Down.',
    ],
  },
  schemaGenerate: {
    title: 'Schema Generate Guide',
    purpose: 'Generate a JSON Schema from sample JSON data.',
    steps: [
      'Paste representative sample JSON.',
      'Click Generate to create the schema.',
      'Review schema output and share/export for reuse.',
    ],
  },
  schemaMock: {
    title: 'Schema Mock Guide',
    purpose: 'Generate mock data rows from a JSON Schema definition.',
    steps: [
      'Paste a valid JSON Schema in the input panel.',
      'Set Rows to control how many mock records to generate.',
      'Click Generate Mock and export the produced data.',
    ],
  },
  schemaValidate: {
    title: 'Schema Validate Guide',
    purpose: 'Validate JSON data against JSON Schema and inspect validation issues.',
    steps: [
      'Provide JSON_DATA and JSON_SCHEMA in their editors.',
      'Select draft version and optional custom keywords if needed.',
      'Click Validate Schema and review ERROR_PANEL + output summary.',
    ],
  },
  convertCsv: {
    title: 'CSV Guide',
    purpose: 'Convert between JSON and CSV/TSV with configurable delimiter and quoting rules.',
    steps: [
      'Paste JSON or CSV input (direction is auto-detected).',
      'Adjust delimiter, header, quote, and escape options.',
      'Click Convert, then export as CSV/TSV/JSON.',
    ],
  },
  escape: {
    title: 'Escape Guide',
    purpose: 'Escape raw text into JSON-safe strings or unescape JSON string values.',
    steps: [
      'Paste plain text or a JSON-escaped string.',
      'Click Escape/Unescape.',
      'Copy the transformed text from output.',
    ],
  },
  patch: {
    title: 'Patch Guide',
    purpose: 'Generate and apply RFC 6902 JSON Patch operations.',
    steps: [
      'Use BASE_JSON and TARGET_JSON, then click Generate Patch.',
      'Review or edit PATCH_OPERATIONS as needed.',
      'Click Apply Patch to produce PATCH_RESULT and export it.',
    ],
  },
  tree: {
    title: 'Tree Guide',
    purpose: 'Explore JSON structure visually and inspect exact node paths.',
    steps: [
      'Paste JSON and click Validate to parse it.',
      'Browse nodes in the tree panel using expand/collapse controls.',
      'Inspect JSON Pointer/JSONPath and jump to nodes by path input.',
    ],
  },
};

export function getModeGuideTitle(mode: Mode): string {
  return MODE_GUIDES[mode].title;
}

type ModeGuideContentProps = {
  mode: Mode;
};

export function ModeGuideContent({ mode }: ModeGuideContentProps) {
  const guide = MODE_GUIDES[mode];

  return (
    <div className="space-y-4">
      <section className="space-y-1">
        <div className="uppercase tracking-wide text-[#A2AAB8]">Purpose</div>
        <p className="text-[#C7CED9]">{guide.purpose}</p>
      </section>
      <section className="space-y-1">
        <div className="uppercase tracking-wide text-[#A2AAB8]">How to use</div>
        <ol className="list-decimal space-y-1 pl-4">
          {guide.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>
    </div>
  );
}
