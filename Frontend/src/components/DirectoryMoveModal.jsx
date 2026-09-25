import React, { useState, useEffect, useCallback } from "react";
import axios from "../api/axios";
import { BackArrowIcon, MoveIcon } from "./ActionIcons";
import { lockBodyScroll, unlockBodyScroll } from "../utils/scrollLock";

export default function DirectoryMoveModal({ movingItem, onClose, onMoveSuccess, showToast }) {
    const rootFolderId = Number(localStorage.getItem("rootFolderId")) || -1;
    const workspaceRootId = movingItem?.workspace?.rootId !== undefined && movingItem?.workspace?.rootId !== null
        ? movingItem.workspace.rootId
        : (rootFolderId !== -1 ? rootFolderId : -1);
    const workspaceRootName = movingItem?.workspace?.rootName || (movingItem?.workspace?.type === 'PROJECT' ? "Project Root" : "Root Drive");

    useEffect(() => {
        if (!movingItem) return;
        lockBodyScroll();
        return () => {
            unlockBodyScroll();
        };
    }, [movingItem]);

    const [pickerFolderId, setPickerFolderId] = useState(() => workspaceRootId);
    const [history, setHistory] = useState([]);
    const [currentFolderName, setCurrentFolderName] = useState(workspaceRootName);
    const [subfolders, setSubfolders] = useState([]);
    const [loading, setLoading] = useState(false);

    const isUploadMode = movingItem?.type === 'upload_file';
    const isCreateMode = movingItem?.type === 'create_folder';

    // Inline folder creation
    const [showCreateForm, setShowCreateForm] = useState(isCreateMode);
    const [newFolderName, setNewFolderName] = useState("");
    const [creating, setCreating] = useState(false);

    const token = () => localStorage.getItem("accessToken");

    const fetchSubfolders = useCallback(async (folderId) => {
        setLoading(true);
        try {
            const fetchId = (folderId === -1 && workspaceRootId !== -1) ? workspaceRootId : folderId;
            const res = await axios.get(`api/folder/fetch/${fetchId}`, {
                headers: { Authorization: `Bearer ${token()}` }
            });
            const children = res.data.children?.children || [];
            setSubfolders(children);
            if (res.data.children && res.data.children.name) {
                if (folderId === workspaceRootId || folderId === -1) {
                    setCurrentFolderName(workspaceRootName);
                } else {
                    setCurrentFolderName(res.data.children.name === "root" ? "Root Drive" : res.data.children.name);
                }
            } else if (folderId === -1 || folderId === workspaceRootId) {
                setCurrentFolderName(workspaceRootName);
            }
        } catch (err) {
            console.error("Error fetching picker subfolders:", err);
            showToast?.(err.response?.data?.error || "Failed to load directory", "error");
        } finally {
            setLoading(false);
        }
    }, [showToast, workspaceRootId, workspaceRootName]);

    useEffect(() => {
        fetchSubfolders(pickerFolderId);
    }, [pickerFolderId, fetchSubfolders]);

    const handleOpenFolder = (folder) => {
        // Exclude moving folder into itself
        if (movingItem?.type === 'folder' && folder.id === movingItem.id) {
            showToast?.("Cannot move a folder into itself", "error");
            return;
        }
        setHistory((prev) => [...prev, { id: folder.id, name: folder.name }]);
        setPickerFolderId(folder.id);
    };

    const handleNavigateBack = () => {
        if (history.length === 0) return;
        const newHist = [...history];
        newHist.pop();
        setHistory(newHist);
        const prevId = newHist.length === 0 ? (workspaceRootId !== -1 ? workspaceRootId : -1) : newHist[newHist.length - 1].id;
        setPickerFolderId(prevId);
    };

    const handleBreadcrumbClick = (index) => {
        if (index === -1) {
            setHistory([]);
            setPickerFolderId(workspaceRootId !== -1 ? workspaceRootId : -1);
            return;
        }
        const newHist = history.slice(0, index + 1);
        setHistory(newHist);
        setPickerFolderId(newHist[newHist.length - 1].id);
    };

    const handleCreateFolderSubmit = async (e) => {
        e?.preventDefault();
        if (!newFolderName.trim()) {
            showToast?.("Please enter a folder name", "error");
            return;
        }
        setCreating(true);
        try {
            const targetPid = (pickerFolderId === -1 || pickerFolderId === 0) ? (rootFolderId !== -1 ? rootFolderId : null) : pickerFolderId;
            await axios.post("api/folder/create", {
                name: newFolderName.trim(),
                pid: targetPid
            }, {
                headers: { Authorization: `Bearer ${token()}` }
            });
            showToast?.(`Folder "${newFolderName}" created successfully`, "success");
            setNewFolderName("");
            setShowCreateForm(false);
            if (isCreateMode) {
                await onMoveSuccess?.(targetPid);
            } else {
                fetchSubfolders(pickerFolderId);
            }
        } catch (err) {
            showToast?.(err.response?.data?.error || "Failed to create folder", "error");
        } finally {
            setCreating(false);
        }
    };

    const handleActionClick = async () => {
        if (!movingItem) return;
        const targetPid = (pickerFolderId === -1 || pickerFolderId === 0) ? (workspaceRootId !== -1 ? workspaceRootId : 0) : pickerFolderId;

        if (isUploadMode) {
            if (targetPid === 0) {
                showToast?.("Files cannot be uploaded to Root level. Please select a folder.", "error");
                return;
            }
            await onMoveSuccess(targetPid);
            return;
        }

        if (isCreateMode) {
            if (showCreateForm && newFolderName.trim()) {
                await handleCreateFolderSubmit();
            } else {
                setShowCreateForm(true);
            }
            return;
        }

        if (movingItem.type === 'file' && targetPid === 0) {
            showToast?.("Files cannot be moved to Root level", "error");
            return;
        }

        if (movingItem.type === 'folder' && movingItem.id === targetPid) {
            showToast?.("Cannot move a folder into itself", "error");
            return;
        }

        await onMoveSuccess(targetPid);
    };

    if (!movingItem) return null;

    // Filter subfolders so moving folder itself is omitted
    const validSubfolders = movingItem.type === 'folder'
        ? subfolders.filter(f => f.id !== movingItem.id)
        : subfolders;

    const badgeLabel = isUploadMode ? "Uploading" : isCreateMode ? "New Folder" : "Moving";
    const badgeStyle = isUploadMode
        ? { background: "rgba(59, 130, 246, 0.12)", color: "#3b82f6" }
        : isCreateMode
            ? { background: "rgba(139, 92, 246, 0.12)", color: "#8b5cf6" }
            : {};

    const buttonLabel = isUploadMode ? "Upload Here" : isCreateMode ? "+ New Folder" : "Move Here";

    return (
        <div className="directory-move-backdrop">
            <div className="directory-move-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="move-modal-header">
                    <div className="move-header-info">
                        <span className="move-badge" style={badgeStyle}>{badgeLabel}</span>
                        <span className="move-item-name">{movingItem.name}</span>
                    </div>
                    <button type="button" className="move-close-btn" onClick={onClose}>✕</button>
                </div>

                {/* Directory Navigation & Toolbar */}
                <div className="move-modal-toolbar">
                    <div className="move-breadcrumbs">
                        <span
                            className={`move-crumb ${(pickerFolderId === -1 || pickerFolderId === workspaceRootId) && history.length === 0 ? 'active' : ''}`}
                            onClick={() => handleBreadcrumbClick(-1)}
                        >
                            {workspaceRootName}
                        </span>
                        {history.map((h, idx) => (
                            <React.Fragment key={h.id}>
                                <span className="move-crumb-sep">/</span>
                                <span
                                    className={`move-crumb ${idx === history.length - 1 ? 'active' : ''}`}
                                    onClick={() => handleBreadcrumbClick(idx)}
                                >
                                    {h.name}
                                </span>
                            </React.Fragment>
                        ))}
                    </div>

                    <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setShowCreateForm(!showCreateForm)}
                    >
                        + New Folder
                    </button>
                </div>

                {/* Inline New Folder Form */}
                {showCreateForm && (
                    <form onSubmit={handleCreateFolderSubmit} className="move-create-form">
                        <input
                            type="text"
                            placeholder="Folder name..."
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            className="input-field input-field-sm"
                            autoFocus
                        />
                        <button type="submit" className="btn btn-primary btn-sm" disabled={creating}>
                            {creating ? "Creating..." : "Create"}
                        </button>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowCreateForm(false)}>
                            Cancel
                        </button>
                    </form>
                )}

                {/* Directory List Container */}
                <div className="move-directory-body">
                    {history.length > 0 && (
                        <div className="move-folder-item back-item" onClick={handleNavigateBack}>
                            <BackArrowIcon size={18} color="var(--text-muted)" />
                            <span className="folder-item-name">.. (Go Back)</span>
                        </div>
                    )}

                    {loading ? (
                        <div className="loading-container">
                            <div className="spinner"></div>
                        </div>
                    ) : validSubfolders.length === 0 ? (
                        <div className="move-empty-directory">
                            <p>No subfolders in this directory.</p>
                            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                                {isUploadMode
                                    ? `You can tap "Upload Here" below to upload "${movingItem.name}" to this folder.`
                                    : isCreateMode
                                        ? `You can tap "+ New Folder" above to create a folder here.`
                                        : `You can tap "Move Here" below to place "${movingItem.name}" in this directory.`}
                            </p>
                        </div>
                    ) : (
                        validSubfolders.map((folder) => (
                            <div
                                key={folder.id}
                                className="move-folder-item"
                                onClick={() => handleOpenFolder(folder)}
                            >
                                <svg className="move-folder-icon" viewBox="0 0 24 24" width="22" height="22">
                                    <path fill="#f59e0b" d="M10,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V8C22,6.89 21.1,6 20,6H12L10,4Z" />
                                </svg>
                                <span className="folder-item-name">{folder.name}</span>
                                <svg className="move-folder-arrow" viewBox="0 0 24 24" width="18" height="18">
                                    <path fill="currentColor" d="M8.59,16.59L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.59Z" />
                                </svg>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer Action Bar */}
                <div className="move-modal-footer">
                    <div className="target-location-summary">
                        Destination: <strong>{currentFolderName}</strong>
                    </div>
                    <div className="move-footer-buttons">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="button" className="btn btn-primary" onClick={handleActionClick} style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                            {isUploadMode ? (
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="17 8 12 3 7 8" />
                                    <line x1="12" y1="3" x2="12" y2="15" />
                                </svg>
                            ) : isCreateMode ? (
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                                    <line x1="12" y1="11" x2="12" y2="17" />
                                    <line x1="9" y1="14" x2="15" y2="14" />
                                </svg>
                            ) : (
                                <MoveIcon size={16} color="#ffffff" />
                            )}
                            <span>{buttonLabel}</span>
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
