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
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
            "pdfjs-dist/build/pdf.worker.min.mjs",
            import.meta.url
        ).toString();
    }
}

export default function PdfPreview({ url }) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const renderTaskRef = useRef(null);
    const loadingTaskRef = useRef(null);

    const [pdf, setPdf] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [scale, setScale] = useState(1.0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 1. Calculate ideal initial scale based on screen size
    const getResponsiveInitialScale = () => {
        if (typeof window === "undefined") return 1.0;
        const width = window.innerWidth;
        if (width < 420) return 0.85;
        return 1.0;
    };

    // 2. Load PDF Document safely from Blob URL / HTTP URL / ArrayBuffer
    useEffect(() => {
        if (!url) return;

        let active = true;
        setLoading(true);
        setError(null);
        setPdf(null);
        setPageNumber(1);
        setScale(getResponsiveInitialScale());

        const loadPdf = async () => {
            try {
                let pdfInitParam;

                if (typeof url === "string") {
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

    // 3. Render Page to Canvas with Aspect Ratio Preservation & High-DPI Support
    useEffect(() => {
        if (!pdf || !canvasRef.current) return;

        let cancelled = false;

        const renderPage = async () => {
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

                // Internal buffer resolution scaled for HiDPI displays
                canvas.width = Math.floor(viewport.width * dpr);
                canvas.height = Math.floor(viewport.height * dpr);

                // Preserve exact aspect ratio in CSS to PREVENT SQUISHING / DISTORTION on mobile
                canvas.style.width = `${Math.floor(viewport.width)}px`;
                canvas.style.height = "auto";
                canvas.style.aspectRatio = `${viewport.width} / ${viewport.height}`;
                canvas.style.maxWidth = scale > 1.0 ? "none" : "100%";

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
                    backgroundColor: "#0d0e12",
                    color: "#9ca3af",
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
                    backgroundColor: "#0d0e12",
                    color: "#f3f4f6",
                    gap: "16px",
                    padding: "20px"
                }}
            >
                <div
                    style={{
                        padding: "32px 24px",
                        borderRadius: "16px",
                        backgroundColor: "#16171e",
                        border: "1px solid #282a36",
                        textAlign: "center",
                        maxWidth: "400px",
                        width: "100%"
                    }}
                >
                    <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "8px", color: "#f3f4f6" }}>
                        {error || "Unable to preview PDF."}
                    </h3>
                    <p style={{ fontSize: "13px", color: "#9ca3af", margin: 0 }}>
                        The document could not be loaded into the viewer.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                backgroundColor: "#0c0d10",
                overflow: "hidden"
            }}
        >
            {/* Single-Row Mobile-Responsive Dark Control Toolbar */}
            <div
                style={{
                    height: "46px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    flexShrink: 0,
                    backgroundColor: "#16171e",
                    borderBottom: "1px solid #262734",
                    padding: "0 10px",
                    zIndex: 10,
                    overflowX: "auto",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.4)"
                }}
            >
                {/* Navigation Group */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                    <button
                        disabled={pageNumber <= 1}
                        onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                        style={{
                            padding: "4px 10px",
                            fontSize: "12px",
                            fontWeight: "600",
                            borderRadius: "6px",
                            backgroundColor: pageNumber <= 1 ? "#1c1d26" : "#262836",
                            color: pageNumber <= 1 ? "#4b4e5e" : "#f3f4f6",
                            border: "1px solid #343746",
                            cursor: pageNumber <= 1 ? "not-allowed" : "pointer"
                        }}
                    >
                        Prev
                    </button>

                    <span style={{ fontSize: "12.5px", fontWeight: "600", color: "#f3f4f6", padding: "0 2px", whiteSpace: "nowrap" }}>
                        {pageNumber} / {pdf.numPages}
                    </span>

                    <button
                        disabled={pageNumber >= pdf.numPages}
                        onClick={() => setPageNumber((p) => Math.min(pdf.numPages, p + 1))}
                        style={{
                            padding: "4px 10px",
                            fontSize: "12px",
                            fontWeight: "600",
                            borderRadius: "6px",
                            backgroundColor: pageNumber >= pdf.numPages ? "#1c1d26" : "#262836",
                            color: pageNumber >= pdf.numPages ? "#4b4e5e" : "#f3f4f6",
                            border: "1px solid #343746",
                            cursor: pageNumber >= pdf.numPages ? "not-allowed" : "pointer"
                        }}
                    >
                        Next
                    </button>
                </div>

                <div style={{ width: "1px", height: "16px", backgroundColor: "#2e3140", margin: "0 4px", flexShrink: 0 }} />

                {/* Zoom Controls Group */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                    <button
                        disabled={scale <= 0.5}
                        onClick={() => setScale((s) => Math.max(0.5, Math.round((s - 0.25) * 100) / 100))}
                        style={{
                            padding: "3px 9px",
                            fontSize: "13px",
                            fontWeight: "700",
                            borderRadius: "6px",
                            backgroundColor: scale <= 0.5 ? "#1c1d26" : "#262836",
                            color: scale <= 0.5 ? "#4b4e5e" : "#f3f4f6",
                            border: "1px solid #343746",
                            cursor: scale <= 0.5 ? "not-allowed" : "pointer"
                        }}
                        title="Zoom out"
                    >
                        −
                    </button>

                    <span style={{ fontSize: "12.5px", fontWeight: "600", color: "#f3f4f6", minWidth: "40px", textAlign: "center" }}>
                        {Math.round(scale * 100)}%
                    </span>

                    <button
                        disabled={scale >= 3.0}
                        onClick={() => setScale((s) => Math.min(3.0, Math.round((s + 0.25) * 100) / 100))}
                        style={{
                            padding: "3px 9px",
                            fontSize: "13px",
                            fontWeight: "700",
                            borderRadius: "6px",
                            backgroundColor: scale >= 3.0 ? "#1c1d26" : "#262836",
                            color: scale >= 3.0 ? "#4b4e5e" : "#f3f4f6",
                            border: "1px solid #343746",
                            cursor: scale >= 3.0 ? "not-allowed" : "pointer"
                        }}
                        title="Zoom in"
                    >
                        +
                    </button>

                    <button
                        onClick={() => setScale(1.0)}
                        style={{
                            padding: "3px 8px",
                            fontSize: "11px",
                            fontWeight: "600",
                            borderRadius: "6px",
                            backgroundColor: scale === 1.0 ? "#1c1d26" : "#262836",
                            color: scale === 1.0 ? "#6b7280" : "#60a5fa",
                            border: "1px solid #343746",
                            cursor: "pointer",
                            marginLeft: "2px"
                        }}
                        title="Reset Zoom"
                    >
                        Fit
                    </button>
                </div>
            </div>

            {/* Canvas Scrollable Container */}
            <div
                style={{
                    flex: 1,
                    overflow: "auto",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "flex-start",
                    padding: "16px",
                    boxSizing: "border-box"
                }}
            >
                <canvas
                    ref={canvasRef}
                    style={{
                        backgroundColor: "#ffffff",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                        borderRadius: "4px",
                        display: "block"
                    }}
                />
            </div>
        </div>
    );
}