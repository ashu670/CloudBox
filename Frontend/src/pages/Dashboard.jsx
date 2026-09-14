import { useState, useEffect, useMemo } from "react";
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
import {
  FolderPlus,
  Upload,
  Share2,
  UserPlus,
  Shield,
  ShieldAlert,
  History,
  Inbox,
  Users,
  Search,
  ChevronRight,
  Folder as FolderIcon,
  Home,
  ArrowLeft,
  Move,
  Download,
  Eye,
  Edit2,
  Trash2,
  HardDrive
} from "lucide-react";

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
    const [searchQuery, setSearchQuery] = useState("");

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
        if (mimeType.includes("zip") || mimeType.includes("tar") || mimeType.includes("gzip")) return "Zip Archive";
        return "File";
    };

    // Filtered folders and files based on client-side search
    const filteredFolders = useMemo(() => {
        if (!searchQuery.trim()) return folders;
        return folders.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [folders, searchQuery]);

    const filteredFiles = useMemo(() => {
        if (!searchQuery.trim()) return files;
        return files.filter(f => f.orgName.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [files, searchQuery]);

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
                    style={{ paddingLeft: `${10 + depth * 12}px` }}
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
                    <FolderIcon className="tree-icon" size={16} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{node.name}</span>
                </div>

                {isExpanded && (
                    <div className="tree-children">
                        {children ? (
                            children.length === 0 ? (
                                <div className="tree-node" style={{ paddingLeft: `${20 + depth * 12}px`, opacity: 0.5, fontStyle: 'italic', fontSize: '12px' }}>
                                    (Empty)
                                </div>
                            ) : (
                                children.map(child => renderTreeNode(child, depth + 1))
                            )
                        ) : (
                            <div className="tree-node" style={{ paddingLeft: `${20 + depth * 12}px`, opacity: 0.5, fontSize: '12px' }}>
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
                    <Home className="tree-icon" size={16} />
                    <span>Root Workspace</span>
                </div>

                {isExpanded && (
                    <div className="tree-children">
                        {rootChildren ? (
                            rootChildren.length === 0 ? (
                                <div className="tree-node" style={{ paddingLeft: '20px', opacity: 0.5, fontStyle: 'italic', fontSize: '12px' }}>
                                    (No Folders)
                                </div>
                            ) : (
                                rootChildren.map(child => renderTreeNode(child, 0))
                            )
                        ) : (
                            <div className="tree-node" style={{ paddingLeft: '20px', opacity: 0.5, fontSize: '12px' }}>
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
                <div className="sidebar-title">Workspace Directory</div>
                <div className="tree-container">
                    {renderRootNode()}
                </div>

                {/* Storage Meter Summary */}
                <div className="sidebar-storage-widget">
                    <div className="storage-label-row">
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <HardDrive size={14} color="#818cf8" /> Workspace Items
                        </span>
                        <span>{folders.length} folders • {files.length} files</span>
                    </div>
                    <div className="storage-bar-bg">
                        <div className="storage-bar-fill" style={{ width: `${Math.min(100, (files.length + folders.length) * 8)}%` }}></div>
                    </div>
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
                            <span key={folder.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <ChevronRight size={14} className="breadcrumb-separator" />
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
                            <span style={{ marginLeft: '12px', background: 'var(--accent-primary-subtle)', border: '1px solid var(--border-glow)', color: 'var(--accent-primary)', padding: '3px 10px', borderRadius: '999px', fontSize: '11.5px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                                Code: <strong>{currentFolderInfo.inviteCode}</strong> ({currentFolderInfo.isInviteActive ? 'Active' : 'Disabled'})
                            </span>
                        )}
                    </div>

                    <div className="toolbar-actions">
                        {/* Instant Search Bar */}
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <Search size={15} style={{ position: 'absolute', left: '12px', color: 'var(--text-dim)' }} />
                            <input
                                type="text"
                                placeholder="Search current folder..."
                                className="search-filter-input"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {movingItem && (
                            <div className="move-banner" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(2, 132, 199, 0.12)', border: '1px solid rgba(2, 132, 199, 0.3)', padding: '4px 12px', borderRadius: '8px' }}>
                                <span style={{ fontSize: '12.5px', color: 'var(--accent-cyan)' }}>
                                    Moving <strong>{movingItem.name}</strong>
                                </span>
                                <button type="button" className="btn btn-primary btn-sm" onClick={executeMove}>Move Here</button>
                                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setMovingItem(null)}>Cancel</button>
                            </div>
                        )}

                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowCreator(!showCreator)}>
                            <FolderPlus size={15} /> New Folder
                        </button>

                        <button
                            type="button"
                            className={`btn btn-secondary btn-sm ${sharedPanel === 'create' ? 'active' : ''}`}
                            onClick={() => toggleSharedPanel('create')}
                        >
                            <Share2 size={15} /> Create Shared
                        </button>

                        <button
                            type="button"
                            className={`btn btn-secondary btn-sm ${sharedPanel === 'join' ? 'active' : ''}`}
                            onClick={() => toggleSharedPanel('join')}
                        >
                            <UserPlus size={15} /> Join Shared
                        </button>

                        {isSharedFolderContext && (
                            <>
                                {currentFolderInfo?.userRole === 'OWNER' && (
                                    <button
                                        type="button"
                                        className={`btn btn-secondary btn-sm ${sharedPanel === 'owner-panel' ? 'active' : ''}`}
                                        onClick={() => toggleSharedPanel('owner-panel')}
                                    >
                                        <Shield size={15} color="#f59e0b" /> Owner Panel
                                    </button>
                                )}
                                {currentFolderInfo?.userRole === 'ADMIN' && (
                                    <button
                                        type="button"
                                        className={`btn btn-secondary btn-sm ${sharedPanel === 'admin-panel' ? 'active' : ''}`}
                                        onClick={() => toggleSharedPanel('admin-panel')}
                                    >
                                        <ShieldAlert size={15} color="#8b5cf6" /> Admin Panel
                                    </button>
                                )}
                                {(currentFolderInfo?.userRole === 'OWNER' || currentFolderInfo?.userRole === 'ADMIN') && (
                                    <button
                                        type="button"
                                        className={`btn btn-secondary btn-sm ${sharedPanel === 'activities' ? 'active' : ''}`}
                                        onClick={() => toggleSharedPanel('activities')}
                                    >
                                        <History size={15} /> Activity Logs
                                    </button>
                                )}
                                <button
                                    type="button"
                                    className={`btn btn-secondary btn-sm ${sharedPanel === 'requests' ? 'active' : ''}`}
                                    onClick={() => toggleSharedPanel('requests')}
                                >
                                    <Inbox size={15} /> Requests
                                </button>
                                <button
                                    type="button"
                                    className={`btn btn-secondary btn-sm ${sharedPanel === 'members' ? 'active' : ''}`}
                                    onClick={() => toggleSharedPanel('members')}
                                >
                                    <Users size={15} /> Members
                                </button>
                            </>
                        )}

                        <button 
                            type="button" 
                            className="btn btn-primary btn-sm btn-glow" 
                            onClick={() => document.getElementById("file-picker").click()}
                            disabled={isUploading}
                        >
                            <Upload size={15} /> {isUploading ? "Uploading..." : "Upload File"}
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

                {/* Shared Action Panels */}
                {sharedPanel && (
                    <div style={{ marginBottom: '20px' }}>
                        {sharedPanel === 'create' && (
                            <CreateSharedFolder onFolderCreated={handleSharedFolderCreated} />
                        )}
                        {sharedPanel === 'join' && (
                            <JoinSharedFolder onJoined={handleSharedFolderJoined} />
                        )}
                        {sharedPanel === 'owner-panel' && isSharedFolderContext && (
                            <div className="shared-view-panel">
                                <OwnerPanel
                                    folderId={currentFolderId}
                                    onNotify={(msg, type) => showToast(msg, type)}
                                    onRefresh={refreshAfterSharedAction}
                                />
                            </div>
                        )}
                        {sharedPanel === 'admin-panel' && isSharedFolderContext && (
                            <div className="shared-view-panel">
                                <AdminPanel
                                    folderId={currentFolderId}
                                    onNotify={(msg, type) => showToast(msg, type)}
                                    onRefresh={refreshAfterSharedAction}
                                />
                            </div>
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
                        <FolderPlus size={20} color="#8b5cf6" />
                        <input
                            value={folderName}
                            onChange={(e) => setFolderName(e.target.value)}
                            placeholder="Enter new folder name..."
                            className="input-field"
                            autoFocus
                            style={{ flex: 1 }}
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
                {currentFolderId !== -1 && currentFolderId !== 0 && (
                    <div style={{ marginBottom: '14px' }}>
                        <button onClick={goBack} className="btn btn-secondary btn-sm">
                            <ArrowLeft size={14} /> Back
                        </button>
                    </div>
                )}

                {/* Drag and Drop Zone Area */}
                {currentFolderId > 0 && (
                    <div className={`upload-dropzone ${isDragging ? 'dragover' : ''}`}>
                        <span className="upload-dropzone-text">
                            ⚡ Drag & drop files here or drag items onto folders to organize
                        </span>
                    </div>
                )}

                {/* Main List / Table */}
                {loading ? (
                    <div className="empty-state">
                        <p style={{ color: 'var(--text-muted)' }}>Loading files & folders...</p>
                    </div>
                ) : filteredFolders.length === 0 && filteredFiles.length === 0 ? (
                    <div className="empty-state">
                        <h3 className="empty-state-title">
                            {searchQuery ? "No matching items found" : "This folder is empty"}
                        </h3>
                        <p className="empty-state-text">
                            {searchQuery
                                ? `No files or folders matched "${searchQuery}".`
                                : (currentFolderId <= 0 
                                    ? "Create a folder to start organizing your files." 
                                    : "Upload a file or create a subfolder here.")}
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
                            <div style={{ textAlign: 'right' }}>Actions</div>
                        </div>

                        {/* Folders List */}
                        {filteredFolders.map(folder => {
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
                                        <FolderIcon size={20} color="#fbbf24" fill="#fbbf2420" />
                                    </div>
                                    <div className="file-name">
                                        {isEditing ? (
                                            <form 
                                                onSubmit={(e) => handleRenameSubmit(e, folder.id, 'folder')} 
                                                onClick={(e) => e.stopPropagation()}
                                                style={{ display: 'flex', gap: '6px', width: '100%' }}
                                            >
                                                <input 
                                                    value={renameValue} 
                                                    onChange={(e) => setRenameValue(e.target.value)} 
                                                    className="input-field" 
                                                    autoFocus
                                                    style={{ padding: '4px 8px', fontSize: '13px' }}
                                                />
                                                <button type="submit" className="btn btn-primary btn-sm">Save</button>
                                                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditingItem(null)}>Cancel</button>
                                            </form>
                                        ) : (
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                                <span>{folder.name}</span>
                                                {folder.isShared && folder.inviteCode && (
                                                    <span style={{ background: 'rgba(124, 58, 237, 0.15)', border: '1px solid rgba(139, 92, 246, 0.3)', color: '#c4b5fd', padding: '1px 6px', borderRadius: '4px', fontSize: '10.5px', fontWeight: '600' }}>
                                                        Code: {folder.inviteCode}
                                                    </span>
                                                )}
                                            </span>
                                        )}
                                    </div>
                                    <div className="file-size">—</div>
                                    <div className="file-type">Folder</div>
                                    <div className="file-date">{formatDate(folder.createdAt)}</div>
                                    <div className="row-actions">
                                        {!isEditing && (
                                            <>
                                                <button className="action-btn" title="Rename Folder" onClick={(e) => { e.stopPropagation(); setEditingItem({ type: 'folder', id: folder.id }); setRenameValue(folder.name); }}>
                                                    <Edit2 size={12} /> Rename
                                                </button>
                                                <button className="action-btn btn-delete" title="Delete Folder" onClick={(e) => deleteFolder(e, folder.id)}>
                                                    <Trash2 size={12} /> Delete
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Files List */}
                        {filteredFiles.map(file => {
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
                                                style={{ display: 'flex', gap: '6px', width: '100%' }}
                                            >
                                                <input 
                                                    value={renameValue} 
                                                    onChange={(e) => setRenameValue(e.target.value)} 
                                                    className="input-field" 
                                                    autoFocus
                                                    style={{ padding: '4px 8px', fontSize: '13px' }}
                                                />
                                                <button type="submit" className="btn btn-primary btn-sm">Save</button>
                                                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditingItem(null)}>Cancel</button>
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
                                                <button className="action-btn" title="Preview File" onClick={(e) => previewFile(e, file)}>
                                                    <Eye size={12} /> Preview
                                                </button>
                                                <button className="action-btn" title="Download File" onClick={(e) => downloadFile(e, file.id, file.orgName)}>
                                                    <Download size={12} /> Download
                                                </button>
                                                <button className="action-btn" title="Rename File" onClick={(e) => { e.stopPropagation(); setEditingItem({ type: 'file', id: file.id }); setRenameValue(file.orgName); }}>
                                                    <Edit2 size={12} /> Rename
                                                </button>
                                                <button className="action-btn btn-delete" title="Delete File" onClick={(e) => deleteFile(e, file.id)}>
                                                    <Trash2 size={12} /> Delete
                                                </button>
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