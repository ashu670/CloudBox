import React, { useState, useEffect } from "react";
import { formatBytes } from "../utils/formatters";

export default function FilePreviewModal({ previewItem, onClose, onDownload }) {
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

    const renderPreviewBody = () => {
        if (mimeType.startsWith("image/")) {
            return (
                <div className="preview-image-container">
                    <img src={url} alt={file.orgName} className="preview-image" />
                </div>
            );
        }

        if (mimeType === "application/pdf") {
            return (
                <div className="preview-pdf-container">
                    <iframe src={url} title={file.orgName} className="preview-iframe" />
                </div>
            );
        }

        if (mimeType.startsWith("video/")) {
            return (
                <div className="preview-media-container">
                    <video controls autoPlay src={url} className="preview-video">
                        Your browser does not support HTML5 video playback.
                    </video>
                </div>
            );
        }

        if (mimeType.startsWith("audio/")) {
            return (
                <div className="preview-media-container audio">
                    <audio controls autoPlay src={url} className="preview-audio">
                        Your browser does not support HTML5 audio.
                    </audio>
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
                <div className="preview-text-container">
                    {loadingText ? (
                        <div className="loading-container"><div className="spinner"></div></div>
                    ) : (
                        <pre className="preview-code-block"><code>{textContent}</code></pre>
                    )}
                </div>
            );
        }

        return (
            <div className="preview-fallback">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                </svg>
                <p>Preview not available for this file type.</p>
                <button className="btn btn-primary" onClick={() => onDownload(null, file.id, file.orgName)}>
                    Download to View
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
                            Download
                        </button>
                        <button className="preview-close-btn" onClick={onClose}>
                            ✕
                        </button>
                    </div>
                </div>
                <div className="preview-modal-body">{renderPreviewBody()}</div>
            </div>
        </div>
    );
}
