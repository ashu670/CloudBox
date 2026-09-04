import React, { useState, useEffect } from "react";
import axios from "../api/axios";
import { formatBytes, formatDate } from "../utils/formatters";

export default function ShareModal({ item, onClose, showToast }) {
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [duration, setDuration] = useState("1d");
    const [shareData, setShareData] = useState(null);

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
                }
                showToast("Share link copied to clipboard!", "success");
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
                showToast("File is now private. Share link revoked.", "success");
            }
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to make file private.";
            showToast(msg, "error");
        } finally {
            setActionLoading(false);
        }
    };

    const handleCopy = async () => {
        if (shareData?.shareUrl) {
            try {
                await navigator.clipboard.writeText(shareData.shareUrl);
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

    return (
        <div className="file-preview-modal-backdrop" onClick={onClose}>
            <div className="file-preview-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "480px", width: "90%", padding: "28px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                    <div>
                        <h2 style={{ fontSize: "20px", fontWeight: "700", margin: 0, color: "var(--text-main)" }}>Share File</h2>
                        <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "4px 0 0 0" }}>
                            {item.orgName || item.name} ({formatBytes(item.size || 0)})
                        </p>
                    </div>
                    <button className="preview-close-btn" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px" }}>✕</button>
                </div>

                {loading ? (
                    <div style={{ textAlign: "center", padding: "30px 0" }}>
                        <div className="spinner" style={{ margin: "0 auto" }}></div>
                        <p style={{ marginTop: "12px", color: "var(--text-secondary)", fontSize: "14px" }}>Loading share details...</p>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        {shareData && shareData.isActive && shareData.shareUrl ? (
                            <div style={{ padding: "16px", borderRadius: "10px", backgroundColor: "var(--bg-app)", border: "1px solid var(--border-color)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                    <span style={{ fontSize: "12px", fontWeight: "600", color: "#10b981", display: "flex", alignItems: "center", gap: "6px" }}>
                                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#10b981" }}></span>
                                        Public Link Active
                                    </span>
                                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                                        {formatExpirationText(shareData.expiresAt)}
                                    </span>
                                </div>
                                <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                                    <input
                                        type="text"
                                        readOnly
                                        value={shareData.shareUrl}
                                        style={{
                                            flex: 1,
                                            padding: "8px 12px",
                                            borderRadius: "6px",
                                            border: "1px solid var(--border-color)",
                                            backgroundColor: "var(--bg-card)",
                                            fontSize: "13px",
                                            color: "var(--text-main)"
                                        }}
                                    />
                                    <button onClick={handleCopy} className="btn btn-secondary btn-sm" style={{ whiteSpace: "nowrap" }}>
                                        Copy Link
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div style={{ padding: "14px", borderRadius: "10px", backgroundColor: "var(--bg-app)", border: "1px solid var(--border-color)", textAlign: "center" }}>
                                <p style={{ margin: 0, fontSize: "13.5px", color: "var(--text-secondary)" }}>
                                    This file is currently <strong>Private</strong>. Generate a public link below to share it.
                                </p>
                            </div>
                        )}

                        <div>
                            <label style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-main)", marginBottom: "8px", display: "block" }}>
                                Link Expiration Duration
                            </label>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
                                {[
                                    { key: "1h", label: "1 Hour" },
                                    { key: "1d", label: "1 Day" },
                                    { key: "1w", label: "1 Week" },
                                    { key: "never", label: "Never" }
                                ].map((opt) => (
                                    <button
                                        key={opt.key}
                                        type="button"
                                        onClick={() => setDuration(opt.key)}
                                        className={`btn ${duration === opt.key ? "btn-primary" : "btn-secondary"}`}
                                        style={{
                                            padding: "8px 4px",
                                            fontSize: "12.5px",
                                            fontWeight: duration === opt.key ? "600" : "400",
                                            justifyContent: "center"
                                        }}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: "10px", marginTop: "10px", justifyContent: "flex-end" }}>
                            {shareData && shareData.isActive && (
                                <button
                                    onClick={handleMakePrivate}
                                    disabled={actionLoading}
                                    className="btn btn-secondary"
                                    style={{ color: "#ef4444", borderColor: "#ef4444", marginRight: "auto" }}
                                >
                                    Make Private
                                </button>
                            )}
                            <button onClick={onClose} className="btn btn-secondary">
                                Cancel
                            </button>
                            <button
                                onClick={() => handleCreateOrUpdateShare()}
                                disabled={actionLoading}
                                className="btn btn-primary"
                            >
                                {actionLoading ? "Processing..." : shareData?.isActive ? "Update Link Expiry" : "Generate Public URL"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
