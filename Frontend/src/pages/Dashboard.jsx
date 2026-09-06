import { useState, useEffect } from "react";
import { useFolderManager } from "../hooks/useFolderManager";
import { formatBytes, formatDate } from "../utils/formatters";
import FileIcon from "../components/fileIcon";
import Navbar from "../components/navbar";
import CreateSharedFolder from "../components/CreateSharedFolder";
import JoinSharedFolder from "../components/JoinSharedFolder";
import FolderRequests from "../components/FolderRequests";
import FolderMembers from "../components/FolderMembers";
import OwnerPanel from "../components/OwnerPanel";
import AdminPanel from "../components/AdminPanel";
import ActivityLogs from "../components/ActivityLogs";
import FilePreviewModal from "../components/FilePreviewModal";
import ActionBottomSheet from "../components/ActionBottomSheet";
import DirectoryMoveModal from "../components/DirectoryMoveModal";
import ShareModal from "../components/ShareModal";
import { DownloadIcon, MoveIcon, RenameIcon, DeleteIcon } from "../components/ActionIcons";
import { lockBodyScroll, unlockBodyScroll } from "../utils/scrollLock";

export default function FolderView() {
    const {
        folders, files, filteredFolders, filteredFiles, userProfile, storageBreakdown, searchQuery, setSearchQuery,
        rootFolderId, currentFolderId, history, folderName, setFolderName,
        loading, isUploading, isDragging, setIsDragging, showCreator, setShowCreator,
        editingItem, setEditingItem, renameValue, setRenameValue, movingItem, setMovingItem,
        previewItem, previewFile, closePreview,
        toasts, expandedFolders, treeNodes, foldersCache, currentFolderInfo,
        createFolder, deleteFolder, deleteFile,
        downloadFile, shareFile, openShareModal, closeShareModal, shareModalItem, handleRenameSubmit, executeMove, moveItemToFolder, handleFileUpload,
        handleFolderSelect, toggleFolderExpand, goBack, refreshAfterSharedAction, showToast
    } = useFolderManager();

    const [sharedPanel, setSharedPanel] = useState(null);
    const [draggedItem, setDraggedItem] = useState(null);
    const [dropTargetId, setDropTargetId] = useState(null);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [showMoveModal, setShowMoveModal] = useState(false);
    const [activeBottomSheet, setActiveBottomSheet] = useState(null);

    useEffect(() => {
        if (mobileSidebarOpen) {
            lockBodyScroll();
            return () => unlockBodyScroll();
        }
    }, [mobileSidebarOpen]);

    const openActionSheet = (item, itemType) => {
        const isFolder = itemType === 'folder';
        const name = isFolder ? item.name : item.orgName;
        const actions = isFolder ? [
            {
                type: 'move',
                label: "Move",
                onClick: (e) => {
                    setMovingItem({ type: 'folder', id: item.id, name: item.name });
                    setShowMoveModal(true);
                }
            },
            {
                type: 'rename',
                label: "Rename",
                onClick: (e) => {
                    setEditingItem({ type: 'folder', id: item.id });
                    setRenameValue(item.name);
                }
            },
            {
                type: 'delete',
                label: "Delete",
                danger: true,
                onClick: (e) => deleteFolder(e, item.id)
            }
        ] : [
            {
                type: 'download',
                label: "Download",
                onClick: (e) => downloadFile(e, item.id, item.orgName)
            },
            {
                type: 'share',
                label: "Share",
                onClick: (e) => shareFile(item.id)
            },
            {
                type: 'move',
                label: "Move",
                onClick: (e) => {
                    setMovingItem({ type: 'file', id: item.id, name: item.orgName });
                    setShowMoveModal(true);
                }
            },
            {
                type: 'rename',
                label: "Rename",
                onClick: (e) => {
                    setEditingItem({ type: 'file', id: item.id });
                    setRenameValue(item.orgName);
                }
            },
            {
                type: 'delete',
                label: "Delete",
                danger: true,
                onClick: (e) => deleteFile(e, item.id)
            }
        ];

        setActiveBottomSheet({ name, actions });
    };


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
        if (mimeType.includes("zip") || mimeType.includes("tar") || mimeType.includes("gzip")) return "Archive";
        return "Document";
    };

    // Overall storage breakdown metrics for all user files across all folders
    const categoryStats = storageBreakdown || { image: 0, video: 0, audio: 0, document: 0 };
    const totalStorageUsed = userProfile?.usedStorage || (categoryStats.image + categoryStats.video + categoryStats.audio + categoryStats.document);


    // Sidebar Folder Tree Rendering
    const renderTreeNode = (node, depth = 0) => {
        const isExpanded = expandedFolders[node.id];
        const isActive = currentFolderId === node.id;
        const isTarget = dropTargetId === node.id;
        const nodeData = treeNodes[node.id];
        const subfolders = nodeData?.subfolders || (Array.isArray(nodeData) ? nodeData : []);
        const nodeFiles = nodeData?.files || [];
        const hasContent = subfolders.length > 0 || nodeFiles.length > 0;

        return (
            <div key={node.id} className="tree-node-wrapper">
                <div
                    className={`tree-node ${isActive ? 'active' : ''} ${isTarget ? 'drag-over-target' : ''}`}
                    style={{ paddingLeft: `${12 + depth * 14}px` }}
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
                    <span className="tree-node-name">{node.name}</span>
                </div>

                {isExpanded && (
                    <div className="tree-children">
                        {nodeData ? (
                            !hasContent ? (
                                <div className="tree-node empty-tree" style={{ paddingLeft: `${28 + depth * 14}px` }}>
                                    (Empty)
                                </div>
                            ) : (
                                <>
                                    {subfolders.map(child => renderTreeNode(child, depth + 1))}
                                    {nodeFiles.map(file => (
                                        <div
                                            key={`tree-file-${file.id}`}
                                            className="tree-node tree-file-node"
                                            style={{ paddingLeft: `${28 + depth * 14}px` }}
                                            onClick={(e) => previewFile(e, file)}
                                            draggable={true}
                                            onDragStart={(e) => handleDragStartItem(e, { type: 'file', id: file.id, name: file.orgName })}
                                            onDragEnd={handleDragEndItem}
                                        >
                                            <FileIcon mimeType={file.mimeType} size={16} />
                                            <span className="tree-node-name">{file.orgName}</span>
                                        </div>
                                    ))}
                                </>
                            )
                        ) : (
                            <div className="tree-node loading-tree" style={{ paddingLeft: `${28 + depth * 14}px` }}>
                                Loading...
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const renderRootNode = () => {
        const rootIdKey = rootFolderId !== -1 ? rootFolderId : -1;
        const isExpanded = expandedFolders[rootIdKey] !== undefined 
            ? expandedFolders[rootIdKey] 
            : (expandedFolders[-1] !== undefined ? expandedFolders[-1] : true);
        const isActive = currentFolderId === rootFolderId || currentFolderId === -1 || currentFolderId === 0;
        const isTarget = dropTargetId === -1 || dropTargetId === rootFolderId;
        const rootData = treeNodes[rootIdKey] || treeNodes[-1];
        const rootSubfolders = rootData?.subfolders || (Array.isArray(rootData) ? rootData : []);
        const rootFiles = rootData?.files || [];
        const hasRootContent = rootSubfolders.length > 0 || rootFiles.length > 0;

        return (
            <div className="tree-node-wrapper">
                <div
                    className={`tree-node ${isActive ? 'active' : ''} ${isTarget ? 'drag-over-target' : ''}`}
                    onClick={() => handleFolderSelect({ id: rootFolderId !== -1 ? rootFolderId : -1, name: "Root", pid: null })}
                    onDragOver={(e) => handleDragOverTarget(e, rootFolderId !== -1 ? rootFolderId : -1)}
                    onDragLeave={(e) => handleDragLeaveTarget(e, rootFolderId !== -1 ? rootFolderId : -1)}
                    onDrop={(e) => handleDropOnTarget(e, rootFolderId !== -1 ? rootFolderId : -1)}
                >
                    <svg
                        className={`tree-chevron ${isExpanded ? 'expanded' : ''}`}
                        onClick={(e) => toggleFolderExpand(rootFolderId !== -1 ? rootFolderId : -1, e)}
                        viewBox="0 0 24 24"
                    >
                        <path d="M8.59,16.59L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.59Z" />
                    </svg>
                    <svg className="tree-icon root-icon" viewBox="0 0 24 24">
                        <path d="M12,3L20,9V21H16V14H8V21H4V9L12,3Z" />
                    </svg>
                    <span className="tree-node-name">Root Drive</span>
                </div>

                {isExpanded && (
                    <div className="tree-children">
                        {rootData ? (
                            !hasRootContent ? (
                                <div className="tree-node empty-tree" style={{ paddingLeft: '28px' }}>
                                    (No Items)
                                </div>
                            ) : (
                                <>
                                    {rootSubfolders.map(child => renderTreeNode(child, 0))}
                                    {rootFiles.map(file => (
                                        <div
                                            key={`tree-file-${file.id}`}
                                            className="tree-node tree-file-node"
                                            style={{ paddingLeft: '28px' }}
                                            onClick={(e) => previewFile(e, file)}
                                            draggable={true}
                                            onDragStart={(e) => handleDragStartItem(e, { type: 'file', id: file.id, name: file.orgName })}
                                            onDragEnd={handleDragEndItem}
                                        >
                                            <FileIcon mimeType={file.mimeType} size={16} />
                                            <span className="tree-node-name">{file.orgName}</span>
                                        </div>
                                    ))}
                                </>
                            )
                        ) : (
                            <div className="tree-node loading-tree" style={{ paddingLeft: '28px' }}>
                                Loading...
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };


    // Calculate Storage Usage values
    const usedStorageBytes = userProfile?.usedStorage || 0;
    const limitStorageBytes = userProfile?.storageLimit || 524288000;
    const storagePercent = Math.min(100, Math.round((usedStorageBytes / limitStorageBytes) * 100));

    return (
        <div className="app-container">
            {/* Header Topbar Navigation */}
            <Navbar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                userProfile={userProfile}
                onToggleSidebar={() => setMobileSidebarOpen(prev => !prev)}
            />

            <div className="dashboard-layout">
                {/* Backdrop for Mobile Drawer */}
                {mobileSidebarOpen && (
                    <div className="sidebar-backdrop active" onClick={() => setMobileSidebarOpen(false)}></div>
                )}

                {/* Modern Sidebar */}
                <aside className={`sidebar ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
                    {/* Mobile Drawer Header */}
                    <div className="mobile-drawer-header">
                        <div className="mobile-drawer-brand">
                            <svg className="cloudbox-logo" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
                            </svg>
                            <span className="brand-name">CloudBox</span>
                        </div>
                        <button
                            className="mobile-drawer-close-btn"
                            onClick={() => setMobileSidebarOpen(false)}
                            aria-label="Close menu"
                        >
                            ✕
                        </button>
                    </div>

                    {/* User Snippet Card */}
                    <div className="user-profile-card">
                        <div className="avatar-circle">
                            {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : "C"}
                        </div>
                        <div className="user-info">
                            <div className="user-name">{userProfile?.name || "CloudBox User"}</div>
                            <div className="user-email">{userProfile?.email || "user@cloudbox.io"}</div>
                        </div>
                    </div>

                    {/* Navigation Menu */}
                    <div className="sidebar-section">
                        <div className="sidebar-section-title">Main Menu</div>
                        <div
                            className={`sidebar-nav-item ${(currentFolderId === -1 || currentFolderId === rootFolderId) ? 'active' : ''}`}
                            onClick={() => handleFolderSelect({ id: rootFolderId !== -1 ? rootFolderId : -1, name: "Root", pid: null })}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="7" height="7" rx="1" />
                                <rect x="14" y="3" width="7" height="7" rx="1" />
                                <rect x="14" y="14" width="7" height="7" rx="1" />
                                <rect x="3" y="14" width="7" height="7" rx="1" />
                            </svg>
                            <span>Dashboard</span>
                        </div>
                    </div>

                    {/* Directory Tree */}
                    <div className="sidebar-section directory-section">
                        <div className="sidebar-section-title">Directory Tree</div>
                        <div className="tree-container">
                            {renderRootNode()}
                        </div>
                    </div>

                    {/* Real Storage Quota Widget */}
                    <div className="storage-widget">
                        <div className="storage-widget-header">
                            <div className="storage-widget-title">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                </svg>
                                <span>Storage Quota</span>
                            </div>
                            <span className="storage-percent">{storagePercent}%</span>
                        </div>

                        <div className="storage-bar">
                            <div className="storage-fill" style={{ width: `${storagePercent}%` }}></div>
                        </div>

                        <div className="storage-numbers">
                            <strong>{formatBytes(usedStorageBytes)}</strong> of {formatBytes(limitStorageBytes)}
                        </div>
                    </div>
                </aside>

                {/* Main Workspace Content */}
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
                    {/* Welcome Banner Header */}
                    <div className="dashboard-welcome">
                        <div className="welcome-text">
                            <h2>Welcome Back, {userProfile?.name || "User"}</h2>
                            <p>Manage your cloud files, shared directories, and storage effortlessly.</p>
                        </div>

                        <div className="quick-action-buttons">
                            <button type="button" className="btn btn-secondary" onClick={() => setShowCreator(!showCreator)}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="12" y1="5" x2="12" y2="19" />
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                                <span>Create Folder</span>
                            </button>

                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => document.getElementById("file-picker").click()}
                                disabled={isUploading}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="17 8 12 3 7 8" />
                                    <line x1="12" y1="3" x2="12" y2="15" />
                                </svg>
                                <span>{isUploading ? "Uploading..." : "Upload File"}</span>
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

                    {/* Toolbar & Shared Action Buttons */}
                    <div className="explorer-toolbar">
                        <div className="breadcrumbs">
                            <span
                                className={`breadcrumb-item ${(currentFolderId === -1 || currentFolderId === rootFolderId) ? 'active' : ''} ${(dropTargetId === -1 || dropTargetId === rootFolderId) ? 'drag-over-target' : ''}`}
                                onClick={() => handleFolderSelect({ id: rootFolderId !== -1 ? rootFolderId : -1, name: "Root" })}
                                onDragOver={(e) => handleDragOverTarget(e, rootFolderId !== -1 ? rootFolderId : -1)}
                                onDragLeave={(e) => handleDragLeaveTarget(e, rootFolderId !== -1 ? rootFolderId : -1)}
                                onDrop={(e) => handleDropOnTarget(e, rootFolderId !== -1 ? rootFolderId : -1)}
                            >
                                Root
                            </span>
                            {history.map((folder, index) => (
                                <span key={folder.id} className="breadcrumb-wrapper">
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
                                <span className="invite-badge">
                                    Code: <strong>{currentFolderInfo.inviteCode}</strong> ({currentFolderInfo.isInviteActive ? 'Active' : 'Disabled'})
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

                            <button
                                type="button"
                                className={`btn btn-secondary btn-sm ${sharedPanel === 'create' ? 'active' : ''}`}
                                onClick={() => toggleSharedPanel('create')}
                            >
                                Create Shared
                            </button>

                            <button
                                type="button"
                                className={`btn btn-secondary btn-sm ${sharedPanel === 'join' ? 'active' : ''}`}
                                onClick={() => toggleSharedPanel('join')}
                            >
                                Join Shared
                            </button>

                            {isSharedFolderContext && (
                                <>
                                    {currentFolderInfo?.userRole === 'OWNER' && (
                                        <button
                                            type="button"
                                            className={`btn btn-secondary btn-sm ${sharedPanel === 'owner-panel' ? 'active' : ''}`}
                                            onClick={() => toggleSharedPanel('owner-panel')}
                                        >
                                            Owner Panel
                                        </button>
                                    )}
                                    {currentFolderInfo?.userRole === 'ADMIN' && (
                                        <button
                                            type="button"
                                            className={`btn btn-secondary btn-sm ${sharedPanel === 'admin-panel' ? 'active' : ''}`}
                                            onClick={() => toggleSharedPanel('admin-panel')}
                                        >
                                            Admin Panel
                                        </button>
                                    )}
                                    {(currentFolderInfo?.userRole === 'OWNER' || currentFolderInfo?.userRole === 'ADMIN') && (
                                        <button
                                            type="button"
                                            className={`btn btn-secondary btn-sm ${sharedPanel === 'activities' ? 'active' : ''}`}
                                            onClick={() => toggleSharedPanel('activities')}
                                        >
                                            Activity Logs
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        className={`btn btn-secondary btn-sm ${sharedPanel === 'requests' ? 'active' : ''}`}
                                        onClick={() => toggleSharedPanel('requests')}
                                    >
                                        Requests
                                    </button>
                                    <button
                                        type="button"
                                        className={`btn btn-secondary btn-sm ${sharedPanel === 'members' ? 'active' : ''}`}
                                        onClick={() => toggleSharedPanel('members')}
                                    >
                                        Members
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Shared View Panels */}
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
                            <button type="submit" className="btn btn-primary btn-sm">Create</button>
                            <button
                                type="button"
                                className="btn btn-secondary btn-sm"
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
                    {currentFolderId !== -1 && currentFolderId !== 0 && currentFolderId !== rootFolderId && (
                        <div className="back-button-bar">
                            <button onClick={goBack} className="btn btn-secondary btn-sm">
                                &larr; Back
                            </button>
                        </div>
                    )}

                    {/* Quick Folders Cards Grid ("My Folders") */}
                    {filteredFolders.length > 0 && (
                        <section className="dashboard-section">
                            <div className="section-title">My Folders</div>
                            <div className="folders-grid">
                                {filteredFolders.map(folder => {
                                    const isEditing = editingItem && editingItem.type === 'folder' && editingItem.id === folder.id;
                                    const isTarget = dropTargetId === folder.id;
                                    return (
                                        <div
                                            key={`grid-folder-${folder.id}`}
                                            className={`folder-card ${isTarget ? 'drag-over-target' : ''}`}
                                            onClick={() => !isEditing && handleFolderSelect(folder)}
                                            draggable={!isEditing}
                                            onDragStart={(e) => handleDragStartItem(e, { type: 'folder', id: folder.id, name: folder.name })}
                                            onDragEnd={handleDragEndItem}
                                            onDragOver={(e) => handleDragOverTarget(e, folder.id)}
                                            onDragLeave={(e) => handleDragLeaveTarget(e, folder.id)}
                                            onDrop={(e) => handleDropOnTarget(e, folder.id)}
                                        >
                                            <div className="folder-card-top">
                                                <svg className="folder-card-icon" viewBox="0 0 24 24">
                                                    <path d="M10,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V8C22,6.89 21.1,6 20,6H12L10,4Z" />
                                                </svg>

                                                <div className="folder-card-actions">
                                                    {!isEditing && (
                                                        <button
                                                            type="button"
                                                            className="action-dots-btn"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openActionSheet(folder, 'folder');
                                                            }}
                                                            title="Actions"
                                                        >
                                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                                                <circle cx="12" cy="5" r="2" />
                                                                <circle cx="12" cy="12" r="2" />
                                                                <circle cx="12" cy="19" r="2" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>



                                            </div>

                                            {isEditing ? (
                                                <form
                                                    onSubmit={(e) => handleRenameSubmit(e, folder.id, 'folder')}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="folder-rename-form"
                                                >
                                                    <input
                                                        value={renameValue}
                                                        onChange={(e) => setRenameValue(e.target.value)}
                                                        className="input-field input-field-sm"
                                                        autoFocus
                                                    />
                                                    <button type="submit" className="btn btn-primary btn-sm">Save</button>
                                                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditingItem(null)}>Cancel</button>
                                                </form>
                                            ) : (
                                                <div className="folder-card-title">
                                                    <span>{folder.name}</span>
                                                    {folder.isShared && folder.inviteCode && (
                                                        <span className="shared-badge">Shared</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* Overall Storage Breakdown Bar (Only shown on main Dashboard / Root) */}
                    {(currentFolderId === -1 || currentFolderId === 0 || currentFolderId === rootFolderId) && (
                        <div className="category-breakdown-card">
                            <div className="category-header">
                                <span className="category-title">Storage Breakdown</span>
                                <span className="category-total">{formatBytes(totalStorageUsed)}</span>
                            </div>
                            <div className="category-progress-bar">
                                {totalStorageUsed > 0 ? (
                                    <>
                                        {categoryStats.image > 0 && (
                                            <div
                                                className="cat-fill cat-image"
                                                style={{ width: `${(categoryStats.image / totalStorageUsed) * 100}%` }}
                                                title={`Images: ${formatBytes(categoryStats.image)}`}
                                            ></div>
                                        )}
                                        {categoryStats.document > 0 && (
                                            <div
                                                className="cat-fill cat-document"
                                                style={{ width: `${(categoryStats.document / totalStorageUsed) * 100}%` }}
                                                title={`Documents: ${formatBytes(categoryStats.document)}`}
                                            ></div>
                                        )}
                                        {categoryStats.video > 0 && (
                                            <div
                                                className="cat-fill cat-video"
                                                style={{ width: `${(categoryStats.video / totalStorageUsed) * 100}%` }}
                                                title={`Videos: ${formatBytes(categoryStats.video)}`}
                                            ></div>
                                        )}
                                        {categoryStats.audio > 0 && (
                                            <div
                                                className="cat-fill cat-audio"
                                                style={{ width: `${(categoryStats.audio / totalStorageUsed) * 100}%` }}
                                                title={`Audio: ${formatBytes(categoryStats.audio)}`}
                                            ></div>
                                        )}
                                    </>
                                ) : (
                                    <div className="cat-fill" style={{ width: "0%" }}></div>
                                )}
                            </div>
                            <div className="category-legend">
                                <span className="legend-item"><span className="dot dot-image"></span> Images ({formatBytes(categoryStats.image)})</span>
                                <span className="legend-item"><span className="dot dot-document"></span> Documents ({formatBytes(categoryStats.document)})</span>
                                <span className="legend-item"><span className="dot dot-video"></span> Videos ({formatBytes(categoryStats.video)})</span>
                                <span className="legend-item"><span className="dot dot-audio"></span> Audio ({formatBytes(categoryStats.audio)})</span>
                            </div>
                        </div>
                    )}

                    {/* Files Explorer Table ("All Files") */}
                    <section className="dashboard-section">
                        <div className="section-title-row">
                            <span className="section-title">All Files</span>
                            {searchQuery && (
                                <span className="search-status-tag">Filtering by "{searchQuery}"</span>
                            )}
                        </div>

                        {loading ? (
                            <div className="loading-container">
                                <div className="spinner"></div>
                            </div>
                        ) : filteredFolders.length === 0 && filteredFiles.length === 0 ? (
                            <div className="empty-state">
                                <svg className="empty-state-svg" viewBox="0 0 24 24" width="48" height="48">
                                    <path fill="currentColor" d="M19.35,10.03C18.67,6.59 15.64,4 12,4C9.11,4 6.6,5.64 5.35,8.03C2.34,8.36 0,10.9 0,14C0,17.1 2.9,20 6,20H19C21.76,20 24,17.76 24,15C24,12.36 21.95,10.22 19.35,10.03Z" opacity="0.3" />
                                </svg>
                                <h3 className="empty-state-title">
                                    {searchQuery ? "No matching files or folders found" : "This folder is empty"}
                                </h3>
                                <p className="empty-state-text">
                                    {currentFolderId <= 0
                                        ? "Create a folder to start organizing your files."
                                        : "Upload a file or create a subfolder here."}
                                </p>
                            </div>
                        ) : (
                            <div className="files-table-container">
                                <div className="files-table">
                                    <div className="table-header">
                                        <div className="col-icon"></div>
                                        <div className="col-name">File Name</div>
                                        <div className="col-type">Type</div>
                                        <div className="col-size">Size</div>
                                        <div className="col-date">Date Modified</div>
                                        <div className="col-actions">Actions</div>
                                    </div>

                                    {/* Folders in Table */}
                                    {filteredFolders.map(folder => {
                                        const isEditing = editingItem && editingItem.type === 'folder' && editingItem.id === folder.id;
                                        const isTarget = dropTargetId === folder.id;
                                        return (
                                            <div
                                                key={`row-folder-${folder.id}`}
                                                className={`table-row clickable-row ${isTarget ? 'drag-over-target' : ''} ${isEditing ? 'editing-row' : ''}`}
                                                onClick={() => !isEditing && handleFolderSelect(folder)}
                                                draggable={!isEditing}
                                                onDragStart={(e) => handleDragStartItem(e, { type: 'folder', id: folder.id, name: folder.name })}
                                                onDragEnd={handleDragEndItem}
                                                onDragOver={(e) => handleDragOverTarget(e, folder.id)}
                                                onDragLeave={(e) => handleDragLeaveTarget(e, folder.id)}
                                                onDrop={(e) => handleDropOnTarget(e, folder.id)}
                                            >
                                                <div className="col-icon">
                                                    <svg className="folder-table-icon" viewBox="0 0 24 24" width="20" height="20">
                                                        <path fill="#f59e0b" d="M10,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V8C22,6.89 21.1,6 20,6H12L10,4Z" />
                                                    </svg>
                                                </div>

                                                <div className="col-name">
                                                    {isEditing ? (
                                                        <form
                                                            onSubmit={(e) => handleRenameSubmit(e, folder.id, 'folder')}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="row-rename-form"
                                                        >
                                                            <input
                                                                value={renameValue}
                                                                onChange={(e) => setRenameValue(e.target.value)}
                                                                className="input-field input-field-sm"
                                                                autoFocus
                                                            />
                                                            <button type="submit" className="btn btn-primary btn-sm">Save</button>
                                                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditingItem(null)}>Cancel</button>
                                                        </form>
                                                    ) : (
                                                        <span className="row-item-name">
                                                            <span>{folder.name}</span>
                                                            {folder.isShared && folder.inviteCode && (
                                                                <span className="shared-badge">Shared</span>
                                                            )}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="col-type">Folder</div>
                                                <div className="col-size">-</div>
                                                <div className="col-date">{formatDate(folder.createdAt)}</div>

                                                <div className="col-actions">
                                                    {!isEditing && (
                                                        <button
                                                            type="button"
                                                            className="action-dots-btn"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openActionSheet(folder, 'folder');
                                                            }}
                                                            title="Actions"
                                                        >
                                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                                                <circle cx="12" cy="5" r="2" />
                                                                <circle cx="12" cy="12" r="2" />
                                                                <circle cx="12" cy="19" r="2" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Files in Table */}
                                    {filteredFiles.map(file => {
                                        const isEditing = editingItem && editingItem.type === 'file' && editingItem.id === file.id;
                                        return (
                                            <div
                                                key={`row-file-${file.id}`}
                                                className={`table-row clickable-row ${isEditing ? 'editing-row' : ''}`}
                                                onClick={(e) => {
                                                    if (e.target.closest('.col-actions') || e.target.closest('form')) return;
                                                    previewFile(e, file);
                                                }}
                                                onDoubleClick={(e) => {
                                                    if (e.target.closest('.col-actions') || e.target.closest('form')) return;
                                                    previewFile(e, file);
                                                }}
                                                title="Click to preview file"
                                                draggable={!isEditing}
                                                onDragStart={(e) => handleDragStartItem(e, { type: 'file', id: file.id, name: file.orgName })}
                                                onDragEnd={handleDragEndItem}
                                            >

                                                <div className="col-icon">
                                                    <FileIcon mimeType={file.mimeType} />
                                                </div>

                                                <div className="col-name">
                                                    {isEditing ? (
                                                        <form
                                                            onSubmit={(e) => handleRenameSubmit(e, file.id, 'file')}
                                                            className="row-rename-form"
                                                        >
                                                            <input
                                                                value={renameValue}
                                                                onChange={(e) => setRenameValue(e.target.value)}
                                                                className="input-field input-field-sm"
                                                                autoFocus
                                                            />
                                                            <button type="submit" className="btn btn-primary btn-sm">Save</button>
                                                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditingItem(null)}>Cancel</button>
                                                        </form>
                                                    ) : (
                                                        <span className="row-item-name">{file.orgName}</span>
                                                    )}
                                                </div>

                                                <div className="col-type">{getFileTypeLabel(file.mimeType)}</div>
                                                <div className="col-size">{formatBytes(file.size)}</div>
                                                <div className="col-date">{formatDate(file.createdAt)}</div>

                                                <div className="col-actions">
                                                    {!isEditing && (
                                                        <button
                                                            type="button"
                                                            className="action-dots-btn"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openActionSheet(file, 'file');
                                                            }}
                                                            title="Actions"
                                                        >
                                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                                                <circle cx="12" cy="5" r="2" />
                                                                <circle cx="12" cy="12" r="2" />
                                                                <circle cx="12" cy="19" r="2" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </section>
                </main>

                {/* Drag and Drop Zone Overlay */}
                {isDragging && (
                    <div className="drag-overlay">
                        <div className="drag-overlay-card">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            <h3>Drop file here to upload</h3>
                            <p>Release file to start uploading to the active folder</p>
                        </div>
                    </div>
                )}

                {/* File Preview Modal */}
                <FilePreviewModal
                    previewItem={previewItem}
                    onClose={closePreview}
                    onDownload={downloadFile}
                    onShare={shareFile}
                />

                {/* Bottom Sheet Action Menu */}
                {activeBottomSheet && (
                    <ActionBottomSheet
                        activeItem={activeBottomSheet}
                        onClose={() => setActiveBottomSheet(null)}
                    />
                )}

                {/* Full-Screen Directory Move Explorer Modal */}
                {showMoveModal && movingItem && (
                    <DirectoryMoveModal
                        movingItem={movingItem}
                        onClose={() => { setShowMoveModal(false); setMovingItem(null); }}
                        showToast={showToast}
                        onMoveSuccess={async (targetFolderId) => {
                            await moveItemToFolder(movingItem, targetFolderId);
                            setShowMoveModal(false);
                            setMovingItem(null);
                        }}
                    />
                )}

                {/* Share Modal */}
                {shareModalItem && (
                    <ShareModal
                        item={shareModalItem}
                        onClose={closeShareModal}
                        showToast={showToast}
                    />
                )}



                {/* Toast Container */}
                <div className="toast-container">
                    {toasts.map(toast => (
                        <div key={toast.id} className={`toast toast-${toast.type}`}>
                            <span>{toast.message}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}