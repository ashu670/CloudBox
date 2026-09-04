import React, { useState, useEffect } from "react";
import { formatBytes } from "../utils/formatters";
import FileIcon from "./fileIcon";

export default function FilePreviewModal({ previewItem, onClose, onDownload, onShare }) {
    const [textContent, setTextContent] = useState(null);
    const [loadingText, setLoadingText] = useState(false);

    useEffect(() => {
        if (!previewItem || !previewItem.mimeType) return;
        const { mimeType, url } = previewItem;

        if (
            mimeType.startsWith("text/") ||
            mimeType === "application/json" ||
            mimeType.includes("javascript") ||
            mimeType.includes("xml")
        ) {
            setLoadingText(true);
            fetch(url)
                .then((res) => res.text())
                .then((text) => {
                    setTextContent(text);
                    setLoadingText(false);
                })
                .catch(() => {
                    setTextContent("Failed to load text preview.");
                    setLoadingText(false);
                });
        }
    }, [previewItem]);

    if (!previewItem) return null;

    const { file, url, mimeType } = previewItem;

    const renderFullViewportPreview = () => {
        if (mimeType.startsWith("image/")) {
            return (
                <div style={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "var(--bg-app)", padding: "16px" }}>
                    <img
                        src={url}
                        alt={file.orgName}
                        style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: "6px", boxShadow: "0 8px 30px rgba(0,0,0,0.3)" }}
                    />
                </div>
            );
        }

        if (mimeType === "application/pdf") {
            const pdfUrl = `${url}#toolbar=0&navpanes=0`;
            return (
                <div style={{ width: "100%", height: "100%", backgroundColor: "#1e1e24" }}>
                    <iframe
                        src={pdfUrl}
                        title={file.orgName}
                        style={{ width: "100%", height: "100%", border: "none" }}
                    />
                </div>
            );
        }

        if (mimeType.startsWith("video/")) {
            return (
                <div style={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "#000" }}>
                    <video
                        controls
                        controlsList="nodownload"
                        autoPlay
                        src={url}
                        style={{ maxWidth: "100%", maxHeight: "100%" }}
                    >
                        Your browser does not support HTML5 video playback.
                    </video>
                </div>
            );
        }

        if (mimeType.startsWith("audio/")) {
            return (
                <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", backgroundColor: "var(--bg-app)", padding: "20px" }}>
                    <div style={{ padding: "40px", borderRadius: "20px", backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-color)", textAlign: "center", maxWidth: "460px", width: "100%", boxShadow: "0 10px 40px rgba(0,0,0,0.2)" }}>
                        <div style={{ transform: "scale(2.2)", margin: "20px 0 30px 0" }}>
                            <FileIcon mimeType={mimeType} />
                        </div>
                        <h3 style={{ fontSize: "17px", fontWeight: "600", color: "var(--text-main)", marginBottom: "6px", wordBreak: "break-all" }}>{file.orgName}</h3>
                        <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "24px" }}>{formatBytes(file.size)}</p>
                        <audio controls controlsList="nodownload" autoPlay src={url} style={{ width: "100%" }}>
                            Your browser does not support HTML5 audio.
                        </audio>
                    </div>
                </div>
            );
        }

        if (
            mimeType.startsWith("text/") ||
            mimeType === "application/json" ||
            mimeType.includes("javascript") ||
            mimeType.includes("xml")
        ) {
            return (
                <div style={{ width: "100%", height: "100%", backgroundColor: "var(--bg-app)", overflow: "hidden" }}>
                    {loadingText ? (
                        <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center" }}>
                            <div className="spinner"></div>
                        </div>
                    ) : (
                        <pre style={{ width: "100%", height: "100%", padding: "24px", overflow: "auto", fontSize: "13.5px", margin: 0, color: "var(--text-main)", fontFamily: "monospace", lineHeight: "1.5" }}>
                            <code>{textContent}</code>
                        </pre>
                    )}
                </div>
            );
        }

        return (
            <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", backgroundColor: "var(--bg-app)", padding: "20px" }}>
                <div style={{ padding: "48px 32px", borderRadius: "20px", backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-color)", textAlign: "center", maxWidth: "440px", width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
                    <div style={{ transform: "scale(2.2)" }}>
                        <FileIcon mimeType={mimeType} />
                    </div>
                    <h3 style={{ fontSize: "18px", fontWeight: "600", color: "var(--text-main)", margin: 0 }}>Preview not available</h3>
                    <p style={{ fontSize: "13.5px", color: "var(--text-muted)", margin: 0 }}>
                        Direct preview is not available for this file format.
                    </p>
                    <button className="btn btn-primary" onClick={() => onDownload(null, file.id, file.orgName)} style={{ marginTop: "8px", width: "100%" }}>
                        Download to View ({formatBytes(file.size)})
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: "100vw",
                height: "100vh",
                backgroundColor: "rgba(0, 0, 0, 0.85)",
                backdropFilter: "blur(6px)",
                zIndex: 2000,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden"
            }}
            onClick={onClose}
        >
            {/* Modal Full-Width Header */}
            <header
                style={{
                    height: "60px",
                    padding: "0 24px",
                    backgroundColor: "var(--bg-surface)",
                    borderBottom: "1px solid var(--border-color)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "16px",
                    flexShrink: 0
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: 0, flex: 1 }}>
                    <div style={{ transform: "scale(1.2)", display: "flex", alignItems: "center", flexShrink: 0 }}>
                        <FileIcon mimeType={mimeType} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                        <h2 style={{ fontSize: "16px", fontWeight: "700", color: "var(--text-main)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {file.orgName}
                        </h2>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                            {formatBytes(file.size)} • {mimeType}
                        </div>
                    </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
                    {onShare && (
                        <button className="btn btn-secondary" onClick={() => onShare(file.id)} style={{ padding: "7px 16px", fontSize: "13px" }}>
                            Share
                        </button>
                    )}
                    <button className="btn btn-primary" onClick={() => onDownload(null, file.id, file.orgName)} style={{ padding: "7px 18px", fontSize: "13px", fontWeight: "600" }}>
                        Download
                    </button>
                    <button
                        onClick={onClose}
                        style={{
                            background: "none",
                            border: "none",
                            fontSize: "22px",
                            color: "var(--text-muted)",
                            cursor: "pointer",
                            padding: "4px 8px",
                            marginLeft: "4px"
                        }}
                    >
                        ✕
                    </button>
                </div>
            </header>

            {/* Main Full Viewport Preview Body */}
            <main
                style={{ flex: 1, width: "100%", height: "calc(100vh - 60px)", overflow: "hidden", position: "relative" }}
                onClick={(e) => e.stopPropagation()}
            >
                {renderFullViewportPreview()}
            </main>
        </div>
    );
}
