# JSON Dev Tool - Feature Development Roadmap

Roadmap này đề xuất phát triển từ nền code hiện tại, ưu tiên theo tác động người dùng và độ phức tạp triển khai.

## Phase 1 - Nâng trải nghiệm sử dụng nhanh (ngắn hạn)

### 1) Session persistence cho mỗi mode

- Mục tiêu: giữ lại input/output/theme/mode khi refresh trang.
- Phạm vi kỹ thuật: lưu state tối thiểu vào `localStorage` theo key từng mode, restore state khi khởi tạo `useJsonToolState`.
- Tiêu chí hoàn thành: reload trang không mất dữ liệu đang làm.

### 2) Import/Export file trực tiếp

- Mục tiêu: giảm thao tác copy/paste thủ công.
- Phạm vi kỹ thuật: thêm nút upload file cho input editor, hỗ trợ tải output theo đúng định dạng (`.json`, `.yaml`, `.csv`, `.txt`).
- Tiêu chí hoàn thành: người dùng có thể mở file cục bộ và xuất kết quả chỉ bằng UI.

### 3) UX lỗi rõ ràng hơn

- Mục tiêu: dễ debug hơn khi parse/validate thất bại.
- Phạm vi kỹ thuật: hiển thị error panel dạng danh sách cho mode schema validate, highlight path lỗi (`instancePath`) trong output/error badge.
- Tiêu chí hoàn thành: người dùng đọc lỗi theo từng dòng/path thay vì chỉ 1 message ngắn.

## Phase 2 - Mở rộng năng lực xử lý dữ liệu (trung hạn)

### 1) JSON Patch mode

- Mục tiêu: hỗ trợ tạo/apply patch giữa 2 JSON.
- Phạm vi kỹ thuật: thêm mode mới `/patch`, tích hợp thư viện JSON Patch (RFC 6902), có 2 action `Generate Patch` và `Apply Patch`.
- Tiêu chí hoàn thành: có thể sinh patch từ original/modified và apply ngược vào data gốc.

### 2) CSV nâng cao (multi delimiter)

- Mục tiêu: xử lý tốt dữ liệu thực tế từ nhiều nguồn.
- Phạm vi kỹ thuật: tuỳ chọn delimiter (`,`, `;`, `\t`), tuỳ chọn có/không header row, tuỳ chọn quote/escape strategy.
- Tiêu chí hoàn thành: người dùng convert được cả CSV chuẩn châu Âu (`;`) và TSV.

### 3) Schema tools nâng cao

- Mục tiêu: tăng độ bao phủ kiểm tra schema.
- Phạm vi kỹ thuật: cho phép chọn draft version (draft-07/2019-09/2020-12), optional custom keywords cho AJV.
- Tiêu chí hoàn thành: validate đúng theo draft người dùng chọn.

## Phase 3 - Chất lượng kỹ thuật và cộng tác (dài hạn)

### 1) Bộ test tự động

- Mục tiêu: giảm regression khi thêm mode mới.
- Phạm vi kỹ thuật: unit test cho `utils.ts` (schema/csv/escape), integration test cho `useJsonToolState`, smoke E2E cho route chính bằng Playwright.
- Tiêu chí hoàn thành: CI chạy được test + lint + build trước merge.

### 2) Shareable URLs

- Mục tiêu: chia sẻ nhanh ngữ cảnh làm việc.
- Phạm vi kỹ thuật: encode mode + input + options vào URL query/hash và thêm nút `Copy share link`.
- Tiêu chí hoàn thành: mở link trên máy khác khôi phục được đúng mode và dữ liệu.

### 3) Plugin architecture cho custom transforms

- Mục tiêu: cho phép mở rộng công cụ mà không sửa lõi nhiều.
- Phạm vi kỹ thuật: định nghĩa interface `transformer` chuẩn và registry local cho custom action/mode.
- Tiêu chí hoàn thành: có thể thêm một transform mới với thay đổi giới hạn trong module plugin.

## Backlog mở rộng

- Multi-tab workspace cho nhiều phiên xử lý song song.
- Batch processing (nhiều record/file).
- Sensitive data masking trước khi copy/export.
- Theme preset và font size preset cho editor.
