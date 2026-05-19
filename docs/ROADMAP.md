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

## 2. Next Priorities (chưa triển khai)

### 1) Bộ test tự động

- Mục tiêu: giảm regression khi thêm mode mới.
- Phạm vi kỹ thuật: unit test cho `utils.ts`, integration test cho `useJsonToolState`, smoke E2E cho route chính bằng Playwright.
- Tiêu chí hoàn thành: CI chạy test + lint + build trước merge.

### 2) Shareable URLs

- Mục tiêu: chia sẻ nhanh ngữ cảnh làm việc.
- Phạm vi kỹ thuật: encode mode + input + options vào URL query/hash và thêm nút `Copy share link`.
- Tiêu chí hoàn thành: mở link trên máy khác khôi phục được đúng mode và dữ liệu.

### 3) Plugin architecture cho custom transforms

- Mục tiêu: mở rộng công cụ mà không sửa lõi nhiều.
- Phạm vi kỹ thuật: định nghĩa interface `transformer` chuẩn và registry local cho custom action/mode.
- Tiêu chí hoàn thành: thêm transform mới với thay đổi giới hạn trong module plugin.

## 3. Backlog mở rộng

- Multi-tab workspace cho nhiều phiên xử lý song song.
- Batch processing (nhiều record/file).
- Sensitive data masking trước khi copy/export.
- Theme preset và font size preset cho editor.
