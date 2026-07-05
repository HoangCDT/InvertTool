# VisionInvert - Batch Image Color Inverter (Static Web Edition)

VisionInvert là một ứng dụng web tĩnh cao cấp giúp chuyển đổi hình ảnh hàng loạt sang dạng ảnh xám đảo ngược (Grayscale + Inverted) xử lý 100% trên trình duyệt của người dùng (Client-side) sử dụng HTML5 Canvas.

### ✨ Tính năng nổi bật:
- **Xử lý 100% Client-side**: Hình ảnh không bao giờ bị tải lên bất kỳ máy chủ nào, đảm bảo tính riêng tư tuyệt đối và tốc độ xử lý nhanh tức thì.
- **Lọc thông minh (Thresholding & Levels)**:
  - **Lọc sạch nền trắng**: Nâng các điểm ảnh gần trắng lên trắng tinh để khi đảo ngược màu sẽ cho nền đen tuyệt đối.
  - **Lọc sạch nền đen (Black Cutoff)**: Hạ các điểm ảnh xám tối/gần đen xuống đen tinh để khi đảo ngược sẽ cho nền trắng tinh hoàn hảo.
- **Kéo & Thả (Drag & Drop)**: Hỗ trợ kéo thả tập tin ảnh hoặc cả thư mục chứa ảnh vào trang web để xử lý hàng loạt.
- **Thanh trượt So sánh (Before/After Slider)**: Xem và so sánh ảnh gốc và ảnh đã đảo ngược màu trực quan.
- **Xuất ZIP tiện lợi**: Tự động nén tất cả hình ảnh đã xử lý thành một tệp tin `.ZIP` duy nhất để tải xuống chỉ với một cú click chuột.

---

## 🚀 Cách chạy ứng dụng cục bộ

### Cách 1: Chạy bằng máy chủ FastAPI (Khuyên dùng khi dev)
1. Cài đặt môi trường ảo và dependencies:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```
2. Khởi chạy server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
3. Mở trình duyệt truy cập: **[http://localhost:8000](http://localhost:8000)**

### Cách 2: Mở trực tiếp bằng trình duyệt (Không cần Python)
Vì đây là ứng dụng web tĩnh 100%, bạn có thể mở thư mục `static/` và click đúp trực tiếp vào file `static/index.html` để chạy trên bất kỳ trình duyệt nào mà không cần cài đặt môi trường.

---

## ☁️ Hướng dẫn Deploy lên Web (Miễn phí)

Bạn có thể đưa trang web này lên mạng để chia sẻ cho bất kỳ ai sử dụng mà không tốn một chi phí nào:

### 1. Vercel / Netlify
- Đăng nhập vào [Vercel](https://vercel.com/) hoặc [Netlify](https://www.netlify.com/).
- Chọn liên kết với kho lưu trữ GitHub chứa dự án của bạn.
- Thiết lập **Build Command** là trống (hoặc `npm run build` nếu cấu hình build, nhưng ở đây không cần).
- Thiết lập **Publish Directory** (hoặc root directory) trỏ vào thư mục chứa các file static (ví dụ thư mục `static/` của dự án).
- Nhấp **Deploy** và bạn sẽ nhận được đường dẫn truy cập công khai miễn phí.

### 2. GitHub Pages
- Đẩy code của bạn lên một repository GitHub.
- Truy cập vào **Settings** -> **Pages** của repository đó.
- Tại mục **Build and deployment**, chọn nguồn phát từ nhánh `master` hoặc `main` và chọn thư mục `/` hoặc cấu hình thư mục publish là `static/`.

---

## 🐳 Khởi chạy bằng Docker & Docker Compose

Nếu máy của bạn đã cài đặt Docker, bạn có thể build và chạy ứng dụng cực kỳ nhanh chóng mà không cần bận tâm về việc cài đặt Python:

1. **Khởi chạy ứng dụng**:
   ```bash
   docker-compose up --build -d
   ```
   Ứng dụng sẽ chạy ngầm và mở cổng tại địa chỉ: **[http://localhost:8000](http://localhost:8000)**.
   
2. **Dừng ứng dụng**:
   ```bash
   docker-compose down
   ```

---

## 🧪 Chạy Kiểm Thử (Tests)
Chạy bộ kiểm thử tự động để xác minh server static luôn hoạt động ổn định:
```bash
source venv/bin/activate
pytest test_main.py -v
```
