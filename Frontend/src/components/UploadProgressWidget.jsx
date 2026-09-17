import React, { useState, useEffect } from "react";
import { formatBytes, formatSpeed, formatRemainingTime } from "../utils/formatters";

export default function UploadProgressWidget({
    uploads = [],
    onRetry,
    onDismiss,
    onClearCompleted
}) {
    const [isMinimized, setIsMinimized] = useState(false);
    const [isOnline, setIsOnline] = useState(() => typeof navigator !== "undefined" ? navigator.onLine : true);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);
        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    if (!uploads || uploads.length === 0) {
        return null;
    }

    const activeCount = uploads.filter(u => u.status === 'PREPARING' || u.status === 'UPLOADING' || u.status === 'COMPLETING').length;
    const completedCount = uploads.filter(u => u.status === 'SUCCESS').length;
    const errorCount = uploads.filter(u => u.status === 'ERROR').length;
    const totalCount = uploads.length;

    const getHeaderTitle = () => {
        if (activeCount > 0) {
            return `Uploading ${activeCount} ${activeCount === 1 ? 'item' : 'items'}...`;
        }
        if (errorCount > 0 && completedCount === 0) {
            return `${errorCount} upload failed`;
        }
        if (completedCount > 0) {
            return `${completedCount} ${completedCount === 1 ? 'upload' : 'uploads'} complete`;
        }
        return `Uploads (${totalCount})`;
    };

    return (
        <aside
            className={`cb-upload-widget ${isMinimized ? 'minimized' : ''}`}
            aria-label="Upload Progress"
            role="region"
        >
            {/* Header */}
            <div className="cb-upload-widget-header" onClick={() => setIsMinimized(prev => !prev)}>
                <div className="cb-upload-widget-header-left">
                    {activeCount > 0 ? (
                        <div className="cb-upload-spin-icon" aria-hidden="true">
                            <svg className="cb-spinner-svg" viewBox="0 0 24 24" width="16" height="16">
                                <circle className="cb-spinner-circle-bg" cx="12" cy="12" r="10" fill="none" strokeWidth="3" />
                                <circle className="cb-spinner-circle-val" cx="12" cy="12" r="10" fill="none" strokeWidth="3" strokeDasharray="31.4 31.4" />
                            </svg>
                        </div>
                    ) : errorCount > 0 ? (
                        <span className="cb-upload-badge-icon error" aria-hidden="true">✕</span>
                    ) : (
                        <span className="cb-upload-badge-icon success" aria-hidden="true">✓</span>
                    )}
                    <span className="cb-upload-widget-title">{getHeaderTitle()}</span>
                </div>

                <div className="cb-upload-widget-header-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                        type="button"
                        className="cb-upload-widget-btn"
                        onClick={() => setIsMinimized(prev => !prev)}
                        title={isMinimized ? "Expand upload panel" : "Minimize upload panel"}
                        aria-label={isMinimized ? "Expand" : "Minimize"}
                    >
                        {isMinimized ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="18 15 12 9 6 15" />
                            </svg>
                        ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        )}
                    </button>

                    <button
                        type="button"
                        className="cb-upload-widget-btn close"
                        onClick={onClearCompleted}
                        title="Clear completed uploads"
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Offline Alert Banner */}
            {!isOnline && !isMinimized && (
                <div className="cb-upload-offline-banner">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="1" y1="1" x2="23" y2="23" />
                        <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
                        <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
                        <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
                        <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
                        <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                        <line x1="12" y1="20" x2="12.01" y2="20" />
                    </svg>
                    <span>Offline — Waiting for connection...</span>
                </div>
            )}

            {/* List of uploads */}
            {!isMinimized && (
                <div className="cb-upload-list">
                    {uploads.map((item) => {
                        const isUploading = item.status === 'UPLOADING';
                        const isPreparing = item.status === 'PREPARING';
                        const isCompleting = item.status === 'COMPLETING';
                        const isSuccess = item.status === 'SUCCESS';
                        const isError = item.status === 'ERROR';

                        return (
                            <div key={item.id} className={`cb-upload-item ${item.status.toLowerCase()}`}>
                                <div className="cb-upload-item-top">
                                    <div className="cb-upload-item-file-info">
                                        <svg className="cb-upload-file-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                            <polyline points="14 2 14 8 20 8" />
                                        </svg>
                                        <div className="cb-upload-name-wrap">
                                            <span className="cb-upload-file-name" title={item.fileName}>
                                                {item.fileName}
                                            </span>
                                            <span className="cb-upload-size-sub">
                                                {formatBytes(item.fileSize)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action buttons for item */}
                                    <div className="cb-upload-item-actions">
                                        {isError && (
                                            <button
                                                type="button"
                                                className="cb-upload-btn-text retry"
                                                onClick={() => onRetry?.(item.id)}
                                                title="Retry this upload"
                                            >
                                                Retry
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            className="cb-upload-btn-text dismiss"
                                            onClick={() => onDismiss?.(item.id)}
                                            title="Dismiss item"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div className="cb-upload-progress-bar-wrap">
                                    <div
                                        className={`cb-upload-progress-bar-fill ${item.status.toLowerCase()}`}
                                        style={{
                                            width: isSuccess ? "100%" : `${Math.max(3, item.progress || 0)}%`
                                        }}
                                    />
                                </div>

                                {/* Status & Metrics Info */}
                                <div className="cb-upload-item-bottom">
                                    <div className="cb-upload-status-detail">
                                        {isPreparing && (
                                            <span className="cb-upload-stage preparing">
                                                Preparing upload...
                                            </span>
                                        )}
                                        {isUploading && (
                                            <span className="cb-upload-stage uploading">
                                                <strong>{item.progress}%</strong> • {formatBytes(item.uploadedBytes)} / {formatBytes(item.totalBytes)} • Upload speed: <strong>{formatSpeed(item.speed)}</strong>
                                            </span>
                                        )}
                                        {isCompleting && (
                                            <span className="cb-upload-stage completing">
                                                Finalizing...
                                            </span>
                                        )}
                                        {isSuccess && (
                                            <span className="cb-upload-stage success">
                                                ✓ Uploaded
                                            </span>
                                        )}
                                        {isError && (
                                            <span className="cb-upload-stage error" title={item.error}>
                                                ✕ {item.error || "Upload failed"}
                                            </span>
                                        )}
                                    </div>

                                    {isUploading && (
                                        <div className="cb-upload-time-remaining">
                                            {formatRemainingTime(item.remainingTimeSec)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </aside>
    );
}
