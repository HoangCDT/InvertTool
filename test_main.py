from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_read_root():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_scan_invalid_directory():
    response = client.post("/api/scan", json={"folder_path": "/invalid/path/that/does/not/exist"})
    assert response.status_code == 400
    assert "Thư mục không tồn tại" in response.json()["detail"]

def test_scan_valid_directory():
    import os
    import tempfile
    from PIL import Image
    with tempfile.TemporaryDirectory() as temp_dir:
        # Create a mock image
        img_path = os.path.join(temp_dir, "test.png")
        img = Image.new("RGB", (100, 100), color="white")
        img.save(img_path)

        response = client.post("/api/scan", json={"folder_path": temp_dir})
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["image_count"] == 1
        assert "test.png" in data["images"]

def test_preview_missing_file():
    response = client.get("/api/preview?path=/invalid/path/test.png")
    assert response.status_code == 400
    assert "Tập tin không tồn tại" in response.json()["detail"]

def test_preview_valid_file():
    import os
    import tempfile
    from PIL import Image
    with tempfile.TemporaryDirectory() as temp_dir:
        img_path = os.path.join(temp_dir, "test.png")
        img = Image.new("RGB", (10, 10), color="red")
        img.save(img_path)

        response = client.get(f"/api/preview?path={img_path}")
        assert response.status_code == 200
        assert response.headers["content-type"] == "image/png"

def test_process_images_sse():
    import os
    import tempfile
    from PIL import Image
    import json
    
    with tempfile.TemporaryDirectory() as temp_dir:
        # Create two test images
        for name in ["a.jpg", "b.png"]:
            img = Image.new("RGB", (100, 100), color="white")
            img.save(os.path.join(temp_dir, name))

        # Test the streaming endpoint
        with client.stream("GET", f"/api/process?folder_path={temp_dir}") as response:
            assert response.status_code == 200
            assert "text/event-stream" in response.headers["content-type"]
            
            # Check events streamed back
            events = [line for line in response.iter_lines() if line.startswith("data:")]
            assert len(events) >= 3 # 2 progress events + 1 complete event
            
            # Verify folders and inverted files are actually written
            output_dir = os.path.join(temp_dir, "inverted")
            assert os.path.exists(output_dir)
            assert os.path.exists(os.path.join(output_dir, "a.jpg"))
            assert os.path.exists(os.path.join(output_dir, "b.png"))

            # Verify image inversion occurred (white 255 becomes black 0)
            inverted_img = Image.open(os.path.join(output_dir, "a.jpg"))
            pixel = inverted_img.getpixel((0,0))
            val = pixel[0] if isinstance(pixel, tuple) else pixel
            assert val == 0



