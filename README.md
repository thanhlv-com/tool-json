# JSON Dev Tool

Ứng dụng Vite + React + TypeScript để xử lý JSON ngay trên trình duyệt: format/validate, diff, JSONPath query, JSON <-> YAML, JSON <-> CSV, escape/unescape chuỗi JSON.

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
- `/schema-validate`: validate JSON data theo JSON Schema.
- `/csv`: chuyển đổi JSON <-> CSV.
- `/escape`: escape/unescape JSON string.

## Cấu trúc chính

- `src/router/AppRouter.tsx`: route entrypoint.
- `src/features/json-tool/`: toàn bộ JSON tool UI/state/utils.
- `src/features/json-tool/useJsonToolState.ts`: state trung tâm + xử lý mode.
- `src/features/json-tool/utils.ts`: schema/csv/escape helper.

## Tài liệu chi tiết

- [Current Features](docs/FEATURES.md)
- [Feature Roadmap](docs/ROADMAP.md)
