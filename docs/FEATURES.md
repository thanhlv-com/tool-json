# JSON Dev Tool - Current Features (Code-First)

Tài liệu này mô tả hành vi hiện tại theo code trong `src/features/json-tool/`.

## 1. Kiến trúc hiện tại

- App dùng `BrowserRouter` + route wildcard (`*`) để render `JsonToolPage`.
- Map mode theo path nằm trong `modeRoutes.ts`.
- Path cũ `/yaml` vẫn được map sang mode `convert`, sau đó được canonical redirect sang `/convert`.
- Nếu URL có `?share=...` hợp lệ, app ưu tiên mode trong payload share và tự điều hướng về canonical route của mode đó trước khi apply dữ liệu.
- Nếu truy cập path không hợp lệ, app redirect về mode cuối trong `localStorage` (fallback `/editor`).
- App được đóng gói dạng offline-first PWA qua `vite-plugin-pwa` (service worker + web manifest).
- State và xử lý nghiệp vụ tập trung ở `useJsonToolState(mode)`.
- Component UI được nhóm theo thư mục:
- `components/navigation`: `TopNavigation`.
- `components/action-bars`: `ActionBar`/`DiffActionBar`/`MergeActionBar`/`PatchActionBar`.
- `components/workspaces`: `EditorWorkspace`/`DiffWorkspace`/`MergeWorkspace`/`SchemaValidateWorkspace`/`PatchWorkspace`/`TreeExplorerWorkspace`.

## 2. Mode và route

| Mode | Route canonical | Chức năng chính |
| --- | --- | --- |
| `format` | `/editor` | Format, minify, validate JSON |
| `diff` | `/diff` | So sánh JSON gốc và JSON sửa + panel diff details |
| `merge` | `/merge` | Merge hai JSON structure thành một JSON duy nhất |
| `query` | `/query` | JSONPath query |
| `tree` | `/tree` | Tree explorer + path inspector cho JSON |
| `convert` | `/convert` | Convert JSON -> YAML/XML/Properties |
| `schemaGenerate` | `/schema-generate` | Sinh JSON Schema từ sample JSON |
| `schemaMock` | `/schema-mock` | Sinh mock data từ JSON Schema |
| `schemaValidate` | `/schema-validate` | Validate JSON data theo schema |
| `convertCsv` | `/csv` | Chuyển JSON <-> CSV |
| `escape` | `/escape` | Escape/unescape chuỗi JSON |
| `patch` | `/patch` | Generate và apply JSON Patch |

Legacy path:
- `/yaml` -> mode `convert` -> redirect sang `/convert`.

## 3. State, persistence, và input

- Có `Sync Input` cho nhóm mode thường (`format/query/tree/convert/schemaGenerate/schemaValidate/convertCsv/escape`).
- Riêng `schemaMock` giữ input schema độc lập để luôn có ví dụ `JSON_SCHEMA` hợp lệ.
- Khi `Sync Input = true`, các mode trên dùng chung `sharedInput`.
- Khi `Sync Input = false`, mỗi mode dùng input riêng (`inputByMode`).
- `diff` dùng cặp input độc lập: `diffOriginal` và `diffModified`.
- `patch` dùng 3 input độc lập: `patchBaseInput`, `patchTargetInput`, `patchOperationsInput`.
- Theme có 2 giá trị: `vs-dark` và `light`.
- Toàn bộ state chính được persist vào `localStorage` key `json-dev-tool.state.v2`, gồm cả `showArrayHints` và `lastMode`.

## 4. Chi tiết từng mode

### 4.1 `/editor` (format)

- Parse JSON và hỗ trợ `Format`, `Minify`, `Validate`.
- `Format`: pretty JSON (`JSON.stringify(..., null, 2)`).
- `Minify`: JSON một dòng.
- `Validate`: validate + trả output pretty JSON.
- Parse lỗi hiển thị `Parse Error: ...`.

### 4.2 `/diff`

- Dùng Monaco `DiffEditor`.
- `originalEditable: true`, cả hai phía có thể chỉnh.
- Có nút `Format` riêng cho diff để format lại original/modified JSON.
- Có status summary (`Ops`, `+added`, `-removed`, `~changed`).
- Có panel `Diff Details` hiển thị chi tiết từng operation theo path (ví dụ missing array item, type changed, value changed), kèm preview before/after.
- Khi input không hợp lệ, hiển thị parse lỗi theo từng phía (`Original JSON invalid...`, `Modified JSON invalid...`).

