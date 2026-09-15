import { useState, useEffect, useCallback } from "react";
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
import TrashModal from "../components/TrashModal";
import { lockBodyScroll, unlockBodyScroll } from "../utils/scrollLock";
import axios from "../api/axios";

export default function FolderView() {
    const {
        folders, files, filteredFolders, filteredFiles, userProfile, storageBreakdown, searchQuery, setSearchQuery,
        searchLoading, searchError,
        rootFolderId, currentFolderId, history, folderName, setFolderName,
        loading, isUploading, isDragging, setIsDragging, showCreator, setShowCreator,
        editingItem, setEditingItem, renameValue, setRenameValue, movingItem, setMovingItem,
        previewItem, previewFile, closePreview,
        toasts, currentFolderInfo,
        createFolder, deleteFolder, deleteFile,
        downloadFile, shareFile, openShareModal, closeShareModal, shareModalItem, handleRenameSubmit, executeMove, moveItemToFolder, handleFileUpload,
        handleFolderSelect, goBack, refreshAfterSharedAction, showToast
    } = useFolderManager();

    const [sharedPanel, setSharedPanel] = useState(null);
    const [draggedItem, setDraggedItem] = useState(null);
    const [dropTargetId, setDropTargetId] = useState(null);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [showMoveModal, setShowMoveModal] = useState(false);
    const [activeBottomSheet, setActiveBottomSheet] = useState(null);
    const [showTrash, setShowTrash] = useState(false);
    const [viewMode, setViewMode] = useState("list");
    const [activeNav, setActiveNav] = useState("dashboard");
    const [selectedRows, setSelectedRows] = useState(new Set());

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
                onClick: () => {
                    setMovingItem({ type: 'folder', id: item.id, name: item.name });
                    setShowMoveModal(true);
                }
            },
            {
                type: 'rename',
                label: "Rename",
                onClick: () => {
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
                onClick: () => shareFile(item.id)
            },
            {
                type: 'move',
                label: "Move",
                onClick: () => {
                    setMovingItem({ type: 'file', id: item.id, name: item.orgName });
                    setShowMoveModal(true);
                }
            },
            {
                type: 'rename',
                label: "Rename",
                onClick: () => {
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

    const getFileTypeLabel = (mimeType, fileName = "") => {
        if (!mimeType && !fileName) return "Document";
        const name = (fileName || "").toLowerCase();
        if (mimeType?.startsWith("image/") || name.match(/\.(png|jpe?g|gif|webp|svg)$/)) return "Image";
        if (mimeType === "application/pdf" || name.endsWith(".pdf")) return "PDF";
        if (mimeType?.startsWith("audio/") || name.match(/\.(mp3|wav|ogg|m4a)$/)) return "Audio";
        if (mimeType?.startsWith("video/") || name.match(/\.(mp4|mov|webm|mkv)$/)) return "Video";
        if (name.match(/\.(doc|docx)$/)) return "Document";
        if (name.match(/\.(xls|xlsx)$/)) return "Spreadsheet";
        if (mimeType?.includes("zip") || name.match(/\.(zip|tar|gz|rar)$/)) return "Archive";
        return "Document";
    };

    // Calculate Storage metrics — only use real values from API, never fake fallbacks
    const usedStorageBytes = userProfile?.usedStorage || 0;
    const limitStorageBytes = userProfile?.storageLimit || 0;
    const storagePercent = limitStorageBytes > 0
        ? Math.min(100, Math.round((usedStorageBytes / limitStorageBytes) * 100))
        : 0;

    // Category breakdown — show 0 when not yet loaded; never fallback to fake numbers
    const categoryStats = storageBreakdown || {};
    const docSize = formatBytes(categoryStats.document || 0);
    const imgSize = formatBytes(categoryStats.image || 0);
    const vidSize = formatBytes(categoryStats.video || 0);
    const audSize = formatBytes(categoryStats.audio || 0);

    // Greeting according to local time
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
    };

    // Real user info — never show hardcoded dummy values
    const userName = userProfile?.name || "";
    const userEmail = userProfile?.email || "";

    // Checkbox toggling
    const toggleRowSelect = (id) => {
        setSelectedRows(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    // Real activity state — fetched from the root folder's activity log
    const [recentActivity, setRecentActivity] = useState([]);
    const [activityLoading, setActivityLoading] = useState(false);

    const fetchRecentActivity = useCallback(async (fId) => {
        if (!fId || fId === -1) return;
        setActivityLoading(true);
        try {
            const { data } = await axios.get(`api/folder/activities/${fId}`);
            setRecentActivity((data.data || []).slice(0, 4));
        } catch {
            setRecentActivity([]);
        } finally {
            setActivityLoading(false);
        }
    }, []);

    useEffect(() => {
        if (rootFolderId && rootFolderId !== -1) {
            fetchRecentActivity(rootFolderId);
        }
    }, [rootFolderId, fetchRecentActivity]);

    // Helper: map activity action type to icon + colour
    const getActivityMeta = (action = "") => {
        const a = action.toUpperCase();
        if (a.includes("FOLDER") && (a.includes("CREATE") || a.includes("ADD")))
            return { color: "yellow", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" /></svg> };
        if (a.includes("UPLOAD") || a.includes("FILE") && a.includes("ADD"))
            return { color: "blue", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg> };
        if (a.includes("JOIN") || a.includes("MEMBER"))
            return { color: "purple", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg> };
        if (a.includes("DELETE") || a.includes("TRASH") || a.includes("REMOVE"))
            return { color: "red", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg> };
        return { color: "blue", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg> };
    };

    // Folder cards — only real data, never mock
    const displayFolderCards = filteredFolders;

    return (
        <div className="app-container">
            {/* Topbar Header */}
            <Navbar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                userProfile={userProfile}
                onToggleSidebar={() => setMobileSidebarOpen(prev => !prev)}
            />

            <div className="cb-dashboard-wrapper">
                {/* Mobile Sidebar Backdrop */}
                {mobileSidebarOpen && (
                    <div className="sidebar-backdrop active" onClick={() => setMobileSidebarOpen(false)}></div>
                )}

                {/* ─── 1. LEFT SIDEBAR ─────────────────────────────────────── */}
                <aside className={`cb-left-sidebar ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
                    <nav className="cb-sidebar-nav">
                        <button
                            type="button"
                            className={`cb-nav-item ${activeNav === 'dashboard' ? 'active' : ''}`}
                            onClick={() => {
                                setActiveNav('dashboard');
                                handleFolderSelect({ id: rootFolderId !== -1 ? rootFolderId : -1, name: "Root", pid: null });
                                setMobileSidebarOpen(false);
                            }}
                        >
                            <svg className="cb-nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                            </svg>
                            <span>Dashboard</span>
                        </button>

                        <button
                            type="button"
                            className={`cb-nav-item ${activeNav === 'files' ? 'active' : ''}`}
                            onClick={() => {
                                setActiveNav('files');
                                handleFolderSelect({ id: rootFolderId !== -1 ? rootFolderId : -1, name: "Root", pid: null });
                                setMobileSidebarOpen(false);
                            }}
                        >
                            <svg className="cb-nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                            </svg>
                            <span>My Files</span>
                        </button>

                        <button
                            type="button"
                            className={`cb-nav-item ${activeNav === 'projects' ? 'active' : ''}`}
                            onClick={() => {
                                setActiveNav('projects');
                                setSharedPanel('create');
                                setMobileSidebarOpen(false);
                            }}
                        >
                            <svg className="cb-nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                            <span>Projects</span>
                        </button>

                        <button
                            type="button"
                            className={`cb-nav-item ${activeNav === 'shared' ? 'active' : ''}`}
                            onClick={() => {
                                setActiveNav('shared');
                                setSharedPanel('members');
                                setMobileSidebarOpen(false);
                            }}
                        >
                            <svg className="cb-nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                            </svg>
                            <span>Shared with Me</span>
                        </button>

                        <button
                            type="button"
                            className={`cb-nav-item ${activeNav === 'trash' ? 'active' : ''}`}
                            onClick={() => {
                                setActiveNav('trash');
                                setShowTrash(true);
                                setMobileSidebarOpen(false);
                            }}
                        >
                            <svg className="cb-nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                <path d="M10 11v6" /><path d="M14 11v6" />
                                <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                            </svg>
                            <span>Trash</span>
                        </button>
                    </nav>

                    {/* Bottom Left Sidebar Storage & Profile */}
                    <div className="cb-sidebar-bottom">
                        {/* Donut Storage Widget */}
                        <div className="cb-sidebar-storage-card">
                            <div className="cb-storage-donut-row">
                                <div className="cb-donut-wrapper">
                                    <svg className="cb-donut-svg" width="48" height="48" viewBox="0 0 36 36">
                                        <path
                                            className="cb-donut-bg"
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                            fill="none"
                                            strokeWidth="3.8"
                                        />
                                        <path
                                            className="cb-donut-fill"
                                            strokeDasharray={`${storagePercent}, 100`}
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                            fill="none"
                                            strokeWidth="3.8"
                                        />
                                    </svg>
                                </div>
                                <div className="cb-donut-text">
                                    <span className="cb-donut-title">
                                        {limitStorageBytes > 0
                                            ? `${formatBytes(usedStorageBytes)} of ${formatBytes(limitStorageBytes)} used`
                                            : "Loading storage..."}
                                    </span>
                                    <div className="cb-donut-mini-bar">
                                        <div className="cb-donut-mini-fill" style={{ width: `${storagePercent}%` }}></div>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                className="cb-manage-storage-btn"
                                onClick={() => showToast(`Total Storage: ${formatBytes(limitStorageBytes)} (${storagePercent}% used)`, "info")}
                            >
                                Manage Storage
                            </button>
                        </div>

                        {/* Bottom Profile Snippet */}
                        <div className="cb-sidebar-user-row">
                            <div className="cb-user-avatar-sm">
                                {userName.charAt(0).toUpperCase()}
                            </div>
                            <span className="cb-user-email-text" title={userEmail}>
                                {userEmail}
                            </span>
                            <svg className="cb-user-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </div>
                    </div>
                </aside>

                {/* ─── 2. CENTER CONTENT (WORKSPACE) ───────────────────────── */}
                <main
                    className="cb-center-content"
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
                    {/* Welcome Hero Card */}
                    <div className="cb-hero-card">
                        <div className="cb-hero-left">
                            <h1 className="cb-hero-title">
                                {getGreeting()}, {userName}
                            </h1>
                            <p className="cb-hero-subtitle">
                                Your files. Anywhere. Always with you.
                            </p>

                            <div className="cb-hero-actions">
                                <button
                                    type="button"
                                    className="cb-btn-upload"
                                    onClick={() => document.getElementById("file-picker").click()}
                                    disabled={isUploading}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="17 8 12 3 7 8" />
                                        <line x1="12" y1="3" x2="12" y2="15" />
                                    </svg>
                                    <span>{isUploading ? "Uploading..." : "Upload File"}</span>
                                </button>

                                <button
                                    type="button"
                                    className="cb-btn-outlined"
                                    onClick={() => setShowCreator(true)}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                                    </svg>
                                    <span>Create Folder</span>
                                </button>

                                <button
                                    type="button"
                                    className="cb-btn-outlined"
                                    onClick={() => setSharedPanel('create')}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                        <circle cx="8.5" cy="7" r="4" />
                                        <line x1="20" y1="8" x2="20" y2="14" />
                                        <line x1="23" y1="11" x2="17" y2="11" />
                                    </svg>
                                    <span>New Project</span>
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

                        {/* Scenic Landscape Illustration on Right */}
                        <div className="cb-hero-right">
                            <div className="cb-scenic-illustration">
                                <svg viewBox="0 0 340 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="cb-scenic-svg">
                                    {/* Soft warm sun */}
                                    <circle cx="210" cy="55" r="32" fill="url(#sun-grad)" opacity="0.85" />
                                    {/* Mountain Layer 1 */}
                                    <path
                                        d="M110 140 C145 90 190 75 240 110 C270 128 310 135 340 140 Z"
                                        fill="url(#mountain-grad-1)"
                                        opacity="0.6"
                                    />
                                    {/* Mountain Layer 2 */}
                                    <path
                                        d="M170 140 C210 95 260 90 310 125 C325 132 335 137 340 140 Z"
                                        fill="url(#mountain-grad-2)"
                                        opacity="0.75"
                                    />
                                    {/* Mountain Foreground */}
                                    <path
                                        d="M140 140 C190 110 240 105 340 140 Z"
                                        fill="url(#mountain-grad-3)"
                                        opacity="0.9"
                                    />
                                    <defs>
                                        <linearGradient id="sun-grad" x1="210" y1="23" x2="210" y2="87" gradientUnits="userSpaceOnUse">
                                            <stop stopColor="#fed7aa" />
                                            <stop offset="1" stopColor="#fbcfe8" />
                                        </linearGradient>
                                        <linearGradient id="mountain-grad-1" x1="110" y1="80" x2="340" y2="140" gradientUnits="userSpaceOnUse">
                                            <stop stopColor="#c7d2fe" />
                                            <stop offset="1" stopColor="#e0e7ff" />
                                        </linearGradient>
                                        <linearGradient id="mountain-grad-2" x1="170" y1="90" x2="340" y2="140" gradientUnits="userSpaceOnUse">
                                            <stop stopColor="#a5b4fc" />
                                            <stop offset="1" stopColor="#c7d2fe" />
                                        </linearGradient>
                                        <linearGradient id="mountain-grad-3" x1="140" y1="105" x2="340" y2="140" gradientUnits="userSpaceOnUse">
                                            <stop stopColor="#818cf8" stopOpacity="0.4" />
                                            <stop offset="1" stopColor="#c7d2fe" stopOpacity="0.2" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                            </div>
                            <div className="cb-hero-quote">
                                A more organized<br />you, a brighter tomorrow.
                            </div>
                        </div>
                    </div>

                    {/* Subfolder Breadcrumbs & Back Navigation */}
                    {history.length > 0 && (
                        <div className="cb-breadcrumbs-bar">
                            <button onClick={goBack} className="cb-back-btn">
                                &larr; Back
                            </button>
                            <div className="cb-breadcrumbs-list">
                                <span
                                    className="cb-breadcrumb-item"
                                    onClick={() => handleFolderSelect({ id: rootFolderId !== -1 ? rootFolderId : -1, name: "Root" })}
                                >
                                    Root
                                </span>
                                {history.map((folder, idx) => (
                                    <span key={folder.id} className="cb-breadcrumb-chunk">
                                        <span className="cb-breadcrumb-sep">/</span>
                                        <span
                                            className={`cb-breadcrumb-item ${idx === history.length - 1 ? 'active' : ''}`}
                                            onClick={() => handleFolderSelect(folder)}
                                        >
                                            {folder.name}
                                        </span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ─── "My Folders" Section ────────────────────────────── */}
                    <section className="cb-section">
                        <div className="cb-section-header">
                            <h2 className="cb-section-title">
                                {isSharedFolderContext ? "Project Folders" : "My Folders"}
                            </h2>
                            <button
                                type="button"
                                className="cb-view-all-link"
                                onClick={() => handleFolderSelect({ id: rootFolderId !== -1 ? rootFolderId : -1, name: "Root" })}
                            >
                                View all &rarr;
                            </button>
                        </div>

                        <div className="cb-folders-row">
                            {loading && filteredFolders.length === 0 ? (
                                <div className="cb-folders-loading">
                                    <div className="spinner" style={{ width: 28, height: 28 }}></div>
                                </div>
                            ) : displayFolderCards.length === 0 ? (
                                <div className="cb-empty-folders-state">
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-faint, #6b7280)", marginBottom: 10 }}>
                                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                                    </svg>
                                    <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "13px" }}>No folders yet.</p>
                                    <button
                                        type="button"
                                        className="cb-btn-outlined"
                                        style={{ marginTop: 10, fontSize: "12px", padding: "6px 14px" }}
                                        onClick={() => setShowCreator(true)}
                                    >
                                        + Create your first folder
                                    </button>
                                </div>
                            ) : (
                                displayFolderCards.slice(0, 3).map((folder) => {
                                    const isEditing = editingItem && editingItem.type === 'folder' && editingItem.id === folder.id;
                                    const isTarget = dropTargetId === folder.id;
                                    return (
                                        <div
                                            key={folder.id}
                                            className={`cb-folder-card ${isTarget ? 'drag-over' : ''}`}
                                            onClick={() => { if (!isEditing) handleFolderSelect(folder); }}
                                            draggable={!isEditing}
                                            onDragStart={(e) => handleDragStartItem(e, { type: 'folder', id: folder.id, name: folder.name })}
                                            onDragEnd={handleDragEndItem}
                                            onDragOver={(e) => handleDragOverTarget(e, folder.id)}
                                            onDragLeave={(e) => handleDragLeaveTarget(e, folder.id)}
                                            onDrop={(e) => handleDropOnTarget(e, folder.id)}
                                        >
                                            <div className="cb-folder-icon-box">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="#6366f1">
                                                    <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                                                </svg>
                                            </div>

                                            <div className="cb-folder-meta">
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
                                                        <span className="cb-folder-name" title={folder.name}>
                                                            {folder.name}
                                                        </span>
                                                        <span className="cb-folder-subtext">
                                                            {`${folder.fileCount || 0} files • ${formatDate(folder.createdAt)}`}
                                                        </span>
                                                    </>
                                                )}
                                            </div>

                                            {!isEditing && (
                                                <button
                                                    type="button"
                                                    className="cb-card-dots-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openActionSheet(folder, 'folder');
                                                    }}
                                                    title="Folder Options"
                                                >
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                                        <circle cx="12" cy="5" r="2" />
                                                        <circle cx="12" cy="12" r="2" />
                                                        <circle cx="12" cy="19" r="2" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </section>

                    {/* ─── "All Files" Section ─────────────────────────────── */}
                    <section className="cb-section">
                        <div className="cb-section-header">
                            <h2 className="cb-section-title">
                                {searchQuery.trim() ? "Search Results" : "All Files"}
                            </h2>

                            <div className="cb-view-toggle-group">
                                <button
                                    type="button"
                                    className={`cb-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                                    onClick={() => setViewMode('list')}
                                    title="List View"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="8" y1="6" x2="21" y2="6" />
                                        <line x1="8" y1="12" x2="21" y2="12" />
                                        <line x1="8" y1="18" x2="21" y2="18" />
                                        <line x1="3" y1="6" x2="3.01" y2="6" />
                                        <line x1="3" y1="12" x2="3.01" y2="12" />
                                        <line x1="3" y1="18" x2="3.01" y2="18" />
                                    </svg>
                                </button>
                                <button
                                    type="button"
                                    className={`cb-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                                    onClick={() => setViewMode('grid')}
                                    title="Grid View"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="3" width="7" height="7" />
                                        <rect x="14" y="3" width="7" height="7" />
                                        <rect x="14" y="14" width="7" height="7" />
                                        <rect x="3" y="14" width="7" height="7" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Files Content Table */}
                        {searchLoading ? (
                            <div className="cb-loading-state">
                                <div className="spinner"></div>
                            </div>
                        ) : viewMode === "grid" ? (
                            <div className="cb-files-grid">
                                {(hasRealContent ? filteredFiles : []).map(file => (
                                    <div
                                        key={file.id}
                                        className="cb-file-grid-card"
                                        onClick={(e) => previewFile(e, file)}
                                    >
                                        <div className="cb-grid-card-icon">
                                            <FileIcon mimeType={file.mimeType} size={36} />
                                        </div>
                                        <div className="cb-grid-card-info">
                                            <span className="cb-grid-file-name" title={file.orgName}>{file.orgName}</span>
                                            <span className="cb-grid-file-size">{formatBytes(file.size)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="cb-table-card">
                                <div className="cb-table-header">
                                    <div className="cb-col-check">
                                        <input
                                            type="checkbox"
                                            className="cb-checkbox"
                                            aria-label="Select all"
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    const allIds = hasRealContent
                                                        ? [...filteredFolders.map(f => f.id), ...filteredFiles.map(f => f.id)]
                                                        : fallbackFiles.map(f => f.id);
                                                    setSelectedRows(new Set(allIds));
                                                } else {
                                                    setSelectedRows(new Set());
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="cb-col-name">Name</div>
                                    <div className="cb-col-type">Type</div>
                                    <div className="cb-col-size">Size</div>
                                    <div className="cb-col-date">Last Modified</div>
                                    <div className="cb-col-actions">Actions</div>
                                </div>

                                <div className="cb-table-body">
                                    {/* Real folders */}
                                    {filteredFolders.map(folder => {
                                        const isEditing = editingItem && editingItem.type === 'folder' && editingItem.id === folder.id;
                                        const isChecked = selectedRows.has(folder.id);
                                        return (
                                            <div
                                                key={`f-${folder.id}`}
                                                className={`cb-table-row ${isChecked ? 'selected' : ''}`}
                                                onClick={() => !isEditing && handleFolderSelect(folder)}
                                            >
                                                <div className="cb-col-check" onClick={(e) => e.stopPropagation()}>
                                                    <input
                                                        type="checkbox"
                                                        className="cb-checkbox"
                                                        checked={isChecked}
                                                        onChange={() => toggleRowSelect(folder.id)}
                                                    />
                                                </div>
                                                <div className="cb-col-name">
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#f59e0b" className="cb-row-type-icon">
                                                        <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                                                    </svg>
                                                    {isEditing ? (
                                                        <form onSubmit={(e) => handleRenameSubmit(e, folder.id, 'folder')} className="cb-rename-inline-form">
                                                            <input
                                                                value={renameValue}
                                                                onChange={(e) => setRenameValue(e.target.value)}
                                                                className="cb-rename-inline-input"
                                                                autoFocus
                                                            />
                                                            <button type="submit" className="cb-rename-save-btn">Save</button>
                                                        </form>
                                                    ) : (
                                                        <span className="cb-row-name-text">{folder.name}</span>
                                                    )}
                                                </div>
                                                <div className="cb-col-type">Folder</div>
                                                <div className="cb-col-size">—</div>
                                                <div className="cb-col-date">{formatDate(folder.createdAt)}</div>
                                                <div className="cb-col-actions" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        type="button"
                                                        className="cb-row-actions-btn"
                                                        onClick={() => openActionSheet(folder, 'folder')}
                                                    >
                                                        ···
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Real files */}
                                    {filteredFiles.map(file => {
                                        const isEditing = editingItem && editingItem.type === 'file' && editingItem.id === file.id;
                                        const isChecked = selectedRows.has(file.id);
                                        return (
                                            <div
                                                key={`file-${file.id}`}
                                                className={`cb-table-row ${isChecked ? 'selected' : ''}`}
                                                onClick={(e) => { if (!isEditing) previewFile(e, file); }}
                                            >
                                                <div className="cb-col-check" onClick={(e) => e.stopPropagation()}>
                                                    <input
                                                        type="checkbox"
                                                        className="cb-checkbox"
                                                        checked={isChecked}
                                                        onChange={() => toggleRowSelect(file.id)}
                                                    />
                                                </div>
                                                <div className="cb-col-name">
                                                    <div className="cb-row-type-icon">
                                                        <FileIcon mimeType={file.mimeType} size={18} />
                                                    </div>
                                                    {isEditing ? (
                                                        <form onSubmit={(e) => handleRenameSubmit(e, file.id, 'file')} className="cb-rename-inline-form">
                                                            <input
                                                                value={renameValue}
                                                                onChange={(e) => setRenameValue(e.target.value)}
                                                                className="cb-rename-inline-input"
                                                                autoFocus
                                                            />
                                                            <button type="submit" className="cb-rename-save-btn">Save</button>
                                                        </form>
                                                    ) : (
                                                        <span className="cb-row-name-text">{file.orgName}</span>
                                                    )}
                                                </div>
                                                <div className="cb-col-type">{getFileTypeLabel(file.mimeType, file.orgName)}</div>
                                                <div className="cb-col-size">{formatBytes(file.size)}</div>
                                                <div className="cb-col-date">{formatDate(file.createdAt)}</div>
                                                <div className="cb-col-actions" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        type="button"
                                                        className="cb-row-actions-btn"
                                                        onClick={() => openActionSheet(file, 'file')}
                                                    >
                                                        ···
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Empty state — shown only when loading is done and no real content */}
                                    {!loading && filteredFolders.length === 0 && filteredFiles.length === 0 && (
                                        <div className="cb-table-empty-state">
                                            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-faint, #9ca3af)", marginBottom: 8 }}>
                                                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                                                <polyline points="13 2 13 9 20 9" />
                                            </svg>
                                            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "13px" }}>No files yet. Upload or create your first folder to get started.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </section>
                </main>

                {/* ─── 3. RIGHT SIDEBAR ─────────────────────────────────────── */}
                <aside className="cb-right-sidebar">
                    {/* Card 1: Storage Usage */}
                    <div className="cb-panel-card">
                        <div className="cb-panel-card-header">
                            <span className="cb-panel-title">Storage Usage</span>
                            <span className="cb-panel-percentage">{storagePercent}%</span>
                        </div>

                        <div className="cb-storage-main-track">
                            <div className="cb-storage-main-fill" style={{ width: `${storagePercent}%` }}></div>
                        </div>

                        <span className="cb-storage-used-caption">
                            {formatBytes(usedStorageBytes)} of {formatBytes(limitStorageBytes)} used
                        </span>

                        <div className="cb-breakdown-section">
                            <span className="cb-breakdown-heading">Breakdown</span>

                            <div className="cb-breakdown-list">
                                <div className="cb-breakdown-item">
                                    <span className="cb-bullet-dot dot-documents"></span>
                                    <span className="cb-breakdown-name">Documents</span>
                                    <span className="cb-breakdown-val">{docSize}</span>
                                </div>

                                <div className="cb-breakdown-item">
                                    <span className="cb-bullet-dot dot-images"></span>
                                    <span className="cb-breakdown-name">Images</span>
                                    <span className="cb-breakdown-val">{imgSize}</span>
                                </div>

                                <div className="cb-breakdown-item">
                                    <span className="cb-bullet-dot dot-videos"></span>
                                    <span className="cb-breakdown-name">Videos</span>
                                    <span className="cb-breakdown-val">{vidSize}</span>
                                </div>

                                <div className="cb-breakdown-item">
                                    <span className="cb-bullet-dot dot-audio"></span>
                                    <span className="cb-breakdown-name">Audio</span>
                                    <span className="cb-breakdown-val">{audSize}</span>
                                </div>

                                <div className="cb-breakdown-item">
                                    <span className="cb-bullet-dot dot-others"></span>
                                    <span className="cb-breakdown-name">Others</span>
                                    <span className="cb-breakdown-val">0 Bytes</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Recent Activity — real data from API */}
                    <div className="cb-panel-card">
                        <div className="cb-panel-card-header">
                            <span className="cb-panel-title">Recent Activity</span>
                            <button
                                type="button"
                                className="cb-view-all-link"
                                onClick={() => rootFolderId && rootFolderId !== -1 && fetchRecentActivity(rootFolderId)}
                            >
                                Refresh &rarr;
                            </button>
                        </div>

                        <div className="cb-activity-list">
                            {activityLoading ? (
                                <div style={{ display: "flex", justifyContent: "center", padding: "20px 0" }}>
                                    <div className="spinner" style={{ width: 22, height: 22 }}></div>
                                </div>
                            ) : recentActivity.length === 0 ? (
                                <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-muted)", fontSize: "13px" }}>
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ display: "block", margin: "0 auto 8px" }}>
                                        <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                    </svg>
                                    No recent activity yet.
                                </div>
                            ) : (
                                recentActivity.map((log) => {
                                    const { color, icon } = getActivityMeta(log.action);
                                    const label = (log.action || "").replace(/_/g, " ").toLowerCase().replace(/^./, c => c.toUpperCase());
                                    const sub = `${log.description || ""} • ${formatDate(log.createdAt)}`;
                                    return (
                                        <div key={log.id} className="cb-activity-item">
                                            <div className={`cb-activity-icon-circle ${color}`}>
                                                {icon}
                                            </div>
                                            <div className="cb-activity-info">
                                                <span className="cb-activity-label">{label}</span>
                                                <span className="cb-activity-sub" title={sub}>{sub}</span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Card 3: Promo / Collaboration Banner */}
                    <div className="cb-promo-card">
                        <div className="cb-promo-header">
                            <span className="cb-promo-title">Store. Share. Collaborate.</span>
                            <button
                                type="button"
                                className="cb-promo-arrow-btn"
                                onClick={() => setSharedPanel('create')}
                                title="Create Project"
                            >
                                &rarr;
                            </button>
                        </div>
                        <p className="cb-promo-subtitle">
                            Build something amazing together.
                        </p>

                        <div className="cb-promo-graphic">
                            <svg viewBox="0 0 180 50" fill="none" xmlns="http://www.w3.org/2000/svg" className="cb-promo-svg">
                                <path
                                    d="M0 50 C40 30 80 15 120 35 C150 45 170 48 180 50 Z"
                                    fill="url(#promo-grad-1)"
                                    opacity="0.8"
                                />
                                <path
                                    d="M50 50 C90 20 140 25 180 50 Z"
                                    fill="url(#promo-grad-2)"
                                    opacity="0.9"
                                />
                                <defs>
                                    <linearGradient id="promo-grad-1" x1="0" y1="20" x2="180" y2="50" gradientUnits="userSpaceOnUse">
                                        <stop stopColor="#c4b5fd" stopOpacity="0.4" />
                                        <stop offset="1" stopColor="#a78bfa" stopOpacity="0.2" />
                                    </linearGradient>
                                    <linearGradient id="promo-grad-2" x1="50" y1="20" x2="180" y2="50" gradientUnits="userSpaceOnUse">
                                        <stop stopColor="#a78bfa" stopOpacity="0.6" />
                                        <stop offset="1" stopColor="#818cf8" stopOpacity="0.3" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                    </div>
                </aside>
            </div>

            {/* ─── MODALS & UTILITIES ─────────────────────────────────────── */}
            {/* Create Normal Folder Popup Modal */}
            {showCreator && (
                <div className="file-preview-modal-backdrop" onClick={() => setShowCreator(false)}>
                    <div className="file-preview-modal-card custom-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "440px", width: "90%" }}>
                        <div className="share-modal-header" style={{ marginBottom: "16px" }}>
                            <div>
                                <h2 style={{ fontSize: "18px", fontWeight: "700", margin: 0, color: "var(--text-main)" }}>Create New Folder</h2>
                                <p style={{ fontSize: "12.5px", color: "var(--text-muted)", margin: "4px 0 0 0" }}>
                                    Enter a name for your folder in {currentFolderInfo?.name || "Root"}
                                </p>
                            </div>
                            <button className="preview-close-btn" onClick={() => setShowCreator(false)} aria-label="Close modal">✕</button>
                        </div>

                        <form onSubmit={(e) => { createFolder(e); setShowCreator(false); }} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <input
                                value={folderName}
                                onChange={(e) => setFolderName(e.target.value)}
                                placeholder="Enter folder name..."
                                className="input-field"
                                autoFocus
                            />
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
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
                                <button type="submit" className="btn btn-primary">Create Folder</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

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

            {/* Trash Modal */}
            {showTrash && (
                <TrashModal
                    onClose={() => setShowTrash(false)}
                    showToast={showToast}
                    refreshDashboard={refreshAfterSharedAction}
                />
            )}

            {/* Create / Join Project Modal */}
            {sharedPanel && (
                <div className="file-preview-modal-backdrop" onClick={() => setSharedPanel(null)}>
                    <div className="file-preview-modal-card custom-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "520px", width: "90%" }}>
                        <div className="share-modal-header" style={{ marginBottom: "16px" }}>
                            <div>
                                <h2 style={{ fontSize: "18px", fontWeight: "700", margin: 0, color: "var(--text-main)" }}>
                                    {sharedPanel === 'create' && "Create Project"}
                                    {sharedPanel === 'join' && "Join Project"}
                                    {sharedPanel === 'owner-panel' && "Project Owner Panel"}
                                    {sharedPanel === 'admin-panel' && "Project Admin Panel"}
                                    {sharedPanel === 'activities' && "Project Activity Logs"}
                                    {sharedPanel === 'requests' && "Project Join Requests"}
                                    {sharedPanel === 'members' && "Project Members"}
                                </h2>
                            </div>
                            <button className="preview-close-btn" onClick={() => setSharedPanel(null)} aria-label="Close modal">✕</button>
                        </div>

                        {sharedPanel === 'create' && (
                            <CreateSharedFolder onFolderCreated={async () => { await handleSharedFolderCreated(); setSharedPanel(null); }} />
                        )}
                        {sharedPanel === 'join' && (
                            <JoinSharedFolder onJoined={async () => { await handleSharedFolderJoined(); setSharedPanel(null); }} />
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
                            <ActivityLogs folderId={currentFolderId} />
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
                </div>
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
    );
}