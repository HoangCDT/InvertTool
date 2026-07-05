# VisionInvert - Batch Image Color Inverter

Một ứng dụng web cục bộ viết bằng Python (FastAPI + Pillow) và Vanilla HTML/CSS/JS, hỗ trợ quét và đổi hình ảnh trong thư mục sang ảnh xám đảo ngược (Grayscale + Inverted) theo thời gian thực (Server-Sent Events).

---

## 🚀 Hướng dẫn cài đặt & Chạy ứng dụng

### 1. Cài đặt môi trường ảo và dependencies
Chạy các lệnh sau tại thư mục gốc của dự án:
```bash
# Tạo môi trường ảo
python3 -m venv venv

# Kích hoạt môi trường ảo
source venv/bin/activate

# Cập nhật pip và cài đặt thư viện
pip install --upgrade pip
pip install -r requirements.txt
```

### 2. Khởi chạy ứng dụng
Chạy lệnh uvicorn để khởi động server:
```bash
uvicorn main:app --reload --port 8000
```

Sau khi server khởi chạy thành công, mở trình duyệt web truy cập địa chỉ:
👉 **[http://localhost:8000](http://localhost:8000)**

---

## 🧪 Chạy Kiểm Thử (Tests)

Ứng dụng đi kèm bộ kiểm thử tự động toàn diện viết bằng `pytest`. Để chạy kiểm thử:
```bash
# Đảm bảo venv đã được kích hoạt
pytest test_main.py -v
```

---

## 📂 Cách Sử Dụng
1. Nhập đường dẫn thư mục tuyệt đối chứa các file ảnh (ví dụ: `/Users/username/Pictures/Test_Folder`) vào ô nhập trên giao diện.
2. Click **Quét thư mục** để hệ thống kiểm tra và đếm tổng số lượng hình ảnh phù hợp.
3. Click **Bắt đầu đảo ngược** để tiến hành đổi màu trắng đen âm bản. Tiến trình sẽ cập nhật tự động.
4. Nhấp vào các tệp tin trong danh sách đã xử lý thành công để xem so sánh Trước / Sau trực quan trên thanh trượt (slider). Các hình ảnh đầu ra được lưu tại thư mục con `inverted/` trong thư mục gốc bạn chọn.
