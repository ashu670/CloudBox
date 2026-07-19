import { useEffect, useState, useCallback } from "react";
import axios from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function FolderView() {
    const [folders, setFolders] = useState([]);
    const [files, setFiles] = useState([]);
    const [currentFolderId, setCurrentFolderId] = useState(-1);
    const [history, setHistory] = useState([]);
    const [folderName, setFolderName] = useState("");
    const [loading, setLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [showCreator, setShowCreator] = useState(false);

    // Toast notifications
    const [toasts, setToasts] = useState([]);

    // Tree sidebar state
    const [expandedFolders, setExpandedFolders] = useState({ "-1": true });
    const [treeNodes, setTreeNodes] = useState({});
    const [foldersCache, setFoldersCache] = useState({});

    const navigate = useNavigate();

    const showToast = (message, type = "success") => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    };

    const addToCache = (folderList) => {
        if (!folderList || !Array.isArray(folderList)) return;
        setFoldersCache(prev => {
            const next = { ...prev };
            folderList.forEach(f => {
                next[f.id] = f;
            });
            return next;
        });
    };

    const fetchTreeSubfolders = async (folderId) => {
        try {
            const token = localStorage.getItem("accessToken");
            const fetchId = folderId === -1 ? -1 : folderId;
            const { data } = await axios.get(`api/folder/fetch/${fetchId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            const fetchedChildren = data.children?.children || [];
            addToCache(fetchedChildren);

            setTreeNodes(prev => ({
                ...prev,
                [folderId]: fetchedChildren
            }));
        } catch (err) {
            console.error("Error fetching tree subfolders:", err);
        }
    };

    const fetchFolders = useCallback(async (id = currentFolderId) => {
        setLoading(true);

        try {
            const token = localStorage.getItem("accessToken");
            const { data } = await axios.get(`api/folder/fetch/${id}`, {
                headers : {Authorization : `Bearer ${token}`}
            });
            
            setFolders(data.children?.children || []);
            setFiles(data.children?.files || []);
            addToCache(data.children?.children || []);
            
            if (data.children && data.children.id !== null) {
                setFoldersCache(prev => ({
                    ...prev,
                    [data.children.id]: data.children
                }));
            }
        } catch (err) {
            console.error(err);
            if (err.response?.status === 401 || err.response?.status === 403) {
                showToast("Session expired. Please log in again.", "error");
                navigate("/login");
            } else {
                showToast(err.response?.data?.error || "Unable to fetch contents.", "error");
            }
        } finally {
            setLoading(false);
        }
    }, [currentFolderId, navigate]);

    // Rebuild breadcrumbs history using the parent-pointer cache
    const rebuildHistory = (folderId) => {
        const path = [];
        let currentId = folderId;
        while (currentId && currentId !== -1 && currentId !== 0) {
            const folder = foldersCache[currentId];
            if (!folder) break;
            path.unshift({ id: folder.id, name: folder.name, pid: folder.pid });
            currentId = folder.pid;
        }
        return path;
    };

    useEffect(() => {
        const initDashboard = async () => {
            await fetchTreeSubfolders(-1);
            setExpandedFolders(prev => ({ ...prev, "-1": true }));
        };
        initDashboard();
    }, []);

    useEffect(() => {
        fetchFolders();
    }, [fetchFolders]);

    const createFolder = async (e) => {
        e.preventDefault();

        if (!folderName.trim()) return;

        try {
            const token = localStorage.getItem("accessToken");

            await axios.post("api/folder/create", {
                name: folderName,
                pid: currentFolderId === -1 ? null : currentFolderId
            },{
                headers : {Authorization : `Bearer ${token}`}
            });

            showToast("Folder created successfully", "success");
            setFolderName("");
            setShowCreator(false);
            
            // Reload views
            fetchFolders();
            fetchTreeSubfolders(currentFolderId);

        } catch (err) {
            console.error(err);
            showToast(err.response?.data?.error || "Failed to create folder", "error");
        }
    };

    const deleteFolder = async (e, folderId) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this folder and all its contents?")) return;

        try {
            const token = localStorage.getItem("accessToken");
            await axios.delete(`api/folder/delete/${folderId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showToast("Folder deleted successfully", "success");
            
            // Refresh views
            fetchFolders();
            fetchTreeSubfolders(currentFolderId);
        } catch (err) {
            console.error(err);
            showToast(err.response?.data?.error || "Failed to delete folder", "error");
        }
    };

    const handleFileUpload = async (file) => {
        if (!file) return;
        setIsUploading(true);

        if (currentFolderId <= 0) {
            showToast("Please open or create a folder first to upload files.", "error");
            setIsUploading(false);
            return;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("folderId", currentFolderId);

        try {
            const token = localStorage.getItem("accessToken");
            await axios.post("api/file/upload", formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data"
                }
            });
            showToast(`File "${file.name}" uploaded successfully`, "success");
            fetchFolders();
        } catch (err) {
            console.error(err);
            showToast(err.response?.data?.message || err.response?.data?.error || "File upload failed", "error");
        } finally {
            setIsUploading(false);
        }
    };

    const handleFolderSelect = (folder) => {
        if (folder.id === -1 || folder.id === 0) {
            setCurrentFolderId(-1);
            setHistory([]);
        } else {
            const newHistory = rebuildHistory(folder.id);
            setHistory(newHistory);
            setCurrentFolderId(folder.id);
        }
    };

    const toggleFolderExpand = async (folderId, e) => {
        e.stopPropagation();
        const isExpanded = expandedFolders[folderId];
        
        setExpandedFolders(prev => ({
            ...prev,
            [folderId]: !isExpanded
        }));

        if (!isExpanded && !treeNodes[folderId]) {
            await fetchTreeSubfolders(folderId);
        }
    };

    const goBack = () => {
        const temp = [...history];
        temp.pop();
        setHistory(temp);

        if (temp.length === 0)
            setCurrentFolderId(-1);
        else
            setCurrentFolderId(temp[temp.length - 1].id);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    };

    // Helper to format byte counts
    const formatBytes = (bytes, decimals = 2) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        const date = new Date(dateStr);
        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getFileIcon = (mimeType) => {
        if (mimeType.startsWith("image/")) {
            return (
                <svg className="file-svg" viewBox="0 0 24 24" style={{ fill: '#3b82f6' }}>
                    <path d="M8.5,13.5L11,16.5L14.5,12L19,18H5L8.5,13.5M21,19V5C21,3.89 20.1,3 19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19M5,5H19V19H5V5Z" />
                </svg>
            );
        }
        if (mimeType === "application/pdf") {
            return (
                <svg className="file-svg" viewBox="0 0 24 24" style={{ fill: '#ef4444' }}>
                    <path d="M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M19,19H5V5H19V19M10,17H14V15H10V17M10,13H16V11H10V13M10,9H16V7H10V9Z" />
                </svg>
            );
        }
        if (mimeType.startsWith("audio/") || mimeType.startsWith("video/")) {
            return (
                <svg className="file-svg" viewBox="0 0 24 24" style={{ fill: '#aa3bff' }}>
                    <path d="M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5Z" />
                </svg>
            );
        }
        if (mimeType.startsWith("text/") || mimeType.includes("javascript") || mimeType.includes("json")) {
            return (
                <svg className="file-svg" viewBox="0 0 24 24" style={{ fill: '#f59e0b' }}>
                    <path d="M12.89,3L14.85,3.4L11.11,21L9.15,20.6L12.89,3M19.59,12L16,8.41V5.58L22.42,12L16,18.41V15.58L19.59,12M1.58,12L8,5.58V8.41L4.41,12L8,15.58V18.41L1.58,12Z" />
                </svg>
            );
        }
        return (
            <svg className="file-svg" viewBox="0 0 24 24" style={{ fill: '#6b7280' }}>
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
            </svg>
        );
    };

    const getFileTypeLabel = (mimeType) => {
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
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
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

                    <div className="toolbar-actions">
                        <button 
                            className="btn btn-secondary"
                            onClick={() => setShowCreator(!showCreator)}
                        >
                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M20,6H12L10,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V8C22,6.89 21.1,6 20,6M18,12H14V16H12V12H8V10H12V6H14V10H18V12Z" />
                            </svg>
                            New Folder
                        </button>

                        <button 
                            className="btn btn-primary"
                            onClick={() => document.getElementById("file-picker").click()}
                            disabled={isUploading}
                        >
                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M9,16V10H5L12,3L19,10H15V16H9M5,20V18H19V20H5Z" />
                            </svg>
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
                    <div>
                        <button onClick={goBack} className="btn btn-secondary btn-sm">
                            ← Back
                        </button>
                    </div>
                )}

                {/* Drag and Drop Zone Area */}
                {currentFolderId > 0 && (
                    <div className={`upload-dropzone ${isDragging ? 'dragover' : ''}`}>
                        <div className="upload-dropzone-inner">
                            <svg className="upload-icon" viewBox="0 0 24 24">
                                <path d="M19.35,10.03C18.67,6.59 15.64,4 12,4C9.11,4 6.6,5.64 5.35,8.03C2.34,8.36 0,10.9 0,14C0,17.1 2.9,20 6,20H19C21.76,20 24,17.76 24,15C24,12.36 21.95,10.22 19.35,10.03M14,13V17H10V13H7L12,8L17,13H14Z" />
                            </svg>
                            <span className="upload-dropzone-text">Drag & drop files here to upload</span>
                            <span className="upload-dropzone-subtext">or click the Upload button above</span>
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
                        <svg className="empty-state-svg" viewBox="0 0 24 24">
                            <path d="M20,18H4V8H20M20,6H12L10,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V8C22,6.89 21.1,6 20,6Z" />
                        </svg>
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

                        {/* Folders first */}
                        {folders.map(folder => (
                            <div 
                                key={`folder-${folder.id}`} 
                                className="file-row clickable-row"
                                onClick={() => handleFolderSelect(folder)}
                            >
                                <div className="item-icon-col">
                                    <svg className="folder-svg" viewBox="0 0 24 24">
                                        <path d="M10,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V8C22,6.89 21.1,6 20,6H12L10,4Z" />
                                    </svg>
                                </div>
                                <div className="file-name" title={folder.name}>
                                    {folder.name}
                                </div>
                                <div className="file-size">-</div>
                                <div className="file-type">File folder</div>
                                <div className="file-date">{formatDate(folder.createdAt)}</div>
                                <div>
                                    <button 
                                        className="delete-btn"
                                        onClick={(e) => deleteFolder(e, folder.id)}
                                        title="Delete folder"
                                    >
                                        <svg className="delete-icon" viewBox="0 0 24 24">
                                            <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}

                        {/* Files second */}
                        {files.map(file => (
                            <div key={`file-${file.id}`} className="file-row">
                                <div className="item-icon-col">
                                    {getFileIcon(file.mimeType)}
                                </div>
                                <div className="file-name" title={file.orgName}>
                                    {file.orgName}
                                </div>
                                <div className="file-size">{formatBytes(file.size)}</div>
                                <div className="file-type">{getFileTypeLabel(file.mimeType)}</div>
                                <div className="file-date">{formatDate(file.createdAt)}</div>
                                <div></div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Custom sliding Toast notifications */}
            <div className="toast-container">
                {toasts.map(toast => (
                    <div key={toast.id} className={`toast toast-${toast.type}`}>
                        {toast.type === "success" ? (
                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        ) : (
                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        )}
                        <span>{toast.message}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}