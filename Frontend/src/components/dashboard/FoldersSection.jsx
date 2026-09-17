import React from "react";

export default function FoldersSection({
    rootFolderId,
    handleFolderSelect,
    prefetchFolder,
    setActiveNav
}) {
    return (
        <section className="cb-section-quick-access">
            <div className="cb-section-header">
                <h2 className="cb-section-title-modern">Quick Access</h2>
                <button
                    type="button"
                    className="cb-view-all-link-modern"
                    onClick={() => {
                        setActiveNav?.('files');
                        handleFolderSelect && handleFolderSelect({ id: rootFolderId !== -1 ? rootFolderId : -1, name: "Root" });
                    }}
                    onMouseEnter={() => prefetchFolder && prefetchFolder(rootFolderId !== -1 ? rootFolderId : -1)}
                >
                    View all &rarr;
                </button>
            </div>

            <div className="cb-in-progress-card">
                <div className="cb-in-progress-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                    </svg>
                </div>
                <div className="cb-in-progress-text-wrap">
                    <span className="cb-in-progress-title">This section is in progress</span>
                    <span className="cb-in-progress-sub">Quick Access shortcuts are currently being updated.</span>
                </div>
            </div>
        </section>
    );
}
