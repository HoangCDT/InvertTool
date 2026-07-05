document.addEventListener("DOMContentLoaded", () => {
    const btnScan = document.getElementById("btn-scan");
    const btnStart = document.getElementById("btn-start");
    const btnBrowse = document.getElementById("btn-browse");
    const folderInput = document.getElementById("folder-path");
    
    const statusCard = document.getElementById("status-card");
    const filesCard = document.getElementById("files-card");
    const statTotal = document.getElementById("stat-total");
    const statDone = document.getElementById("stat-done");
    
    const progressBar = document.getElementById("progress-bar");
    const progressText = document.getElementById("progress-text");
    const fileList = document.getElementById("file-list");
    
    const previewPlaceholder = document.getElementById("preview-placeholder");
    const sliderContainer = document.getElementById("slider-container");
    const imgOriginal = document.getElementById("img-original");
    const imgInverted = document.getElementById("img-inverted");
    
    const sliderHandle = document.getElementById("slider-handle");
    const sliderResizeBox = document.getElementById("slider-resize-box");
    
    let scannedFolder = "";
    let imagesList = [];
    let eventSource = null;

    // 0. BROWSE DIRECTORY
    btnBrowse.addEventListener("click", async () => {
        try {
            btnBrowse.disabled = true;
            btnBrowse.innerText = "Đang chọn...";
            
            const res = await fetch("/api/browse", { method: "POST" });
            const data = await res.json();
            
            if (data.success && data.folder_path) {
                folderInput.value = data.folder_path;
                // Automatically trigger directory scan
                btnScan.click();
            }
        } catch (err) {
            console.error("Browse error:", err);
            alert("Lỗi khi mở hộp thoại chọn thư mục: " + err.message);
        } finally {
            btnBrowse.disabled = false;
            btnBrowse.innerText = "Duyệt...";
        }
    });

    // 1. SCAN DIRECTORY
    btnScan.addEventListener("click", async () => {
        const folderPath = folderInput.value.trim();
        if (!folderPath) {
            alert("Vui lòng nhập đường dẫn thư mục!");
            return;
        }

        try {
            btnScan.disabled = true;
            btnScan.innerText = "Đang quét...";
            
            const res = await fetch("/api/scan", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ folder_path: folderPath })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.detail || "Không thể quét thư mục");
            }

            scannedFolder = data.folder_path;
            imagesList = data.images;

            // Show/update cards
            statusCard.classList.remove("hidden");
            filesCard.classList.remove("hidden");
            btnStart.classList.remove("hidden");
            btnStart.disabled = false;
            btnStart.innerText = "Bắt đầu đảo ngược";

            statTotal.innerText = data.image_count;
            statDone.innerText = "0";
            progressBar.style.width = "0%";
            progressText.innerText = "0%";

            // Render File List
            renderFileList();
        } catch (err) {
            alert("Lỗi: " + err.message);
            statusCard.classList.add("hidden");
            filesCard.classList.add("hidden");
            btnStart.classList.add("hidden");
        } finally {
            btnScan.disabled = false;
            btnScan.innerText = "Quét thư mục";
        }
    });

    function renderFileList() {
        fileList.innerHTML = "";
        imagesList.forEach(filename => {
            const li = document.createElement("li");
            li.className = "file-item";
            li.innerHTML = `
                <div class="file-info">
                    <img class="file-thumb" src="/api/preview?path=${encodeURIComponent(scannedFolder + '/' + filename)}" alt="thumbnail">
                    <span>${filename}</span>
                </div>
                <span class="badge waiting" id="badge-${filename.replace(/[^a-zA-Z0-9]/g, '_')}">Chờ xử lý</span>
            `;
            
            // Clicking file shows preview (if processed, show slider; if not, show placeholder)
            li.addEventListener("click", () => {
                const badge = document.getElementById(`badge-${filename.replace(/[^a-zA-Z0-9]/g, '_')}`);
                if (badge.classList.contains("success")) {
                    showPreview(filename);
                } else {
                    alert("File này chưa được xử lý xong. Hãy bắt đầu đảo ngược trước!");
                }
            });
            
            fileList.appendChild(li);
        });
    }

    // 2. PROCESS IMAGES (SSE)
    btnStart.addEventListener("click", () => {
        if (!scannedFolder) return;
        
        btnStart.disabled = true;
        btnStart.innerText = "Đang đảo ngược...";

        if (eventSource) {
            eventSource.close();
        }

        eventSource = new EventSource(`/api/process?folder_path=${encodeURIComponent(scannedFolder)}`);

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === "progress") {
                statDone.innerText = data.completed_count;
                progressBar.style.width = `${data.progress_percent}%`;
                progressText.innerText = `${data.progress_percent}%`;

                // Update item status badge
                const badgeId = `badge-${data.current_file.replace(/[^a-zA-Z0-9]/g, '_')}`;
                const badge = document.getElementById(badgeId);
                if (badge) {
                    if (data.status === "success") {
                        badge.className = "badge success";
                        badge.innerText = "Thành công";
                        // Also update thumbnail with inverted image
                        const thumb = badge.previousElementSibling.querySelector(".file-thumb");
                        thumb.src = `/api/preview?path=${encodeURIComponent(scannedFolder + '/inverted/' + data.current_file)}&t=${Date.now()}`;
                    } else {
                        badge.className = "badge error";
                        badge.innerText = "Lỗi";
                    }
                }
            } else if (data.type === "complete") {
                eventSource.close();
                btnStart.innerText = "Hoàn thành!";
                setTimeout(() => {
                    btnStart.innerText = "Bắt đầu đảo ngược";
                    btnStart.disabled = false;
                }, 3000);
                alert(data.message);
            }
        };

        eventSource.onerror = (err) => {
            console.error("SSE Error:", err);
            eventSource.close();
            btnStart.innerText = "Gặp lỗi kết nối";
            btnStart.disabled = false;
        };
    });

    // 3. SHOW PREVIEW
    function showPreview(filename) {
        previewPlaceholder.classList.add("hidden");
        sliderContainer.classList.remove("hidden");
        
        const originalPath = scannedFolder + '/' + filename;
        const invertedPath = scannedFolder + '/inverted/' + filename;
        
        imgOriginal.src = `/api/preview?path=${encodeURIComponent(originalPath)}`;
        imgInverted.src = `/api/preview?path=${encodeURIComponent(invertedPath)}`;
        
        // Reset slider position to 50%
        sliderResizeBox.style.width = "50%";
        sliderHandle.style.left = "50%";
    }

    // 4. BEFORE/AFTER SLIDER INTERACTIVE DRAG
    let isDragging = false;
    
    function getMouseX(e) {
        const rect = sliderContainer.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        let x = clientX - rect.left;
        x = Math.max(0, Math.min(x, rect.width));
        return (x / rect.width) * 100;
    }

    function slide(pct) {
        sliderResizeBox.style.width = `${pct}%`;
        sliderHandle.style.left = `${pct}%`;
    }

    const startDragging = () => { isDragging = true; };
    const stopDragging = () => { isDragging = false; };
    const onDrag = (e) => {
        if (!isDragging) return;
        const pct = getMouseX(e);
        slide(pct);
    };

    sliderHandle.addEventListener("mousedown", startDragging);
    sliderHandle.addEventListener("touchstart", startDragging);
    
    window.addEventListener("mouseup", stopDragging);
    window.addEventListener("touchend", stopDragging);
    
    window.addEventListener("mousemove", onDrag);
    window.addEventListener("touchmove", onDrag);
});
