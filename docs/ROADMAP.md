# JSON Dev Tool - Feature Development Roadmap

Roadmap được cập nhật theo trạng thái code hiện tại (code-first).

## 1. Completed (đã triển khai)

### 1) Session persistence cho mỗi mode

- Trạng thái: Done.
- Đã triển khai: persist state vào `localStorage` (`json-dev-tool.state.v2`) gồm input/output/options/theme và
  `lastMode`.
- Hành vi hiện tại: reload trang vẫn giữ ngữ cảnh làm việc và route fallback theo mode cuối.

### 2) Import/Export file trực tiếp

- Trạng thái: Done.
- Đã triển khai: import input qua nút `Open` (mode thường) và `Open Base/Target/Patch` (patch mode).
- Hành vi hiện tại: download output theo định dạng phù hợp (`.json`, `.yaml`, `.xml`, `.properties`, `.csv`, `.tsv`,
  `.txt`, `patch-result.json`).

### 3) UX lỗi rõ ràng hơn

- Trạng thái: Done.
- Đã triển khai: `schema-validate` có `ERROR_PANEL` hiển thị danh sách issue theo `path/message/keyword`, kèm summary
  trong output JSON.

### 4) JSON Patch mode

- Trạng thái: Done.
- Đã triển khai: route `/patch`, workspace 4 ô (base/target/operations/result), action `Generate Patch` và
  `Apply Patch`.
- Stack: `fast-json-patch`.

### 5) CSV nâng cao (multi delimiter)

- Trạng thái: Done.
- Đã triển khai: delimiter (`,`, `;`, `\t`), header on/off, quote strategy (`auto|always`), escape strategy (
  `double|backslash`).

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
- Đã triển khai: hiển thị hints ngay trong editor bằng content widgets, gồm path + kiểu dữ liệu + metadata (`items`,
  `keys`).
- Hành vi hiện tại: người dùng có thể bật/tắt qua cấu hình `Type Hints` và giá trị được persist trong `localStorage`.

### 10) JSON Merge mode

- Trạng thái: Done.
- Đã triển khai: mode `/merge` với 2 input JSON (`LEFT_JSON`, `RIGHT_JSON`) và output `MERGED_RESULT`.
- Hành vi hiện tại: merge sâu object theo key, merge array theo index, ưu tiên giá trị bên phải khi conflict; trả
  summary thống kê merge ngay trên status bar.

### 11) Shareable URLs

- Trạng thái: Done.
- Đã triển khai: nút `Share` có trên tất cả action bar, payload được encode trong query `?share=...`.
- Hành vi hiện tại: link share chứa mode + state theo mode; khi mở link app tự điều hướng về route canonical của mode
  trong payload rồi restore dữ liệu.

### 12) Tối ưu hiệu năng cho JSON lớn (Phase 1)

- Trạng thái: Done.
  Đã triển khai:
- Debounce auto-processing cho các mode xử lý tức thời, với delay lớn hơn khi input lớn.
- Debounce tính diff report và giới hạn số `Diff Details` render cho dữ liệu lớn để tránh nghẽn UI.
- Tự tắt array/type hints khi nội dung editor vượt ngưỡng kích thước lớn.
- Hành vi hiện tại: thao tác nhập/chỉnh sửa ở payload lớn mượt hơn rõ rệt so với xử lý tức thời mỗi phím gõ.

### 13) JSON Tree Explorer + Path Inspector

- Trạng thái: Done.
- Đã triển khai: thêm route `/tree` với workspace chuyên biệt gồm tree explorer (expand/collapse), inspector theo node
  đang chọn, và jump theo `JSON Pointer` hoặc `JSONPath`.
- Hành vi hiện tại: người dùng có thể duyệt cấu trúc JSON theo cây, đọc path/type/depth/size/value của node, và định vị
  nhanh node mục tiêu bằng path input.

## 2. Backlog Analysis (mở rộng)

Phần này phân tích backlog theo 4 tiêu chí: giá trị người dùng, độ phức tạp triển khai, rủi ro kỹ thuật, và phụ thuộc
với kiến trúc hiện tại.

