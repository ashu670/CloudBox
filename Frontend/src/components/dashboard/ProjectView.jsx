import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "../../api/axios";
import { formatBytes, formatDate } from "../../utils/formatters";
import OwnerPanel from "../OwnerPanel";
import AdminPanel from "../AdminPanel";
import ActivityLogs from "../ActivityLogs";
import FolderRequests from "../FolderRequests";
import FolderMembers from "../FolderMembers";

// ── Helpers ───────────────────────────────────────────────────────────────────
function fileIcon(name = "", mime = "") {
    const n = name.toLowerCase();
    const m = (mime || "").toLowerCase();
    if (n.endsWith(".pdf") || m === "application/pdf")
        return { color: "#ef4444", bg: "rgba(239,68,68,.13)", label: "PDF" };
    if (n.match(/\.(png|jpg|jpeg|gif|webp|svg)$/) || m.startsWith("image/"))
        return { color: "#10b981", bg: "rgba(16,185,129,.13)", label: "IMG" };
    if (n.match(/\.(mp4|mov|webm|mkv)$/) || m.startsWith("video/"))
        return { color: "#a855f7", bg: "rgba(168,85,247,.13)", label: "VID" };
    if (n.match(/\.(mp3|wav|ogg|m4a)$/) || m.startsWith("audio/"))
        return { color: "#f59e0b", bg: "rgba(245,158,11,.13)", label: "AUD" };
    if (n.match(/\.(zip|tar|gz|rar|7z)$/) || m.includes("zip"))
        return { color: "#ec4899", bg: "rgba(236,72,153,.13)", label: "ZIP" };
    return { color: "#6366f1", bg: "rgba(99,102,241,.13)", label: "DOC" };
}

// ── Role badge ────────────────────────────────────────────────────────────────
const RoleBadge = ({ role }) => {
    const map = {
        OWNER:  { bg: "rgba(245, 158, 11, 0.14)", color: "#d97706", border: "rgba(245, 158, 11, 0.3)" },
        ADMIN:  { bg: "rgba(139, 92, 246, 0.14)", color: "#8b5cf6", border: "rgba(139, 92, 246, 0.3)" },
        EDITOR: { bg: "rgba(16, 185, 129, 0.14)", color: "#10b981", border: "rgba(16, 185, 129, 0.3)" },
        VIEWER: { bg: "rgba(59, 130, 246, 0.14)", color: "#3b82f6", border: "rgba(59, 130, 246, 0.3)" },
    };
    const s = map[role] || map.VIEWER;
    return (
        <span style={{
            background: s.bg,
            color: s.color,
            border: `1px solid ${s.border}`,
            padding: "2px 10px",
            borderRadius: "999px",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.5px",
            whiteSpace: "nowrap",
            display: "inline-block",
        }}>
            {role}
        </span>
    );
};

