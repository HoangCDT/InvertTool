from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_serve_html():
    response = client.get("/")
    assert response.status_code == 200
    assert "VisionInvert" in response.text
    assert "threshold-slider" in response.text

def test_serve_js():
    response = client.get("/app.js")
    assert response.status_code == 200
    assert "processFileClientSide" in response.text

def test_serve_css():
    response = client.get("/style.css")
    assert response.status_code == 200
    assert "drop-zone" in response.text
