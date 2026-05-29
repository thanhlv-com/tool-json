# JSON Dev Tool - Current Features (Code-First)

Tài liệu này mô tả hành vi thực tế theo code hiện tại trong `src/features/json-tool/`.

## 1. Kiến trúc runtime

- `App.tsx` dùng `BrowserRouter` và `AppRouter`.
- `AppRouter` dùng route wildcard (`*`) và render `JsonToolPage` cho mọi path.
- Mapping mode <-> route nằm tại `src/features/json-tool/modeRoutes.ts`.
- Path legacy `/yaml` vẫn được nhận và canonical redirect sang `/convert`.
- `JsonToolPage` tự xử lý canonical route, fallback route invalid, và share-route ưu tiên mode trong payload.
- State/logic tập trung ở `useJsonToolState(mode)`.

## 2. Mode và route

| Mode | Route canonical | Mô tả |
| --- | --- | --- |
| `format` | `/editor` | Format/minify/validate JSON |
| `diff` | `/diff` | So sánh original/modified JSON + diff details |
| `merge` | `/merge` | Merge hai JSON cấu trúc |
| `query` | `/query` | JSONPath query |
| `pipeline` | `/pipeline` | Chạy chuỗi transform steps |
| `privacy` | `/privacy` | Mask dữ liệu nhạy cảm |
| `tree` | `/tree` | Tree explorer + path inspector |
| `convert` | `/convert` | JSON -> YAML/XML/Properties/TypeScript DTO/Java DTO |
| `schemaGenerate` | `/schema-generate` | Sinh JSON Schema từ sample JSON |
| `schemaMock` | `/schema-mock` | Sinh mock data từ JSON Schema |
| `schemaValidate` | `/schema-validate` | Validate JSON theo JSON Schema |
| `convertCsv` | `/csv` | Chuyển đổi JSON <-> CSV/TSV |
| `escape` | `/escape` | Escape/unescape text JSON string |
| `patch` | `/patch` | Generate/apply JSON Patch (RFC 6902) |

## 3. State, persistence, share

- Local state được persist vào `localStorage` key `json-dev-tool.state.v2`.
- Persist chứa mode cuối (`lastMode`), input/output/options/theme, và workspace history.
- Route invalid sẽ fallback về mode cuối đã persist (hoặc `/editor` nếu chưa có dữ liệu).
- `Sync Input` đồng bộ input giữa các mode editor thông thường; `schemaMock` luôn giữ input riêng.
- Share dùng query `?share=...` (base64url payload), tự điều hướng về mode trong payload trước khi áp dữ liệu.

## 4. Workspace History

- Có toggle `Workspace History` ở top navigation.
- Mỗi mode có timeline snapshot riêng.
- Hỗ trợ `Undo`, `Redo`, `Save Snapshot`, và restore snapshot theo dropdown.
- Có auto snapshot theo debounce để giảm mất trạng thái khi thao tác liên tục.

## 5. Keyboard shortcuts

- `Ctrl/Cmd + Enter`: chạy action chính của mode.
- `Ctrl/Cmd + Shift + F`: format (mode phù hợp).
- `Ctrl/Cmd + Shift + M`: minify (mode phù hợp).

## 6. Hành vi từng nhóm mode

### 6.1 Editor / Query / Convert / Schema / CSV / Escape

- Nhóm này dùng `EditorWorkspace` (2 pane input/output read-only).
- Có `Type Hints` hiển thị inline trong Monaco (path + type + metadata keys/items) cho nội dung structured.
- Có `Open`, `Share`, `Copy`, `Down` trên action bar.

### 6.2 Diff

- Desktop dùng Monaco `DiffEditor` side-by-side.
- Mobile chuyển thành 2 editor stack (`ORIGINAL_JSON`, `MODIFIED_JSON`) để dễ thao tác màn hình hẹp.
- Có diff summary (`+/-/~`) và danh sách diff details theo path.

### 6.3 Merge

- Input: `LEFT_JSON` + `RIGHT_JSON`.
- Output: `MERGED_RESULT`.
- Merge thống kê: `ops`, `+keys`, `overwrite`, `+array`, `type-conflict`.

### 6.4 Patch

