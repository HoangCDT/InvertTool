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

