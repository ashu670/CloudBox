import React from "react";
import { formatDate } from "../../utils/formatters";

export default function FoldersSection({
    isSharedFolderContext,
    rootFolderId,
    handleFolderSelect,
    prefetchFolder,
    loading,
    filteredFolders = [],
    editingItem,
    renameValue,
    setRenameValue,
    handleRenameSubmit,
    openActionSheet,
    dropTargetId,
    handleDragStartItem,
    handleDragEndItem,
    handleDragOverTarget,
    handleDragLeaveTarget,
    handleDropOnTarget
}) {
    const defaultColorThemes = [
        { folderClass: "folder-purple", iconColor: "#8b5cf6" },
        { folderClass: "folder-blue", iconColor: "#38bdf8" },
        { folderClass: "folder-coral", iconColor: "#f87171" },
        { folderClass: "folder-green", iconColor: "#4ade80" }
    ];

    const displayFolders = filteredFolders.slice(0, 8);

    return (
        <section className="cb-section-quick-access">
            <div className="cb-section-header">
                <h2 className="cb-section-title-modern">Quick Access</h2>
                <button
                    type="button"
                    className="cb-view-all-link-modern"
                    onClick={() => handleFolderSelect({ id: rootFolderId !== -1 ? rootFolderId : -1, name: "Root" })}
                    onMouseEnter={() => prefetchFolder && prefetchFolder(rootFolderId !== -1 ? rootFolderId : -1)}
                >
                    View all &rarr;
                </button>
            </div>

            <div className="cb-folders-row-4">
                {loading && filteredFolders.length === 0 ? (
                    <div className="cb-folders-loading">
                        <div className="spinner" style={{ width: 28, height: 28 }}></div>
                    </div>
                ) : displayFolders.length === 0 ? (
                    <div className="cb-empty-state-card">
                        <div className="cb-empty-state-icon">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                            </svg>
                        </div>
                        <div className="cb-empty-state-texts">
                            <span className="cb-empty-state-title">No folders here</span>
                            <span className="cb-empty-state-sub">Click "Create Folder" in the top banner to add one.</span>
                        </div>
                    </div>
                ) : (
                    displayFolders.map((folder, idx) => {
                        const isEditing = editingItem && editingItem.type === 'folder' && editingItem.id === folder.id;
                        const isTarget = dropTargetId === folder.id;
                        const theme = defaultColorThemes[idx % defaultColorThemes.length];
                        const countText = `${folder.fileCount ?? (folder.files ? folder.files.length : (folder.totalFiles ?? 0))} items`;

                        return (
                            <div
                                key={folder.id}
                                className={`cb-folder-card-modern ${theme.folderClass} ${isTarget ? 'drag-over' : ''}`}
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
                                <div className="cb-folder-card-top">
                                    <div className="cb-folder-tab-icon">
                                        <svg width="34" height="28" viewBox="0 0 24 20" fill="currentColor">
                                            <path d="M20 4h-7.586l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z" />
                                        </svg>
                                    </div>

                                    {!isEditing && (
                                        <button
                                            type="button"
                                            className="cb-folder-dots-trigger"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openActionSheet(folder, 'folder');
                                            }}
                                            aria-label="Folder Options"
                                        >
                                            ···
                                        </button>
                                    )}
                                </div>

                                <div className="cb-folder-card-info">
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
                                            <span className="cb-folder-name-modern" title={folder.name}>
                                                {folder.name}
                                            </span>
                                            <span className="cb-folder-items-count">
                                                {countText}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </section>
    );
}
