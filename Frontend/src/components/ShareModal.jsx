import React, { useState, useEffect } from "react";
import axios from "../api/axios";
import { formatBytes, formatDate } from "../utils/formatters";
import { lockBodyScroll, unlockBodyScroll } from "../utils/scrollLock";

// Helper to get matching file type badge and icon
const getFileIconInfo = (name = "", mimeType = "") => {
    const lower = (name || "").toLowerCase();
    const mime = (mimeType || "").toLowerCase();

    if (lower.endsWith(".pdf") || mime === "application/pdf") {
        return {
            bg: "rgba(239, 68, 68, 0.15)",
            color: "#ef4444",
            border: "rgba(239, 68, 68, 0.25)",
            label: "PDF",
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5z" />
                </svg>
            )
        };
    }
    if (lower.match(/\.(png|jpg|jpeg|gif|webp|svg)$/) || mime.startsWith("image/")) {
        return {
            bg: "rgba(16, 185, 129, 0.15)",
            color: "#10b981",
            border: "rgba(16, 185, 129, 0.25)",
            label: "Image",
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                </svg>
            )
        };
    }
    if (lower.match(/\.(mp4|mov|webm|mkv)$/) || mime.startsWith("video/")) {
        return {
            bg: "rgba(168, 85, 247, 0.15)",
            color: "#a855f7",
            border: "rgba(168, 85, 247, 0.25)",
            label: "Video",
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
            )
        };
    }
    if (lower.match(/\.(zip|tar|gz|rar|7z)$/) || mime.includes("zip")) {
        return {
            bg: "rgba(236, 72, 153, 0.15)",
            color: "#ec4899",
            border: "rgba(236, 72, 153, 0.25)",
            label: "Archive",
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 8v13H3V8" />
                    <path d="M1 3h22v5H1z" />
                    <path d="M10 12h4" />
                </svg>
            )
        };
    }
    return {
        bg: "rgba(99, 102, 241, 0.15)",
        color: "#6366f1",
        border: "rgba(99, 102, 241, 0.25)",
        label: "Document",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
            </svg>
        )
    };
};

