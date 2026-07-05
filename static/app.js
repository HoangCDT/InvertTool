document.addEventListener("DOMContentLoaded", () => {
    // Select elements
    const dropZone = document.getElementById("drop-zone");
    const fileInput = document.getElementById("file-input");
    const folderInput = document.getElementById("folder-input");
    const btnSelectFiles = document.getElementById("btn-select-files");
    const btnSelectFolder = document.getElementById("btn-select-folder");
    
    const btnStart = document.getElementById("btn-start");
    const btnDownloadAll = document.getElementById("btn-download-all");
    const folderInputLabel = document.getElementById("folder-path");
    
    const thresholdSlider = document.getElementById("threshold-slider");
    const thresholdVal = document.getElementById("threshold-val");
    const blackThresholdSlider = document.getElementById("black-threshold-slider");
    const blackThresholdVal = document.getElementById("black-threshold-val");
    
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
    
    let selectedFiles = [];
    let activePreviewFile = null;
    let updateScheduled = false;
    const SUPPORTED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".bmp"];

    // 1. FILE & FOLDER SELECTION EVENTS
    btnSelectFiles.addEventListener("click", (e) => {
        e.stopPropagation();
        fileInput.click();
    });

    btnSelectFolder.addEventListener("click", (e) => {
        e.stopPropagation();
        folderInput.click();
    });

    fileInput.addEventListener("change", handleFileSelection);
    folderInput.addEventListener("change", handleFileSelection);

    // Drag and drop support
    dropZone.addEventListener("click", () => {
        fileInput.click();
    });

    dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.classList.add("dragover");
    });

    dropZone.addEventListener("dragleave", () => {
        dropZone.classList.remove("dragover");
    });

    dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZone.classList.remove("dragover");
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            processFilesArray(Array.from(files));
        }
    });

    function handleFileSelection(e) {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            processFilesArray(files);
        }
    }

    function processFilesArray(files) {
        // Filter image files by extension
        selectedFiles = files.filter(file => {
            const ext = "." + file.name.split(".").pop().toLowerCase();
            return SUPPORTED_EXTENSIONS.includes(ext);
        });

        if (selectedFiles.length === 0) {
            alert("Không tìm thấy tệp tin hình ảnh hợp lệ!");
            return;
        }

        // Show/update cards
        statusCard.classList.remove("hidden");
        filesCard.classList.remove("hidden");
        btnStart.classList.remove("hidden");
        btnStart.disabled = false;
        btnStart.innerText = "Bắt đầu đảo ngược";
        btnDownloadAll.classList.add("hidden");

        statTotal.innerText = selectedFiles.length;
        statDone.innerText = "0";
        progressBar.style.width = "0%";
        progressText.innerText = "0%";

        renderFileList();
    }

    function renderFileList() {
        fileList.innerHTML = "";
        activePreviewFile = null;
        selectedFiles.forEach((file, index) => {
            // Create object URL for original image thumbnail
            file.originalUrl = URL.createObjectURL(file);
            file.invertedUrl = null;
            file.processedBlob = null;
            file.id = `file-${index}`;

            const li = document.createElement("li");
            li.className = "file-item";
            li.id = file.id;
            li.innerHTML = `
                <div class="file-info">
                    <img class="file-thumb" src="${file.originalUrl}" alt="thumbnail">
                    <span>${file.name}</span>
                </div>
                <span class="badge waiting" id="badge-${file.id}">Chờ xử lý</span>
            `;
            
            li.addEventListener("click", () => {
                activePreviewFile = file;
                
                // Highlight active item
                document.querySelectorAll(".file-item").forEach(item => item.classList.remove("active"));
                li.classList.add("active");
                
                showPreview(file);
                schedulePreviewUpdate();
            });
            
            fileList.appendChild(li);
        });
    }

    // Update threshold labels dynamically
    thresholdSlider.addEventListener("input", () => {
        const val = thresholdSlider.value;
        if (val === "255") {
            thresholdVal.innerText = "Tắt";
            thresholdVal.className = "badge waiting";
        } else {
            thresholdVal.innerText = val;
            thresholdVal.className = "badge success";
        }
        schedulePreviewUpdate();
    });

    blackThresholdSlider.addEventListener("input", () => {
        const val = blackThresholdSlider.value;
        if (val === "0") {
            blackThresholdVal.innerText = "Tắt";
            blackThresholdVal.className = "badge waiting";
        } else {
            blackThresholdVal.innerText = val;
            blackThresholdVal.className = "badge success";
        }
        schedulePreviewUpdate();
    });

    // 2. IMAGE PROCESSING ALGORITHM (CLIENT-SIDE)
    btnStart.addEventListener("click", async () => {
        if (selectedFiles.length === 0) return;

        btnStart.disabled = true;
        btnStart.innerText = "Đang xử lý...";
        btnDownloadAll.classList.add("hidden");

        const w_thresh = parseInt(thresholdSlider.value);
        const b_thresh = parseInt(blackThresholdSlider.value);
        let completedCount = 0;

        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            const badge = document.getElementById(`badge-${file.id}`);
            if (badge) {
                badge.className = "badge processing";
                badge.innerText = "Đang xử lý";
            }

            try {
                await processFileClientSide(file, w_thresh, b_thresh);
                completedCount++;
                statDone.innerText = completedCount;
                
                const pct = Math.round((completedCount / selectedFiles.length) * 100);
                progressBar.style.width = `${pct}%`;
                progressText.innerText = `${pct}%`;

                if (badge) {
                    badge.className = "badge success";
                    badge.innerText = "Thành công";
                    
                    // Update thumbnail with processed image
                    const thumb = document.getElementById(file.id).querySelector(".file-thumb");
                    if (thumb) {
                        thumb.src = file.invertedUrl;
                    }
                }
            } catch (err) {
                console.error("Processing error for " + file.name, err);
                if (badge) {
                    badge.className = "badge error";
                    badge.innerText = "Lỗi";
                }
            }
        }

        btnStart.innerText = "Hoàn thành!";
        btnDownloadAll.classList.remove("hidden");
        setTimeout(() => {
            btnStart.innerText = "Bắt đầu đảo ngược";
            btnStart.disabled = false;
        }, 3000);
    });

    function processFileClientSide(file, w_thresh, b_thresh) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    // Create offscreen canvas
                    const canvas = document.createElement("canvas");
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext("2d");
                    ctx.drawImage(img, 0, 0);

                    const imgData = ctx.getImageData(0, 0, img.width, img.height);
                    const d = imgData.data;

                    // Precompute LUT (Lookup Table) for Levels Adjustment and Inversion
                    const lut = new Uint8Array(256);
                    for (let p = 0; p < 256; p++) {
                        let val = p;
                        if (p <= b_thresh) {
                            val = 0;
                        } else if (p >= w_thresh) {
                            val = 255;
                        } else {
                            if (w_thresh > b_thresh) {
                                val = Math.round((p - b_thresh) / (w_thresh - b_thresh) * 255);
                            }
                        }
                        // Invert color: white background becomes black, black becomes white
                        lut[p] = 255 - val;
                    }

                    // Loop through image pixels and convert to grayscale + invert
                    for (let i = 0; i < d.length; i += 4) {
                        const r = d[i];
                        const g = d[i + 1];
                        const b = d[i + 2];

                        // Convert to Grayscale (Starlette/PIL Luminance Formula)
                        const gray = Math.round(r * 0.299 + g * 0.587 + b * 0.114);
                        const val = lut[gray];

                        d[i] = val;     // Red
                        d[i + 1] = val; // Green
                        d[i + 2] = val; // Blue
                        // d[i + 3] is Alpha (transparency), unchanged
                    }

                    ctx.putImageData(imgData, 0, 0);

                    // Output file format
                    const outputType = file.type || "image/png";

                    canvas.toBlob((blob) => {
                        if (blob) {
                            file.processedBlob = blob;
                            file.invertedUrl = URL.createObjectURL(blob);
                            resolve();
                        } else {
                            reject(new Error("Canvas conversion to Blob failed"));
                        }
                    }, outputType);
                };

                img.onerror = () => reject(new Error("Không thể load hình ảnh"));
                img.src = event.target.result;
            };

            reader.onerror = () => reject(new Error("Không thể đọc tệp"));
            reader.readAsDataURL(file);
        });
    }

    // 3. ZIP GENERATION & DOWNLOAD
    btnDownloadAll.addEventListener("click", () => {
        if (selectedFiles.length === 0) return;

        const zip = new JSZip();
        let filesAdded = 0;

        selectedFiles.forEach(file => {
            if (file.processedBlob) {
                zip.file(file.name, file.processedBlob);
                filesAdded++;
            }
        });

        if (filesAdded === 0) {
            alert("Chưa có hình ảnh nào được xử lý thành công để tải xuống!");
            return;
        }

        btnDownloadAll.disabled = true;
        btnDownloadAll.innerText = "Đang nén file ZIP...";

        zip.generateAsync({ type: "blob" }).then((content) => {
            const url = URL.createObjectURL(content);
            const a = document.createElement("a");
            a.href = url;
            a.download = "inverted_images.zip";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            btnDownloadAll.disabled = false;
            btnDownloadAll.innerText = "Tải xuống tất cả (.ZIP)";
        }).catch(err => {
            console.error("ZIP creation error", err);
            alert("Có lỗi xảy ra khi tạo file nén ZIP.");
            btnDownloadAll.disabled = false;
            btnDownloadAll.innerText = "Tải xuống tất cả (.ZIP)";
        });
    });

    // 4. SHOW PREVIEW & SLIDER CONTROLS
    function showPreview(file) {
        previewPlaceholder.classList.add("hidden");
        sliderContainer.classList.remove("hidden");
        
        imgOriginal.src = file.originalUrl;
        imgInverted.src = file.invertedUrl || file.originalUrl;
        
        // Reset slider to 50%
        imgInverted.style.clipPath = "inset(0 0 0 50%)";
        sliderHandle.style.left = "50%";
    }

    // Real-time slider update methods
    async function updateActivePreview() {
        if (!activePreviewFile) return;

        const w_thresh = parseInt(thresholdSlider.value);
        const b_thresh = parseInt(blackThresholdSlider.value);

        try {
            const oldInvertedUrl = activePreviewFile.invertedUrl;

            await processFileClientSide(activePreviewFile, w_thresh, b_thresh);

            // Revoke old object URL to prevent memory leaks
            if (oldInvertedUrl && oldInvertedUrl !== activePreviewFile.invertedUrl) {
                URL.revokeObjectURL(oldInvertedUrl);
            }

            // Update DOM images
            imgInverted.src = activePreviewFile.invertedUrl;

            const thumb = document.getElementById(activePreviewFile.id).querySelector(".file-thumb");
            if (thumb) {
                thumb.src = activePreviewFile.invertedUrl;
            }

            // Set badge status to success
            const badge = document.getElementById(`badge-${activePreviewFile.id}`);
            if (badge) {
                badge.className = "badge success";
                badge.innerText = "Thành công";
            }
        } catch (err) {
            console.error("Lỗi cập nhật preview thời gian thực:", err);
        }
    }

    function schedulePreviewUpdate() {
        if (updateScheduled) return;
        updateScheduled = true;
        requestAnimationFrame(async () => {
            await updateActivePreview();
            updateScheduled = false;
        });
    }

    // Slider interactive drag implementation
    let isDragging = false;
    
    function getMouseX(e) {
        const rect = sliderContainer.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        let x = clientX - rect.left;
        x = Math.max(0, Math.min(x, rect.width));
        return (x / rect.width) * 100;
    }

    function slide(pct) {
        imgInverted.style.clipPath = `inset(0 0 0 ${pct}%)`;
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
