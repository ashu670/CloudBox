import React, { useState, useMemo } from "react";
import { formatBytes, formatDate } from "../../utils/formatters";

// Distinctive badge icons matching CloudBox visual language
const getFileBadge = (name = "", mimeType = "") => {
    const lower = (name || "").toLowerCase();
    const mime = (mimeType || "").toLowerCase();

    if (lower.endsWith(".pdf") || mime === "application/pdf") {
        return {
            bg: "rgba(239, 68, 68, 0.14)",
            color: "#ef4444",
            border: "rgba(239, 68, 68, 0.25)",
            label: "PDF",
            category: "document",
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5z" />
                </svg>
            )
        };
    }
    if (lower.endsWith(".fig") || lower.includes("figma")) {
        return {
            bg: "rgba(168, 85, 247, 0.14)",
            color: "#a855f7",
            border: "rgba(168, 85, 247, 0.25)",
            label: "Figma",
            category: "document",
            icon: (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                    <path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H12v7H8.5A3.5 3.5 0 0 1 5 5.5z" />
                    <path d="M12 2h3.5a3.5 3.5 0 1 1 0 7H12V2z" />
                    <path d="M12 12.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 1 1-7 0z" />
                    <path d="M5 19.5A3.5 3.5 0 0 1 8.5 16H12v3.5a3.5 3.5 0 1 1-7 0z" />
                    <path d="M5 12.5A3.5 3.5 0 0 1 8.5 9H12v7H8.5A3.5 3.5 0 0 1 5 12.5z" />
                </svg>
            )
        };
    }
    if (lower.endsWith(".mp4") || lower.endsWith(".mov") || lower.endsWith(".webm") || mime.startsWith("video/")) {
        return {
            bg: "rgba(147, 51, 234, 0.14)",
            color: "#a855f7",
            border: "rgba(147, 51, 234, 0.25)",
            label: "Video",
            category: "media",
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
            )
        };
    }
    if (lower.endsWith(".docx") || lower.endsWith(".doc") || lower.endsWith(".txt") || lower.endsWith(".md")) {
        return {
            bg: "rgba(59, 130, 246, 0.14)",
            color: "#3b82f6",
            border: "rgba(59, 130, 246, 0.25)",
            label: "Document",
            category: "document",
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                </svg>
            )
        };
    }
    if (lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".gif") || lower.endsWith(".webp") || lower.endsWith(".svg") || mime.startsWith("image/")) {
        return {
            bg: "rgba(16, 185, 129, 0.14)",
            color: "#10b981",
            border: "rgba(16, 185, 129, 0.25)",
            label: "Image",
            category: "image",
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                </svg>
            )
        };
    }
    if (lower.endsWith(".mp3") || lower.endsWith(".wav") || lower.endsWith(".ogg") || mime.startsWith("audio/")) {
        return {
            bg: "rgba(245, 158, 11, 0.14)",
            color: "#f59e0b",
            border: "rgba(245, 158, 11, 0.25)",
            label: "Audio",
            category: "media",
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
            )
        };
    }
    if (lower.endsWith(".zip") || lower.endsWith(".rar") || lower.endsWith(".tar") || lower.endsWith(".gz")) {
        return {
            bg: "rgba(236, 72, 153, 0.14)",
            color: "#ec4899",
            border: "rgba(236, 72, 153, 0.25)",
            label: "Archive",
            category: "archive",
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 8v13H3V8" />
                    <path d="M1 3h22v5H1z" />
                    <path d="M10 12h4" />
                </svg>
            )
        };
    }
    return {
        bg: "rgba(100, 116, 139, 0.14)",
        color: "#64748b",
        border: "rgba(100, 116, 139, 0.25)",
        label: "File",
        category: "other",
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                <polyline points="13 2 13 9 20 9" />
            </svg>
        )
    };
};

