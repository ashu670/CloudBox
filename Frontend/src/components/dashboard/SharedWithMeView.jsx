import React, { useState } from "react";
import { formatDate } from "../../utils/formatters";

export default function SharedWithMeView({
    sharedFolders = [],
    userProfile,
    onSelectSharedFolder,
    onJoinClick,
    onNewProjectClick
}) {
    const [search, setSearch] = useState("");

    const currentUserId = userProfile?.id;

    const filtered = sharedFolders.filter(f =>
        f.name.toLowerCase().includes(search.toLowerCase())
    );

    const getRoleBadge = (folder) => {
        const isOwner = folder.uid === currentUserId || folder.userRole === "OWNER";
        const role = folder.userRole || (isOwner ? "OWNER" : "MEMBER");

        const colorMap = {
            OWNER: { bg: "rgba(245, 158, 11, 0.14)", color: "#d97706", border: "rgba(245, 158, 11, 0.3)" },
            ADMIN: { bg: "rgba(139, 92, 246, 0.14)", color: "#8b5cf6", border: "rgba(139, 92, 246, 0.3)" },
            EDITOR: { bg: "rgba(16, 185, 129, 0.14)", color: "#10b981", border: "rgba(16, 185, 129, 0.3)" },
            VIEWER: { bg: "rgba(59, 130, 246, 0.14)", color: "#3b82f6", border: "rgba(59, 130, 246, 0.3)" },
            MEMBER: { bg: "rgba(100, 116, 139, 0.14)", color: "#64748b", border: "rgba(100, 116, 139, 0.3)" },
        };

        const s = colorMap[role] || colorMap.MEMBER;

        return (
            <span
                style={{
                    background: s.bg,
                    color: s.color,
                    border: `1px solid ${s.border}`,
                    padding: "2px 9px",
                    borderRadius: "999px",
                    fontSize: "11px",
                    fontWeight: "700",
                    letterSpacing: "0.4px"
                }}
            >
                {role}
            </span>
        );
    };

    return (
        <div className="cb-shared-view-container">
            {/* Top Header Banner */}
            <div className="cb-shared-header">
                <div className="cb-shared-header-left">
                    <div className="cb-shared-icon-badge">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="18" cy="5" r="3" />
                            <circle cx="6" cy="12" r="3" />
                            <circle cx="18" cy="19" r="3" />
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="cb-shared-title">Shared with me</h1>
                        <p className="cb-shared-subtitle">
                            Folders and team project workspaces shared with your account
                        </p>
                    </div>
                </div>

                <div className="cb-shared-header-actions">
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={onJoinClick}
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="8.5" cy="7" r="4" />
                            <line x1="20" y1="8" x2="20" y2="14" />
                            <line x1="23" y1="11" x2="17" y2="11" />
                        </svg>
                        <span>Join with Code</span>
                    </button>

                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={onNewProjectClick}
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        <span>New Project</span>
                    </button>
                </div>
            </div>

            {/* Filter / Search Bar */}
            {sharedFolders.length > 0 && (
                <div className="cb-shared-filter-bar">
                    <div className="cb-shared-search-wrap">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="cb-shared-search-icon">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Filter shared workspaces..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="cb-shared-search-input"
                        />
                        {search && (
                            <button type="button" className="cb-shared-search-clear" onClick={() => setSearch("")}>✕</button>
                        )}
                    </div>
                    <span className="cb-shared-count-badge">
                        {filtered.length} {filtered.length === 1 ? 'workspace' : 'workspaces'}
                    </span>
                </div>
            )}

            {/* Grid of Shared Folders */}
            {filtered.length > 0 ? (
                <div className="cb-shared-grid">
                    {filtered.map((folder) => {
                        const isOwner = folder.uid === currentUserId;
                        const ownerLabel = isOwner ? "You (Owner)" : folder.user?.email || folder.user?.name || "Team Member";

                        return (
                            <div
                                key={folder.id}
                                className="cb-shared-card"
                                onClick={() => onSelectSharedFolder(folder)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        onSelectSharedFolder(folder);
                                    }
                                }}
                            >
                                <div className="cb-shared-card-top">
                                    <div className="cb-shared-card-folder-icon">
                                        <svg viewBox="0 0 24 24" width="32" height="32">
                                            <path fill="#7c3aed" d="M10,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V8C22,6.89 21.1,6 20,6H12L10,4Z" />
                                        </svg>
                                        <div className="cb-shared-mini-badge">
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="cb-shared-card-role">
                                        {getRoleBadge(folder)}
                                    </div>
                                </div>

                                <div className="cb-shared-card-info">
                                    <h3 className="cb-shared-card-name" title={folder.name}>
                                        {folder.name}
                                    </h3>
                                    <p className="cb-shared-card-owner">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                            <circle cx="12" cy="7" r="4" />
                                        </svg>
                                        <span>Owner: {ownerLabel}</span>
                                    </p>
                                </div>

                                <div className="cb-shared-card-footer">
                                    <span className="cb-shared-date">
                                        Updated {formatDate(folder.updatedAt || folder.createdAt)}
                                    </span>
                                    <span className="cb-shared-enter-link">
                                        Open Workspace &rarr;
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="cb-shared-empty-state">
                    <div className="cb-shared-empty-icon">
                        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="18" cy="5" r="3" />
                            <circle cx="6" cy="12" r="3" />
                            <circle cx="18" cy="19" r="3" />
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                        </svg>
                    </div>
                    <h2>No shared workspaces yet</h2>
                    <p>
                        When teammates share folders or invite you with a collaboration code, they will appear right here as full shared workspaces.
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