| Backlog                                       | Giá trị người dùng                                                 | Độ phức tạp       | Rủi ro chính                                        | Phụ thuộc kỹ thuật                                      | Ưu tiên |
|-----------------------------------------------|--------------------------------------------------------------------|-------------------|-----------------------------------------------------|---------------------------------------------------------|---------|
| Theme preset + font size preset               | Tăng tốc thao tác hằng ngày, cải thiện khả dụng khi trình bày/demo | Thấp              | Thấp                                                | `TopNavigation`, editor options, persistence state      | P0      |
| Import từ URL/API response mẫu                | Giảm thao tác copy/paste khi test transform                        | Thấp - Trung bình | Trung bình (CORS/network error)                     | action bar import flow, validate input, error UX        | P0      |
| Multi-tab workspace                           | Hỗ trợ làm nhiều bài toán JSON song song trong cùng mode           | Trung bình        | Trung bình (state sync/persistence)                 | state model `useJsonToolState`, workspace switching UI  | P1      |
| Batch processing nhiều record/file            | Mở rộng use case từ interactive sang xử lý hàng loạt               | Trung bình - Cao  | Cao (hiệu năng, theo dõi tiến độ, export kết quả)   | job queue cục bộ, import/export pipeline, workerization | P1      |
| 3-way compare/merge (`base/current/incoming`) | Giá trị cao cho workflow merge phức tạp                            | Cao               | Cao (thuật toán conflict và UX conflict resolution) | merge engine, diff engine, workspace + action bar riêng | P2      |

Kết luận ưu tiên:

- Ưu tiên 1 (P0): `Theme/Font Preset`, `Import URL/API` vì chi phí thấp và tạo cải thiện UX tức thì.
- Ưu tiên 2 (P1): `Multi-tab`, `Batch Processing` để mở rộng khả năng làm việc đa tác vụ và scale.
- Ưu tiên 3 (P2): `3-way compare/merge` do độ phức tạp cao, cần nền tảng state/job ổn định trước.

## 3. Kế Hoạch Triển Khai

### Phase 1: Quick Wins + nền tảng UX (Sprint 1)

Mục tiêu:

- Giao nhanh các cải tiến có giá trị cao, ít rủi ro.

Hạng mục:

1. Theme preset + font size preset

- Thêm preset UI vào top navigation.
- Persist vào `localStorage` cùng state hiện có.
- Áp dụng đồng bộ cho input/output editors.

2. Import từ URL/API response mẫu

- Thêm action `Import URL`.
- Fetch dữ liệu text/JSON với timeout và thông báo lỗi rõ ràng.
- Tự detect JSON hợp lệ trước khi apply vào input.

Definition of Done:

- Có thể đổi preset theme/font và giữ lại sau reload.
- Có thể nhập URL hợp lệ, hiển thị lỗi tốt cho 4 tình huống: timeout, CORS, non-200, payload không parse được.
- `npm run lint` và `npm run build` pass.

### Phase 2: Multi-tab workspace (Sprint 2)

Mục tiêu:

- Cho phép người dùng thao tác nhiều phiên JSON song song mà không phải mở nhiều tab trình duyệt.

Hạng mục:

1. Thiết kế state model theo tab

- `tabsByMode`, `activeTabIdByMode`, metadata (`title`, `updatedAt`).

2. Tab UI cho workspace

- Add/rename/close/duplicate tab.
- Cảnh báo khi đóng tab có thay đổi chưa lưu snapshot.

3. Persistence cho tabs

- Persist dữ liệu tab theo mode, có migration fallback từ state v2 hiện tại.

Definition of Done:

- Mỗi mode có thể có nhiều tab độc lập input/output/options.
- Đổi mode không làm mất tab state của mode khác.
- Restore đầy đủ tab state sau reload.

### Phase 3: Batch processing (Sprint 3-4)

Mục tiêu:

- Hỗ trợ xử lý nhiều file/record theo pipeline có thể theo dõi tiến độ.

Hạng mục:

1. Batch input

- Multi-file import và textarea NDJSON/JSON array.

2. Batch execution engine

- Chạy theo từng item, thống kê success/fail.
- Thêm cancel job và retry failed items.

3. Batch output

- Export kết quả theo JSON/CSV và report lỗi theo từng item.

Definition of Done:

- Xử lý được batch với báo cáo `total/success/failed/duration`.
- Không block UI trong lúc xử lý batch lớn (ưu tiên worker hoặc chunked async loop).
- Có demo flow tối thiểu cho mode `convert` và `schema-validate`.

### Phase 4: 3-way compare/merge (Sprint 5+)

