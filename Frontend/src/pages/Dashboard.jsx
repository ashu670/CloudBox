import { useState, useEffect } from "react";
import { useFolderManager } from "../hooks/useFolderManager";
import { formatBytes, formatDate } from "../utils/formatters";
import FileIcon from "../components/fileIcon";
import CreateSharedFolder from "../components/CreateSharedFolder";
import JoinSharedFolder from "../components/JoinSharedFolder";
import FolderRequests from "../components/FolderRequests";
import FolderMembers from "../components/FolderMembers";
import OwnerPanel from "../components/OwnerPanel";
import AdminPanel from "../components/AdminPanel";
import ActivityLogs from "../components/ActivityLogs";
import FilePreviewModal from "../components/FilePreviewModal";

export default function FolderView() {
    const {
        folders, files, currentFolderId, history, folderName, setFolderName,
        loading, isUploading, isDragging, setIsDragging, showCreator, setShowCreator,
        editingItem, setEditingItem, renameValue, setRenameValue, movingItem, setMovingItem,
        previewItem, previewFile, closePreview,
        toasts, expandedFolders, treeNodes, currentFolderInfo,
        createFolder, deleteFolder, deleteFile,
        downloadFile, handleRenameSubmit, executeMove, moveItemToFolder, handleFileUpload,
        handleFolderSelect, toggleFolderExpand, goBack, refreshAfterSharedAction, showToast
    } = useFolderManager();

    const [sharedPanel, setSharedPanel] = useState(null);
    const [draggedItem, setDraggedItem] = useState(null);
    const [dropTargetId, setDropTargetId] = useState(null);

    const toggleSharedPanel = (panel) => {
        setSharedPanel((prev) => (prev === panel ? null : panel));
    };

    const handleSharedFolderCreated = async () => {
        await refreshAfterSharedAction();
    };

    const handleSharedFolderJoined = async () => {
        await refreshAfterSharedAction();
    };

    const handleRequestHandled = async () => {
        await refreshAfterSharedAction();
    };

    const isSharedFolderContext = currentFolderInfo?.isShared === true;

    useEffect(() => {
        if (!isSharedFolderContext && (sharedPanel === 'requests' || sharedPanel === 'members')) {
            setSharedPanel(null);
        }
    }, [isSharedFolderContext, sharedPanel]);

    // Drag & Drop event handlers
    const handleDragStartItem = (e, item) => {
        setDraggedItem(item);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("application/json", JSON.stringify(item));
    };

    const handleDragEndItem = () => {
        setDraggedItem(null);
        setDropTargetId(null);
    };

    const handleDragOverTarget = (e, targetFolderId) => {
        e.preventDefault();
        e.stopPropagation();
        setDropTargetId(targetFolderId);
        if (draggedItem) {
            e.dataTransfer.dropEffect = "move";
        }
    };

    const handleDragLeaveTarget = (e, targetFolderId) => {
        e.preventDefault();
        e.stopPropagation();
        if (dropTargetId === targetFolderId) {
            setDropTargetId(null);
        }
    };

    const handleDropOnTarget = (e, targetFolderId) => {
        e.preventDefault();
        e.stopPropagation();
        setDropTargetId(null);

        // Check if external file upload drop
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0 && !draggedItem) {
            if (targetFolderId > 0) {
                handleFileUpload(e.dataTransfer.files[0], targetFolderId);
            } else {
                showToast("Files cannot be uploaded to Root level.", "error");
            }
            return;
        }

        let item = draggedItem;
        if (!item) {
            try {
                const rawData = e.dataTransfer.getData("application/json");
                if (rawData) item = JSON.parse(rawData);
            } catch {
                item = null;
            }
        }

        if (item) {
            moveItemToFolder(item, targetFolderId);
            setDraggedItem(null);
        }
    };

    // Helper to format type labels
    const getFileTypeLabel = (mimeType) => {
        if (!mimeType) return "File";
        if (mimeType.startsWith("image/")) return "Image file";
        if (mimeType === "application/pdf") return "PDF Document";
        if (mimeType.startsWith("audio/")) return "Audio track";
        if (mimeType.startsWith("video/")) return "Video clip";
        if (mimeType.startsWith("text/")) return "Text document";
        if (mimeType.includes("zip") || mimeType.includes("tar") || mimeType.includes("gzip")) return "zip Archive";
        return "File";
    };

    // Sidebar Folder Tree Rendering
    const renderTreeNode = (node, depth = 0) => {
        const isExpanded = expandedFolders[node.id];
        const isActive = currentFolderId === node.id;
        const isTarget = dropTargetId === node.id;
        const children = treeNodes[node.id];

        return (
            <div key={node.id} className="tree-node-wrapper">
                <div 
                    className={`tree-node ${isActive ? 'active' : ''} ${isTarget ? 'drag-over-target' : ''}`}
                    style={{ paddingLeft: `${12 + depth * 12}px` }}
                    onClick={() => handleFolderSelect(node)}
                    draggable={true}
                    onDragStart={(e) => handleDragStartItem(e, { type: 'folder', id: node.id, name: node.name })}
                    onDragEnd={handleDragEndItem}
                    onDragOver={(e) => handleDragOverTarget(e, node.id)}
                    onDragLeave={(e) => handleDragLeaveTarget(e, node.id)}
                    onDrop={(e) => handleDropOnTarget(e, node.id)}
                >
                    <svg 
                        className={`tree-chevron ${isExpanded ? 'expanded' : ''}`}
                        onClick={(e) => toggleFolderExpand(node.id, e)}
                        viewBox="0 0 24 24"
                    >
                        <path d="M8.59,16.59L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.59Z" />
                    </svg>
                    <svg className="tree-icon" viewBox="0 0 24 24">
                        <path d="M10,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V8C22,6.89 21.1,6 20,6H12L10,4Z" />
                    </svg>
                    <span>{node.name}</span>
                </div>

                {isExpanded && (
                    <div className="tree-children">
                        {children ? (
                            children.length === 0 ? (
                                <div className="tree-node" style={{ paddingLeft: `${24 + depth * 12}px`, opacity: 0.5, fontStyle: 'italic' }}>
                                    (Empty)
                                </div>
                            ) : (
                                children.map(child => renderTreeNode(child, depth + 1))
                            )
                        ) : (
                            <div className="tree-node" style={{ paddingLeft: `${24 + depth * 12}px`, opacity: 0.5 }}>
                                Loading...
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const renderRootNode = () => {
        const isExpanded = expandedFolders[-1];
        const isActive = currentFolderId === -1 || currentFolderId === 0;
        const isTarget = dropTargetId === -1;
        const rootChildren = treeNodes[-1];

        return (
            <div className="tree-node-wrapper">
                <div 
                    className={`tree-node ${isActive ? 'active' : ''} ${isTarget ? 'drag-over-target' : ''}`}
                    onClick={() => handleFolderSelect({ id: -1, name: "Root", pid: null })}
                    onDragOver={(e) => handleDragOverTarget(e, -1)}
                    onDragLeave={(e) => handleDragLeaveTarget(e, -1)}
                    onDrop={(e) => handleDropOnTarget(e, -1)}
                >
                    <svg 
                        className={`tree-chevron ${isExpanded ? 'expanded' : ''}`}
                        onClick={(e) => toggleFolderExpand(-1, e)}
                        viewBox="0 0 24 24"
                    >
                        <path d="M8.59,16.59L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.59Z" />
                    </svg>
                    <svg className="tree-icon" viewBox="0 0 24 24">
                        <path d="M12,3L20,9V21H16V14H8V21H4V9L12,3Z" />
                    </svg>
                    <span>Root</span>
                </div>

                {isExpanded && (
                    <div className="tree-children">
                        {rootChildren ? (
                            rootChildren.length === 0 ? (
                                <div className="tree-node" style={{ paddingLeft: '24px', opacity: 0.5, fontStyle: 'italic' }}>
                                    (No Folders)
                                </div>
                            ) : (
                                rootChildren.map(child => renderTreeNode(child, 0))
                            )
                        ) : (
                            <div className="tree-node" style={{ paddingLeft: '24px', opacity: 0.5 }}>
                                Loading...
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="dashboard-layout">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-title">Directory Tree</div>
                <div className="tree-container">
                    {renderRootNode()}
                </div>
            </aside>

            {/* Main Area */}
            <main 
                className="main-content"
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0] && !draggedItem) {
                        handleFileUpload(e.dataTransfer.files[0]);
                    }
                }}
            >
                {/* Explorer Header */}
                <div className="explorer-header">
                    <div className="breadcrumbs">
                        <span 
                            className={`breadcrumb-item ${currentFolderId === -1 ? 'active' : ''} ${dropTargetId === -1 ? 'drag-over-target' : ''}`}
                            onClick={() => handleFolderSelect({ id: -1, name: "Root" })}
                            onDragOver={(e) => handleDragOverTarget(e, -1)}
                            onDragLeave={(e) => handleDragLeaveTarget(e, -1)}
                            onDrop={(e) => handleDropOnTarget(e, -1)}
                        >
                            Root
                        </span>
                        {history.map((folder, index) => (
                            <span key={folder.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                <span className="breadcrumb-separator">/</span>
                                <span 
                                    className={`breadcrumb-item ${index === history.length - 1 ? 'active' : ''} ${dropTargetId === folder.id ? 'drag-over-target' : ''}`}
                                    onClick={() => handleFolderSelect(folder)}
                                    onDragOver={(e) => handleDragOverTarget(e, folder.id)}
                                    onDragLeave={(e) => handleDragLeaveTarget(e, folder.id)}
                                    onDrop={(e) => handleDropOnTarget(e, folder.id)}
                                >
                                    {folder.name}
                                </span>
                            </span>
                        ))}
                        {isSharedFolderContext && currentFolderInfo?.inviteCode && (
                            <span className="invite-badge-inline" style={{ marginLeft: '16px', background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', color: 'var(--accent)', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '500', whiteSpace: 'nowrap' }}>
                                Invite Code: <strong>{currentFolderInfo.inviteCode}</strong> ({currentFolderInfo.isInviteActive ? 'Active' : 'Disabled'})
                            </span>
                        )}
                    </div>

                    <div className="toolbar-actions">
                        {movingItem && (
                            <div className="move-banner">
                                <span className="move-banner-text">
                                    Moving <strong>{movingItem.name}</strong>
                                </span>
                                <button type="button" className="btn btn-primary btn-sm" onClick={executeMove}>Move Here</button>
                                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setMovingItem(null)}>Cancel</button>
                            </div>
                        )}

                        <button type="button" className="btn btn-secondary" onClick={() => setShowCreator(!showCreator)}>
                            New Folder
                        </button>

                        <button
                            type="button"
                            className={`btn btn-secondary ${sharedPanel === 'create' ? 'active' : ''}`}
                            onClick={() => toggleSharedPanel('create')}
                        >
                            Create Shared
                        </button>

                        <button
                            type="button"
                            className={`btn btn-secondary ${sharedPanel === 'join' ? 'active' : ''}`}
                            onClick={() => toggleSharedPanel('join')}
                        >
                            Join Shared
                        </button>

                        {isSharedFolderContext && (
                            <>
                                {currentFolderInfo?.userRole === 'OWNER' && (
                                    <button
                                        type="button"
                                        className={`btn btn-secondary ${sharedPanel === 'owner-panel' ? 'active' : ''}`}
                                        onClick={() => toggleSharedPanel('owner-panel')}
                                    >
                                        Owner Panel
                                    </button>
                                )}
                                {currentFolderInfo?.userRole === 'ADMIN' && (
                                    <button
                                        type="button"
                                        className={`btn btn-secondary ${sharedPanel === 'admin-panel' ? 'active' : ''}`}
                                        onClick={() => toggleSharedPanel('admin-panel')}
                                    >
                                        Admin Panel
                                    </button>
                                )}
                                {(currentFolderInfo?.userRole === 'OWNER' || currentFolderInfo?.userRole === 'ADMIN') && (
                                    <button
                                        type="button"
                                        className={`btn btn-secondary ${sharedPanel === 'activities' ? 'active' : ''}`}
                                        onClick={() => toggleSharedPanel('activities')}
                                    >
                                        Activity Logs
                                    </button>
                                )}
                                <button
                                    type="button"
                                    className={`btn btn-secondary ${sharedPanel === 'requests' ? 'active' : ''}`}
                                    onClick={() => toggleSharedPanel('requests')}
                                >
                                    Requests
                                </button>
                                <button
                                    type="button"
                                    className={`btn btn-secondary ${sharedPanel === 'members' ? 'active' : ''}`}
                                    onClick={() => toggleSharedPanel('members')}
                                >
                                    Members
                                </button>
                            </>
                        )}

                        <button 
                            type="button"
                            className="btn btn-primary" 
                            onClick={() => document.getElementById("file-picker").click()}
                            disabled={isUploading}
                        >
                            {isUploading ? "Uploading..." : "Upload File"}
                        </button>

                        <input 
                            id="file-picker"
                            type="file"
                            style={{ display: "none" }}
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                    handleFileUpload(e.target.files[0]);
                                }
                            }}
                        />
                    </div>
                </div>

                {sharedPanel && (
                    <div className="shared-view-panel">
                        {sharedPanel === 'create' && (
                            <CreateSharedFolder onFolderCreated={handleSharedFolderCreated} />
                        )}
                        {sharedPanel === 'join' && (
                            <JoinSharedFolder onJoined={handleSharedFolderJoined} />
                        )}
                        {sharedPanel === 'owner-panel' && isSharedFolderContext && (
                            <OwnerPanel
                                folderId={currentFolderId}
                                onNotify={(msg, type) => showToast(msg, type)}
                                onRefresh={refreshAfterSharedAction}
                            />
                        )}
                        {sharedPanel === 'admin-panel' && isSharedFolderContext && (
                            <AdminPanel
                                folderId={currentFolderId}
                                onNotify={(msg, type) => showToast(msg, type)}
                                onRefresh={refreshAfterSharedAction}
                            />
                        )}
                        {sharedPanel === 'activities' && isSharedFolderContext && (
                            <ActivityLogs
                                folderId={currentFolderId}
                            />
                        )}
                        {sharedPanel === 'requests' && isSharedFolderContext && (
                            <FolderRequests
                                folderId={currentFolderId}
                                onRequestHandled={handleRequestHandled}
                                onNotify={(msg, type) => showToast(msg, type)}
                            />
                        )}
                        {sharedPanel === 'members' && isSharedFolderContext && (
                            <FolderMembers folderId={currentFolderId} />
                        )}
                    </div>
                )}

                {/* Inline Folder Creator */}
                {showCreator && (
                    <form onSubmit={createFolder} className="creator-bar">
                        <input
                            value={folderName}
                            onChange={(e) => setFolderName(e.target.value)}
                            placeholder="Enter folder name..."
                            className="input-field"
                            autoFocus
                        />
                        <button type="submit" className="btn btn-primary">Create</button>
                        <button 
                            type="button" 
                            className="btn btn-secondary"
                            onClick={() => {
                                setFolderName("");
                                setShowCreator(false);
                            }}
                        >
                            Cancel
                        </button>
                    </form>
                )}

                {/* Back button */}
                {currentFolderId !== -1 && currentFolderId !== 0 && (
                    <div style={{ marginBottom: '12px' }}>
                        <button onClick={goBack} className="btn btn-secondary btn-sm">
                            ← Back
                        </button>
                    </div>
                )}

                {/* Drag and Drop Zone Area */}
                {currentFolderId > 0 && (
                    <div className={`upload-dropzone ${isDragging ? 'dragover' : ''}`}>
                        <div className="upload-dropzone-inner">
                            <span className="upload-dropzone-text">Drag & drop files or folders onto tree/items to move or upload</span>
                        </div>
                    </div>
                )}

                {/* Grid view */}
                {loading ? (
                    <div className="loading-container">
                        <div className="spinner"></div>
                    </div>
                ) : folders.length === 0 && files.length === 0 ? (
                    <div className="empty-state">
                        <h3 className="empty-state-title">This folder is empty</h3>
                        <p className="empty-state-text">
                            {currentFolderId <= 0 
                                ? "Create a folder to start organizing your files." 
                                : "Upload a file or create a subfolder here."}
                        </p>
                    </div>
                ) : (
                    <div className="files-list">
                        <div className="file-row file-row-header">
                            <div></div>
                            <div>Name</div>
                            <div>Size</div>
                            <div>Type</div>
                            <div>Date Modified</div>
                            <div>Actions</div>
                        </div>

                        {/* Folders List */}
                        {folders.map(folder => {
                            const isEditing = editingItem && editingItem.type === 'folder' && editingItem.id === folder.id;
                            const isTarget = dropTargetId === folder.id;
                            return (
                                <div 
                                    key={`folder-${folder.id}`} 
                                    className={`file-row clickable-row ${isTarget ? 'drag-over-target' : ''}`}
                                    onClick={() => !isEditing && handleFolderSelect(folder)}
                                    draggable={!isEditing}
                                    onDragStart={(e) => handleDragStartItem(e, { type: 'folder', id: folder.id, name: folder.name })}
                                    onDragEnd={handleDragEndItem}
                                    onDragOver={(e) => handleDragOverTarget(e, folder.id)}
                                    onDragLeave={(e) => handleDragLeaveTarget(e, folder.id)}
                                    onDrop={(e) => handleDropOnTarget(e, folder.id)}
                                >
                                    <div className="item-icon-col">
                                        <svg className="folder-svg" viewBox="0 0 24 24" width="20" height="20" style={{ fill: '#ffb020' }}>
                                            <path d="M10,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V8C22,6.89 21.1,6 20,6H12L10,4Z" />
                                        </svg>
                                    </div>
                                    <div className="file-name">
                                        {isEditing ? (
                                            <form 
                                                onSubmit={(e) => handleRenameSubmit(e, folder.id, 'folder')} 
                                                onClick={(e) => e.stopPropagation()}
                                                style={{ display: 'flex', gap: '4px' }}
                                            >
                                                <input 
                                                    value={renameValue} 
                                                    onChange={(e) => setRenameValue(e.target.value)} 
                                                    className="input-field" 
                                                    autoFocus
                                                />
                                                <button type="submit" className="btn btn-primary">Save</button>
                                                <button type="button" className="btn btn-secondary" onClick={() => setEditingItem(null)}>Cancel</button>
                                            </form>
                                        ) : (
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                                <span>{folder.name}</span>
                                                {folder.isShared && folder.inviteCode && (
                                                    <span className="folder-list-invite-tag" style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', color: 'var(--accent)', padding: '1px 6px', borderRadius: '8px', fontSize: '10px', fontWeight: '500' }}>
                                                        Code: {folder.inviteCode}
                                                    </span>
                                                )}
                                            </span>
                                        )}
                                    </div>
                                    <div className="file-size">-</div>
                                    <div className="file-type">File folder</div>
                                    <div className="file-date">{formatDate(folder.createdAt)}</div>
                                    <div className="row-actions">
                                        {!isEditing && (
                                            <>
                                                <button className="action-btn" onClick={(e) => { e.stopPropagation(); setEditingItem({ type: 'folder', id: folder.id }); setRenameValue(folder.name); }}>Rename</button>
                                                <button className="action-btn btn-delete" onClick={(e) => deleteFolder(e, folder.id)}>Delete</button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Files List */}
                        {files.map(file => {
                            const isEditing = editingItem && editingItem.type === 'file' && editingItem.id === file.id;
                            return (
                                <div 
                                    key={`file-${file.id}`} 
                                    className="file-row"
                                    draggable={!isEditing}
                                    onDragStart={(e) => handleDragStartItem(e, { type: 'file', id: file.id, name: file.orgName })}
                                    onDragEnd={handleDragEndItem}
                                >
                                    <div className="item-icon-col">
                                        <FileIcon mimeType={file.mimeType} />
                                    </div>
                                    <div className="file-name">
                                        {isEditing ? (
                                            <form 
                                                onSubmit={(e) => handleRenameSubmit(e, file.id, 'file')}
                                                style={{ display: 'flex', gap: '4px' }}
                                            >
                                                <input 
                                                    value={renameValue} 
                                                    onChange={(e) => setRenameValue(e.target.value)} 
                                                    className="input-field" 
                                                    autoFocus
                                                />
                                                <button type="submit" className="btn btn-primary">Save</button>
                                                <button type="button" className="btn btn-secondary" onClick={() => setEditingItem(null)}>Cancel</button>
                                            </form>
                                        ) : (
                                            <span>{file.orgName}</span>
                                        )}
                                    </div>
                                    <div className="file-size">{formatBytes(file.size)}</div>
                                    <div className="file-type">{getFileTypeLabel(file.mimeType)}</div>
                                    <div className="file-date">{formatDate(file.createdAt)}</div>
                                    <div className="row-actions">
                                        {!isEditing && (
                                            <>
                                                <button className="action-btn" onClick={(e) => previewFile(e, file)}>Preview</button>
                                                <button className="action-btn" onClick={(e) => downloadFile(e, file.id, file.orgName)}>Download</button>
                                                <button className="action-btn" onClick={(e) => { e.stopPropagation(); setEditingItem({ type: 'file', id: file.id }); setRenameValue(file.orgName); }}>Rename</button>
                                                <button className="action-btn btn-delete" onClick={(e) => deleteFile(e, file.id)}>Delete</button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* File Preview Modal */}
            <FilePreviewModal
                previewItem={previewItem}
                onClose={closePreview}
                onDownload={downloadFile}
            />

            {/* Toast Container */}
            <div className="toast-container">
                {toasts.map(toast => (
                    <div key={toast.id} className={`toast toast-${toast.type}`}>
                        <span>{toast.message}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}