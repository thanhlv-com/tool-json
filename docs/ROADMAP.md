# JSON Dev Tool - Feature Roadmap (Code-First)

Roadmap này được viết từ trạng thái code hiện tại. Mục tiêu là giữ backlog thực dụng và tránh drift docs.

## 1. Đã triển khai

- Routed mode system với canonical route và legacy redirect `/yaml` -> `/convert`.
- Bộ mode đầy đủ: editor, diff, merge, query, pipeline, privacy, tree, convert, schema-generate, schema-mock, schema-validate, csv, escape, patch.
- Local persistence `json-dev-tool.state.v2` (mode cuối, options, state theo mode).
- Share URL theo mode (`?share=...`) + restore dữ liệu theo payload.
- Workspace History (undo/redo/save snapshot/restore snapshot).
- JSON Diff report chi tiết theo path và fallback UI cho mobile.
- JSON Merge với summary thống kê merge.
- JSON Patch generate/apply (RFC 6902).
- Schema tooling: generate, mock data, validate theo nhiều draft + custom keywords + imported schemas.
- CSV converter 2 chiều với options delimiter/header/quote/escape.
- Pipeline transform steps và Privacy masking rules.
- PWA offline-first (manifest + service worker + runtime caching).

## 2. Ưu tiên kế tiếp

### P0 - UX và độ tin cậy

1. Theme presets + editor font-size presets
- Giá trị: tăng tốc thao tác hằng ngày.
- Scope: `TopNavigation`, editor options, persistence.

2. Import từ URL
- Giá trị: giảm copy/paste thủ công.
- Scope: action bar import flow + timeout/error UX.
- Rủi ro: CORS/network failure.

3. Validation feedback nhất quán
- Giá trị: dễ hiểu lỗi hơn ở mode đa editor.
- Scope: chuẩn hóa message format giữa schema/pipeline/privacy/csv.

### P1 - Năng suất xử lý dữ liệu

1. Multi-tab workspace theo mode
- Giá trị: làm nhiều tác vụ song song trong cùng mode.
- Scope: state model tabs + persistence + tab UI.

2. Batch processing (JSON array / nhiều file)
- Giá trị: xử lý hàng loạt thay vì từng payload.
- Scope: input batching, progress, cancel/retry, export report.

3. Saved snippets/presets
- Giá trị: tái sử dụng config/query/rules nhanh.
- Scope: local snippets library, preset chooser.

### P2 - Nâng cấp nâng cao

1. 3-way compare/merge (`base/current/incoming`)
- Giá trị: phù hợp workflow merge phức tạp.
- Scope: conflict detection + resolution UI.

2. Workerization cho payload lớn
- Giá trị: giảm block UI khi diff/merge/batch nặng.
- Scope: tách compute nặng sang Web Worker.

## 3. Kế hoạch rollout đề xuất

### Phase A

- Theme/font presets
- Import từ URL
- Chuẩn hóa validation message

### Phase B

- Multi-tab workspace
- Snippets/presets

### Phase C

- Batch processing
- Workerization cho tác vụ nặng

### Phase D

- 3-way compare/merge

## 4. Definition of Done cho mỗi phase

1. `npm run lint` pass.
2. `npm run build` pass.
3. Verify thủ công route bị tác động.
4. Cập nhật đồng bộ `README.md`, `docs/FEATURES.md`, `docs/ROADMAP.md`, `AGENTS.md`.
