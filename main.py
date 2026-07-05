from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
import subprocess

app = FastAPI()

class ScanRequest(BaseModel):
    folder_path: str

SUPPORTED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".bmp"}

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

@app.post("/api/browse")
def browse_folder():
    try:
        # Run macOS osascript to open native folder chooser dialog
        cmd = ["osascript", "-e", 'POSIX path of (choose folder with prompt "Chọn thư mục hình ảnh")']
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        path = result.stdout.strip()
        return {"success": True, "folder_path": path}
    except subprocess.CalledProcessError as e:
        # Check if cancelled (exit code 1 or stderr message)
        if "User canceled" in e.stderr or "User canceled" in e.stdout or e.returncode == 1:
            return {"success": False, "cancelled": True}
        raise HTTPException(status_code=500, detail=f"Lỗi hệ thống: {e.stderr or str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi: {str(e)}")


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

@app.get("/api/process")
async def process_images(folder_path: str):
    from fastapi.responses import StreamingResponse
    import json
    import asyncio
    from PIL import Image, ImageOps
    
    abs_path = os.path.abspath(folder_path)
    if not os.path.exists(abs_path) or not os.path.isdir(abs_path):
        raise HTTPException(status_code=400, detail="Thư mục đầu vào không tồn tại.")

    async def process_images_generator(folder_path: str):
        abs_path = os.path.abspath(folder_path)
        output_dir = os.path.join(abs_path, "inverted")
        
        # Ensure output directory exists
        os.makedirs(output_dir, exist_ok=True)

        try:
            files = sorted(os.listdir(abs_path))
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': f'Không thể đọc thư mục: {str(e)}'})}\n\n"
            return

        image_files = [f for f in files if os.path.splitext(f)[1].lower() in SUPPORTED_EXTENSIONS]
        total_count = len(image_files)

        if total_count == 0:
            yield f"data: {json.dumps({'type': 'complete', 'message': 'Không tìm thấy hình ảnh nào để xử lý.'})}\n\n"
            return

        for idx, filename in enumerate(image_files, start=1):
            src_file = os.path.join(abs_path, filename)
            dest_file = os.path.join(output_dir, filename)
            
            try:
                # Pillow Processing
                with Image.open(src_file) as img:
                    # Maintain orientation
                    img = ImageOps.exif_transpose(img)
                    # Convert to grayscale ('L')
                    gray_img = img.convert('L')
                    # Invert
                    inverted_img = ImageOps.invert(gray_img)
                    # Save with original format details
                    inverted_img.save(dest_file, format=img.format)
                
                # yield progress event
                progress = int((idx / total_count) * 100)
                event_data = {
                    "type": "progress",
                    "progress_percent": progress,
                    "completed_count": idx,
                    "total_count": total_count,
                    "current_file": filename,
                    "status": "success",
                    "message": f"Đã xử lý xong: {filename}"
                }
                yield f"data: {json.dumps(event_data)}\n\n"
                
            except Exception as e:
                # If single file fails, stream error, but continue loop
                progress = int((idx / total_count) * 100)
                event_data = {
                    "type": "progress",
                    "progress_percent": progress,
                    "completed_count": idx,
                    "total_count": total_count,
                    "current_file": filename,
                    "status": "error",
                    "message": f"Lỗi xử lý {filename}: {str(e)}"
                }
                yield f"data: {json.dumps(event_data)}\n\n"

            # Tiny sleep to ensure async yielding doesn't lock CPU
            await asyncio.sleep(0.01)

        # yield complete event
        complete_data = {
            "type": "complete",
            "message": f"Hoàn thành xử lý {total_count} hình ảnh. Đầu ra được lưu tại {output_dir}"
        }
        yield f"data: {json.dumps(complete_data)}\n\n"
        
    return StreamingResponse(
        process_images_generator(abs_path),
        media_type="text/event-stream"
    )

from fastapi.staticfiles import StaticFiles
app.mount("/", StaticFiles(directory="static", html=True), name="static")




