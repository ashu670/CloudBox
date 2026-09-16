import React, { useState, useEffect, useCallback } from "react";
import axios from "../api/axios";
import FileIcon from "./fileIcon";
import { formatBytes } from "../utils/formatters";
import { lockBodyScroll, unlockBodyScroll } from "../utils/scrollLock";

export default function TrashModal({ onClose, showToast, refreshDashboard }) {
    const [trashItems, setTrashItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [restoringId, setRestoringId] = useState(null);
    const [restoringAll, setRestoringAll] = useState(false);

    useEffect(() => {
        lockBodyScroll();
        return () => {
            unlockBodyScroll();
        };
    }, []);

    const fetchTrashItems = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("accessToken");
            const res = await axios.get("api/trash", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data && res.data.items) {
                setTrashItems(res.data.items);
            }
        } catch (err) {
            console.error("Error fetching trash items:", err);
            showToast?.(err.response?.data?.error || "Failed to load trash items", "error");
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchTrashItems();
    }, [fetchTrashItems]);

    const [deletingId, setDeletingId] = useState(null);

    const handleRestoreItem = async (id, name) => {
        setRestoringId(id);
        try {
            const token = localStorage.getItem("accessToken");
            const res = await axios.post(`api/trash/restore/${id}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showToast?.(res.data?.message || `Restored "${name}"`, "success");
            setTrashItems(prev => prev.filter(item => item.id !== id));
            refreshDashboard?.();
        } catch (err) {
            console.error(`Error restoring item ${id}:`, err);
            showToast?.(err.response?.data?.error || `Failed to restore "${name}"`, "error");
        } finally {
            setRestoringId(null);
        }
    };

    const handleDeletePermanentItem = async (id, name) => {
        if (!window.confirm(`Are you sure you want to permanently delete "${name}"? This action cannot be undone.`)) {
            return;
        }
        setDeletingId(id);
        try {
            const token = localStorage.getItem("accessToken");
            const res = await axios.delete(`api/trash/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showToast?.(res.data?.message || `Permanently deleted "${name}"`, "success");
            setTrashItems(prev => prev.filter(item => item.id !== id));
            refreshDashboard?.();
        } catch (err) {
            console.error(`Error deleting item ${id} permanently:`, err);
            showToast?.(err.response?.data?.error || `Failed to permanently delete "${name}"`, "error");
        } finally {
            setDeletingId(null);
        }
    };

    const handleRestoreAll = async () => {
        if (trashItems.length === 0) return;
        setRestoringAll(true);
        try {
            const token = localStorage.getItem("accessToken");
            const res = await axios.post("api/trash/restore/all", {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showToast?.(res.data?.message || "Restored all items from trash", "success");
            setTrashItems([]);
            refreshDashboard?.();
        } catch (err) {
            console.error("Error restoring all trash items:", err);
            showToast?.(err.response?.data?.error || "Failed to restore items", "error");
        } finally {
            setRestoringAll(false);
        }
    };

    return (
        <div className="file-preview-modal-backdrop" onClick={onClose}>
            <div className="file-preview-modal-card trash-modal-card" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="trash-modal-header">
                    <div className="trash-modal-title-group">
                        <div className="trash-modal-header-icon">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                <path d="M10 11v6" />
                                <path d="M14 11v6" />
                                <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                            </svg>
                        </div>
                        <div className="trash-modal-title-text">
                            <h2 className="trash-modal-title">Trash Bin</h2>
                            <p className="trash-modal-subtitle">Items stored 30 days before permanent deletion</p>
                        </div>
                    </div>

                    <div className="trash-modal-header-actions">
                        {trashItems.length > 0 && (
                            <button
                                className="trash-restore-all-btn"
                                onClick={handleRestoreAll}
                                disabled={restoringAll || loading}
                            >
                                {restoringAll ? (
                                    <>
                                        <span className="spinner-sm" /> Restoring...
                                    </>
                                ) : (
                                    <>
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="1 4 1 10 7 10" />
                                            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                                        </svg>
                                        <span>Restore All ({trashItems.length})</span>
                                    </>
                                )}
                            </button>
                        )}
                        <button className="preview-close-btn" onClick={onClose} aria-label="Close trash modal">
                            ✕
                        </button>
                    </div>
                </div>

                {/* Body Content */}
                <div className="trash-modal-body">
                    {loading ? (
                        <div className="trash-loading-state">
                            <div className="spinner-lg" />
                            <p>Loading trash items...</p>
                        </div>
                    ) : trashItems.length === 0 ? (
                        <div className="trash-empty-state">
                            <div className="trash-empty-icon-wrap">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                    <path d="M10 11v6" />
                                    <path d="M14 11v6" />
                                    <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                                </svg>
                            </div>
                            <h3>Your Trash is Empty</h3>
                            <p>Deleted files and folders will appear here for 30 days before being permanently removed.</p>
                        </div>
                    ) : (
                        <div className="trash-items-wrapper">
                            <div className="trash-items-table-header">
                                <span className="col-item">Item Name</span>
                                <span className="col-location">Original Location</span>
                                <span className="col-size">Size</span>
                                <span className="col-expiry">Auto Deletes In</span>
                                <span className="col-action">Action</span>
                            </div>

                            <div className="trash-items-list">
                                {trashItems.map((item) => {
                                    const isFolder = item.type === "FOLDER";
                                    const isRestoringThis = restoringId === item.id;

                                    return (
                                        <div key={item.id} className="trash-item-row">
                                            {/* Col 1: Item Name */}
                                            <div className="trash-col-name">
                                                <div className="trash-item-icon">
                                                    {isFolder ? (
                                                        <svg width="20" height="20" viewBox="0 0 24 20" fill="#8b5cf6">
                                                            <path d="M20 4h-7.586l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z" />
                                                        </svg>
                                                    ) : (
                                                        <FileIcon mimeType={item.mimeType || ""} size={20} />
                                                    )}
                                                </div>
                                                <span className="trash-item-name" title={item.name}>
                                                    {item.name}
                                                </span>
                                                <span className="trash-item-type-badge">
                                                    {isFolder ? "Folder" : "File"}
                                                </span>
                                            </div>

                                            {/* Col 2: Location */}
                                            <div className="trash-col-location">
                                                <span className="location-pill" title={item.location}>
                                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                                                    </svg>
                                                    <span>{item.location || "Root"}</span>
                                                </span>
                                            </div>

                                            {/* Col 3: Size */}
                                            <div className="trash-col-size">
                                                <span className="meta-pill">
                                                    {isFolder ? "—" : formatBytes(item.size || 0)}
                                                </span>
                                            </div>

                                            {/* Col 4: Expiry */}
                                            <div className="trash-col-expiry">
                                                <span className={`expiry-badge ${(item.secondsLeft <= 60 || item.daysLeft <= 3) ? "urgent" : ""}`}>
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <circle cx="12" cy="12" r="10" />
                                                        <polyline points="12 6 12 12 16 14" />
                                                    </svg>
                                                    <span>
                                                        {item.secondsLeft !== undefined && item.secondsLeft <= 60
                                                            ? (item.secondsLeft === 0 ? "Expiring now" : `${item.secondsLeft}s left`)
                                                            : (item.daysLeft === 0 ? "Expires today" : `${item.daysLeft} ${item.daysLeft === 1 ? "day" : "days"}`)}
                                                    </span>
                                                </span>
                                            </div>

                                            {/* Col 5: Actions */}
                                            <div className="trash-col-actions">
                                                <button
                                                    className="trash-restore-btn"
                                                    onClick={() => handleRestoreItem(item.id, item.name)}
                                                    disabled={isRestoringThis || deletingId === item.id || restoringAll}
                                                    title="Restore item"
                                                >
                                                    {isRestoringThis ? (
                                                        <span className="spinner-sm" />
                                                    ) : (
                                                        <>
                                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                                                <polyline points="1 4 1 10 7 10" />
                                                                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                                                            </svg>
                                                            <span>Restore</span>
                                                        </>
                                                    )}
                                                </button>
                                                <button
                                                    className="trash-delete-btn"
                                                    onClick={() => handleDeletePermanentItem(item.id, item.name)}
                                                    disabled={isRestoringThis || deletingId === item.id || restoringAll}
                                                    title="Delete Permanently"
                                                >
                                                    {deletingId === item.id ? (
                                                        <span className="spinner-sm" />
                                                    ) : (
                                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                                            <polyline points="3 6 5 6 21 6" />
                                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                                        </svg>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
