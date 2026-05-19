# JSON Dev Tool

Ứng dụng Vite + React + TypeScript để xử lý dữ liệu ngay trên trình duyệt: JSON format/validate, diff chi tiết, JSONPath query, JSON -> YAML/XML/Properties, JSON <-> CSV, escape/unescape, và JSON Patch (RFC 6902).

## Chạy local

Yêu cầu: Node.js 20+.

```bash
npm ci
npm run dev
```

Dev server mặc định: `http://0.0.0.0:3000`.

## Build và kiểm tra

```bash
npm run lint
npm run build
npm run preview
```

## Danh sách mode hiện có

- `/editor`: JSON editor (format, minify, validate).
- `/diff`: so sánh hai JSON bằng Monaco DiffEditor, có `Format` cho cả 2 pane và panel diff chi tiết theo path.
- `/merge`: merge hai cấu trúc JSON (`LEFT_JSON` + `RIGHT_JSON`) thành `MERGED_RESULT`.
- `/query`: chạy JSONPath query trên input JSON.
- `/convert`: convert từ JSON sang `YAML`, `XML`, hoặc `Properties` (input bắt buộc là JSON hợp lệ).
- `/schema-generate`: tạo JSON Schema từ sample JSON.
- `/schema-validate`: validate JSON data theo JSON Schema (chọn draft + custom keywords).
- `/csv`: chuyển đổi JSON <-> CSV (delimiter/header/quote/escape options).
- `/escape`: escape/unescape JSON string.
- `/patch`: generate/apply JSON Patch operations.

Lưu ý route cũ `/yaml` vẫn được nhận để tương thích link cũ, sau đó tự canonical redirect về `/convert`.

## Khả năng hiện có nổi bật

- Type hints hiển thị trực tiếp bên trong editor (Monaco content widget) cho cả object/array/scalar, kèm path và thông tin số lượng (`items`, `keys`), có toggle `Type Hints`.
- Diff report có summary (`+/-/~`) và danh sách detail theo từng operation/path để phân tích nhanh case thiếu item hoặc đổi kiểu dữ liệu.
- Merge report có summary số thay đổi (`ops`, `+keys`, `overwrite`, `+array`, `type-conflict`) để theo dõi kết quả hợp nhất.
- Persist state vào `localStorage` (`json-dev-tool.state.v2`): reload vẫn giữ input/output/options/theme, `Type Hints`, và mode cuối.
- Hỗ trợ import input từ file qua nút `Open` theo từng mode.
- Hỗ trợ download output theo định dạng phù hợp (`.json`, `.yaml`, `.xml`, `.properties`, `.csv`, `.tsv`, `.txt`, `patch-result.json`).

## Cấu trúc chính

- `src/router/AppRouter.tsx`: route entrypoint.
- `src/features/json-tool/JsonToolPage.tsx`: page điều phối action bar + workspace theo mode.
- `src/features/json-tool/components/action-bars/`: nhóm action bar theo mode.
- `src/features/json-tool/components/workspaces/`: nhóm workspace editor theo mode.
- `src/features/json-tool/components/navigation/`: top navigation.
- `src/features/json-tool/modeRoutes.ts`: map mode <-> route.
- `src/features/json-tool/useJsonToolState.ts`: state trung tâm + xử lý mode + localStorage persistence.
- `src/features/json-tool/utils.ts`: helper cho schema/csv/escape/patch.

## Tài liệu chi tiết

- [Current Features](docs/FEATURES.md)
- [Feature Roadmap](docs/ROADMAP.md)