const folderPalette = [
    { gradient: "linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(99, 102, 241, 0.08) 100%)", iconColor: "#8b5cf6", glow: "rgba(139, 92, 246, 0.3)" },
    { gradient: "linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(59, 130, 246, 0.08) 100%)", iconColor: "#38bdf8", glow: "rgba(56, 189, 248, 0.3)" },
    { gradient: "linear-gradient(135deg, rgba(251, 113, 133, 0.2) 0%, rgba(244, 63, 94, 0.08) 100%)", iconColor: "#fb7185", glow: "rgba(251, 113, 133, 0.3)" },
    { gradient: "linear-gradient(135deg, rgba(74, 222, 128, 0.2) 0%, rgba(34, 197, 94, 0.08) 100%)", iconColor: "#4ade80", glow: "rgba(74, 222, 128, 0.3)" },
    { gradient: "linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.08) 100%)", iconColor: "#fbbf24", glow: "rgba(251, 191, 36, 0.3)" },
    { gradient: "linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(217, 70, 239, 0.08) 100%)", iconColor: "#c084fc", glow: "rgba(168, 85, 247, 0.3)" }
];

export default function MyDriveView({
    folders = [],
    files = [],
    loading = false,
    currentFolderId,
    rootFolderId,
    history = [],
    currentFolderInfo,
    handleFolderSelect,
    prefetchFolder,
    goBack,
    onUploadClick,
    onCreateFolderClick,
    previewFile,
    downloadFile,
    openActionSheet,
    editingItem,
    renameValue,
    setRenameValue,
    handleRenameSubmit,
    viewMode = "list",
    setViewMode,
    userName = "",
    userInitials = "U",
    dropTargetId,
    handleDragStartItem,
    handleDragEndItem,
    handleDragOverTarget,
    handleDragLeaveTarget,
    handleDropOnTarget
}) {
    const [filterCategory, setFilterCategory] = useState("all");
    const [sortBy, setSortBy] = useState("name");
    const [sortAsc, setSortAsc] = useState(true);

    const isRoot = history.length === 0 || currentFolderId === rootFolderId || currentFolderId === -1;
    const currentTitle = isRoot ? "My Drive" : (currentFolderInfo?.name || "Folder");

    // Filtered & Sorted files
    const displayedFiles = useMemo(() => {
        let list = [...files];
        if (filterCategory !== "all") {
            list = list.filter(f => {
                const badge = getFileBadge(f.orgName, f.mimeType);
                return badge.category === filterCategory;
            });
        }
        list.sort((a, b) => {
            let valA, valB;
            if (sortBy === "name") {
                valA = (a.orgName || "").toLowerCase();
                valB = (b.orgName || "").toLowerCase();
            } else if (sortBy === "size") {
                valA = Number(a.size || 0);
                valB = Number(b.size || 0);
            } else if (sortBy === "date") {
                valA = new Date(a.updatedAt || a.createdAt || 0).getTime();
                valB = new Date(b.updatedAt || b.createdAt || 0).getTime();
            }
            if (valA < valB) return sortAsc ? -1 : 1;
            if (valA > valB) return sortAsc ? 1 : -1;
            return 0;
        });
        return list;
    }, [files, filterCategory, sortBy, sortAsc]);

    const toggleSort = (field) => {
        if (sortBy === field) {
            setSortAsc(prev => !prev);
        } else {
            setSortBy(field);
            setSortAsc(true);
        }
    };

    return (
        <div className="cb-mydrive-workspace">
            {/* ─── 1. TOP TITLE & ACTION TOOLBAR ─────────────────────────────── */}
            <div className="cb-mydrive-top-toolbar">
                <div className="cb-mydrive-nav-flow">
                    {/* Back Button when drilled down */}
                    {!isRoot && (
                        <button
                            type="button"
                            className="cb-mydrive-back-pill"
                            onClick={goBack}
                            title="Go to previous folder"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="19" y1="12" x2="5" y2="12" />
                                <polyline points="12 19 5 12 12 5" />
                            </svg>
                            <span>Back</span>
                        </button>
                    )}

                    {/* Integrated Breadcrumbs Path */}
                    <nav className="cb-mydrive-breadcrumb-trail" aria-label="Directory Breadcrumbs">
                        <button
                            type="button"
                            className={`cb-trail-item ${isRoot ? 'active' : ''}`}
                            onClick={() => handleFolderSelect({ id: rootFolderId !== -1 ? rootFolderId : -1, name: "Root" })}
                            onMouseEnter={() => prefetchFolder && prefetchFolder(rootFolderId !== -1 ? rootFolderId : -1)}
                        >
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                            </svg>
                            <span>My Drive</span>
                        </button>

                        {history.map((folder, idx) => {
                            const isCurrent = idx === history.length - 1;
                            return (
                                <React.Fragment key={folder.id || idx}>
                                    <span className="cb-trail-separator">›</span>
                                    <button
                                        type="button"
                                        className={`cb-trail-item ${isCurrent ? 'active' : ''}`}
                                        onClick={() => handleFolderSelect(folder)}
                                        onMouseEnter={() => prefetchFolder && prefetchFolder(folder.id)}
                                        title={folder.name}
                                    >
                                        <span>{folder.name}</span>
                                    </button>
                                </React.Fragment>
                            );
                        })}
                    </nav>

                    <div className="cb-mydrive-meta-badge">
                        {folders.length} {folders.length === 1 ? 'folder' : 'folders'} • {files.length} {files.length === 1 ? 'file' : 'files'}
                    </div>
                </div>

                <div className="cb-mydrive-action-group">
                    <button
                        type="button"
                        className="cb-btn-upload-primary"
                        onClick={onUploadClick}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        <span>Upload File</span>
                    </button>

                    <button
                        type="button"
                        className="cb-btn-create-subtle"
                        onClick={onCreateFolderClick}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                            <line x1="12" y1="11" x2="12" y2="17" />
                            <line x1="9" y1="14" x2="15" y2="14" />
                        </svg>
                        <span>New Folder</span>
                    </button>

                    {/* View Switcher Toggle */}
                    <div className="cb-view-toggle-pill">
                        <button
                            type="button"
                            className={`cb-view-pill-btn ${viewMode === 'list' ? 'active' : ''}`}
                            onClick={() => setViewMode && setViewMode('list')}
                            title="List View"
                            aria-label="List View"
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                <line x1="8" y1="6" x2="21" y2="6" />
                                <line x1="8" y1="12" x2="21" y2="12" />
                                <line x1="8" y1="18" x2="21" y2="18" />
                                <line x1="3" y1="6" x2="3.01" y2="6" />
                                <line x1="3" y1="12" x2="3.01" y2="12" />
                                <line x1="3" y1="18" x2="3.01" y2="18" />
                            </svg>
                        </button>
                        <button
                            type="button"
                            className={`cb-view-pill-btn ${viewMode === 'grid' ? 'active' : ''}`}
                            onClick={() => setViewMode && setViewMode('grid')}
                            title="Grid View"
                            aria-label="Grid View"
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                                <rect x="14" y="14" width="7" height="7" rx="1.5" />
                                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* ─── 2. CATEGORY FILTERS ─────────────────────────────────────────── */}
            <div className="cb-filter-tabs-row">
                <div className="cb-filter-chips-list">
                    {[
                        { id: "all", label: "All Items" },
                        { id: "document", label: "Documents" },
                        { id: "image", label: "Images" },
                        { id: "media", label: "Media" },
                        { id: "archive", label: "Archives" }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            type="button"
                            className={`cb-filter-chip ${filterCategory === tab.id ? 'active' : ''}`}
                            onClick={() => setFilterCategory(tab.id)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ─── 3. FOLDERS SECTION ───────────────────────────────────────────── */}
            {folders.length > 0 && filterCategory === "all" && (
                <section className="cb-drive-block">
                    <div className="cb-block-header">
                        <div className="cb-block-title-wrap">
                            <h2 className="cb-block-title">Folders</h2>
                            <span className="cb-block-count-badge">{folders.length}</span>
                        </div>
                    </div>

                    {viewMode === "grid" ? (
                        /* ─── GRID VIEW FOR FOLDERS ─── */
                        <div className="cb-folders-grid-fluid">
                            {folders.map((folder, idx) => {
                                const isEditing = editingItem && editingItem.type === 'folder' && editingItem.id === folder.id;
                                const isTarget = dropTargetId === folder.id;
                                const palette = folderPalette[idx % folderPalette.length];
                                const countText = `${folder.fileCount ?? (folder.files ? folder.files.length : (folder.totalFiles ?? 0))} items`;

                                return (
                                    <div
                                        key={folder.id}
                                        className={`cb-folder-tile ${isTarget ? 'drag-over' : ''}`}
                                        style={{
                                            "--folder-glow": palette.glow
                                        }}
                                        onClick={() => {
                                            if (!isEditing) handleFolderSelect(folder);
                                        }}
                                        onMouseEnter={() => prefetchFolder && prefetchFolder(folder.id)}
                                        draggable={!isEditing}
                                        onDragStart={(e) => handleDragStartItem && handleDragStartItem(e, { type: 'folder', id: folder.id, name: folder.name })}
                                        onDragEnd={handleDragEndItem}
                                        onDragOver={(e) => handleDragOverTarget && handleDragOverTarget(e, folder.id)}
                                        onDragLeave={(e) => handleDragLeaveTarget && handleDragLeaveTarget(e, folder.id)}
                                        onDrop={(e) => handleDropOnTarget && handleDropOnTarget(e, folder.id)}
                                    >
                                        <div className="cb-folder-tile-top">
                                            <div className="cb-folder-icon-glow" style={{ color: palette.iconColor, background: palette.gradient }}>
                                                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z" />
                                                </svg>
                                            </div>

                                            {!isEditing && (
                                                <button
                                                    type="button"
                                                    className="cb-folder-action-trigger"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openActionSheet(folder, 'folder');
                                                    }}
                                                    aria-label="Folder Options"
                                                    title="Folder options"
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                        <circle cx="12" cy="12" r="2" />
                                                        <circle cx="19" cy="12" r="2" />
                                                        <circle cx="5" cy="12" r="2" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>

                                        <div className="cb-folder-tile-body">
                                            {isEditing ? (
                                                <form
                                                    onSubmit={(e) => handleRenameSubmit(e, folder.id, 'folder')}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="cb-rename-form"
                                                >
                                                    <input
                                                        value={renameValue}
                                                        onChange={(e) => setRenameValue(e.target.value)}
                                                        className="cb-rename-input"
                                                        autoFocus
                                                    />
                                                    <button type="submit" className="cb-rename-save">Save</button>
                                                </form>
                                            ) : (
                                                <>
                                                    <span className="cb-folder-tile-name" title={folder.name}>
                                                        {folder.name}
                                                    </span>
                                                    {folder._isOptimistic ? (
                                                        <span className="cb-optimistic-tag">Creating...</span>
                                                    ) : (
                                                        <span className="cb-folder-tile-sub">
                                                            {countText}
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        /* ─── LIST VIEW FOR FOLDERS ─── */
                        <div className="cb-drive-table-wrapper cb-folders-list-wrapper">
                            <div className="cb-drive-table-header">
                                <div className="cb-tbl-col-name">Name</div>
                                <div className="cb-tbl-col-type">Type</div>
                                <div className="cb-tbl-col-size">Items</div>
                                <div className="cb-tbl-col-date">Modified</div>
                                <div className="cb-tbl-col-owner">Owner</div>
                                <div className="cb-tbl-col-actions">Actions</div>
                            </div>

                            <div className="cb-drive-table-body">
                                {folders.map((folder, idx) => {
                                    const isEditing = editingItem && editingItem.type === 'folder' && editingItem.id === folder.id;
                                    const isTarget = dropTargetId === folder.id;
                                    const palette = folderPalette[idx % folderPalette.length];
                                    const countText = `${folder.fileCount ?? (folder.files ? folder.files.length : (folder.totalFiles ?? 0))} items`;
                                    const displayDate = formatDate(folder.updatedAt || folder.createdAt);
                                    const folderOwner = folder.user?.name || (userName ? "You" : "User");
                                    const ownerInitial = folder.user?.name
                                        ? folder.user.name.split(" ").filter(Boolean).map(p => p[0]).join("").slice(0, 2).toUpperCase()
                                        : userInitials;

                                    return (
                                        <div
                                            key={folder.id}
                                            className={`cb-drive-table-row cb-folder-list-row ${isTarget ? 'drag-over' : ''}`}
                                            onClick={() => {
                                                if (!isEditing) handleFolderSelect(folder);
                                            }}
                                            onMouseEnter={() => prefetchFolder && prefetchFolder(folder.id)}
                                            draggable={!isEditing}
                                            onDragStart={(e) => handleDragStartItem && handleDragStartItem(e, { type: 'folder', id: folder.id, name: folder.name })}
                                            onDragEnd={handleDragEndItem}
                                            onDragOver={(e) => handleDragOverTarget && handleDragOverTarget(e, folder.id)}
                                            onDragLeave={(e) => handleDragLeaveTarget && handleDragLeaveTarget(e, folder.id)}
                                            onDrop={(e) => handleDropOnTarget && handleDropOnTarget(e, folder.id)}
                                        >
                                            <div className="cb-tbl-col-name">
                                                <div
                                                    className="cb-file-icon-badge cb-folder-badge-icon"
                                                    style={{ background: palette.gradient, color: palette.iconColor, borderColor: palette.glow }}
                                                >
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z" />
                                                    </svg>
                                                </div>
                                                {isEditing ? (
                                                    <form
                                                        onSubmit={(e) => handleRenameSubmit(e, folder.id, 'folder')}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="cb-rename-inline-form"
                                                    >
                                                        <input
                                                            value={renameValue}
                                                            onChange={(e) => setRenameValue(e.target.value)}
                                                            className="cb-rename-inline-input"
                                                            autoFocus
                                                        />
                                                        <button type="submit" className="cb-rename-save-btn">Save</button>
                                                    </form>
                                                ) : (
                                                    <div className="cb-tbl-meta-wrap">
                                                        <span className="cb-tbl-filename" title={folder.name}>
                                                            {folder.name}
                                                        </span>
                                                        {folder._isOptimistic ? (
                                                            <span className="cb-optimistic-tag">Creating...</span>
                                                        ) : (
                                                            <span className="cb-tbl-mobile-sub">
                                                                {countText} • {displayDate}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="cb-tbl-col-type">
                                                <span className="cb-type-tag" style={{ color: palette.iconColor }}>
                                                    Folder
                                                </span>
                                            </div>

                                            <div className="cb-tbl-col-size">
                                                {countText}
                                            </div>

                                            <div className="cb-tbl-col-date">
                                                {displayDate}
                                            </div>

                                            <div className="cb-tbl-col-owner">
                                                <div className="cb-owner-badge">
                                                    <div className="cb-owner-avatar-chip">{ownerInitial}</div>
                                                    <span className="cb-owner-name">{folderOwner}</span>
                                                </div>
                                            </div>

                                            <div className="cb-tbl-col-actions" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    type="button"
                                                    className="cb-tbl-dots-btn"
                                                    onClick={() => openActionSheet(folder, 'folder')}
                                                    aria-label="More actions"
                                                    title="Folder options"
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                        <circle cx="12" cy="12" r="2" />
                                                        <circle cx="19" cy="12" r="2" />
                                                        <circle cx="5" cy="12" r="2" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </section>
            )}

            {/* ─── 4. FILES SECTION ─────────────────────────────────────────────── */}
            <section className="cb-drive-block">
                <div className="cb-block-header">
                    <div className="cb-block-title-wrap">
                        <h2 className="cb-block-title">Files</h2>
                        <span className="cb-block-count-badge">{displayedFiles.length}</span>
                    </div>
                </div>

                {loading && files.length === 0 ? (
                    <div className="cb-loading-state-box">
                        <div className="spinner"></div>
                        <span>Loading directory contents...</span>
                    </div>
                ) : files.length === 0 && folders.length === 0 ? (
                    /* Elegant Full Empty State */
                    <div className="cb-empty-cloud-card">
                        <div className="cb-empty-icon-halo">
                            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                                <line x1="12" y1="11" x2="12" y2="17" />
                                <line x1="9" y1="14" x2="15" y2="14" />
                            </svg>
                        </div>
                        <h3 className="cb-empty-heading">This folder is empty</h3>
                        <p className="cb-empty-caption">
                            Drag and drop files here, or use the buttons below to get started organizing your workspace.
                        </p>
                        <div className="cb-empty-actions-row">
                            <button className="cb-btn-upload-primary" onClick={onUploadClick}>
                                Upload File
                            </button>
                            <button className="cb-btn-create-subtle" onClick={onCreateFolderClick}>
                                Create Folder
                            </button>
                        </div>
                    </div>
                ) : displayedFiles.length === 0 ? (
                    <div className="cb-empty-category-box">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                            <polyline points="13 2 13 9 20 9" />
                        </svg>
                        <span className="cb-empty-cat-title">No files in this category</span>
                        <span className="cb-empty-cat-sub">Upload files using the top button or select another filter.</span>
                    </div>
                ) : viewMode === "grid" ? (
                    /* ─── GRID VIEW FOR FILES ─── */
                    <div className="cb-files-grid-fluid">
                        {displayedFiles.map(file => {
                            const isEditing = editingItem && editingItem.type === 'file' && editingItem.id === file.id;
                            const badge = getFileBadge(file.orgName, file.mimeType);
                            const displayDate = formatDate(file.updatedAt || file.createdAt);

                            return (
                                <div
                                    key={file.id}
                                    className="cb-file-grid-card"
                                    onClick={(e) => {
                                        if (!isEditing) previewFile(e, file);
                                    }}
                                    draggable={!isEditing}
                                    onDragStart={(e) => handleDragStartItem && handleDragStartItem(e, { type: 'file', id: file.id, name: file.orgName })}
                                    onDragEnd={handleDragEndItem}
                                >
                                    <div className="cb-file-grid-preview" style={{ background: badge.bg, borderColor: badge.border }}>
                                        <div style={{ color: badge.color }}>
                                            {badge.icon}
                                        </div>
                                    </div>

                                    <div className="cb-file-grid-info">
                                        <div className="cb-file-grid-header">
                                            {isEditing ? (
                                                <form
                                                    onSubmit={(e) => handleRenameSubmit(e, file.id, 'file')}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="cb-rename-inline-form"
                                                >
                                                    <input
                                                        value={renameValue}
                                                        onChange={(e) => setRenameValue(e.target.value)}
                                                        className="cb-rename-inline-input"
                                                        autoFocus
                                                    />
                                                    <button type="submit" className="cb-rename-save-btn">Save</button>
                                                </form>
                                            ) : (
                                                <span className="cb-file-grid-name" title={file.orgName}>
                                                    {file.orgName}
                                                </span>
                                            )}
                                            {file._isUploading && (
                                                <span className="cb-uploading-tag">Uploading...</span>
                                            )}

                                            <button
                                                type="button"
                                                className="cb-file-dots-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openActionSheet(file, 'file');
                                                }}
                                                aria-label="Actions"
                                                title="More actions"
                                            >
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                                                    <circle cx="12" cy="12" r="2" />
                                                    <circle cx="19" cy="12" r="2" />
                                                    <circle cx="5" cy="12" r="2" />
                                                </svg>
                                            </button>
                                        </div>

                                        <div className="cb-file-grid-meta">
                                            <span className="cb-file-size-tag">{formatBytes(file.size)}</span>
                                            <span className="cb-file-date-tag">{displayDate}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* ─── LIST / TABLE VIEW FOR FILES ─── */
                    <div className="cb-drive-table-wrapper">
                        <div className="cb-drive-table-header">
                            <div className="cb-tbl-col-name" onClick={() => toggleSort("name")}>
                                <span>Name</span>
                                {sortBy === "name" && <span className="cb-sort-arrow">{sortAsc ? "↑" : "↓"}</span>}
                            </div>
                            <div className="cb-tbl-col-type">Type</div>
                            <div className="cb-tbl-col-size" onClick={() => toggleSort("size")}>
                                <span>Size</span>
                                {sortBy === "size" && <span className="cb-sort-arrow">{sortAsc ? "↑" : "↓"}</span>}
                            </div>
                            <div className="cb-tbl-col-date" onClick={() => toggleSort("date")}>
                                <span>Modified</span>
                                {sortBy === "date" && <span className="cb-sort-arrow">{sortAsc ? "↑" : "↓"}</span>}
                            </div>
                            <div className="cb-tbl-col-owner">Owner</div>
                            <div className="cb-tbl-col-actions">Actions</div>
                        </div>

                        <div className="cb-drive-table-body">
                            {displayedFiles.map((file) => {
                                const isEditing = editingItem && editingItem.type === 'file' && editingItem.id === file.id;
                                const badge = getFileBadge(file.orgName, file.mimeType);
                                const displayDate = formatDate(file.updatedAt || file.createdAt);
                                const fileOwner = file.user?.name || (userName ? "You" : "User");
                                const ownerInitial = file.user?.name
                                    ? file.user.name.split(" ").filter(Boolean).map(p => p[0]).join("").slice(0, 2).toUpperCase()
                                    : userInitials;

                                return (
                                    <div
                                        key={file.id}
                                        className="cb-drive-table-row"
                                        onClick={(e) => {
                                            if (!isEditing) previewFile(e, file);
                                        }}
                                        draggable={!isEditing}
                                        onDragStart={(e) => handleDragStartItem && handleDragStartItem(e, { type: 'file', id: file.id, name: file.orgName })}
                                        onDragEnd={handleDragEndItem}
                                    >
                                        {/* Name & Badge Icon */}
                                        <div className="cb-tbl-col-name">
                                            <div
                                                className="cb-file-icon-badge"
                                                style={{ background: badge.bg, color: badge.color, borderColor: badge.border }}
                                            >
                                                {badge.icon}
                                            </div>
                                            {isEditing ? (
                                                <form
                                                    onSubmit={(e) => handleRenameSubmit(e, file.id, 'file')}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="cb-rename-inline-form"
                                                >
                                                    <input
                                                        value={renameValue}
                                                        onChange={(e) => setRenameValue(e.target.value)}
                                                        className="cb-rename-inline-input"
                                                        autoFocus
                                                    />
                                                    <button type="submit" className="cb-rename-save-btn">Save</button>
                                                </form>
                                            ) : (
                                                <div className="cb-tbl-meta-wrap">
                                                    <span className="cb-tbl-filename" title={file.orgName}>
                                                        {file.orgName}
                                                    </span>
                                                    {file._isUploading ? (
                                                        <span className="cb-uploading-tag">Uploading...</span>
                                                    ) : (
                                                        <span className="cb-tbl-mobile-sub">
                                                            {formatBytes(file.size)} • {displayDate}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Type */}
                                        <div className="cb-tbl-col-type">
                                            <span className="cb-type-tag" style={{ color: badge.color }}>
                                                {badge.label}
                                            </span>
                                        </div>

                                        {/* Size */}
                                        <div className="cb-tbl-col-size">
                                            {formatBytes(file.size)}
                                        </div>

                                        {/* Modified */}
                                        <div className="cb-tbl-col-date">
                                            {displayDate}
                                        </div>

                                        {/* Owner */}
                                        <div className="cb-tbl-col-owner">
                                            <div className="cb-owner-badge">
                                                <div className="cb-owner-avatar-chip">{ownerInitial}</div>
                                                <span className="cb-owner-name">{fileOwner}</span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="cb-tbl-col-actions" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                type="button"
                                                className="cb-quick-action-btn"
                                                onClick={(e) => previewFile(e, file)}
                                                title="Preview file"
                                                aria-label="Preview"
                                            >
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                    <circle cx="12" cy="12" r="3" />
                                                </svg>
                                            </button>

                                            <button
                                                type="button"
                                                className="cb-quick-action-btn"
                                                onClick={(e) => downloadFile(e, file.id, file.orgName)}
                                                title="Download file"
                                                aria-label="Download"
                                            >
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                    <polyline points="7 10 12 15 17 10" />
                                                    <line x1="12" y1="15" x2="12" y2="3" />
                                                </svg>
                                            </button>

                                            <button
                                                type="button"
                                                className="cb-tbl-dots-btn"
                                                onClick={() => openActionSheet(file, 'file')}
                                                aria-label="More actions"
                                                title="More actions"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                    <circle cx="12" cy="12" r="2" />
                                                    <circle cx="19" cy="12" r="2" />
                                                    <circle cx="5" cy="12" r="2" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}
