import React, { useState } from "react";
import { formatBytes } from "../../utils/formatters";

export default function Sidebar({
    activeNav,
    setActiveNav,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    rootFolderId,
    handleFolderSelect,
    prefetchFolder,
    setSharedPanel,
    setShowTrash,
    storagePercent = 0,
    usedStorageBytes = 0,
    limitStorageBytes = 0,
    userName,
    userEmail,
    showToast,
    sharedFolders = [],
    activeProjectId = null,
    onProjectClick,
    onSharedClick,
}) {
    const [projectsOpen, setProjectsOpen] = useState(true);

    const displayPercent = storagePercent || 0;
    const displayUsed = formatBytes(usedStorageBytes);
    const displayLimit = limitStorageBytes > 0 ? formatBytes(limitStorageBytes) : "10 GB";

    return (
        <aside className={`cb-left-sidebar ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
            {/* Mobile Drawer Header */}
            <div className="cb-sidebar-mobile-header">
                <div className="cb-sidebar-mobile-brand">
                    <svg className="cloudbox-logo" viewBox="0 0 24 24" width="22" height="22">
                        <path fill="#6366f1" d="M19.35,10.03C18.67,6.59 15.64,4 12,4C9.11,4 6.6,5.64 5.35,8.03C2.34,8.36 0,10.9 0,14C0,17.1 2.9,20 6,20H19C21.76,20 24,17.76 24,15C24,12.36 21.95,10.22 19.35,10.03Z" />
                    </svg>
                    <span className="brand-name" style={{ fontSize: "17px", fontWeight: "800", color: "var(--text-heading)" }}>CloudBox</span>
                </div>
                <button
                    type="button"
                    className="cb-sidebar-close-btn"
                    onClick={() => setMobileSidebarOpen(false)}
                    aria-label="Close menu"
                >
                    ✕
                </button>
            </div>

            {/* Top Navigation Block */}
            <div className="cb-sidebar-top">
                <nav className="cb-sidebar-nav">
                    {/* Dashboard */}
                    <button
                        type="button"
                        className={`cb-nav-item ${activeNav === 'dashboard' ? 'active' : ''}`}
                        onClick={() => {
                            setActiveNav('dashboard');
                            handleFolderSelect({ id: rootFolderId !== -1 ? rootFolderId : -1, name: "Root", pid: null });
                            setMobileSidebarOpen(false);
                        }}
                        onMouseEnter={() => prefetchFolder && prefetchFolder(rootFolderId !== -1 ? rootFolderId : -1)}
                    >
                        <svg className="cb-nav-icon" width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                        </svg>
                        <span>Dashboard</span>
                    </button>

                    {/* My Drive */}
                    <button
                        type="button"
                        className={`cb-nav-item ${activeNav === 'files' ? 'active' : ''}`}
                        onClick={() => {
                            setActiveNav('files');
                            handleFolderSelect({ id: rootFolderId !== -1 ? rootFolderId : -1, name: "Root", pid: null });
                            setMobileSidebarOpen(false);
                        }}
                        onMouseEnter={() => prefetchFolder && prefetchFolder(rootFolderId !== -1 ? rootFolderId : -1)}
                    >
                        <svg className="cb-nav-icon" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                        </svg>
                        <span>My Drive</span>
                    </button>

                    {/* Projects (Expandable) */}
                    <div className="cb-nav-group">
                        <button
                            type="button"
                            className={`cb-nav-item cb-nav-group-header ${activeNav === 'projects' ? 'active' : ''}`}
                            onClick={() => setProjectsOpen(prev => !prev)}
                        >
                            <svg className="cb-nav-icon" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="3" width="20" height="14" rx="2" />
                                <line x1="8" y1="21" x2="16" y2="21" />
                                <line x1="12" y1="17" x2="12" y2="21" />
                            </svg>
                            <span style={{ flex: 1 }}>Projects</span>
                            <svg
                                className={`cb-nav-chevron ${projectsOpen ? 'open' : ''}`}
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                            >
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </button>

                        {projectsOpen && (() => {
                            const topLevelProjects = (sharedFolders || []).filter(f => !f.pid || f.pid === null || f.pid === rootFolderId || f.pid === 0 || f.pid === -1);
                            return (
                            <div className="cb-nav-sub-list">
                                {topLevelProjects.length > 0 ? (
                                    topLevelProjects.map((folder) => {
                                        const isActive = activeNav === 'projects' && activeProjectId === folder.id;
                                        const role = folder.userRole;
                                        return (
                                            <button
                                                key={folder.id}
                                                type="button"
                                                className={`cb-nav-sub-item ${isActive ? 'cb-project-item-active' : ''}`}
                                                onClick={() => {
                                                    setActiveNav('projects');
                                                    setMobileSidebarOpen(false);
                                                    if (onProjectClick) {
                                                        onProjectClick(folder);
                                                    } else {
                                                        handleFolderSelect(folder);
                                                    }
                                                }}
                                                onMouseEnter={() => prefetchFolder && prefetchFolder(folder.id)}
                                            >
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill={isActive ? "#7c3aed" : "#94a3b8"}>
                                                    <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                                                </svg>
                                                <span className="cb-project-name" title={folder.name}>{folder.name}</span>
                                                {role && (
                                                    <span className="cb-project-role-pill">
                                                        {role.toLowerCase()}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })
                                ) : (
                                    <div className="cb-nav-sub-empty">No projects yet</div>
                                )}

                                <button
                                    type="button"
                                    className="cb-nav-sub-item cb-add-project-btn"
                                    onClick={() => { setSharedPanel('create'); setMobileSidebarOpen(false); }}
                                >
                                    <span className="cb-add-plus">+</span>
                                    <span>Add Project</span>
                                </button>
                            </div>
                            );
                        })()}
                    </div>

                    {/* Shared with me */}
                    <button
                        type="button"
                        className={`cb-nav-item ${activeNav === 'shared' ? 'active' : ''}`}
                        onClick={() => {
                            setActiveNav('shared');
                            onSharedClick?.();
                            setMobileSidebarOpen(false);
                        }}
                    >
                        <svg className="cb-nav-icon" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="18" cy="5" r="3" />
                            <circle cx="6" cy="12" r="3" />
                            <circle cx="18" cy="19" r="3" />
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                        </svg>
                        <span>Shared with me</span>
                    </button>

                    {/* Starred */}
                    <button
                        type="button"
                        className={`cb-nav-item ${activeNav === 'starred' ? 'active' : ''}`}
                        onClick={() => setActiveNav('starred')}
                    >
                        <svg className="cb-nav-icon" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                        <span>Starred</span>
                    </button>

                    {/* Recent */}
                    <button
                        type="button"
                        className={`cb-nav-item ${activeNav === 'recent' ? 'active' : ''}`}
                        onClick={() => setActiveNav('recent')}
                    >
                        <svg className="cb-nav-icon" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                        <span>Recent</span>
                    </button>

                    {/* Trash */}
                    <button
                        type="button"
                        className={`cb-nav-item ${activeNav === 'trash' ? 'active' : ''}`}
                        onClick={() => {
                            setActiveNav('trash');
                            setShowTrash(true);
                            setMobileSidebarOpen(false);
                        }}
                    >
                        <svg className="cb-nav-icon" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                            <path d="M10 11v6" /><path d="M14 11v6" />
                            <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                        </svg>
                        <span>Trash</span>
                    </button>
                </nav>
            </div>

            {/* Bottom Storage Widget (Matching Reference Image) */}
            <div className="cb-sidebar-bottom">
                <div className="cb-sidebar-storage-card">
                    <div className="cb-storage-label-row">
                        <span className="cb-storage-label-title">Storage</span>
                        <span className="cb-storage-label-pct">{displayPercent}%</span>
                    </div>
                    <div className="cb-donut-mini-bar">
                        <div className="cb-donut-mini-fill" style={{ width: `${displayPercent}%` }}></div>
                    </div>
                    <span className="cb-sidebar-storage-sub">
                        {`${displayUsed} of ${displayLimit} used`}
                    </span>
                    <button
                        type="button"
                        className="cb-manage-storage-link"
                        onClick={() => showToast(`Total Storage: ${displayLimit} (${displayPercent}% used)`, "info")}
                    >
                        Manage storage &gt;
                    </button>
                </div>
            </div>
        </aside>
    );
}