- Input: `BASE_JSON`, `TARGET_JSON`, `PATCH_OPERATIONS`.
- Action:
  - `Generate Patch`: sinh operations từ base/target.
  - `Apply Patch`: áp operations lên base.
- Output: `PATCH_RESULT`.

### 6.5 Tree

- Parse JSON input và hiển thị tree object/array.
- Cho phép jump node bằng JSON Pointer (`/a/0/b`) hoặc JSONPath (`$.a[0].b`).
- Inspector hiển thị pointer, jsonpath, type, size, value preview.

### 6.6 Pipeline

- Input gồm `PIPELINE_INPUT` và `PIPELINE_STEPS` (JSON array).
- Step types hỗ trợ:
  - `query` (`path` JSONPath)
  - `set` (`path` JSON Pointer, `value`)
  - `remove` (`path` JSON Pointer)
  - `pick` (`paths` JSON Pointer array)
  - `mask` (`rules` tương thích privacy config)
  - `convert` (`target`: `json|yaml|xml|properties`)
- Output có thể là JSON/YAML/XML/Properties tùy step convert cuối cùng.

### 6.7 Privacy

- Input gồm `PRIVACY_INPUT` và `MASK_RULES`.
- Rule config hỗ trợ:
  - `keys`: danh sách tên field nhạy cảm (match theo lowercase key)
  - `jsonPathPatterns`: danh sách JSONPath cần mask
  - `maskText`: text thay thế
  - `keepStartVisible`, `keepEndVisible`: giữ ký tự đầu/cuối
- Có toggle `Masked-only preview`:
  - Bật: output chỉ masked payload.
  - Tắt: output gồm `masked`, `original`, và summary.

### 6.8 Convert

- Chỉ chấp nhận input JSON hợp lệ.
- Target: YAML, XML, Properties, TypeScript DTO, Java DTO.
- Download name đổi theo target (`result.yaml`, `result.xml`, `result.properties`, `RootDto.ts`, `RootDto.java`).

### 6.9 Schema Generate / Mock / Validate

- `/schema-generate`: sinh schema từ sample JSON.
- `/schema-mock`: sinh mock data theo schema, có `Rows` (1..200), hỗ trợ `$ref` local, `oneOf/anyOf/allOf`, enum/const/default/format.
- `/schema-validate`:
  - Input gồm `JSON_DATA`, `JSON_SCHEMA`, `SCHEMA_IMPORTS`.
  - Draft hỗ trợ: `draft-07`, `2019-09`, `2020-12`.
  - Hỗ trợ custom keywords và imported schemas (array hoặc map).
  - Có `ERROR_PANEL` hiển thị issue list.

### 6.10 CSV

- Detect hướng convert theo input:
  - Bắt đầu bằng `{` hoặc `[` -> JSON -> CSV/TSV.
  - Ngược lại -> CSV/TSV -> JSON.
- Options: delimiter (`,`, `;`, tab), header, quote strategy, escape strategy.
- Chỉ bật JSON validation/coloring khi input nhìn như JSON; input CSV thuần giữ plaintext.

## 7. Import/Export

- Import:
  - Mode thường: `Open` input.
  - Patch: `Open Base`, `Open Target`, `Open Patch`.
  - Merge: `Open Left`, `Open Right`.
- Download tên file theo mode/output language (`.json`, `.yaml`, `.xml`, `.properties`, `.csv`, `.tsv`, `.txt`, `patch-result.json`).

## 8. Responsive, PWA, SSG

- Mobile dùng dropdown mode selector, desktop dùng tab ngang.
- Layout workspace tự đổi số cột theo breakpoint.
- PWA qua `vite-plugin-pwa`, có service worker + manifest, cache runtime cho page/static/font/image.
- SSG prerender qua `npm run ssg`: build sinh `dist/<route>/index.html` cho từng mode route (bao gồm cả legacy `/yaml`) với metadata SEO tĩnh theo route.

## 9. Validation checklist cho thay đổi feature

1. `npm run lint`
2. `npm run build`
3. Verify thủ công các route bị ảnh hưởng.
4. Sync lại `README.md`, `docs/FEATURES.md`, `docs/ROADMAP.md`, `AGENTS.md` khi route/behavior đổi.