export default function ShareModal({ item, onClose, showToast }) {
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [duration, setDuration] = useState("1d");
    const [shareData, setShareData] = useState(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!item) return;
        lockBodyScroll();
        return () => {
            unlockBodyScroll();
        };
    }, [item]);

    useEffect(() => {
        const fetchStatus = async () => {
            if (!item || !item.id) return;
            try {
                setLoading(true);
                const token = localStorage.getItem("accessToken");
                const res = await axios.get(`api/file/share/${item.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data?.success && res.data.data?.isShared) {
                    setShareData(res.data.data);
                } else {
                    setShareData(null);
                }
            } catch (err) {
                console.error("Error fetching share status:", err);
                setShareData(null);
            } finally {
                setLoading(false);
            }
        };

        fetchStatus();
    }, [item]);

    if (!item) return null;

    const fileName = item.orgName || item.name || "File";
    const fileSize = formatBytes(item.size || 0);
    const badge = getFileIconInfo(fileName, item.mimeType);

    const handleCreateOrUpdateShare = async (overrideDuration) => {
        const durToUse = overrideDuration || duration;
        try {
            setActionLoading(true);
            const token = localStorage.getItem("accessToken");
            const res = await axios.post(`api/file/share/${item.id}`, { duration: durToUse }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data?.success && res.data.data) {
                const newShare = res.data.data;
                setShareData({
                    isShared: true,
                    isActive: true,
                    shareUrl: newShare.shareUrl,
                    expiresAt: newShare.expiresAt
                });

                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(newShare.shareUrl);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 3000);
                }
                showToast("Share link generated and copied to clipboard!", "success");
            }
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to generate share link.";
            showToast(msg, "error");
        } finally {
            setActionLoading(false);
        }
    };

    const handleMakePrivate = async () => {
        try {
            setActionLoading(true);
            const token = localStorage.getItem("accessToken");
            const res = await axios.delete(`api/file/share/${item.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data?.success) {
                setShareData(null);
                setCopied(false);
                showToast("File is now private. Public link revoked.", "success");
            }
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to revoke link.";
            showToast(msg, "error");
        } finally {
            setActionLoading(false);
        }
    };

    const handleCopy = async () => {
        if (shareData?.shareUrl) {
            try {
                await navigator.clipboard.writeText(shareData.shareUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 3000);
                showToast("Link copied to clipboard!", "success");
            } catch {
                showToast("Failed to copy link.", "error");
            }
        }
    };

    const formatExpirationText = (expiresAt) => {
        if (!expiresAt) return "Never expires";
        const expDate = new Date(expiresAt);
        const diffMs = expDate - new Date();
        if (diffMs <= 0) return "Expired";
        
        const diffMins = Math.round(diffMs / (1000 * 60));
        if (diffMins < 60) return `Expires in ${diffMins} min${diffMins > 1 ? 's' : ''}`;
        
        const diffHours = Math.round(diffMs / (1000 * 60 * 60));
        if (diffHours < 24) return `Expires in ${diffHours} hour${diffHours > 1 ? 's' : ''}`;

        return `Expires on ${formatDate(expiresAt)}`;
    };

    const durationOptions = [
        { key: "1h", label: "1 Hour", desc: "Short-lived link" },
        { key: "1d", label: "24 Hours", desc: "Standard access" },
        { key: "1w", label: "7 Days", desc: "Weekly project" },
        { key: "never", label: "No Expiry", desc: "Permanent link" }
    ];

    return (
        <div className="cb-share-modal-backdrop" onClick={onClose}>
            <div className="cb-share-modal-card" onClick={(e) => e.stopPropagation()}>
                {/* ─── MODAL HEADER ───────────────────────────────── */}
                <div className="cb-share-modal-header">
                    <div className="cb-share-file-meta">
                        <div
                            className="cb-share-file-badge"
                            style={{ background: badge.bg, color: badge.color, borderColor: badge.border }}
                        >
                            {badge.icon}
                        </div>
                        <div className="cb-share-file-details">
                            <h2 className="cb-share-modal-title">Share File</h2>
                            <div className="cb-share-file-sub">
                                <span className="cb-share-file-name" title={fileName}>{fileName}</span>
                                <span className="cb-share-dot-sep">•</span>
                                <span className="cb-share-file-size">{fileSize}</span>
                            </div>
                        </div>
                    </div>
                    <button className="cb-share-close-btn" onClick={onClose} aria-label="Close modal">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* ─── MODAL BODY ─────────────────────────────────── */}
                <div className="cb-share-modal-body">
                    {loading ? (
                        <div className="cb-share-loading-state">
                            <div className="spinner" style={{ width: 28, height: 28 }}></div>
                            <span>Checking link status...</span>
                        </div>
                    ) : (
                        <>
                            {/* Status Card: Active vs Private */}
                            {shareData && shareData.isActive && shareData.shareUrl ? (
                                <div className="cb-share-status-card active">
                                    <div className="cb-share-status-top">
                                        <div className="cb-share-status-pill active">
                                            <span className="cb-pulse-indicator"></span>
                                            <span>Public Link Active</span>
                                        </div>
                                        <span className="cb-share-expiry-tag">
                                            {formatExpirationText(shareData.expiresAt)}
                                        </span>
                                    </div>

                                    {/* URL Input Box with Copy Button */}
                                    <div className="cb-share-link-box">
                                        <input
                                            type="text"
                                            readOnly
                                            value={shareData.shareUrl}
                                            className="cb-share-url-input"
                                            onClick={(e) => e.target.select()}
                                        />
                                        <button
                                            type="button"
                                            className={`cb-share-copy-btn ${copied ? 'copied' : ''}`}
                                            onClick={handleCopy}
                                        >
                                            {copied ? (
                                                <>
                                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                        <polyline points="20 6 9 17 4 12" />
                                                    </svg>
                                                    <span>Copied!</span>
                                                </>
                                            ) : (
                                                <>
                                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                                    </svg>
                                                    <span>Copy Link</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="cb-share-status-card private">
                                    <div className="cb-share-private-icon">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                        </svg>
                                    </div>
                                    <div className="cb-share-private-text">
                                        <h4>This file is currently private</h4>
                                        <p>Generate a secure public URL below to share access with anyone.</p>
                                    </div>
                                </div>
                            )}

                            {/* ─── EXPIRATION DURATION SELECTOR ──────────────── */}
                            <div className="cb-share-section">
                                <label className="cb-share-section-label">
                                    <span>Link Expiration Duration</span>
                                    <span className="cb-share-section-hint">Auto-revokes when time expires</span>
                                </label>
                                
                                <div className="cb-duration-segmented-grid">
                                    {durationOptions.map((opt) => {
                                        const isSelected = duration === opt.key;
                                        return (
                                            <button
                                                key={opt.key}
                                                type="button"
                                                onClick={() => setDuration(opt.key)}
                                                className={`cb-duration-tab ${isSelected ? "active" : ""}`}
                                            >
                                                <span className="cb-duration-tab-title">{opt.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* ─── FOOTER ACTIONS ────────────────────────────── */}
                            <div className="cb-share-modal-footer">
                                {shareData && shareData.isActive ? (
                                    <button
                                        type="button"
                                        onClick={handleMakePrivate}
                                        disabled={actionLoading}
                                        className="cb-share-btn-danger"
                                        title="Revoke the public link and make this file private"
                                    >
                                        Revoke Access
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="cb-share-btn-secondary"
                                    >
                                        Cancel
                                    </button>
                                )}

                                <div className="cb-share-footer-right">
                                    {shareData && shareData.isActive && (
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="cb-share-btn-secondary"
                                        >
                                            Done
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => handleCreateOrUpdateShare()}
                                        disabled={actionLoading}
                                        className="cb-share-btn-primary"
                                    >
                                        {actionLoading ? (
                                            <>
                                                <div className="spinner" style={{ width: 15, height: 15 }}></div>
                                                <span>Processing...</span>
                                            </>
                                        ) : shareData?.isActive ? (
                                            <>
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                                                    <polyline points="23 4 23 10 17 10" />
                                                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                                                </svg>
                                                <span>Update Expiry</span>
                                            </>
                                        ) : (
                                            <>
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                                                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                                </svg>
                                                <span>Generate Public URL</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
