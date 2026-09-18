import { useState, useEffect, useCallback, useRef } from "react";
import { useFolderManager } from "../hooks/useFolderManager";
import Navbar from "../components/navbar";
import Sidebar from "../components/dashboard/Sidebar";
import HeroBanner from "../components/dashboard/HeroBanner";
import StatsRow from "../components/dashboard/StatsRow";
import FoldersSection from "../components/dashboard/FoldersSection";
import FilesSection from "../components/dashboard/FilesSection";
import RightSidebar from "../components/dashboard/RightSidebar";
import MyDriveView from "../components/dashboard/MyDriveView";
import ProjectView from "../components/dashboard/ProjectView";
import SharedWithMeView from "../components/dashboard/SharedWithMeView";

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
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import UploadProgressWidget from "../components/UploadProgressWidget";
import { lockBodyScroll, unlockBodyScroll } from "../utils/scrollLock";
import axios from "../api/axios";

export default function Dashboard() {
    const {
        folders, files, rootFolders, projects, ownedProjects, sharedWithMe, filteredFolders, filteredFiles, userProfile, storageBreakdown, dashboardStats, searchQuery, setSearchQuery,
        searchLoading, searchError,
        rootFolderId, currentFolderId, history, folderName, setFolderName,
        loading, isUploading, isDragging, setIsDragging, showCreator, setShowCreator,
        editingItem, setEditingItem, renameValue, setRenameValue, movingItem, setMovingItem,
        previewItem, previewFile, closePreview,
        toasts, currentFolderInfo,
        createFolder, deleteFolder, deleteFile,
        deleteModalState, promptDelete, closeDeleteModal, executeDeleteConfirm,
        downloadFile, shareFile, openShareModal, closeShareModal, shareModalItem, handleRenameSubmit, executeMove, moveItemToFolder, handleFileUpload,
        uploads, retryUpload, dismissUpload, clearCompletedUploads,
        handleFolderSelect, prefetchFolder, fetchProjects, goBack, refreshAfterSharedAction, showToast
    } = useFolderManager();

    const [sharedPanel, setSharedPanel] = useState(null);
    const [activeProject, setActiveProject] = useState(null); // { id, name, userRole }
    const [draggedItem, setDraggedItem] = useState(null);
    const [dropTargetId, setDropTargetId] = useState(null);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [showMoveModal, setShowMoveModal] = useState(false);
    const [activeBottomSheet, setActiveBottomSheet] = useState(null);
    const [showTrash, setShowTrash] = useState(false);
    const dragCounterRef = useRef(0);
    const [viewMode, setViewModeState] = useState(() => {
        try {
            return localStorage.getItem("cloudbox_view_mode") || "list";
        } catch {
            return "list";
        }
    });

    const setViewMode = (mode) => {
        setViewModeState(mode);
        try {
            localStorage.setItem("cloudbox_view_mode", mode);
        } catch {}
    };
    const [activeNav, setActiveNav] = useState("dashboard");
    const [selectedRows, setSelectedRows] = useState(new Set());
    const globalFileInputRef = useRef(null);

    const triggerFileUpload = useCallback(() => {
        if (globalFileInputRef.current) {
            globalFileInputRef.current.click();
        } else {
            const el = document.getElementById("file-picker");
            if (el) el.click();
        }
    }, []);

    useEffect(() => {
        if (mobileSidebarOpen) {
            lockBodyScroll();
            return () => unlockBodyScroll();
        }
    }, [mobileSidebarOpen]);

    // Refresh projects whenever switching between sections
    useEffect(() => {
        fetchProjects?.();
    }, [activeNav, fetchProjects]);

    // Front of Dashboard always considers and resets current folder to Root
    useEffect(() => {
        if (activeNav === 'dashboard') {
            const rootId = rootFolderId !== -1 ? rootFolderId : (Number(localStorage.getItem("rootFolderId")) || -1);
            if (rootId !== -1 && currentFolderId !== rootId) {
                handleFolderSelect({ id: rootId, name: "Root", pid: null });
            }
        }
    }, [activeNav, rootFolderId, currentFolderId, handleFolderSelect]);

    const openActionSheet = (item, itemType) => {
        const isFolder = itemType === 'folder';
        const name = isFolder ? item.name : item.orgName;
        const actions = isFolder ? [
            {
                type: 'open',
                label: "Open Folder",
                onClick: () => handleFolderSelect(item)
            },
            {
                type: 'move',
                label: "Move Folder",
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
                onClick: () => promptDelete(item, 'folder')
            }
        ] : [
            {
                type: 'preview',
                label: "Preview / Open",
                onClick: (e) => previewFile(e, item)
            },
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
                label: "Move File",
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
                onClick: () => promptDelete(item, 'file')
            }
        ];

        setActiveBottomSheet({ name, isFolder, item, actions });
    };

    const handleSharedFolderCreated = async () => {
        await refreshAfterSharedAction();
    };

    // ── Project click from sidebar ────────────────────────────────────────
    const handleProjectClick = useCallback((folder) => {
        setActiveProject({
            id: folder.id,
            name: folder.name,
            userRole: folder.userRole || "OWNER",
        });
        setActiveNav("projects");
    }, []);

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
        setIsDragging(false);
        dragCounterRef.current = 0;
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("application/json", JSON.stringify(item));
        e.dataTransfer.setData("application/x-cloudbox-item", JSON.stringify(item));
    };

    const handleDragEndItem = () => {
        setDraggedItem(null);
        setDropTargetId(null);
        dragCounterRef.current = 0;
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
        setIsDragging(false);
        dragCounterRef.current = 0;

        // A. External file drop onto a specific folder
        if (!draggedItem && !e.dataTransfer.types?.includes("application/x-cloudbox-item") && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            if (targetFolderId > 0) {
                handleFileUpload(e.dataTransfer.files[0], targetFolderId);
            } else {
                showToast("Files cannot be uploaded to Root level.", "error");
            }
            return;
        }

        // B. Internal CloudBox item move
        let item = draggedItem;
        if (!item) {
            try {
                const rawData = e.dataTransfer.getData("application/x-cloudbox-item") || e.dataTransfer.getData("application/json");
                if (rawData) item = JSON.parse(rawData);
            } catch {
                item = null;
            }
        }

        if (item) {
            if (item.type === 'folder' && item.id === targetFolderId) {
                showToast("Cannot move a folder into itself.", "error");
                setDraggedItem(null);
                return;
            }
            moveItemToFolder(item, targetFolderId);
            setDraggedItem(null);
        }
    };

    const handleWorkspaceDragEnter = (e) => {
        if (draggedItem || Array.from(e.dataTransfer.types || []).includes("application/x-cloudbox-item")) {
            return;
        }
        if (Array.from(e.dataTransfer.types || []).includes("Files")) {
            e.preventDefault();
            e.stopPropagation();
            dragCounterRef.current += 1;
            if (dragCounterRef.current === 1) {
                setIsDragging(true);
            }
        }
    };

    const handleWorkspaceDragOver = (e) => {
        if (draggedItem || Array.from(e.dataTransfer.types || []).includes("application/x-cloudbox-item")) {
            return;
        }
        if (Array.from(e.dataTransfer.types || []).includes("Files")) {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = "copy";
        }
    };

    const handleWorkspaceDragLeave = (e) => {
        if (draggedItem || Array.from(e.dataTransfer.types || []).includes("application/x-cloudbox-item")) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        dragCounterRef.current -= 1;
        if (dragCounterRef.current <= 0) {
            dragCounterRef.current = 0;
            setIsDragging(false);
        }
    };

    const handleWorkspaceDrop = (e) => {
        dragCounterRef.current = 0;
        setIsDragging(false);

        if (draggedItem || Array.from(e.dataTransfer.types || []).includes("application/x-cloudbox-item")) {
            return;
        }

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            e.preventDefault();
            e.stopPropagation();
            const filesList = Array.from(e.dataTransfer.files);
            if (activeNav === 'dashboard') {
                setMovingItem({
                    type: 'upload_file',
                    file: filesList[0],
                    files: filesList,
                    name: filesList.length === 1 ? filesList[0].name : `${filesList.length} files`
                });
                setShowMoveModal(true);
            } else {
                filesList.forEach(file => handleFileUpload(file));
            }
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

    // Calculate Storage metrics — only use real values from API
    const usedStorageBytes = Number(userProfile?.usedStorage || 0);
    const limitStorageBytes = Number(userProfile?.storageLimit || 0);
    const storagePercent = limitStorageBytes > 0
        ? Math.min(100, Math.max(0, Math.round((usedStorageBytes / limitStorageBytes) * 100)))
        : 0;

    // Real user info
    const userName = userProfile?.name || "";
    const userEmail = userProfile?.email || "";
    const userInitials = userName
        ? userName.split(" ").filter(Boolean).map(w => w[0]).join("").toUpperCase().slice(0, 2)
        : "U";

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

    const currentUserId = userProfile?.id;

    // 1. Projects Dropdown: ONLY shared folders where current user is the OWNER
    const displayOwnedProjects = Array.isArray(ownedProjects) ? ownedProjects : [];

    // 2. Shared with me: ONLY shared folders where current user is NOT the owner (and is a member)
    const displaySharedWithMe = Array.isArray(sharedWithMe) ? sharedWithMe : [];

    return (
        <div className="app-container cb-dashboard-page">
            {/* Topbar Header */}
            <Navbar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                userProfile={userProfile}
                onToggleSidebar={() => setMobileSidebarOpen(prev => !prev)}
                storagePercent={storagePercent}
            />

            {/* Hidden Central File Input */}
            <input
                id="file-picker"
                type="file"
                multiple
                ref={globalFileInputRef}
                style={{ display: "none" }}
                onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                        const filesList = Array.from(e.target.files);
                        if (activeNav === 'dashboard') {
                            setMovingItem({
                                type: 'upload_file',
                                file: filesList[0],
                                files: filesList,
                                name: filesList.length === 1 ? filesList[0].name : `${filesList.length} files`
                            });
                            setShowMoveModal(true);
                        } else {
                            filesList.forEach(file => handleFileUpload(file));
                        }
                        e.target.value = "";
                    }
                }}
            />

            <div className="cb-dashboard-wrapper">
                {/* Mobile Sidebar Backdrop */}
                {mobileSidebarOpen && (
                    <div className="sidebar-backdrop active" onClick={() => setMobileSidebarOpen(false)}></div>
                )}

                {/* ─── 1. LEFT SIDEBAR ─────────────────────────────────────── */}
                <Sidebar
                    activeNav={activeNav}
                    setActiveNav={setActiveNav}
                    mobileSidebarOpen={mobileSidebarOpen}
                    setMobileSidebarOpen={setMobileSidebarOpen}
                    rootFolderId={rootFolderId}
                    handleFolderSelect={handleFolderSelect}
                    prefetchFolder={prefetchFolder}
                    setSharedPanel={setSharedPanel}
                    setShowTrash={setShowTrash}
                    storagePercent={storagePercent}
                    usedStorageBytes={usedStorageBytes}
                    limitStorageBytes={limitStorageBytes}
                    userName={userName}
                    userEmail={userEmail}
                    showToast={showToast}
                    sharedFolders={displayOwnedProjects}
                    activeProjectId={activeProject?.id}
                    onProjectClick={handleProjectClick}
                    onSharedClick={() => {
                        setActiveProject(null);
                        setActiveNav('shared');
                    }}
                />

                {/* ─── 2. CENTER CONTENT (WORKSPACE) ───────────────────────── */}
                <main
                    className={`cb-center-content ${activeNav === 'files' ? 'cb-mydrive-main-full' : ''}`}
                    onDragEnter={handleWorkspaceDragEnter}
                    onDragOver={handleWorkspaceDragOver}
                    onDragLeave={handleWorkspaceDragLeave}
                    onDrop={handleWorkspaceDrop}
                >
                    {activeNav === 'projects' && activeProject ? (
                        /* ─── SHARED FOLDER WORKSPACE VIEW ─── */
                        <ProjectView
                            project={activeProject}
                            onClose={() => {
                                const returnNav = activeProject?.userRole === 'OWNER' ? 'dashboard' : 'shared';
                                setActiveProject(null);
                                setActiveNav(returnNav);
                            }}
                            showToast={showToast}
                            prefetchFolder={prefetchFolder}
                            previewFile={previewFile}
                            downloadFile={downloadFile}
                            openActionSheet={openActionSheet}
                            handleFileUpload={handleFileUpload}
                            userRole={activeProject.userRole}
                            onRefresh={refreshAfterSharedAction}
                            onProjectDeleted={() => {
                                setActiveProject(null);
                                setActiveNav('shared');
                                refreshAfterSharedAction();
                            }}
                        />
                    ) : activeNav === 'shared' ? (
                        /* ─── SHARED WITH ME WORKSPACES LIST ─── */
                        <SharedWithMeView
                            sharedFolders={displaySharedWithMe}
                            userProfile={userProfile}
                            onSelectSharedFolder={handleProjectClick}
                            onJoinClick={() => setSharedPanel('join')}
                            onNewProjectClick={() => setSharedPanel('create')}
                            showToast={showToast}
                        />
                    ) : activeNav === 'files' ? (
                        /* ─── DEDICATED MY DRIVE FILE MANAGER VIEW ─── */
                        <MyDriveView
                            folders={filteredFolders}
                            files={filteredFiles}
                            loading={loading}
                            currentFolderId={currentFolderId}
                            rootFolderId={rootFolderId}
                            history={history}
                            currentFolderInfo={currentFolderInfo}
                            handleFolderSelect={handleFolderSelect}
                            prefetchFolder={prefetchFolder}
                            goBack={goBack}
                            onUploadClick={triggerFileUpload}
                            onCreateFolderClick={() => setShowCreator(true)}
                            previewFile={previewFile}
                            downloadFile={downloadFile}
                            openActionSheet={openActionSheet}
                            editingItem={editingItem}
                            renameValue={renameValue}
                            setRenameValue={setRenameValue}
                            handleRenameSubmit={handleRenameSubmit}
                            viewMode={viewMode}
                            setViewMode={setViewMode}
                            userName={userName}
                            userInitials={userInitials}
                            dropTargetId={dropTargetId}
                            handleDragStartItem={handleDragStartItem}
                            handleDragEndItem={handleDragEndItem}
                            handleDragOverTarget={handleDragOverTarget}
                            handleDragLeaveTarget={handleDragLeaveTarget}
                            handleDropOnTarget={handleDropOnTarget}
                        />
                    ) : (
                        /* ─── DASHBOARD OVERVIEW & QUICK ACCESS VIEW ─── */
                        <>
                            {/* Welcome Hero Banner */}
                            <HeroBanner
                                userName={userName}
                                isUploading={isUploading}
                                onUploadClick={triggerFileUpload}
                                onCreateFolderClick={() => {
                                    setMovingItem({ type: 'create_folder', name: 'New Folder' });
                                    setShowMoveModal(true);
                                }}
                                onNewProjectClick={() => setSharedPanel('create')}
                            />

                            {/* Stats Row — 4 cards with click handlers */}
                            <StatsRow
                                dashboardStats={dashboardStats}
                                onStatClick={(tab) => {
                                    setActiveProject(null);
                                    setActiveNav(tab);
                                }}
                            />

                            {/* "My Folders" Section */}
                            <FoldersSection
                                isSharedFolderContext={isSharedFolderContext}
                                rootFolderId={rootFolderId}
                                handleFolderSelect={handleFolderSelect}
                                prefetchFolder={prefetchFolder}
                                setActiveNav={setActiveNav}
                                loading={loading}
                                filteredFolders={filteredFolders}
                                editingItem={editingItem}
                                renameValue={renameValue}
                                setRenameValue={setRenameValue}
                                handleRenameSubmit={handleRenameSubmit}
                                openActionSheet={openActionSheet}
                                dropTargetId={dropTargetId}
                                handleDragStartItem={handleDragStartItem}
                                handleDragEndItem={handleDragEndItem}
                                handleDragOverTarget={handleDragOverTarget}
                                handleDragLeaveTarget={handleDragLeaveTarget}
                                handleDropOnTarget={handleDropOnTarget}
                            />

                            {/* "All Files" Section */}
                            <FilesSection
                                searchQuery={searchQuery}
                                searchLoading={searchLoading}
                                viewMode={viewMode}
                                setViewMode={setViewMode}
                                setActiveNav={setActiveNav}
                                filteredFiles={filteredFiles}
                                filteredFolders={filteredFolders}
                                selectedRows={selectedRows}
                                setSelectedRows={setSelectedRows}
                                toggleRowSelect={toggleRowSelect}
                                editingItem={editingItem}
                                renameValue={renameValue}
                                setRenameValue={setRenameValue}
                                handleRenameSubmit={handleRenameSubmit}
                                handleFolderSelect={handleFolderSelect}
                                previewFile={previewFile}
                                openActionSheet={openActionSheet}
                                getFileTypeLabel={getFileTypeLabel}
                                userName={userName}
                            />
                        </>
                    )}
                </main>

                {/* ─── 3. RIGHT SIDEBAR (Dashboard Only) ────────────────────── */}
                {activeNav === 'dashboard' && (
                    <RightSidebar
                        storagePercent={storagePercent}
                        usedStorageBytes={usedStorageBytes}
                        limitStorageBytes={limitStorageBytes}
                        storageBreakdown={storageBreakdown}
                        recentActivity={recentActivity}
                        activityLoading={activityLoading}
                        rootFolderId={rootFolderId}
                        fetchRecentActivity={fetchRecentActivity}
                        setSharedPanel={setSharedPanel}
                    />
                )}
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
                        if (movingItem.type === 'upload_file') {
                            if (movingItem.files && movingItem.files.length > 0) {
                                for (const f of movingItem.files) {
                                    handleFileUpload(f, targetFolderId);
                                }
                            } else if (movingItem.file) {
                                handleFileUpload(movingItem.file, targetFolderId);
                            }
                        } else if (movingItem.type === 'create_folder') {
                            await refreshAfterSharedAction();
                        } else {
                            await moveItemToFolder(movingItem, targetFolderId);
                        }
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
                            <CreateSharedFolder
                                onFolderCreated={async () => { await handleSharedFolderCreated(); }}
                                onClose={() => setSharedPanel(null)}
                            />
                        )}
                        {sharedPanel === 'join' && (
                            <JoinSharedFolder onJoined={async () => {
                                await handleSharedFolderJoined();
                                setSharedPanel(null);
                                setActiveProject(null);
                                setActiveNav('shared');
                            }} />
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

            {/* Custom Delete Confirmation Modal (Theme-aware, supports recursive force delete) */}
            <DeleteConfirmationModal
                isOpen={deleteModalState.isOpen}
                item={deleteModalState.item}
                type={deleteModalState.type}
                containsFiles={deleteModalState.containsFiles}
                isDeleting={deleteModalState.isDeleting}
                onClose={closeDeleteModal}
                onConfirm={executeDeleteConfirm}
            />

            {/* Live Upload Progress Manager Widget */}
            <UploadProgressWidget
                uploads={uploads}
                onRetry={retryUpload}
                onDismiss={dismissUpload}
                onClearCompleted={clearCompletedUploads}
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