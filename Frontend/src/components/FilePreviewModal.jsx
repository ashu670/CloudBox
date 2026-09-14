import React, { useState, useEffect } from "react";
import { formatBytes } from "../utils/formatters";
import { Download, X, Copy, Check, FileText, ExternalLink } from "lucide-react";

export default function FilePreviewModal({ previewItem, onClose, onDownload }) {
    const [textContent, setTextContent] = useState(null);
    const [loadingText, setLoadingText] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!previewItem || !previewItem.mimeType) return;
        const { mimeType, url } = previewItem;

        if (
            mimeType.startsWith("text/") ||
            mimeType === "application/json" ||
            mimeType.includes("javascript") ||
            mimeType.includes("typescript") ||
            mimeType.includes("xml") ||
            mimeType.includes("html")
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
                </div>
            );
        }

        if (mimeType === "application/pdf") {
            return (
                <div style={{ width: '100%', height: '65vh' }}>
                    <iframe src={url} title={file.orgName} className="preview-iframe" />
                </div>
            );
        }

        if (mimeType.startsWith("video/")) {
            return (
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%', padding: '10px' }}>
                    <video controls autoPlay src={url} className="preview-video" style={{ maxHeight: '60vh', width: '100%' }}>
                        Your browser does not support HTML5 video playback.
                    </video>
                </div>
            );
        }

        if (mimeType.startsWith("audio/")) {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', width: '100%' }}>
                    <div style={{ marginBottom: '16px', color: '#fbbf24' }}>
                        🎵 Audio Playback
                    </div>
                    <audio controls autoPlay src={url} className="preview-audio" style={{ width: '100%', maxWidth: '480px' }}>
                        Your browser does not support HTML5 audio.
                    </audio>
                </div>
            );
        }

        if (
            mimeType.startsWith("text/") ||
            mimeType === "application/json" ||
            mimeType.includes("javascript") ||
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
                    )}
                </div>
            );
        }

        return (
            <div style={{ textAlign: 'center', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
                <FileText size={48} color="#94a3b8" />
                <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#ffffff', marginBottom: '4px' }}>Preview Not Available</h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>This file type can be viewed after downloading to your device.</p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => onDownload(null, file.id, file.orgName)}>
                    <Download size={15} /> Download to View
                </button>
            </div>
        );
    };

    return (
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
        </div>
    );
}