// ══════════════════════════════════════════════════════════════════════════════
// SHARED WORKSPACE VIEW
// ══════════════════════════════════════════════════════════════════════════════
export default function ProjectView({
    project,            // { id, name, isShared, ... }
    onClose,
    showToast,
    prefetchFolder,
    previewFile,
    downloadFile,
    openActionSheet,
    handleFileUpload,
    onProjectDeleted,
    onRefresh,
}) {
    const [activeTab, setActiveTab] = useState("files");
    const [contents, setContents] = useState({ folders: [], files: [] });
    const [loading, setLoading] = useState(true);
    const [subPath, setSubPath] = useState([]);   // breadcrumb stack inside the project
    const [viewFolderId, setViewFolderId] = useState(project.id);
    const [folderMetadata, setFolderMetadata] = useState(null);
    const [effectiveRole, setEffectiveRole] = useState(project.userRole || "VIEWER");

    // Inline Folder Creation
    const [showCreateFolder, setShowCreateFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);

    // File Input Ref for In-Workspace Upload
    const workspaceFileInputRef = useRef(null);

    const token = () => localStorage.getItem("accessToken");

    // ── fetch folder contents & effective role ────────────────────────────────
    const fetchContents = useCallback(async (fid) => {
        if (!fid) return;
        setLoading(true);
        try {
            const { data } = await axios.get(`api/folder/fetch/${fid}`, {
                headers: { Authorization: `Bearer ${token()}` }
            });
            const ch = data.children || {};
            setContents({
                folders: ch.children || [],
                files:   ch.files   || [],
            });
            setFolderMetadata(ch);
            if (ch.userRole) {
                setEffectiveRole(ch.userRole);
            }
        } catch (err) {
            console.error("Error loading shared folder contents:", err);
            const status = err.response?.status;
            if (status === 403) {
                showToast?.("Access to this shared folder is no longer available.", "error");
                onClose?.();
            } else if (status === 404) {
                showToast?.("This shared workspace no longer exists.", "error");
                onClose?.();
            } else {
                showToast?.(err.response?.data?.message || "Failed to load shared folder.", "error");
            }
            setContents({ folders: [], files: [] });
        } finally {
            setLoading(false);
        }
    }, [showToast, onClose]);

    useEffect(() => {
        setViewFolderId(project.id);
        setSubPath([]);
        setActiveTab("files");
    }, [project.id]);

    useEffect(() => {
        fetchContents(viewFolderId);
    }, [viewFolderId, fetchContents]);

    // ── navigate into subfolder ───────────────────────────────────────────────
    const openSubFolder = (folder) => {
        setSubPath(prev => [
            ...prev,
            { id: viewFolderId, name: prev.length === 0 ? project.name : (folderMetadata?.name || "Folder") }
        ]);
        setViewFolderId(folder.id);
    };

    const goBack = () => {
        if (subPath.length === 0) {
            onClose?.();
            return;
        }
        const prev = subPath[subPath.length - 1];
        setSubPath(p => p.slice(0, -1));
        setViewFolderId(prev.id);
    };

    const jumpTo = (idx) => {
        if (idx < 0) {
            setSubPath([]);
            setViewFolderId(project.id);
        } else {
            const entry = subPath[idx];
            setSubPath(p => p.slice(0, idx));
            setViewFolderId(entry.id);
        }
    };

    // ── Create Folder inside shared workspace ────────────────────────────────
    const handleCreateFolderSubmit = async (e) => {
        e.preventDefault();
        if (!newFolderName.trim()) return;
        setIsCreatingFolder(true);
        try {
            await axios.post("api/folder/create", {
                name: newFolderName.trim(),
                pid: viewFolderId
            }, {
                headers: { Authorization: `Bearer ${token()}` }
            });
            showToast?.(`Folder "${newFolderName}" created`, "success");
            setNewFolderName("");
            setShowCreateFolder(false);
            fetchContents(viewFolderId);
            onRefresh?.();
        } catch (err) {
            showToast?.(err.response?.data?.error || err.response?.data?.message || "Failed to create folder", "error");
        } finally {
            setIsCreatingFolder(false);
        }
    };

    // ── Upload into shared workspace ─────────────────────────────────────────
    const handleFileInputChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            files.forEach(file => {
                handleFileUpload?.(file, viewFolderId);
            });
            e.target.value = "";
            setTimeout(() => {
                fetchContents(viewFolderId);
            }, 1000);
        }
    };

    const isOwner = effectiveRole === "OWNER";
    const isAdmin = effectiveRole === "ADMIN";
    const isEditor = effectiveRole === "EDITOR";
    const canWrite = isOwner || isAdmin || isEditor;
    const isOwnerOrAdmin = isOwner || isAdmin;

    // ── Tabs Config ──────────────────────────────────────────────────────────
    const tabs = [
        { key: "files", label: "Files", icon: "M3 7h18M3 12h18M3 17h18" },
        { key: "members", label: "Members", icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" },
        ...(isOwnerOrAdmin ? [{ key: "activity", label: "Activity", icon: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2" }] : []),
        ...(isOwnerOrAdmin ? [{ key: "requests", label: "Requests", icon: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" }] : []),
        ...(isOwner ? [{ key: "settings", label: "Owner Panel", icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" }] : (isAdmin ? [{ key: "settings", label: "Admin Panel", icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" }] : [])),
    ];

    const ownerInfo = folderMetadata?.user?.email || folderMetadata?.user?.name || project.ownerEmail || (isOwner ? "You" : "Team Member");

    return (
        <div className="cb-shared-workspace-view">
            {/* Hidden File Input for Shared Workspace Upload */}
            <input
                ref={workspaceFileInputRef}
                type="file"
                multiple
                style={{ display: "none" }}
                onChange={handleFileInputChange}
            />

            {/* ── Top Navigation / Header Bar ────────────────────────────── */}
            <div className="cb-workspace-header">
                <div className="cb-workspace-header-top">
                    <button
                        type="button"
                        className="cb-workspace-back-btn"
                        onClick={goBack}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="19" y1="12" x2="5" y2="12" />
                            <polyline points="12 19 5 12 12 5" />
                        </svg>
                        <span>{subPath.length > 0 ? "Back" : (isOwner ? "Dashboard" : "Shared with me")}</span>
                    </button>

                    <div className="cb-workspace-header-actions">
                        {canWrite && (
                            <>
                                <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => setShowCreateFolder(prev => !prev)}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                                        <line x1="12" y1="11" x2="12" y2="17" />
                                        <line x1="9" y1="14" x2="15" y2="14" />
                                    </svg>
                                    <span>New Folder</span>
                                </button>

                                <button
                                    type="button"
                                    className="btn btn-primary btn-sm"
                                    onClick={() => workspaceFileInputRef.current?.click()}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="17 8 12 3 7 8" />
                                        <line x1="12" y1="3" x2="12" y2="15" />
                                    </svg>
                                    <span>Upload File</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className="cb-workspace-info-row">
                    <div className="cb-workspace-title-group">
                        <div className="cb-workspace-avatar-icon">
                            <svg viewBox="0 0 24 24" width="28" height="28">
                                <path fill="#7c3aed" d="M10,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V8C22,6.89 21.1,6 20,6H12L10,4Z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="cb-workspace-title">{project.name}</h1>
                            <div className="cb-workspace-meta-tags">
                                <span className="cb-workspace-owner-tag">
                                    Owner: <strong>{ownerInfo}</strong>
                                </span>
                                <span className="cb-workspace-role-tag">
                                    Role: <RoleBadge role={effectiveRole} />
                                </span>
                                {folderMetadata?.inviteCode && isOwnerOrAdmin && (
                                    <span
                                        className="cb-workspace-code-tag"
                                        onClick={() => {
                                            navigator.clipboard?.writeText(folderMetadata.inviteCode);
                                            showToast?.(`Invite code "${folderMetadata.inviteCode}" copied!`, "success");
                                        }}
                                        title="Click to copy invite code"
                                    >
                                        Code: <code>{folderMetadata.inviteCode}</code>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                        </svg>
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Tab Navigation Bar ──────────────────────────────────── */}
                <div className="cb-workspace-tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            type="button"
                            className={`cb-workspace-tab ${activeTab === tab.key ? "active" : ""}`}
                            onClick={() => setActiveTab(tab.key)}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d={tab.icon} />
                            </svg>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Workspace Body ─────────────────────────────────────────── */}
            <div className="cb-workspace-body">
                {activeTab === "files" && (
                    <div className="cb-workspace-files-view">
                        {/* Scoped Breadcrumbs Bar */}
                        <div className="cb-workspace-breadcrumbs">
                            <span className="cb-bc-root" onClick={() => jumpTo(-1)}>
                                {project.name}
                            </span>
                            {subPath.map((item, idx) => (
                                <React.Fragment key={item.id || idx}>
                                    <span className="cb-bc-sep">/</span>
                                    <span
                                        className={`cb-bc-item ${idx === subPath.length - 1 ? 'active' : ''}`}
                                        onClick={() => jumpTo(idx)}
                                    >
                                        {item.name}
                                    </span>
                                </React.Fragment>
                            ))}
                        </div>

                        {/* Inline Create Folder Form */}
                        {showCreateFolder && (
                            <form onSubmit={handleCreateFolderSubmit} className="cb-workspace-create-form">
                                <input
                                    type="text"
                                    placeholder="Subfolder name..."
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                    className="input-field input-field-sm"
                                    autoFocus
                                />
                                <button type="submit" className="btn btn-primary btn-sm" disabled={isCreatingFolder}>
                                    {isCreatingFolder ? "Creating..." : "Create"}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => setShowCreateFolder(false)}
                                >
                                    Cancel
                                </button>
                            </form>
                        )}

                        {/* Loading State */}
                        {loading ? (
                            <div className="cb-workspace-loading">
                                <div className="spinner" />
                                <span>Loading workspace files...</span>
                            </div>
                        ) : (
                            <>
                                {/* Subfolders Section */}
                                {contents.folders.length > 0 && (
                                    <section className="cb-workspace-section">
                                        <h3 className="cb-workspace-section-title">
                                            Folders ({contents.folders.length})
                                        </h3>
                                        <div className="cb-workspace-folders-grid">
                                            {contents.folders.map(folder => (
                                                <div
                                                    key={folder.id}
                                                    className="cb-workspace-folder-card"
                                                    onClick={() => openSubFolder(folder)}
                                                    onMouseEnter={() => prefetchFolder?.(folder.id)}
                                                >
                                                    <div className="cb-workspace-folder-icon">
                                                        <svg viewBox="0 0 24 24" width="28" height="28">
                                                            <path fill="#f59e0b" d="M10,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V8C22,6.89 21.1,6 20,6H12L10,4Z" />
                                                        </svg>
                                                    </div>
                                                    <span className="cb-workspace-folder-name" title={folder.name}>
                                                        {folder.name}
                                                    </span>
                                                    {canWrite && (
                                                        <button
                                                            type="button"
                                                            className="cb-workspace-item-menu"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openActionSheet?.(folder, 'folder');
                                                            }}
                                                        >
                                                            ⋮
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* Files Section */}
                                {contents.files.length > 0 && (
                                    <section className="cb-workspace-section">
                                        <h3 className="cb-workspace-section-title">
                                            Files ({contents.files.length})
                                        </h3>
                                        <div className="cb-workspace-files-list">
                                            {contents.files.map(file => {
                                                const badge = fileIcon(file.orgName || file.name, file.mimeType);
                                                return (
                                                    <div
                                                        key={file.id}
                                                        className="cb-workspace-file-row"
                                                        onClick={(e) => previewFile?.(e, file)}
                                                    >
                                                        <div className="cb-workspace-file-badge" style={{ background: badge.bg, color: badge.color }}>
                                                            {badge.label}
                                                        </div>
                                                        <div className="cb-workspace-file-info">
                                                            <span className="cb-workspace-file-name" title={file.orgName || file.name}>
                                                                {file.orgName || file.name}
                                                            </span>
                                                            <span className="cb-workspace-file-meta">
                                                                {formatBytes(file.size || 0)} • {formatDate(file.updatedAt || file.createdAt)}
                                                            </span>
                                                        </div>
                                                        <div className="cb-workspace-file-actions" onClick={(e) => e.stopPropagation()}>
                                                            <button
                                                                type="button"
                                                                className="cb-btn-icon-sm"
                                                                onClick={(e) => downloadFile?.(e, file.id, file.orgName || file.name)}
                                                                title="Download file"
                                                            >
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                                    <polyline points="7 10 12 15 17 10" />
                                                                    <line x1="12" y1="15" x2="12" y2="3" />
                                                                </svg>
                                                            </button>
                                                            {canWrite && (
                                                                <button
                                                                    type="button"
                                                                    className="cb-btn-icon-sm"
                                                                    onClick={() => openActionSheet?.(file, 'file')}
                                                                    title="File actions"
                                                                >
                                                                    ⋮
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </section>
                                )}

                                {/* Empty Directory State */}
                                {contents.folders.length === 0 && contents.files.length === 0 && (
                                    <div className="cb-workspace-empty">
                                        <div className="cb-workspace-empty-icon">
                                            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                                                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                                            </svg>
                                        </div>
                                        <h4>This shared folder is empty</h4>
                                        <p>
                                            {canWrite
                                                ? "Upload files or create subfolders to start collaborating."
                                                : "No files or subfolders have been added yet."}
                                        </p>
                                        {canWrite && (
                                            <div className="cb-workspace-empty-actions">
                                                <button
                                                    type="button"
                                                    className="btn btn-primary btn-sm"
                                                    onClick={() => workspaceFileInputRef.current?.click()}
                                                >
                                                    Upload File
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={() => setShowCreateFolder(true)}
                                                >
                                                    Create Folder
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {activeTab === "members" && (
                    <div className="cb-workspace-panel-wrap">
                        <FolderMembers folderId={project.id} />
                    </div>
                )}

                {activeTab === "activity" && isOwnerOrAdmin && (
                    <div className="cb-workspace-panel-wrap">
                        <ActivityLogs folderId={project.id} />
                    </div>
                )}

                {activeTab === "requests" && isOwnerOrAdmin && (
                    <div className="cb-workspace-panel-wrap">
                        <FolderRequests
                            folderId={project.id}
                            onRequestHandled={onRefresh}
                            onNotify={(msg, type) => showToast?.(msg, type)}
                        />
                    </div>
                )}

                {activeTab === "settings" && (
                    <div className="cb-workspace-panel-wrap">
                        {isOwner ? (
                            <OwnerPanel
                                folderId={project.id}
                                onNotify={(msg, type) => showToast?.(msg, type)}
                                onRefresh={onRefresh}
                                onProjectDeleted={onProjectDeleted}
                            />
                        ) : isAdmin ? (
                            <AdminPanel
                                folderId={project.id}
                                onNotify={(msg, type) => showToast?.(msg, type)}
                                onRefresh={onRefresh}
                            />
                        ) : null}
                    </div>
                )}
            </div>
        </div>
    );
}
