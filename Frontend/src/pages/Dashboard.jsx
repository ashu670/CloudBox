import { useFolderManager } from "../hooks/useFolderManager";
import { formatBytes, formatDate } from "../utils/formatters";
import FileIcon from "../components/FileIcon"; // Correct relative import path

export default function FolderView() {
    const {
        folders, files, currentFolderId, history, folderName, setFolderName,
        loading, isUploading, isDragging, setIsDragging, showCreator, setShowCreator,
        editingItem, setEditingItem, renameValue, setRenameValue, movingItem, setMovingItem,
        toasts, expandedFolders, treeNodes, createFolder, deleteFolder, deleteFile,
        downloadFile, handleRenameSubmit, executeMove, handleFileUpload,
        handleFolderSelect, toggleFolderExpand, goBack
    } = useFolderManager();

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
        const children = treeNodes[node.id];

        return (
            <div key={node.id} className="tree-node-wrapper">
                <div 
                    className={`tree-node ${isActive ? 'active' : ''}`}
                    style={{ paddingLeft: `${12 + depth * 12}px` }}
                    onClick={() => handleFolderSelect(node)}
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
        const rootChildren = treeNodes[-1];

        return (
            <div className="tree-node-wrapper">
                <div 
                    className={`tree-node ${isActive ? 'active' : ''}`}
                    onClick={() => handleFolderSelect({ id: -1, name: "Root", pid: null })}
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
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleFileUpload(e.dataTransfer.files[0]);
                    }
                }}
            >
                {/* Explorer Header */}
                <div className="explorer-header">
                    <div className="breadcrumbs">
                        <span 
                            className={`breadcrumb-item ${currentFolderId === -1 ? 'active' : ''}`}
                            onClick={() => handleFolderSelect({ id: -1, name: "Root" })}
                        >
                            Root
                        </span>
                        {history.map((folder, index) => (
                            <span key={folder.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                <span className="breadcrumb-separator">/</span>
                                <span 
                                    className={`breadcrumb-item ${index === history.length - 1 ? 'active' : ''}`}
                                    onClick={() => handleFolderSelect(folder)}
                                >
                                    {folder.name}
                                </span>
                            </span>
                        ))}
                    </div>

                    <div className="toolbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {movingItem && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', padding: '6px 12px', borderRadius: '6px', marginRight: '8px' }}>
                                <span style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 500 }}>
                                    Moving <strong>{movingItem.name}</strong>
                                </span>
                                <button type="button" className="btn btn-primary" onClick={executeMove} style={{ padding: '4px 10px', fontSize: '12px' }}>Move Here</button>
                                <button type="button" className="btn btn-secondary" onClick={() => setMovingItem(null)} style={{ padding: '4px 10px', fontSize: '12px' }}>Cancel</button>
                            </div>
                        )}

                        <button className="btn btn-secondary" onClick={() => setShowCreator(!showCreator)}>
                            New Folder
                        </button>

                        <button 
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
                            <span className="upload-dropzone-text">Drag & drop files here to upload</span>
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
                            return (
                                <div 
                                    key={`folder-${folder.id}`} 
                                    className="file-row clickable-row"
                                    onClick={() => !isEditing && handleFolderSelect(folder)}
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
                                            <span>{folder.name}</span>
                                        )}
                                    </div>
                                    <div className="file-size">-</div>
                                    <div className="file-type">File folder</div>
                                    <div className="file-date">{formatDate(folder.createdAt)}</div>
                                    <div className="row-actions">
                                        {!isEditing && (
                                            <>
                                                <button className="action-btn" onClick={(e) => { e.stopPropagation(); setEditingItem({ type: 'folder', id: folder.id }); setRenameValue(folder.name); }}>Rename</button>
                                                <button className="action-btn" onClick={(e) => { e.stopPropagation(); setMovingItem({ type: 'folder', id: folder.id, name: folder.name }); }}>Move</button>
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
                                <div key={`file-${file.id}`} className="file-row">
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
                                                <button className="action-btn" onClick={(e) => downloadFile(e, file.id, file.orgName)}>Download</button>
                                                <button className="action-btn" onClick={(e) => { e.stopPropagation(); setEditingItem({ type: 'file', id: file.id }); setRenameValue(file.orgName); }}>Rename</button>
                                                <button className="action-btn" onClick={(e) => { e.stopPropagation(); setMovingItem({ type: 'file', id: file.id, name: file.orgName }); }}>Move</button>
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