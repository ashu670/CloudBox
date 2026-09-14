import React, { useState, useEffect } from "react";
import { formatBytes } from "../utils/formatters";
<<<<<<< HEAD
import { Download, X, Copy, Check, FileText, ExternalLink } from "lucide-react";

export default function FilePreviewModal({ previewItem, onClose, onDownload }) {
    const [textContent, setTextContent] = useState(null);
    const [loadingText, setLoadingText] = useState(false);
    const [copied, setCopied] = useState(false);
=======
import { lockBodyScroll, unlockBodyScroll } from "../utils/scrollLock";
import FileIcon from "./fileIcon";
import PdfPreview from "./pdfPreview";

export default function FilePreviewModal({ previewItem, onClose, onDownload, onShare }) {
    const [textContent, setTextContent] = useState(null);
    const [loadingText, setLoadingText] = useState(false);

    useEffect(() => {
        if (!previewItem) return;
        lockBodyScroll();
        return () => {
            unlockBodyScroll();
        };
    }, [previewItem]);
>>>>>>> main

    useEffect(() => {
        if (!previewItem || !previewItem.mimeType) return;
        const { mimeType, url } = previewItem;

        if (
            mimeType.startsWith("text/") ||
            mimeType === "application/json" ||
            mimeType.includes("javascript") ||
<<<<<<< HEAD
            mimeType.includes("typescript") ||
            mimeType.includes("xml") ||
            mimeType.includes("html")
=======
            mimeType.includes("xml")
>>>>>>> main
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

<<<<<<< HEAD
    const handleCopyText = () => {
        if (textContent) {
            navigator.clipboard.writeText(textContent);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const renderPreviewBody = () => {
        if (mimeType.startsWith("image/")) {
            return (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', minHeight: '350px' }}>
                    <img src={url} alt={file.orgName} className="preview-image" />
=======
    const renderFullViewportPreview = () => {
        if (mimeType.startsWith("image/")) {
            return (
                <div style={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "var(--bg-app)", padding: "16px" }}>
                    <img
                        src={url}
                        alt={file.orgName}
                        style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: "6px", boxShadow: "0 8px 30px rgba(0,0,0,0.3)" }}
                    />
>>>>>>> main
                </div>
            );
        }

        if (mimeType === "application/pdf") {
<<<<<<< HEAD
            return (
                <div style={{ width: '100%', height: '65vh' }}>
                    <iframe src={url} title={file.orgName} className="preview-iframe" />
                </div>
            );
=======
            return <PdfPreview url={url} />;
>>>>>>> main
        }

        if (mimeType.startsWith("video/")) {
            return (
<<<<<<< HEAD
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%', padding: '10px' }}>
                    <video controls autoPlay src={url} className="preview-video" style={{ maxHeight: '60vh', width: '100%' }}>
=======
                <div style={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "#000" }}>
                    <video
                        controls
                        controlsList="nodownload"
                        autoPlay
                        src={url}
                        style={{ maxWidth: "100%", maxHeight: "100%" }}
                    >
>>>>>>> main
                        Your browser does not support HTML5 video playback.
                    </video>
                </div>
            );
        }

        if (mimeType.startsWith("audio/")) {
            return (
<<<<<<< HEAD
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', width: '100%' }}>
                    <div style={{ marginBottom: '16px', color: '#fbbf24' }}>
                        🎵 Audio Playback
                    </div>
                    <audio controls autoPlay src={url} className="preview-audio" style={{ width: '100%', maxWidth: '480px' }}>
                        Your browser does not support HTML5 audio.
                    </audio>
=======
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
>>>>>>> main
                </div>
            );
        }

        if (
            mimeType.startsWith("text/") ||
            mimeType === "application/json" ||
            mimeType.includes("javascript") ||
<<<<<<< HEAD
            mimeType.includes("typescript") ||
            mimeType.includes("xml") ||
            mimeType.includes("html")
        ) {
            return (
                <div style={{ width: '100%', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                        <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={handleCopyText}
                            style={{ fontSize: '12px' }}
                        >
                            {copied ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                            {copied ? "Copied!" : "Copy Code"}
                        </button>
                    </div>
                    {loadingText ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading code content...</div>
                    ) : (
                        <pre className="preview-code-block"><code>{textContent}</code></pre>
=======
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
>>>>>>> main
                    )}
                </div>
            );
        }

        return (
<<<<<<< HEAD
            <div style={{ textAlign: 'center', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
                <FileText size={48} color="#94a3b8" />
                <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#ffffff', marginBottom: '4px' }}>Preview Not Available</h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>This file type can be viewed after downloading to your device.</p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => onDownload(null, file.id, file.orgName)}>
                    <Download size={15} /> Download to View
                </button>
=======
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
>>>>>>> main
            </div>
        );
    };

    return (
<<<<<<< HEAD
        <div className="modal-overlay" onClick={onClose}>
            <div className="preview-modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="preview-modal-header">
                    <div className="preview-title-group">
                        <span className="preview-file-name">{file.orgName}</span>
                        <span className="preview-file-meta">
                            {formatBytes(file.size)} • {mimeType}
                        </span>
                    </div>
                    <div className="preview-header-actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => onDownload(null, file.id, file.orgName)}>
                            <Download size={14} /> Download
                        </button>
                        <button className="preview-close-btn" onClick={onClose} aria-label="Close preview modal">
                            <X size={18} />
                        </button>
                    </div>
                </div>
                <div className="preview-modal-body">{renderPreviewBody()}</div>
            </div>
=======
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
                className="preview-modal-header"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="preview-header-info">
                    <div className="preview-file-icon">
                        <FileIcon mimeType={mimeType} />
                    </div>
                    <div className="preview-title-container">
                        <h2 className="preview-file-name" title={file.orgName}>
                            {file.orgName}
                        </h2>
                        <div className="preview-file-meta">
                            {formatBytes(file.size)} <span className="preview-meta-mime">• {mimeType}</span>
                        </div>
                    </div>
                </div>

                <div className="preview-header-actions">
                    {onShare && (
                        <button className="btn btn-secondary preview-action-btn" onClick={() => onShare(file.id)}>
                            Share
                        </button>
                    )}
                    <button className="btn btn-primary preview-action-btn" onClick={() => onDownload(null, file.id, file.orgName)}>
                        Download
                    </button>
                    <button
                        className="preview-close-btn"
                        onClick={onClose}
                        aria-label="Close preview"
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
>>>>>>> main
        </div>
    );
}
