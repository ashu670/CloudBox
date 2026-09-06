import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";

// Initialize worker for pdfjs-dist v6 ESM support using workerPort
if (typeof window !== "undefined" && "Worker" in window && !pdfjsLib.GlobalWorkerOptions.workerPort) {
    try {
        pdfjsLib.GlobalWorkerOptions.workerPort = new Worker(
            new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url),
            { type: "module" }
        );
    } catch {
        // Fallback for environments where workerPort module fails
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
            "pdfjs-dist/build/pdf.worker.min.mjs",
            import.meta.url
        ).toString();
    }
}

export default function PdfPreview({ url }) {
    const canvasRef = useRef(null);
    const renderTaskRef = useRef(null);
    const loadingTaskRef = useRef(null);

    const [pdf, setPdf] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [scale, setScale] = useState(1.0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 1. Load PDF Document safely from Blob URL / HTTP URL / ArrayBuffer
    useEffect(() => {
        if (!url) return;

        let active = true;
        setLoading(true);
        setError(null);
        setPdf(null);
        setPageNumber(1);
        setScale(1.0);

        const loadPdf = async () => {
            try {
                let pdfInitParam;

                if (typeof url === "string") {
                    // Fetch as ArrayBuffer to bypass worker blob fetch / cross-origin isolation restrictions
                    const response = await fetch(url);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch PDF resource (HTTP status ${response.status})`);
                    }
                    const arrayBuffer = await response.arrayBuffer();
                    pdfInitParam = {
                        data: new Uint8Array(arrayBuffer),
                        cMapUrl: "https://unpkg.com/pdfjs-dist@6.3.289/cmaps/",
                        cMapPacked: true,
                        standardFontDataUrl: "https://unpkg.com/pdfjs-dist@6.3.289/standard_fonts/"
                    };
                } else if (url instanceof ArrayBuffer) {
                    pdfInitParam = {
                        data: new Uint8Array(url),
                        cMapUrl: "https://unpkg.com/pdfjs-dist@6.3.289/cmaps/",
                        cMapPacked: true,
                        standardFontDataUrl: "https://unpkg.com/pdfjs-dist@6.3.289/standard_fonts/"
                    };
                } else if (ArrayBuffer.isView(url)) {
                    pdfInitParam = {
                        data: url,
                        cMapUrl: "https://unpkg.com/pdfjs-dist@6.3.289/cmaps/",
                        cMapPacked: true,
                        standardFontDataUrl: "https://unpkg.com/pdfjs-dist@6.3.289/standard_fonts/"
                    };
                } else {
                    pdfInitParam = url;
                }

                if (!active) return;

                const loadingTask = pdfjsLib.getDocument(pdfInitParam);
                loadingTaskRef.current = loadingTask;

                const loadedPdf = await loadingTask.promise;
                if (!active) {
                    loadedPdf.destroy();
                    return;
                }

                setPdf(loadedPdf);
                setLoading(false);
            } catch (err) {
                console.error("PDF.js document loading error:", err);
                if (active) {
                    setError("Unable to preview PDF.");
                    setLoading(false);
                }
            }
        };

        loadPdf();

        return () => {
            active = false;
            if (loadingTaskRef.current) {
                loadingTaskRef.current.destroy().catch(() => {});
                loadingTaskRef.current = null;
            }
        };
    }, [url]);

    // 2. Render Page to Canvas with High-DPI (Retina/Display Scaling) Sharp Text Support
    useEffect(() => {
        if (!pdf || !canvasRef.current) return;

        let cancelled = false;

        const renderPage = async () => {
            // Cancel any ongoing render task to prevent canvas collision
            if (renderTaskRef.current) {
                try {
                    renderTaskRef.current.cancel();
                } catch {
                    // Ignore
                }
                renderTaskRef.current = null;
            }

            try {
                const page = await pdf.getPage(pageNumber);
                if (cancelled) return;

                const dpr = window.devicePixelRatio || 1;
                const viewport = page.getViewport({ scale });
                const canvas = canvasRef.current;
                if (!canvas) return;

                const context = canvas.getContext("2d", { alpha: false });

                // Internal canvas buffer resolution scaled for High-DPI screens
                canvas.width = Math.floor(viewport.width * dpr);
                canvas.height = Math.floor(viewport.height * dpr);

                // CSS display size in logical pixels
                canvas.style.width = `${Math.floor(viewport.width)}px`;
                canvas.style.height = `${Math.floor(viewport.height)}px`;

                // Render context transform matrix scaling by DPR
                const transform = dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null;

                const renderContext = {
                    canvasContext: context,
                    viewport: viewport,
                    transform: transform
                };

                const renderTask = page.render(renderContext);
                renderTaskRef.current = renderTask;

                await renderTask.promise;
                renderTaskRef.current = null;
            } catch (err) {
                if (err?.name === "RenderingCancelledException" || err?.message?.includes("cancelled")) {
                    // Normal behavior during page switch, zoom, or unmount
                    return;
                }
                console.error("PDF.js canvas rendering error:", err);
            }
        };

        renderPage();

        return () => {
            cancelled = true;
            if (renderTaskRef.current) {
                try {
                    renderTaskRef.current.cancel();
                } catch {
                    // Ignore
                }
                renderTaskRef.current = null;
            }
        };
    }, [pdf, pageNumber, scale]);

    if (loading) {
        return (
            <div
                style={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "var(--bg-app)",
                    color: "var(--text-muted)",
                    gap: "12px"
                }}
            >
                <div className="spinner"></div>
                <span style={{ fontSize: "14px", fontWeight: "500" }}>Loading PDF...</span>
            </div>
        );
    }

    if (error || !pdf) {
        return (
            <div
                style={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "var(--bg-app)",
                    color: "var(--text-main)",
                    gap: "16px",
                    padding: "20px"
                }}
            >
                <div
                    style={{
                        padding: "32px 24px",
                        borderRadius: "16px",
                        backgroundColor: "var(--bg-surface)",
                        border: "1px solid var(--border-color)",
                        textAlign: "center",
                        maxWidth: "400px",
                        width: "100%"
                    }}
                >
                    <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "8px", color: "var(--text-main)" }}>
                        {error || "Unable to preview PDF."}
                    </h3>
                    <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
                        The document could not be loaded into the viewer.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div
            style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                backgroundColor: "var(--bg-app)",
                overflow: "hidden"
            }}
        >
            {/* Control Toolbar */}
            <div
                style={{
                    height: "52px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "12px",
                    flexShrink: 0,
                    backgroundColor: "var(--bg-surface)",
                    borderBottom: "1px solid var(--border-color)",
                    padding: "0 16px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    zIndex: 10
                }}
            >
                {/* Navigation */}
                <button
                    className="btn btn-secondary"
                    disabled={pageNumber <= 1}
                    onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                    style={{ padding: "6px 14px", fontSize: "13px" }}
                >
                    Previous
                </button>

                <span style={{ fontSize: "13.5px", fontWeight: "600", color: "var(--text-main)", minWidth: "70px", textAlign: "center" }}>
                    {pageNumber} / {pdf.numPages}
                </span>

                <button
                    className="btn btn-secondary"
                    disabled={pageNumber >= pdf.numPages}
                    onClick={() => setPageNumber((p) => Math.min(pdf.numPages, p + 1))}
                    style={{ padding: "6px 14px", fontSize: "13px" }}
                >
                    Next
                </button>

                <div style={{ width: "1px", height: "20px", backgroundColor: "var(--border-color)", margin: "0 4px" }} />

                {/* Zoom Controls */}
                <button
                    className="btn btn-secondary"
                    disabled={scale <= 0.5}
                    onClick={() => setScale((s) => Math.max(0.5, Math.round((s - 0.25) * 100) / 100))}
                    style={{ padding: "6px 12px", fontSize: "14px", fontWeight: "700" }}
                    title="Zoom out"
                >
                    −
                </button>

                <span style={{ fontSize: "13.5px", fontWeight: "600", color: "var(--text-main)", minWidth: "50px", textAlign: "center" }}>
                    {Math.round(scale * 100)}%
                </span>

                <button
                    className="btn btn-secondary"
                    disabled={scale >= 3.0}
                    onClick={() => setScale((s) => Math.min(3.0, Math.round((s + 0.25) * 100) / 100))}
                    style={{ padding: "6px 12px", fontSize: "14px", fontWeight: "700" }}
                    title="Zoom in"
                >
                    +
                </button>
            </div>

            {/* Canvas Scroll Area */}
            <div
                style={{
                    flex: 1,
                    overflow: "auto",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "flex-start",
                    padding: "24px"
                }}
            >
                <canvas
                    ref={canvasRef}
                    style={{
                        backgroundColor: "#ffffff",
                        boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
                        borderRadius: "4px",
                        maxWidth: "100%",
                        height: "auto"
                    }}
                />
            </div>
        </div>
    );
}