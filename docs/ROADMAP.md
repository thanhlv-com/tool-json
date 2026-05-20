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

### 1) Bộ test tự động

- Mục tiêu: giảm regression khi mở rộng thêm mode/tùy chọn mới.
- Phạm vi kỹ thuật: unit test cho `utils.ts`, integration test cho `useJsonToolState`, smoke E2E cho route chính bằng Playwright.
- Tiêu chí hoàn thành: CI bắt buộc `test + lint + build` trước merge.

### 2) Tối ưu hiệu năng cho JSON lớn

- Mục tiêu: giữ trải nghiệm mượt khi xử lý payload lớn (vài MB đến hàng chục MB).
- Phạm vi kỹ thuật: chuyển parse/transform nặng sang Web Worker, debounce tác vụ tự chạy, và giới hạn render chi tiết khi dữ liệu quá lớn.
- Tiêu chí hoàn thành: thao tác cơ bản (mở mode, validate, convert, query) vẫn phản hồi tốt với file lớn và không treo UI.

### 3) JSON Tree Explorer + Path Inspector

- Mục tiêu: giúp người dùng debug cấu trúc JSON nhanh hơn editor text thuần.
- Phạm vi kỹ thuật: thêm panel tree có expand/collapse, search key/value, copy JSONPath của node, và sync chọn node với editor.
- Tiêu chí hoàn thành: người dùng có thể xác định path và vùng dữ liệu mục tiêu nhanh hơn trong các tài liệu JSON lớn/phức tạp.

### 4) Schema validation nâng cao (`$ref` / schema import)

- Mục tiêu: hỗ trợ bài toán validate thực tế với schema tách file hoặc schema tái sử dụng.
- Phạm vi kỹ thuật: cho phép import nhiều schema, resolve `$ref` nội bộ/ngoại vi, và hiển thị lỗi theo schema nguồn.
- Tiêu chí hoàn thành: validate thành công với bộ schema nhiều file và báo lỗi rõ ràng theo path + schema id.

### 5) JSON Transform pipeline (nhiều bước)

- Mục tiêu: gom nhiều thao tác liên tiếp thành một pipeline có thể tái sử dụng.
- Phạm vi kỹ thuật: định nghĩa chuỗi bước (format/query/convert/escape/patch...), preview kết quả từng bước, clone/chỉnh sửa pipeline.
- Tiêu chí hoàn thành: người dùng tạo được pipeline hoàn chỉnh và áp dụng lại cho input khác mà không thao tác thủ công từng mode.

### 6) Privacy mode và data masking

- Mục tiêu: an toàn hơn khi xử lý dữ liệu nhạy cảm trước khi share/copy/export.
- Phạm vi kỹ thuật: rule mask theo key/pattern (`token`, `email`, `phone`, `authorization`...), toggle hiển thị dữ liệu gốc/masked, cảnh báo trước khi share link.
- Tiêu chí hoàn thành: output/share/copy có thể loại bỏ hoặc che dữ liệu nhạy cảm theo cấu hình người dùng.

### 7) Workspace history và snapshot

- Mục tiêu: giúp quay lại trạng thái trước đó khi thao tác sai hoặc thử nhiều phương án.
- Phạm vi kỹ thuật: lưu snapshot theo mode, undo/redo ở cấp workflow, đặt tên snapshot và restore nhanh.
- Tiêu chí hoàn thành: khôi phục được trạng thái input/options/output trước đó mà không cần dán lại thủ công.

### 8) Plugin architecture cho custom transforms

- Mục tiêu: mở rộng công cụ mà không sửa lõi nhiều.
- Phạm vi kỹ thuật: định nghĩa interface `transformer` chuẩn và registry local cho custom action/mode.
- Tiêu chí hoàn thành: thêm transform mới với thay đổi giới hạn trong module plugin.

## 3. Backlog mở rộng

- Theme preset và font size preset cho editor.
- Multi-tab workspace cho nhiều phiên xử lý song song.
- Batch processing cho nhiều record/file.
- So sánh và merge 3-way (base/current/incoming).
- Cho phép import từ URL/API response mẫu để test nhanh luồng transform.
