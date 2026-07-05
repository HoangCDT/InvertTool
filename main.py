from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os

app = FastAPI()

class ScanRequest(BaseModel):
    folder_path: str

SUPPORTED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".bmp"}

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

@app.post("/api/scan")
def scan_directory(request: ScanRequest):
    # Prevent path traversal
    abs_path = os.path.abspath(request.folder_path)
    
    if not os.path.exists(abs_path):
        raise HTTPException(status_code=400, detail="Thư mục không tồn tại.")
    if not os.path.isdir(abs_path):
        raise HTTPException(status_code=400, detail="Đường dẫn không phải thư mục.")
        
    try:
        files = os.listdir(abs_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Không thể đọc thư mục: {str(e)}")

    image_files = []
    for file in files:
        _, ext = os.path.splitext(file)
        if ext.lower() in SUPPORTED_EXTENSIONS:
            image_files.append(file)

    return {
        "success": True,
        "folder_path": abs_path,
        "image_count": len(image_files),
        "images": sorted(image_files)
    }

@app.get("/api/preview")
def preview_image(path: str):
    from fastapi.responses import FileResponse
    import mimetypes
    
    abs_path = os.path.abspath(path)
    
    if not os.path.exists(abs_path) or os.path.isdir(abs_path):
        raise HTTPException(status_code=400, detail="Tập tin không tồn tại.")
        
    _, ext = os.path.splitext(abs_path)
    if ext.lower() not in SUPPORTED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Định dạng tệp không hỗ trợ preview.")

    mime_type, _ = mimetypes.guess_type(abs_path)
    return FileResponse(abs_path, media_type=mime_type or "image/jpeg")


