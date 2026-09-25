import React, { useState } from "react";
import { formatDate } from "../../utils/formatters";

export default function SharedWithMeView({
    sharedFolders = [],
    userProfile,
    onSelectSharedFolder,
    onJoinClick,
    onNewProjectClick,
    showToast
}) {
    const [search, setSearch] = useState("");

    const currentUserId = userProfile?.id;

    const filtered = (sharedFolders || []).filter(f =>
        (f.name || "").toLowerCase().includes(search.toLowerCase())
    );

    const getStatusBadge = (folder) => {
        if (folder.requestStatus === "PENDING") {
            return (
                <span className="cb-badge cb-badge-pending">
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#f59e0b" }}></span>
                    Pending
                </span>
            );
        }

        if (folder.requestStatus === "REJECTED") {
            return (
                <span className="cb-badge cb-badge-rejected">
                    Rejected
                </span>
            );
        }

        const isOwner = folder.uid === currentUserId || folder.userRole === "OWNER";
        const role = folder.userRole || (isOwner ? "OWNER" : "VIEWER");

        const map = {
            OWNER: "cb-badge-owner",
            ADMIN: "cb-badge-admin",
            EDITOR: "cb-badge-editor",
            VIEWER: "cb-badge-viewer",
        };

        return (
            <span className={`cb-badge ${map[role] || "cb-badge-viewer"}`}>
                {role}
            </span>
        );
    };

    const handleRowClick = (folder) => {
        if (folder.requestStatus === "PENDING") {
            showToast?.("This workspace is pending approval from the project owner or admin.", "info");
            return;
        }
        if (folder.requestStatus === "REJECTED") {
            showToast?.("Your request to join this workspace was rejected by the owner.", "error");
            return;
        }
        onSelectSharedFolder(folder);
    };

    return (
        <div className="cb-shared-view-ref-container">
            {/* ── Top Header Banner (Matching Reference 1) ── */}
            <div className="cb-shared-ref-header">
                <div className="cb-shared-ref-header-left">
                    <div className="cb-shared-ref-icon-badge">
                        <svg viewBox="0 0 24 24" width="28" height="28" fill="#7c3aed">
                            <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="cb-shared-ref-title">Shared with me</h1>
                        <p className="cb-shared-ref-subtitle">
                            Projects and files shared by others
                        </p>
                    </div>
                </div>

                <div className="cb-shared-ref-header-actions">
                    <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={onJoinClick}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="8.5" cy="7" r="4" />
                            <line x1="20" y1="8" x2="20" y2="14" />
                            <line x1="23" y1="11" x2="17" y2="11" />
                        </svg>
                        <span>Join with Code</span>
                    </button>

                    <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={onNewProjectClick}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        <span>New Project</span>
                    </button>
                </div>
            </div>

            {/* ── Search & Filter Bar ── */}
            {sharedFolders.length > 0 && (
                <div className="cb-shared-ref-filter-bar">
                    <div className="cb-shared-search-wrap">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="cb-shared-search-icon">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Filter shared items..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="cb-shared-search-input"
                        />
                        {search && (
                            <button type="button" className="cb-shared-search-clear" onClick={() => setSearch("")}>✕</button>
                        )}
                    </div>
                    <span className="cb-shared-count-badge">
                        {filtered.length} {filtered.length === 1 ? 'item' : 'items'}
                    </span>
                </div>
            )}

            {/* ── Table View (Matching Reference 1) ── */}
            {filtered.length > 0 ? (
                <div className="cb-shared-table-card">
                    <table className="cb-shared-ref-table">
                        <thead>
                            <tr>
                                <th style={{ width: "35%" }}>Name</th>
                                <th style={{ width: "25%" }}>Shared by</th>
                                <th style={{ width: "15%" }}>Type</th>
                                <th style={{ width: "15%" }}>Date</th>
                                <th style={{ width: "10%", textAlign: "right" }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(folder => {
                                const isPending = folder.requestStatus === "PENDING";
                                const isRejected = folder.requestStatus === "REJECTED";
                                const sharedBy = folder.user?.email || folder.user?.name || folder.ownerEmail || "Team Member";
                                const isProject = folder.isShared || folder.inviteCode;

                                return (
                                    <tr
                                        key={`${folder.id}-${folder.requestStatus || 'APPROVED'}`}
                                        className={`cb-shared-ref-row ${isPending ? 'pending' : ''} ${isRejected ? 'rejected' : ''}`}
                                        onClick={() => handleRowClick(folder)}
                                    >
                                        <td>
                                            <div className="cb-shared-name-cell">
                                                <div className="cb-shared-icon-box">
                                                    <svg viewBox="0 0 24 24" width="20" height="20" fill={isProject ? "#7c3aed" : "#f59e0b"}>
                                                        <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                                                    </svg>
                                                </div>
                                                <span className="cb-shared-item-name" title={folder.name}>
                                                    {folder.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="cb-cell-muted">
                                            {sharedBy}
                                        </td>
                                        <td>
                                            <span className="cb-shared-type-pill">
                                                {isProject ? "Project" : "Folder"}
                                            </span>
                                        </td>
                                        <td className="cb-cell-muted">
                                            {formatDate(folder.updatedAt || folder.createdAt)}
                                        </td>
                                        <td style={{ textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                                            <div className="cb-shared-row-actions">
                                                {getStatusBadge(folder)}
                                                <button
                                                    type="button"
                                                    className="cb-shared-overflow-btn"
                                                    onClick={() => handleRowClick(folder)}
                                                    title="Open"
                                                >
                                                    •••
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="cb-shared-empty-state">
                    <div className="cb-shared-empty-icon">
                        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                            <circle cx="18" cy="5" r="3" />
                            <circle cx="6" cy="12" r="3" />
                            <circle cx="18" cy="19" r="3" />
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                        </svg>
                    </div>
                    <h2>No shared items found</h2>
                    <p>
                        {search ? "No shared folders matched your search." : "When teammates share folders or invite you with a collaboration code, they will appear right here."}
                    </p>
                    <div className="cb-shared-empty-actions">
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={onJoinClick}
                        >
                            Join Shared Folder with Code
                        </button>
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={onNewProjectClick}
                        >
                            Create New Project
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
