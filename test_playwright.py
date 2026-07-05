import os
import subprocess
import time
import pytest
from playwright.sync_api import sync_playwright

def test_static_app_flow():
    # Khởi chạy server FastAPI nội bộ trong tiến trình con để test
    proc = subprocess.Popen(
        ["uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8001"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    time.sleep(1.5)  # Chờ server khởi động xong
    
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            page.goto("http://127.0.0.1:8001")
            
            # 1. Xác thực trang load thành công
            assert "VisionInvert" in page.title()
            
            # 2. Kiểm tra các thanh trượt cấu hình có tồn tại
            assert page.locator("#threshold-slider").is_visible()
            assert page.locator("#black-threshold-slider").is_visible()
            
            # 3. Kiểm tra các nhãn trị số mặc định
            assert page.locator("#threshold-val").text_content() == "220"
            assert page.locator("#black-threshold-val").text_content() == "Tắt"
            
            # 4. Kiểm tra danh sách tệp tin đang ẩn (chưa chọn file)
            assert page.locator("#files-card").is_hidden()
            
            browser.close()
    finally:
        # Tắt server sau khi hoàn thành test
        proc.terminate()
        proc.wait()
