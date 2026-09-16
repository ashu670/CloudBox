import React, { useState, useEffect, useCallback } from "react";
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

function timeAgo(d) {
    if (!d) return "";
    const diff = Date.now() - new Date(d).getTime();
    const m = Math.round(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.round(h / 24)}d ago`;
}

// ── Sub-components ───────────────────────────────────────────────────────────
function FolderCard({ folder, onClick, onMouseEnter }) {
    return (
        <div
            className="pv-folder-card"
            onClick={() => onClick(folder)}
            onMouseEnter={() => onMouseEnter && onMouseEnter(folder.id)}
            title={folder.name}
        >
            <div className="pv-folder-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                </svg>
            </div>
            <span className="pv-folder-name">{folder.name}</span>
        </div>
    );
}

function FileRow({ file, onPreview }) {
    const badge = fileIcon(file.orgName || file.name, file.mimeType);
    return (
        <div className="pv-file-row" onClick={() => onPreview && onPreview(file)}>
            <div className="pv-file-badge" style={{ background: badge.bg, color: badge.color }}>
                {badge.label}
            </div>
            <div className="pv-file-info">
                <span className="pv-file-name" title={file.orgName || file.name}>
                    {file.orgName || file.name}
                </span>
                <span className="pv-file-meta">
                    {formatBytes(file.size || 0)} · {timeAgo(file.createdAt || file.updatedAt)}
                </span>
            </div>
        </div>
    );
}

// ── TABS config ──────────────────────────────────────────────────────────────
const TABS = [
    { key: "files",    label: "Files",        icon: "M3 7h18M3 12h18M3 17h18" },
    { key: "owner",    label: "Owner Panel",  icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" },
    { key: "members",  label: "Members",      icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" },
    { key: "activity", label: "Activity",     icon: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2" },
    { key: "requests", label: "Requests",     icon: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" },
];

// ══════════════════════════════════════════════════════════════════════════════
// PROJECT VIEW
// ══════════════════════════════════════════════════════════════════════════════
export default function ProjectView({
    project,            // { id, name, isShared, ... }
    onClose,
    showToast,
    prefetchFolder,
    previewFile,
    userRole,           // OWNER | ADMIN | EDITOR | VIEWER (passed from parent)
    onProjectDeleted,
    onRefresh,
}) {
    const [activeTab, setActiveTab] = useState("files");
    const [contents, setContents] = useState({ folders: [], files: [] });
    const [loading, setLoading] = useState(true);
    const [subPath, setSubPath] = useState([]);   // breadcrumb stack inside the project
    const [viewFolderId, setViewFolderId] = useState(project.id);

    // ── fetch folder contents ─────────────────────────────────────────────────
    const fetchContents = useCallback(async (fid) => {
        if (!fid) return;
        setLoading(true);
        try {
            const { data } = await axios.get(`api/folder/fetch/${fid}`);
            const ch = data.children || {};
            setContents({
                folders: ch.children || [],
                files:   ch.files   || [],
            });
        } catch (err) {
            showToast?.(err.response?.data?.message || "Failed to load folder.", "error");
            setContents({ folders: [], files: [] });
        } finally {
            setLoading(false);
        }
    }, [showToast]);

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
        setSubPath(prev => [...prev, { id: viewFolderId, name: prev.length === 0 ? project.name : prev[prev.length - 1]?.name }]);
        setViewFolderId(folder.id);
    };

    const goBack = () => {
        if (subPath.length === 0) return;
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

    const isOwnerOrAdmin = userRole === "OWNER" || userRole === "ADMIN";

    // ── visible tabs ──────────────────────────────────────────────────────────
    const visibleTabs = TABS.filter(t => {
        if (t.key === "owner")    return userRole === "OWNER";
        if (t.key === "members")  return isOwnerOrAdmin;
        if (t.key === "activity") return isOwnerOrAdmin;
        if (t.key === "requests") return userRole === "OWNER";
        return true;
    });

    return (
        <div className="pv-overlay">
            {/* ── Header ─────────────────────────────────────────────────── */}
            <div className="pv-header">
                <div className="pv-header-left">
                    <div className="pv-project-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="3" width="20" height="14" rx="2" />
                            <line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="pv-project-title">{project.name}</h2>
                        <div className="pv-project-badges">
                            <span className="pv-badge pv-badge-shared">Shared Project</span>
                            {userRole && <span className={`pv-badge pv-badge-role pv-role-${(userRole || "").toLowerCase()}`}>{userRole}</span>}
                        </div>
                    </div>
                </div>
                <button className="pv-close-btn" onClick={onClose} aria-label="Close project view">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            </div>

            {/* ── Tab Bar ────────────────────────────────────────────────── */}
            <div className="pv-tab-bar">
                {visibleTabs.map(tab => (
                    <button
                        key={tab.key}
                        className={`pv-tab ${activeTab === tab.key ? "active" : ""}`}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d={tab.icon} />
                        </svg>
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* ── Body ───────────────────────────────────────────────────── */}
            <div className="pv-body">
                {activeTab === "files" && (
                    <div className="pv-files-panel">
                        {/* Breadcrumbs */}
                        {subPath.length > 0 && (
                            <div className="pv-breadcrumbs">
                                <button className="pv-bc-item pv-bc-link" onClick={() => jumpTo(-1)}>{project.name}</button>
                                {subPath.slice(0, -1).map((s, i) => (
                                    <span key={s.id} className="pv-bc-chunk">
                                        <span className="pv-bc-sep">/</span>
                                        <button className="pv-bc-item pv-bc-link" onClick={() => jumpTo(i)}>{s.name}</button>
                                    </span>
                                ))}
                                <span className="pv-bc-chunk">
                                    <span className="pv-bc-sep">/</span>
                                    <span className="pv-bc-item pv-bc-current">
                                        {subPath[subPath.length - 1]?.name || "…"}
                                    </span>
                                </span>
                            </div>
                        )}

                        {loading ? (
                            <div className="pv-loading">
                                <div className="spinner" style={{ width: 28, height: 28 }} />
                                <span>Loading contents…</span>
                            </div>
                        ) : (
                            <>
                                {/* Sub-folders grid */}
                                {contents.folders.length > 0 && (
                                    <section className="pv-section">
                                        <h4 className="pv-section-title">Folders</h4>
                                        <div className="pv-folders-grid">
                                            {contents.folders.map(f => (
                                                <FolderCard
                                                    key={f.id}
                                                    folder={f}
                                                    onClick={openSubFolder}
                                                    onMouseEnter={prefetchFolder}
                                                />
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* Files list */}
                                {contents.files.length > 0 && (
                                    <section className="pv-section">
                                        <h4 className="pv-section-title">Files</h4>
                                        <div className="pv-files-list">
                                            {contents.files.map(f => (
                                                <FileRow key={f.id} file={f} onPreview={previewFile} />
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {contents.folders.length === 0 && contents.files.length === 0 && (
                                    <div className="pv-empty-state">
                                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" opacity="0.3">
                                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                                        </svg>
                                        <p>This folder is empty</p>
                                        <span>Upload files or create sub-folders to get started.</span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {activeTab === "owner" && (
                    <div className="pv-panel-wrap">
                        <OwnerPanel
                            folderId={project.id}
                            onNotify={(msg, type) => showToast?.(msg, type)}
                            onRefresh={onRefresh}
                            onProjectDeleted={onProjectDeleted}
                        />
                    </div>
                )}

                {activeTab === "members" && (
                    <div className="pv-panel-wrap">
                        <FolderMembers folderId={project.id} />
                    </div>
                )}

                {activeTab === "activity" && (
                    <div className="pv-panel-wrap">
                        <ActivityLogs folderId={project.id} />
                    </div>
                )}

                {activeTab === "requests" && (
                    <div className="pv-panel-wrap">
                        <FolderRequests
                            folderId={project.id}
                            onRequestHandled={onRefresh}
                            onNotify={(msg, type) => showToast?.(msg, type)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
