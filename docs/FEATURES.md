x# JSON Dev Tool - Current Features (Code-First)

Tài liệu này mô tả hành vi hiện tại của hệ thống theo code trong `src/features/json-tool/`.

## 1. Kiến trúc hiện tại

- App dùng `BrowserRouter` và route wildcard (`*`) để render `JsonToolPage`.
- Mode được map theo path trong `modeRoutes.ts`.
- Nếu truy cập path không hợp lệ, app redirect về `/editor`.
- Toàn bộ state và logic xử lý mode nằm trong `useJsonToolState(mode)`.
- `TopNavigation`: chuyển mode, bật/tắt sync input, đổi theme.
- `ActionBar`/`DiffActionBar`: nhóm thao tác theo mode.
- `EditorWorkspace`/`DiffWorkspace`/`SchemaValidateWorkspace`: vùng editor.

## 2. Mode và route

| Mode | Route | Chức năng chính |
| --- | --- | --- |
| `format` | `/editor` | Format, minify, validate JSON |
| `diff` | `/diff` | So sánh JSON gốc và JSON sửa |
| `query` | `/query` | JSONPath query |
| `convert` | `/yaml` | Chuyển JSON <-> YAML |
| `schemaGenerate` | `/schema-generate` | Sinh JSON Schema từ sample JSON |
| `schemaValidate` | `/schema-validate` | Validate JSON data theo schema |
| `convertCsv` | `/csv` | Chuyển JSON <-> CSV |
| `escape` | `/escape` | Escape/unescape chuỗi JSON |

## 3. Hành vi input/state chung

- Có chế độ `Sync Input` cho các mode không phải diff.
- Khi `Sync Input = true`, các mode dùng chung một input.
- Khi `Sync Input = false`, mỗi mode có input riêng theo `inputByMode`.
- `diff` luôn dùng cặp input độc lập: `diffOriginal` và `diffModified`.
- Theme có 2 giá trị: `vs-dark` và `light`.

## 4. Chi tiết từng mode

### 4.1 `/editor` (format)

- Parse JSON và hỗ trợ `Format`, `Minify`, `Validate`.
- `Format`: pretty JSON (`JSON.stringify(..., null, 2)`).
- `Minify`: JSON một dòng.
- `Validate`: chỉ validate + trả output pretty JSON.
- Parse lỗi sẽ hiển thị `Parse Error: ...`.

### 4.2 `/diff`

- Dùng Monaco `DiffEditor`.
- `originalEditable: true`, cả hai phía có thể chỉnh.
- Không có action format/minify/validate ở action bar.

### 4.3 `/query`

- Parse input JSON.
- Chạy JSONPath bằng `jsonpath-plus`.
- Output luôn là mảng kết quả query (JSON pretty).
- Lỗi JSONPath hiển thị `Invalid JSONPath: ...`.

### 4.4 `/yaml` (convert)

- Tự nhận diện nguồn.
- Parse được JSON trước thì coi là JSON -> YAML.
- Nếu JSON parse fail thì parse YAML -> JSON.
- Khi nguồn là JSON thì output là YAML (pretty hoặc flow-style khi minify).
- Khi nguồn là YAML thì output là JSON (pretty hoặc minified).
- `outputLanguage` tự đổi giữa `yaml` và `json`.

### 4.5 `/schema-generate`

- Parse sample JSON.
- Sinh schema theo kiểu dữ liệu thực tế của input.
- Mảng nhiều kiểu sẽ dùng `anyOf`.
- Object tự điền `required` theo tất cả key hiện có.
- Schema root có `$schema: draft-07`.

### 4.6 `/schema-validate`

- Input gồm 2 editor: `JSON_DATA` (data cần validate) và `JSON_SCHEMA` (schema).
- Validate bằng `ajv` (`allErrors: true`, `strict: false`).
- Output có cấu trúc `valid`, `errorCount`, `errors[]` (`{ path, message, keyword }`).

### 4.7 `/csv`

- Tự nhận diện input.
- Nếu text bắt đầu bằng `{` hoặc `[` thì coi là JSON và convert sang CSV.
- Ngược lại coi là CSV và convert sang JSON.
- JSON -> CSV hỗ trợ object array, array array, hoặc primitive list.
- JSON -> CSV escape dấu phẩy, xuống dòng, dấu `"` theo chuẩn CSV.
- CSV -> JSON dùng dòng đầu làm header.
- CSV -> JSON có parse kiểu cơ bản: number, boolean, null, JSON object/array trong cell.
- Nếu chỉ có header mà không có body thì output `[]`.

### 4.8 `/escape`

- Nếu input parse được JSON và là string -> unescape.
- Nếu input parse được JSON nhưng không phải string -> escape thành JSON string.
- Nếu input không parse được JSON -> escape raw text thành JSON string.

## 5. ActionBar, shortcut, output

- Nút `Format/Minify` bị ẩn ở mode: `query`, `schemaGenerate`, `schemaValidate`, `convertCsv`, `escape`, và `convert` khi nguồn là JSON.
- Nút hành động chính đổi label theo mode (`Validate`, `Generate`, `Convert`, `Escape/Unescape`, ...).
- `Copy` và `Down` thao tác trên output hiện tại.
- `result.yaml` cho YAML output.
- `result.csv` cho CSV output.
- `result.txt` cho escape plaintext output.
- Mặc định tải xuống `result.json`.
- Shortcut `Ctrl/Cmd + Enter`: validate/run.
- Shortcut `Ctrl/Cmd + Shift + F`: format.
- Shortcut `Ctrl/Cmd + Shift + M`: minify.

## 6. Giới hạn hiện tại (theo code)

- Chưa có test tự động (unit/integration/e2e).
- `copyToClipboard` chưa có xử lý fallback khi quyền clipboard bị chặn.
- CSV parser hiện dùng delimiter cố định là dấu phẩy.
- Chưa có import/export file trực tiếp từ disk (kéo-thả hoặc upload).