### 4.3 `/query`

- Parse input JSON.
- Chạy JSONPath bằng `jsonpath-plus`.
- Output luôn là mảng kết quả query (JSON pretty).
- Lỗi JSONPath hiển thị `Invalid JSONPath: ...`.

### 4.4 `/merge`

- Input gồm 2 editor độc lập: `LEFT_JSON` và `RIGHT_JSON`.
- Kết quả được hiển thị ở `MERGED_RESULT` (read-only).
- Quy tắc merge:
- Object: merge sâu theo key.
- Array: merge theo index, giữ phần tử còn lại và append item mới từ mảng bên phải.
- Scalar hoặc khác kiểu: ưu tiên giá trị bên phải.
- Có nút `Merge` để chạy hợp nhất và nút `Format` để format nhanh cả 2 input.
- Status bar hiển thị summary: `ops`, `+keys`, `overwrite`, `+array`, `type-conflict`.

### 4.5 `/convert`

- Input bắt buộc là JSON hợp lệ.
- Nếu JSON không hợp lệ, báo lỗi rõ ràng: `Convert mode only accepts valid JSON input: ...`.
- Target hiện có:
- `YAML`
- `XML`
- `Properties`
- Không còn target `JSON`.
- `Minify` có tác dụng khi target là YAML/XML (compact output).
- `Open` chỉ chấp nhận file `.json` ở mode này.

### 4.6 `/schema-generate`

- Parse sample JSON.
- Sinh schema theo kiểu dữ liệu thực tế của input.
- Mảng nhiều kiểu dùng `anyOf`.
- Object tự điền `required` theo toàn bộ key hiện có.
- Schema root có `$schema: draft-07`.

### 4.7 `/schema-mock`

- Input là JSON Schema.
- Action chính: `Generate Mock`.
- Có tham số `Rows` (1-200) để sinh 1 object hoặc danh sách object.
- Generator hiện hỗ trợ các keyword phổ biến: `type`, `enum`, `const`, `default`, `example/examples`, `oneOf`, `anyOf`, `allOf`, `$ref` local, `required`, `min/max` cho number/string/array/object.
- Với schema có `format` string, sinh dữ liệu theo format phổ biến (`email`, `uri/url`, `date-time`, `date`, `uuid`, `ipv4`).

### 4.8 `/schema-validate`

- Input gồm 2 editor: `JSON_DATA` và `JSON_SCHEMA`.
- Validate bằng AJV (`allErrors: true`, `strict: false`).
- Cho phép chọn draft: `draft-07`, `2019-09`, `2020-12`.
- Cho phép nhập custom keywords (danh sách phân tách dấu phẩy).
- Output gồm `valid`, `draft`, `customKeywords`, `errorCount`, `errors[]` (`{ path, message, keyword }`).
- Có `ERROR_PANEL` hiển thị danh sách lỗi chi tiết theo path.

### 4.9 `/csv`

- Tự nhận diện input:
- Nếu text bắt đầu bằng `{` hoặc `[` thì convert JSON -> CSV.
- Ngược lại convert CSV -> JSON.
- JSON -> CSV hỗ trợ object array, array array, hoặc primitive list.
- CSV options hỗ trợ:
- Delimiter: `,`, `;`, `\t`.
- Header row: bật/tắt.
- Quote strategy: `auto` hoặc `always`.
- Escape strategy: `double` (`""`) hoặc `backslash` (`\"`).
- CSV -> JSON có parse kiểu cơ bản: number, boolean, null, JSON object/array trong cell.
- Nếu có header nhưng không có body thì output `[]`.

### 4.10 `/escape`

- Nếu input parse được JSON và là string -> unescape.
- Nếu input parse được JSON nhưng không phải string -> escape thành JSON string.
- Nếu input không parse được JSON -> escape raw text thành JSON string.

### 4.11 `/patch`

- Dùng `fast-json-patch` để xử lý RFC 6902.
- `Generate Patch`: so sánh `BASE_JSON` và `TARGET_JSON`, sinh operations.
- `Apply Patch`: áp operations vào `BASE_JSON`, trả `PATCH_RESULT`.
- `PATCH_OPERATIONS` có thể chỉnh tay trước khi apply.

