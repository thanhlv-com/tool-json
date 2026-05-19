# JSON Dev Tool

Ứng dụng Vite + React + TypeScript để xử lý JSON ngay trên trình duyệt: format/validate, diff, JSONPath query, JSON <-> YAML, JSON <-> CSV, escape/unescape, và JSON Patch (RFC 6902).

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
- `/diff`: so sánh hai JSON bằng Monaco DiffEditor.
- `/query`: chạy JSONPath query trên input JSON.
- `/yaml`: chuyển đổi JSON <-> YAML.
- `/schema-generate`: tạo JSON Schema từ sample JSON.
- `/schema-validate`: validate JSON data theo JSON Schema (chọn draft + custom keywords).
- `/csv`: chuyển đổi JSON <-> CSV (delimiter/header/quote/escape options).
- `/escape`: escape/unescape JSON string.
- `/patch`: generate/apply JSON Patch operations.

## Khả năng hiện có nổi bật

- Persist state vào `localStorage` (`json-dev-tool.state.v2`): reload vẫn giữ input/output/options/theme và mode cuối.
- Hỗ trợ import input từ file qua nút `Open` theo từng mode.
- Hỗ trợ download output theo định dạng phù hợp (`.json`, `.yaml`, `.csv`, `.tsv`, `.txt`, `patch-result.json`).

## Cấu trúc chính

- `src/router/AppRouter.tsx`: route entrypoint.
- `src/features/json-tool/JsonToolPage.tsx`: page điều phối action bar + workspace theo mode.
- `src/features/json-tool/modeRoutes.ts`: map mode <-> route.
- `src/features/json-tool/useJsonToolState.ts`: state trung tâm + xử lý mode + localStorage persistence.
- `src/features/json-tool/utils.ts`: helper cho schema/csv/escape/patch.

## Tài liệu chi tiết

- [Current Features](docs/FEATURES.md)
- [Feature Roadmap](docs/ROADMAP.md)
