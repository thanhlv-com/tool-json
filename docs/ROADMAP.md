# JSON Dev Tool - Feature Development Roadmap

Roadmap được cập nhật theo trạng thái code hiện tại (code-first).

## 1. Completed (đã triển khai)

### 1) Session persistence cho mỗi mode

- Trạng thái: Done.
- Đã triển khai: persist state vào `localStorage` (`json-dev-tool.state.v2`) gồm input/output/options/theme và `lastMode`.
- Hành vi hiện tại: reload trang vẫn giữ ngữ cảnh làm việc và route fallback theo mode cuối.

### 2) Import/Export file trực tiếp

- Trạng thái: Done.
- Đã triển khai: import input qua nút `Open` (mode thường) và `Open Base/Target/Patch` (patch mode).
- Hành vi hiện tại: download output theo định dạng phù hợp (`.json`, `.yaml`, `.xml`, `.properties`, `.csv`, `.tsv`, `.txt`, `patch-result.json`).

### 3) UX lỗi rõ ràng hơn

- Trạng thái: Done.
- Đã triển khai: `schema-validate` có `ERROR_PANEL` hiển thị danh sách issue theo `path/message/keyword`, kèm summary trong output JSON.

### 4) JSON Patch mode

- Trạng thái: Done.
- Đã triển khai: route `/patch`, workspace 4 ô (base/target/operations/result), action `Generate Patch` và `Apply Patch`.
- Stack: `fast-json-patch`.

### 5) CSV nâng cao (multi delimiter)

- Trạng thái: Done.
- Đã triển khai: delimiter (`,`, `;`, `\t`), header on/off, quote strategy (`auto|always`), escape strategy (`double|backslash`).

### 6) Schema tools nâng cao

- Trạng thái: Done.
- Đã triển khai: chọn draft (`draft-07`, `2019-09`, `2020-12`) + nhập custom keywords cho AJV.

### 7) Convert mode mở rộng và chuẩn hóa route

- Trạng thái: Done.
- Đã triển khai: mode `convert` canonical ở `/convert`, giữ backward compatibility cho `/yaml` bằng redirect.
- Hành vi hiện tại: convert chỉ nhận JSON hợp lệ và target gồm `YAML`, `XML`, `Properties` (không còn target JSON).

### 8) Diff phân tích chi tiết

- Trạng thái: Done.
- Đã triển khai: thêm `Diff Details` panel với message theo path, summary `+/-/~`, và nút `Format` riêng cho diff.
- Hành vi hiện tại: hỗ trợ phân tích rõ case thiếu item trong array, đổi type, và thay đổi giá trị.

### 9) Inline type hints trong Monaco editor

- Trạng thái: Done.
- Đã triển khai: hiển thị hints ngay trong editor bằng content widgets, gồm path + kiểu dữ liệu + metadata (`items`, `keys`).
- Hành vi hiện tại: người dùng có thể bật/tắt qua cấu hình `Type Hints` và giá trị được persist trong `localStorage`.

### 10) JSON Merge mode

- Trạng thái: Done.
- Đã triển khai: mode `/merge` với 2 input JSON (`LEFT_JSON`, `RIGHT_JSON`) và output `MERGED_RESULT`.
- Hành vi hiện tại: merge sâu object theo key, merge array theo index, ưu tiên giá trị bên phải khi conflict; trả summary thống kê merge ngay trên status bar.

### 11) Shareable URLs

- Trạng thái: Done.
- Đã triển khai: nút `Share` có trên tất cả action bar, payload được encode trong query `?share=...`.
- Hành vi hiện tại: link share chứa mode + state theo mode; khi mở link app tự điều hướng về route canonical của mode trong payload rồi restore dữ liệu.

## 2. Next Priorities (chưa triển khai)

### 1. Backlog mở rộng

- Theme preset và font size preset cho editor.