### 4.12 `/tree`

- Input là JSON text editor (Monaco).
- Panel phải gồm:
- Tree explorer theo cấu trúc object/array, hỗ trợ expand/collapse từng node hoặc toàn bộ.
- Path inspector cho node đang chọn (`JSONPath`, `JSON Pointer`, `type`, `depth`, `size`, `node value`).
- Có thể jump đến node bằng JSON Pointer (`/a/0/b`) hoặc JSONPath (`$.a[0].b`).

## 5. Inline Type Hints trong editor

- Hints hiển thị trực tiếp bên trong Monaco editor bằng `contentWidget` (không nằm ở toolbar/bar).
- Hiển thị cho cả input và output editor (trừ các workspace chuyên biệt: diff/patch/schema-validate/tree).
- Hints bao gồm:
- JSON path (ví dụ `$.items[0].name`)
- type (`object`, `array<...>`, `string`, `integer`, `number`, `boolean`, `null`)
- detail thêm (`items: n` cho array, `keys: n` cho object)
- Có thể bật/tắt qua checkbox `Type Hints` ở top navigation.

## 6. ActionBar, import/export, shortcut

- Nút chính theo mode: `Validate`, `Generate`, `Generate Mock`, `Validate Schema`, `Convert`, `Escape/Unescape`, `Generate Patch`, `Apply Patch`.
- Với mode `/tree`, action chính vẫn là `Validate` để parse JSON nhanh, còn inspect path thao tác trong panel workspace.
- Nút `Open` import file input có ở action bar mode thường; patch có `Open Base`, `Open Target`, `Open Patch`.
- Nút `Share` có trên tất cả action bar; app tạo URL có query `?share=...` chứa state mode hiện tại, ưu tiên `navigator.share` và fallback copy link vào clipboard.
- Khi mở share link, app tự đưa về mode nằm trong payload share (kể cả khi mở từ route khác) rồi mới load state tương ứng.
- `Copy` và `Down` thao tác trên output hiện tại.
- Tên file download theo mode/output:
- `result.yaml` cho YAML output.
- `result.xml` cho XML output.
- `result.properties` cho Properties output.
- `mock-data.json` cho schema mock mode.
- `result.csv` hoặc `result.tsv` cho CSV output.
- `result.txt` cho plaintext output ở escape mode.
- `patch-result.json` cho patch mode.
- Mặc định còn lại là `result.json`.
- Shortcut:
- `Ctrl/Cmd + Enter`: chạy validate (với patch mode là generate patch).
- `Ctrl/Cmd + Shift + F`: format.
- `Ctrl/Cmd + Shift + M`: minify.

## 7. Giới hạn hiện tại

- Chưa có test tự động (unit/integration/e2e).
- Chưa có drag-and-drop file hoặc import nhiều file cùng lúc.
- `copyToClipboard` phụ thuộc quyền clipboard của browser.

## 8. Responsive behavior

- Mobile/small screens:
- Top navigation dùng `select` mode picker (`sm:hidden`) để tránh vỡ layout.
- Main workspace tự giảm về 1 cột (stack theo chiều dọc) cho các mode editor/diff/merge/patch/schema-validate/tree.
- Action bar tự wrap controls, không phụ thuộc nhiều vào hidden breakpoint như trước.
- Large screens:
- Top navigation chuyển sang tab ngang và cho phép cuộn ngang khi thiếu chỗ (`hidden sm:flex` + `overflow-x-auto`).
- Nội dung được giới hạn `max-width` để tránh vùng làm việc quá dàn trải trên màn hình rất rộng.

## 9. Offline-first PWA

- Build production sinh web manifest và service worker.
- App precache các asset tĩnh quan trọng (HTML/CSS/JS/font/image/icon) để có thể mở lại khi offline.
- Navigation request dùng `NetworkFirst` kèm fallback về cache, giúp ưu tiên nội dung mới khi có mạng nhưng vẫn usable khi mất mạng.
- Static resources (`style/script/worker`) dùng `StaleWhileRevalidate` để cân bằng tốc độ và cập nhật.
- Font dùng `CacheFirst`, image dùng `StaleWhileRevalidate`.