Mục tiêu:

- Cung cấp merge nâng cao cho workflow tương tự Git (`base`, `current`, `incoming`).

Hạng mục:

1. 3-way diff core

- Xác định thay đổi từ `base -> current` và `base -> incoming`.
- Phân loại tự động: non-conflict merge, potential conflict.

2. Conflict resolution UX

- Danh sách conflict theo path.
- Chọn `current`, `incoming`, hoặc chỉnh tay.

3. Kết quả và audit

- Xuất merged result + summary conflicts đã resolve/chưa resolve.

Definition of Done:

- Merge tự động thành công cho case non-conflict.
- Conflict được hiển thị rõ, cho phép resolve từng path.
- Có snapshot trước/sau merge để rollback nhanh.

## 4. Feature Expansion Pool (ý tưởng mới)

Các ý tưởng dưới đây chưa nằm trong commit scope hiện tại, nhưng phù hợp để đưa vào các phase tiếp theo sau khi hoàn
thành P0/P1/P2 hiện tại.

| Feature idea                                                    | Giá trị                                                    | Độ phức tạp      | Rủi ro chính                                   | Gợi ý phase       |
|-----------------------------------------------------------------|------------------------------------------------------------|------------------|------------------------------------------------|-------------------|
| Saved snippets library (input/schema/query templates)           | Tăng tốc thao tác lặp lại, đặc biệt khi demo và test nhanh | Thấp             | Drift snippet mẫu cũ                           | Sau Phase 1       |
| Reusable transform presets (convert/schema/csv options presets) | Chuẩn hóa workflow theo team/use case                      | Trung bình       | Thiết kế schema preset ban đầu                 | Sau Phase 1       |
| Command palette (`Ctrl/Cmd + K`) cho toàn app                   | Điều hướng và chạy action nhanh mà không cần mouse         | Trung bình       | Mapping shortcut xung đột theo OS/browser      | Sau Phase 2       |
| Advanced search/replace trong JSON với preview diff             | Chỉnh sửa payload lớn nhanh hơn                            | Trung bình       | Sai lệch khi replace path sâu                  | Sau Phase 2       |
| JSON schema-driven mock data generator                          | Sinh dữ liệu test tự động từ schema                        | Trung bình       | Chất lượng dữ liệu sinh ra không sát domain    | Sau Phase 2       |
| Privacy mode nâng cao: PII detector + mask policy templates     | Tăng tính an toàn dữ liệu và reuse policy                  | Trung bình - Cao | False positive/negative khi detect PII         | Sau Phase 3       |
| Background worker cho tác vụ nặng (diff/merge/batch)            | Giảm block UI với payload lớn                              | Trung bình - Cao | Phức tạp state sync giữa main thread và worker | Song song Phase 3 |
| JSON test cases runner (assert query/transform output)          | Biến tool thành môi trường verify luồng xử lý              | Cao              | Thiết kế DSL test và UX report                 | Sau Phase 3       |
| Plugin hooks cho mode/action mở rộng                            | Cho phép mở rộng theo nhu cầu đặc thù                      | Cao              | Boundary an toàn và compatibility              | Sau Phase 4       |
| Offline-first package (PWA + local cache assets)                | Trải nghiệm ổn định khi mạng chập chờn                     | Trung bình       | Cache invalidation khi release                 | Song song Phase 4 |

Đề xuất ưu tiên nhóm ý tưởng mới:

1. `Saved snippets library`.
2. `Reusable transform presets`.
3. `Command palette`.
4. `Advanced search/replace với preview diff`.

## 5. Mốc kiểm chứng và quản trị rủi ro

Mốc kiểm chứng sau mỗi phase:

1. Cập nhật đồng bộ `README.md`, `docs/FEATURES.md`, `docs/ROADMAP.md`, `AGENTS.md` nếu feature surface thay đổi.
2. Chạy `npm run lint` và `npm run build`.
3. Verify thủ công các route ảnh hưởng: `/editor`, `/convert`, `/schema-validate`, `/merge`, `/patch`, `/tree`.

Rủi ro cần quản trị sớm:

- State phình to do multi-tab + batch results trong `localStorage`.
- UI lag khi xử lý payload lớn hoặc batch nhiều item.
- Drift giữa behavior thực tế và docs khi rollout nhiều phase liên tiếp.
