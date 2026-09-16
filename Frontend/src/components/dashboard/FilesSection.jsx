import React from "react";
import { formatBytes, formatDate } from "../../utils/formatters";

// Distinctive badge icons for file types matching ref image
const getRefFileBadge = (name = "", mimeType = "") => {
    const lower = name.toLowerCase();
    if (lower.endsWith(".pdf") || mimeType === "application/pdf") {
        return {
            bg: "#fee2e2",
            color: "#dc2626",
            label: "PDF",
            icon: (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5z" />
                </svg>
            )
        };
    }
    if (lower.endsWith(".fig") || lower.includes("figma")) {
        return {
            bg: "#18181b",
            color: "#ffffff",
            label: "Figma",
            icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H12v7H8.5A3.5 3.5 0 0 1 5 5.5z" />
                    <path d="M12 2h3.5a3.5 3.5 0 1 1 0 7H12V2z" />
                    <path d="M12 12.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 1 1-7 0z" />
                    <path d="M5 19.5A3.5 3.5 0 0 1 8.5 16H12v3.5a3.5 3.5 0 1 1-7 0z" />
                    <path d="M5 12.5A3.5 3.5 0 0 1 8.5 9H12v7H8.5A3.5 3.5 0 0 1 5 12.5z" />
                </svg>
            )
        };
    }
    if (lower.endsWith(".mp4") || lower.endsWith(".mov") || mimeType?.startsWith("video/")) {
        return {
            bg: "#f3e8ff",
            color: "#9333ea",
            label: "Video",
            icon: (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
            )
        };
    }
    if (lower.endsWith(".docx") || lower.endsWith(".doc")) {
        return {
            bg: "#dbeafe",
            color: "#2563eb",
            label: "Document",
            icon: (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                </svg>
            )
        };
    }
    if (lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".svg") || mimeType?.startsWith("image/")) {
        return {
            bg: "#dcfce7",
            color: "#16a34a",
            label: "Image",
            icon: (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                </svg>
            )
        };
    }
    return {
        bg: "#e2e8f0",
        color: "#475569",
        label: "File",
        icon: (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                <polyline points="13 2 13 9 20 9" />
            </svg>
        )
    };
};

export default function FilesSection({
    searchQuery = "",
    searchLoading = false,
    viewMode = "list",
    setViewMode,
    filteredFiles = [],
    filteredFolders = [],
    selectedRows = new Set(),
    setSelectedRows,
    toggleRowSelect,
    editingItem,
    renameValue,
    setRenameValue,
    handleRenameSubmit,
    handleFolderSelect,
    previewFile,
    openActionSheet,
    getFileTypeLabel,
    userName = ""
}) {
    const userInitials = userName
        ? userName.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase()
        : "U";

    return (
        <section className="cb-section-recent-files">
            <div className="cb-section-header">
                <h2 className="cb-section-title-modern">Recent Files</h2>
                <button
                    type="button"
                    className="cb-view-all-link-modern"
                    onClick={() => {}}
                >
                    View all &rarr;
                </button>
            </div>

            <div className="cb-table-card-modern">
                <div className="cb-table-header-modern">
                    <div className="cb-col-name-head">Name</div>
                    <div className="cb-col-type-head">Type</div>
                    <div className="cb-col-size-head">Size</div>
                    <div className="cb-col-date-head">Modified</div>
                    <div className="cb-col-owner-head">Owner</div>
                    <div className="cb-col-actions-head"></div>
                </div>

                <div className="cb-table-body-modern">
                    {searchLoading ? (
                        <div className="cb-loading-state">
                            <div className="spinner"></div>
                        </div>
                    ) : filteredFiles.length === 0 ? (
                        <div className="cb-empty-state-card" style={{ margin: "24px auto", justifyContent: "center", maxWidth: "460px" }}>
                            <div className="cb-empty-state-icon">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                                    <polyline points="13 2 13 9 20 9" />
                                </svg>
                            </div>
                            <div className="cb-empty-state-texts">
                                <span className="cb-empty-state-title">No files in this folder</span>
                                <span className="cb-empty-state-sub">Upload files using the button in the top banner or drag & drop them here.</span>
                            </div>
                        </div>
                    ) : (
                        filteredFiles.map((file) => {
                            const isEditing = editingItem && editingItem.type === 'file' && editingItem.id === file.id;
                            const badge = getRefFileBadge(file.orgName, file.mimeType);
                            const displayDate = formatDate(file.updatedAt || file.createdAt);
                            const fileOwner = file.user?.name || (userName ? "You" : "User");
                            const ownerInitial = file.user?.name 
                                ? file.user.name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase()
                                : userInitials;

                            return (
                                <div
                                    key={file.id}
                                    className="cb-table-row-modern"
                                    onClick={(e) => {
                                        if (!isEditing) previewFile(e, file);
                                    }}
                                >
                                    {/* Name & Badge Icon */}
                                    <div className="cb-col-name-cell">
                                        <div className="cb-file-badge-box" style={{ background: badge.bg, color: badge.color }}>
                                            {badge.icon}
                                        </div>
                                        {isEditing ? (
                                            <form onSubmit={(e) => handleRenameSubmit(e, file.id, 'file')} className="cb-rename-inline-form">
                                                <input
                                                    value={renameValue}
                                                    onChange={(e) => setRenameValue(e.target.value)}
                                                    className="cb-rename-inline-input"
                                                    autoFocus
                                                />
                                                <button type="submit" className="cb-rename-save-btn">Save</button>
                                            </form>
                                        ) : (
                                            <span className="cb-file-name-text" title={file.orgName}>
                                                {file.orgName}
                                            </span>
                                        )}
                                    </div>

                                    {/* Type */}
                                    <div className="cb-col-type-cell">
                                        {file.type || badge.label}
                                    </div>

                                    {/* Size */}
                                    <div className="cb-col-size-cell">
                                        {formatBytes(file.size)}
                                    </div>

                                    {/* Modified */}
                                    <div className="cb-col-date-cell">
                                        {displayDate}
                                    </div>

                                    {/* Owner */}
                                    <div className="cb-col-owner-cell">
                                        <div className="cb-owner-pill">
                                            <div className="cb-owner-avatar">{ownerInitial}</div>
                                            <span className="cb-owner-text">{fileOwner}</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="cb-col-actions-cell" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            type="button"
                                            className="cb-row-dots-btn"
                                            onClick={() => openActionSheet(file, 'file')}
                                            aria-label="Actions"
                                        >
                                            ···
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </section>
    );
}
