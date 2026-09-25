import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import axios from "../../api/axios";
import { formatBytes, formatDate } from "../../utils/formatters";
import OwnerPanel from "../OwnerPanel";
import AdminPanel from "../AdminPanel";
import ActivityLogs from "../ActivityLogs";
import FolderRequests from "../FolderRequests";
import FolderMembers from "../FolderMembers";

// ── File Icon & Category Helper ───────────────────────────────────────────────
function getFileDisplayInfo(name = "", mime = "") {
    const n = (name || "").toLowerCase();
    const m = (mime || "").toLowerCase();

    if (n.endsWith(".pdf") || m === "application/pdf") {
        return { color: "#ef4444", bg: "rgba(239,68,68,.12)", label: "PDF", type: "pdf" };
    }
    if (n.match(/\.(png|jpe?g|gif|webp|svg)$/) || m.startsWith("image/")) {
        return { color: "#10b981", bg: "rgba(16,185,129,.12)", label: "IMG", type: "image" };
    }
    if (n.match(/\.(mp4|mov|webm|mkv)$/) || m.startsWith("video/")) {
        return { color: "#a855f7", bg: "rgba(168,85,247,.12)", label: "VID", type: "video" };
    }
    if (n.match(/\.(mp3|wav|ogg|m4a)$/) || m.startsWith("audio/")) {
        return { color: "#f59e0b", bg: "rgba(245,158,11,.12)", label: "AUD", type: "audio" };
    }
    if (n.match(/\.(zip|tar|gz|rar|7z)$/) || m.includes("zip")) {
        return { color: "#ec4899", bg: "rgba(236,72,153,.12)", label: "ZIP", type: "archive" };
    }
    if (n.match(/\.(xlsx?|csv)$/) || m.includes("spreadsheet") || m.includes("excel")) {
        return { color: "#059669", bg: "rgba(5,150,105,.12)", label: "XLS", type: "sheet" };
    }
    if (n.match(/\.(docx?|txt|rtf|md)$/)) {
        return { color: "#3b82f6", bg: "rgba(59,130,246,.12)", label: "DOC", type: "doc" };
    }
    return { color: "#6366f1", bg: "rgba(99,102,241,.12)", label: "FILE", type: "file" };
}

// ── Time Ago Helper ───────────────────────────────────────────────────────────
function timeAgo(dateStr) {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.round(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.round(hrs / 24);
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    return formatDate(dateStr);
}

// ── Action Config & Icons ────────────────────────────────────────────────────
const ACTION_MAP = {
    UPLOAD_FILE: {
        text: "uploaded a file",
        color: "#3b82f6",
        bg: "rgba(59, 130, 246, 0.12)",
        icon: (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" />
                <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
            </svg>
        )
    },
    CREATE_FOLDER: {
        text: "created a folder",
        color: "#f59e0b",
        bg: "rgba(245, 158, 11, 0.12)",
        icon: (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                <line x1="12" y1="11" x2="12" y2="17" />
                <line x1="9" y1="14" x2="15" y2="14" />
            </svg>
        )
    },
    DELETE_FOLDER: {
        text: "deleted a folder",
        color: "#ef4444",
        bg: "rgba(239, 68, 68, 0.12)",
        icon: (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
                <path d="M10 11v6M14 11v6" />
            </svg>
        )
    },
    DELETE_FILE: {
        text: "deleted a file",
        color: "#ef4444",
        bg: "rgba(239, 68, 68, 0.12)",
        icon: (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
                <path d="M10 11v6M14 11v6" />
            </svg>
        )
    },
    RENAME_FOLDER: {
        text: "renamed a folder",
        color: "#8b5cf6",
        bg: "rgba(139, 92, 246, 0.12)",
        icon: (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
        )
    },
    RENAME_FILE: {
        text: "renamed a file",
        color: "#8b5cf6",
        bg: "rgba(139, 92, 246, 0.12)",
        icon: (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
        )
    },
    MOVE_FOLDER: {
        text: "moved a folder",
        color: "#6366f1",
        bg: "rgba(99, 102, 241, 0.12)",
        icon: (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polyline points="9 18 15 12 9 6" />
            </svg>
        )
    },
    MOVE_FILE: {
        text: "moved a file",
        color: "#6366f1",
        bg: "rgba(99, 102, 241, 0.12)",
        icon: (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polyline points="9 18 15 12 9 6" />
            </svg>
        )
    },
    ROLE_CHANGED: {
        text: "updated member role",
        color: "#8b5cf6",
        bg: "rgba(139, 92, 246, 0.12)",
        icon: (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
            </svg>
        )
    },
    ROLE_UPDATED: {
        text: "updated permissions",
        color: "#8b5cf6",
        bg: "rgba(139, 92, 246, 0.12)",
        icon: (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
            </svg>
        )
    },
    JOIN_REQUEST: {
        text: "requested to join",
        color: "#6366f1",
        bg: "rgba(99, 102, 241, 0.12)",
        icon: (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
            </svg>
        )
    },
    APPROVE_REQUEST: {
        text: "approved join request",
        color: "#10b981",
        bg: "rgba(16, 185, 129, 0.12)",
        icon: (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polyline points="20 6 9 17 4 12" />
            </svg>
        )
    },
    SHARE_FOLDER: {
        text: "shared the workspace",
        color: "#6366f1",
        bg: "rgba(99, 102, 241, 0.12)",
        icon: (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
        )
    },
    OWNER_TRANSFERRED: {
        text: "transferred ownership",
        color: "#d97706",
        bg: "rgba(217, 119, 6, 0.12)",
        icon: (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
        )
    }
};

function getActivityInfo(act) {
    const rawAction = act.action || "";
    const rawDesc = act.description || act.message || "";
    const cfg = ACTION_MAP[rawAction] || {
        text: rawDesc && !rawDesc.includes("_") ? rawDesc : (rawAction ? rawAction.replace(/_/g, " ").toLowerCase() : "updated workspace"),
        color: "#6366f1",
        bg: "rgba(99, 102, 241, 0.12)",
        icon: (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
        )
    };

    let actionText = cfg.text;
    if (rawDesc && !rawDesc.includes("_") && rawDesc !== rawAction) {
        actionText = rawDesc;
    }

    const performer = act.user?.name || act.userName || (act.user?.email ? act.user.email.split('@')[0] : (act.userEmail ? act.userEmail.split('@')[0] : "Team Member"));

    return {
        performer,
        actionText,
        time: timeAgo(act.createdAt),
        color: cfg.color,
        bg: cfg.bg,
        icon: cfg.icon
    };
}

// ── Role Badge ────────────────────────────────────────────────────────────────
// ── Role Badge ────────────────────────────────────────────────────────────────
const RoleBadge = ({ role }) => {
    const map = {
        OWNER:  { bg: "rgba(245, 158, 11, 0.12)", color: "#d97706", border: "rgba(245, 158, 11, 0.28)" },
        ADMIN:  { bg: "rgba(139, 92, 246, 0.12)", color: "#8b5cf6", border: "rgba(139, 92, 246, 0.28)" },
        EDITOR: { bg: "rgba(16, 185, 129, 0.12)", color: "#10b981", border: "rgba(16, 185, 129, 0.28)" },
        VIEWER: { bg: "rgba(59, 130, 246, 0.12)", color: "#3b82f6", border: "rgba(59, 130, 246, 0.28)" },
    };
    const s = map[role] || map.VIEWER;
    return (
        <span className="cb-pw-chip cb-pw-chip-role" style={{
            background: s.bg,
            color: s.color,
            borderColor: s.border
        }}>
            <span className="cb-pw-chip-role-dot" style={{ background: s.color }} />
            <span className="cb-pw-chip-label">Role:</span>
            <strong>{role || 'VIEWER'}</strong>
        </span>
    );
};

// ── Folder Vibrant Palette (Matching My Drive Design System) ──────────────────
const folderPalette = [
    { gradient: "linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(99, 102, 241, 0.08) 100%)", iconColor: "#8b5cf6", glow: "rgba(139, 92, 246, 0.3)" },
    { gradient: "linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(59, 130, 246, 0.08) 100%)", iconColor: "#38bdf8", glow: "rgba(56, 189, 248, 0.3)" },
    { gradient: "linear-gradient(135deg, rgba(251, 113, 133, 0.2) 0%, rgba(244, 63, 94, 0.08) 100%)", iconColor: "#fb7185", glow: "rgba(251, 113, 133, 0.3)" },
    { gradient: "linear-gradient(135deg, rgba(74, 222, 128, 0.2) 0%, rgba(34, 197, 94, 0.08) 100%)", iconColor: "#4ade80", glow: "rgba(74, 222, 128, 0.3)" },
    { gradient: "linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.08) 100%)", iconColor: "#fbbf24", glow: "rgba(251, 191, 36, 0.3)" },
    { gradient: "linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(217, 70, 239, 0.08) 100%)", iconColor: "#c084fc", glow: "rgba(168, 85, 247, 0.3)" }
];

const PROJ_CACHE_KEY = "cloudbox_project_content_cache";

function getInitialProjectCache() {
    try {
        const stored = sessionStorage.getItem(PROJ_CACHE_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch {
        return {};
    }
}

function saveProjectCacheToStorage(cache) {
    try {
        sessionStorage.setItem(PROJ_CACHE_KEY, JSON.stringify(cache));
    } catch {
        // Ignore quota errors
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// REDESIGNED PROJECT WORKSPACE (Matching Reference UI/UX & My Drive Intelligence)
// ══════════════════════════════════════════════════════════════════════════════
function ProjectView({
    project,            // { id, name, isShared, ... }
    onClose,
    showToast,
    prefetchFolder,
    previewFile,
    downloadFile,
    openActionSheet,
    handleFileUpload,
    onProjectDeleted,
    onRefresh,
    editingItem,
    renameValue,
    setRenameValue,
    handleRenameSubmit,
    dropTargetId,
    handleDragStartItem,
    handleDragEndItem,
    handleDragOverTarget,
    handleDragLeaveTarget,
    handleDropOnTarget,
}) {
    const [activeTab, setActiveTab] = useState("files");
    const [viewFolderId, setViewFolderId] = useState(project.id);
    const [subPath, setSubPath] = useState([]);   // breadcrumb stack
    const [effectiveRole, setEffectiveRole] = useState(project.userRole || "VIEWER");

    // Fast in-memory & sessionStorage cache for 0ms instant subfolder loading
    const projectCacheRef = useRef(getInitialProjectCache());
    const fetchSequenceRef = useRef(0);
    const lastFetchedFolderIdRef = useRef(null);

    // Synchronously initialize contents from cache if present
    const [contents, setContents] = useState(() => {
        const initialCache = projectCacheRef.current[project.id];
        if (initialCache) {
            return { folders: initialCache.folders || [], files: initialCache.files || [] };
        }
        return { folders: [], files: [] };
    });
    const [loading, setLoading] = useState(() => {
        return !projectCacheRef.current[project.id];
    });
    const [folderMetadata, setFolderMetadata] = useState(() => {
        return projectCacheRef.current[project.id]?.metadata || null;
    });

    // View mode & search/filter inside project
    const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'list'
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("name"); // 'name' | 'size' | 'date'

    // Folder Creation Modal / State
    const [showCreateFolder, setShowCreateFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);

    // Project Recent Activity state
    const [recentActivities, setRecentActivities] = useState([]);
    const [activityLoading, setActivityLoading] = useState(false);

    // Description State
    const [isEditingDesc, setIsEditingDesc] = useState(false);
    const [projectDesc, setProjectDesc] = useState(() => {
        return localStorage.getItem(`cb_proj_desc_${project.id}`) || "A place to store project files, collaborate with your team, and bring ideas to life.";
    });

    const showToastRef = useRef(showToast);
    showToastRef.current = showToast;
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    const workspaceFileInputRef = useRef(null);
    const token = () => localStorage.getItem("accessToken");

    // ── Fetch Folder Contents & Metadata (Intelligent Silent Update) ──────────
    const fetchContents = useCallback(async (fid, isSilent = false) => {
        if (!fid) return;
        const seq = ++fetchSequenceRef.current;
        const cached = projectCacheRef.current[fid];
        if (!isSilent && !cached) {
            setLoading(true);
        }
        try {
            const { data } = await axios.get(`api/folder/fetch/${fid}`, {
                headers: { Authorization: `Bearer ${token()}` }
            });
            if (seq !== fetchSequenceRef.current) return;
            const ch = data.children || {};
            const fetchedFolders = ch.children || [];
            const fetchedFiles = ch.files || [];

            projectCacheRef.current[fid] = {
                folders: fetchedFolders,
                files: fetchedFiles,
                metadata: ch,
                timestamp: Date.now()
            };
            saveProjectCacheToStorage(projectCacheRef.current);

            setContents({
                folders: fetchedFolders,
                files: fetchedFiles,
            });
            setFolderMetadata(ch);
            if (ch.userRole) {
                setEffectiveRole(prev => prev !== ch.userRole ? ch.userRole : prev);
            }
        } catch (err) {
            if (seq !== fetchSequenceRef.current) return;
            console.error("Error loading shared folder contents:", err);
            const status = err.response?.status;
            if (status === 403) {
                showToastRef.current?.("Access to this shared folder is no longer available.", "error");
                onCloseRef.current?.();
            } else if (status === 404) {
                showToastRef.current?.("This shared workspace no longer exists.", "error");
                onCloseRef.current?.();
            } else {
                showToastRef.current?.(err.response?.data?.message || "Failed to load shared folder.", "error");
            }
            if (!cached) {
                setContents({ folders: [], files: [] });
            }
        } finally {
            if (seq === fetchSequenceRef.current) {
                setLoading(false);
            }
        }
    }, []);

    // ── Pre-fetch Subfolder Contents Silently on Hover ────────────────────────
    const prefetchProjectFolder = useCallback(async (fid) => {
        if (!fid) return;
        const existing = projectCacheRef.current[fid];
        if (existing && Date.now() - existing.timestamp < 30000) return;
        try {
            const { data } = await axios.get(`api/folder/fetch/${fid}`, {
                headers: { Authorization: `Bearer ${token()}` }
            });
            const ch = data.children || {};
            projectCacheRef.current[fid] = {
                folders: ch.children || [],
                files: ch.files || [],
                metadata: ch,
                timestamp: Date.now()
            };
            saveProjectCacheToStorage(projectCacheRef.current);
        } catch {
            // Silently ignore prefetch errors
        }
    }, []);

    // ── Fetch Project Recent Activities ───────────────────────────────────────
    const fetchActivities = useCallback(async (fid) => {
        if (!fid) return;
        setActivityLoading(true);
        try {
            const { data } = await axios.get(`api/folder/activities/${fid}`, {
                headers: { Authorization: `Bearer ${token()}` }
            });
            setRecentActivities((data.data || []).slice(0, 4));
        } catch {
            setRecentActivities([]);
        } finally {
            setActivityLoading(false);
        }
    }, []);

    // ── Navigation inside Subfolders (Instant Synchronous Cache Read) ─────────
    const openSubFolder = useCallback((folder) => {
        setSubPath(prev => [
            ...prev,
            { id: viewFolderId, name: prev.length === 0 ? project.name : (folderMetadata?.name || "Folder") }
        ]);
        const cached = projectCacheRef.current[folder.id];
        if (cached) {
            setContents({ folders: cached.folders, files: cached.files });
            setFolderMetadata(cached.metadata);
            setLoading(false);
        } else {
            setContents({ folders: [], files: [] });
            setLoading(true);
        }
        lastFetchedFolderIdRef.current = folder.id;
        setViewFolderId(folder.id);
        fetchContents(folder.id, Boolean(cached));
    }, [viewFolderId, project.name, folderMetadata, fetchContents]);

    const goBack = () => {
        if (subPath.length === 0) {
            onClose?.();
            return;
        }
        const prev = subPath[subPath.length - 1];
        setSubPath(p => p.slice(0, -1));
        const cached = projectCacheRef.current[prev.id];
        if (cached) {
            setContents({ folders: cached.folders, files: cached.files });
            setFolderMetadata(cached.metadata);
            setLoading(false);
        } else {
            setLoading(true);
        }
        lastFetchedFolderIdRef.current = prev.id;
        setViewFolderId(prev.id);
        fetchContents(prev.id, Boolean(cached));
    };

    const jumpTo = (idx) => {
        let targetId = project.id;
        if (idx < 0) {
            setSubPath([]);
        } else {
            const entry = subPath[idx];
            targetId = entry.id;
            setSubPath(p => p.slice(0, idx));
        }
        const cached = projectCacheRef.current[targetId];
        if (cached) {
            setContents({ folders: cached.folders, files: cached.files });
            setFolderMetadata(cached.metadata);
            setLoading(false);
        } else {
            setLoading(true);
        }
        lastFetchedFolderIdRef.current = targetId;
        setViewFolderId(targetId);
        fetchContents(targetId, Boolean(cached));
    };

    useEffect(() => {
        const handleTabSwitch = (e) => {
            if (e.detail) {
                setActiveTab(e.detail);
            }
        };
        const handleProjectRefresh = () => {
            delete projectCacheRef.current[viewFolderId];
            fetchContents(viewFolderId, true);
            if (viewFolderId === project.id) {
                fetchActivities(project.id);
            }
        };
        const handleOpenSubFolder = (e) => {
            if (e.detail) {
                openSubFolder(e.detail);
            }
        };
        window.addEventListener("cb_open_project_tab", handleTabSwitch);
        window.addEventListener("cb_project_refresh", handleProjectRefresh);
        window.addEventListener("cb_open_subfolder", handleOpenSubFolder);
        return () => {
            window.removeEventListener("cb_open_project_tab", handleTabSwitch);
            window.removeEventListener("cb_project_refresh", handleProjectRefresh);
            window.removeEventListener("cb_open_subfolder", handleOpenSubFolder);
        };
    }, [viewFolderId, project.id, fetchContents, fetchActivities, openSubFolder]);

    const prevProjectIdRef = useRef(project.id);
    useEffect(() => {
        if (prevProjectIdRef.current !== project.id) {
            prevProjectIdRef.current = project.id;
            setViewFolderId(project.id);
            setSubPath([]);
            setActiveTab("files");
            const cached = projectCacheRef.current[project.id];
            if (cached) {
                setContents({ folders: cached.folders, files: cached.files });
                setFolderMetadata(cached.metadata);
                setLoading(false);
            }
        }
    }, [project.id]);

    useEffect(() => {
        if (lastFetchedFolderIdRef.current !== viewFolderId) {
            lastFetchedFolderIdRef.current = viewFolderId;
            const cached = projectCacheRef.current[viewFolderId];
            fetchContents(viewFolderId, Boolean(cached));
        }
        if (viewFolderId === project.id) {
            fetchActivities(project.id);
        }
    }, [viewFolderId, project.id, fetchContents, fetchActivities]);

    // ── Create Subfolder (Optimistic & Instant UX Matching My Drive) ──────────
    const handleCreateFolderSubmit = async (e) => {
        if (e && typeof e.preventDefault === 'function') e.preventDefault();
        const trimmed = newFolderName.trim();
        if (!trimmed) return;

        const tempId = `temp-proj-${Date.now()}`;
        const targetPid = viewFolderId;
        const optimisticFolder = {
            id: tempId,
            name: trimmed,
            pid: targetPid,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            childrenCount: 0,
            fileCount: 0,
            _isOptimistic: true
        };

        // Instantly add to state & cache
        setContents(prev => {
            const nextFolders = [optimisticFolder, ...prev.folders];
            if (projectCacheRef.current[targetPid]) {
                projectCacheRef.current[targetPid].folders = nextFolders;
                saveProjectCacheToStorage(projectCacheRef.current);
            }
            return { ...prev, folders: nextFolders };
        });
        setNewFolderName("");
        setShowCreateFolder(false);

        try {
            await axios.post("api/folder/create", {
                name: trimmed,
                pid: targetPid
            }, {
                headers: { Authorization: `Bearer ${token()}` }
            });
            showToast?.(`Folder "${trimmed}" created successfully`, "success");
            delete projectCacheRef.current[targetPid];
            fetchContents(targetPid, true);
            onRefresh?.();
            if (targetPid === project.id) {
                fetchActivities(project.id);
            }
        } catch (err) {
            // Rollback optimistic item on failure
            setContents(prev => ({
                ...prev,
                folders: prev.folders.filter(f => f.id !== tempId)
            }));
            showToast?.(err.response?.data?.error || err.response?.data?.message || "Failed to create folder", "error");
        }
    };

    // ── File Upload (Optimistic & Instant Feedback) ───────────────────────────
    const handleFileInputChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFiles = Array.from(e.target.files);
            const targetFid = viewFolderId;

            // Instantly render optimistic file placeholders
            const optimisticEntries = selectedFiles.map(f => ({
                id: `temp-f-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                name: f.name,
                orgName: f.name,
                size: f.size,
                mimeType: f.type || "application/octet-stream",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                _isOptimistic: true
            }));

            setContents(prev => ({
                ...prev,
                files: [...optimisticEntries, ...prev.files]
            }));

            selectedFiles.forEach(file => {
                handleFileUpload?.(file, targetFid);
            });
            e.target.value = "";
        }
    };

    // ── Permissions ───────────────────────────────────────────────────────────
    const isOwner = effectiveRole === "OWNER";
    const isAdmin = effectiveRole === "ADMIN";
    const isEditor = effectiveRole === "EDITOR";
    const canWrite = isOwner || isAdmin || isEditor;
    const isOwnerOrAdmin = isOwner || isAdmin;

    // ── Tabs Config ──────────────────────────────────────────────────────────
    const tabs = [
        { key: "files", label: "Files", icon: (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
        )},
        { key: "members", label: "Members", icon: (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
        )},
        ...(isOwnerOrAdmin ? [{ key: "activity", label: "Activity", icon: (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
            </svg>
        )}] : []),
        ...(isOwnerOrAdmin ? [{ key: "requests", label: "Requests", icon: (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
        )}] : []),
        ...(isOwner ? [{ key: "settings", label: "Owner Panel", icon: (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
        )}] : (isAdmin ? [{ key: "settings", label: "Admin Panel", icon: (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
        )}] : [])),
    ];

    const ownerInfo = folderMetadata?.user?.email || folderMetadata?.user?.name || project.ownerEmail || (isOwner ? "You" : "Team Member");
    const inviteCode = folderMetadata?.inviteCode || project.inviteCode;

    // ── Filtered & Sorted Files / Folders ────────────────────────────────────
    const filteredFolders = useMemo(() => {
        let f = (contents.folders || []).filter(item =>
            (item.name || "").toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (sortBy === "name") {
            f.sort((a, b) => a.name.localeCompare(b.name));
        }
        return f;
    }, [contents.folders, searchQuery, sortBy]);

    const filteredFiles = useMemo(() => {
        let f = (contents.files || []).filter(item =>
            (item.orgName || item.name || "").toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (sortBy === "name") {
            f.sort((a, b) => (a.orgName || a.name || "").localeCompare(b.orgName || b.name || ""));
        } else if (sortBy === "size") {
            f.sort((a, b) => (b.size || 0) - (a.size || 0));
        } else if (sortBy === "date") {
            f.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
        }
        return f;
    }, [contents.files, searchQuery, sortBy]);

    // ── Calculate Project Storage Summary ────────────────────────────────────
    const totalBytes = useMemo(() => {
        return (contents.files || []).reduce((acc, curr) => acc + Number(curr.size || 0), 0);
    }, [contents.files]);

    const totalFilesCount = (contents.files || []).length;
    const totalFoldersCount = (contents.folders || []).length;
    const storagePercent = Math.min(100, Math.max(1, Math.round((totalBytes / (1024 * 1024 * 1024)) * 100))); // relative to 1GB base

    const handleCopyInvite = () => {
        if (!inviteCode) return;
        navigator.clipboard?.writeText(inviteCode);
        showToast?.(`Invite code "${inviteCode}" copied to clipboard!`, "success");
    };

    return (
        <div className="cb-project-workspace-ref-view">
            {/* Hidden Central File Input */}
            <input
                ref={workspaceFileInputRef}
                type="file"
                multiple
                style={{ display: "none" }}
                onChange={handleFileInputChange}
            />

            {/* ── 1. Top Bar: Back Button & New Folder ────────────────────── */}
            <div className="cb-pw-top-bar">
                <button
                    type="button"
                    className="cb-pw-back-btn"
                    onClick={goBack}
                >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="19" y1="12" x2="5" y2="12" />
                        <polyline points="12 19 5 12 12 5" />
                    </svg>
                    <span>{subPath.length > 0 ? "Back" : "Back to Projects"}</span>
                </button>

                {canWrite && (
                    <button
                        type="button"
                        className="btn btn-outline btn-sm cb-pw-top-new-folder"
                        onClick={() => setShowCreateFolder(true)}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                            <line x1="12" y1="11" x2="12" y2="17" />
                            <line x1="9" y1="14" x2="15" y2="14" />
                        </svg>
                        <span>New Folder</span>
                    </button>
                )}
            </div>

            {/* ── 2. Project Hero Header Card (Matching Reference Design) ──── */}
            <div className="cb-pw-hero-card">
                <div className="cb-pw-hero-main">
                    {/* Left: Project Icon with gradient depth */}
                    <div className="cb-pw-hero-icon-box">
                        <div className="cb-pw-hero-icon-glow"></div>
                        <svg viewBox="0 0 24 24" width="32" height="32" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 7v10a3 3 0 003 3h12a3 3 0 003-3V9a3 3 0 00-3-3h-6l-2-2H6a3 3 0 00-3 3z" fill="url(#cb-pw-fld-back)" />
                            <path d="M3 10h18v7a3 3 0 01-3 3H6a3 3 0 01-3-3v-7z" fill="url(#cb-pw-fld-front)" opacity="0.95" />
                            <defs>
                                <linearGradient id="cb-pw-fld-back" x1="3" y1="4" x2="21" y2="20" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#8b5cf6" />
                                    <stop offset="1" stopColor="#6366f1" />
                                </linearGradient>
                                <linearGradient id="cb-pw-fld-front" x1="3" y1="10" x2="21" y2="20" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#7c3aed" />
                                    <stop offset="1" stopColor="#4f46e5" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>

                    {/* Middle: Title, Badges, Description */}
                    <div className="cb-pw-hero-details">
                        <div className="cb-pw-hero-title-row">
                            <h1 className="cb-pw-project-title">{project.name}</h1>
                            {/* Mobile menu trigger for Owner/Admin */}
                            {isOwnerOrAdmin && (
                                <button
                                    type="button"
                                    className="cb-pw-mobile-menu-btn"
                                    onClick={() => openActionSheet?.(project, 'project', effectiveRole)}
                                    aria-label="Project actions"
                                >
                                    ⋮
                                </button>
                            )}
                        </div>

                        {/* Metadata Badges */}
                        <div className="cb-pw-hero-badges-row">
                            <span className="cb-pw-chip cb-pw-chip-owner">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                                <span className="cb-pw-chip-label">Owner:</span>
                                <strong>{ownerInfo}</strong>
                            </span>

                            <RoleBadge role={effectiveRole} />

                            {inviteCode && (
                                <button
                                    type="button"
                                    className="cb-pw-chip cb-pw-chip-code"
                                    onClick={handleCopyInvite}
                                    title="Click to copy invite code"
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                                        <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                                        <line x1="6" y1="6" x2="6.01" y2="6" />
                                        <line x1="6" y1="18" x2="6.01" y2="18" />
                                    </svg>
                                    <span className="cb-pw-chip-label">Code:</span>
                                    <code>{inviteCode}</code>
                                    <svg className="cb-pw-chip-copy-icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        {/* Description */}
                        <div className="cb-pw-hero-description-row">
                            {isEditingDesc ? (
                                <div className="cb-pw-desc-edit-wrap">
                                    <input
                                        type="text"
                                        className="cb-input cb-pw-desc-input"
                                        value={projectDesc}
                                        onChange={(e) => setProjectDesc(e.target.value)}
                                        placeholder="Add a brief description for this workspace..."
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                localStorage.setItem(`cb_proj_desc_${project.id}`, projectDesc);
                                                setIsEditingDesc(false);
                                                showToast?.("Project description updated", "success");
                                            } else if (e.key === 'Escape') {
                                                setIsEditingDesc(false);
                                            }
                                        }}
                                    />
                                    <div className="cb-pw-desc-edit-actions">
                                        <button
                                            type="button"
                                            className="cb-btn-pill-save"
                                            onClick={() => {
                                                localStorage.setItem(`cb_proj_desc_${project.id}`, projectDesc);
                                                setIsEditingDesc(false);
                                                showToast?.("Project description updated", "success");
                                            }}
                                        >
                                            Save
                                        </button>
                                        <button
                                            type="button"
                                            className="cb-btn-pill-cancel"
                                            onClick={() => setIsEditingDesc(false)}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="cb-pw-hero-description">
                                    <span>{projectDesc}</span>
                                    {isOwnerOrAdmin && (
                                        <button
                                            type="button"
                                            className="cb-pw-edit-desc-btn"
                                            onClick={() => setIsEditingDesc(true)}
                                            title="Edit description"
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M12 20h9" />
                                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                            </svg>
                                            <span>Edit description</span>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Actions & Storage Summary Box */}
                <div className="cb-pw-hero-right">
                    {/* Header Action Buttons */}
                    <div className="cb-pw-hero-action-buttons">
                        {inviteCode && (
                            <button
                                type="button"
                                className="cb-pw-hero-btn cb-pw-hero-btn-outline"
                                onClick={handleCopyInvite}
                                title="Share workspace invite"
                            >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="18" cy="5" r="3" />
                                    <circle cx="6" cy="12" r="3" />
                                    <circle cx="18" cy="19" r="3" />
                                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                                </svg>
                                <span>Share</span>
                            </button>
                        )}

                        {isOwnerOrAdmin && (
                            <button
                                type="button"
                                className="cb-pw-hero-btn cb-pw-hero-btn-outline"
                                onClick={() => openActionSheet?.(project, 'project', effectiveRole)}
                                title="More workspace options"
                            >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                                    <circle cx="5" cy="12" r="2" />
                                    <circle cx="12" cy="12" r="2" />
                                    <circle cx="19" cy="12" r="2" />
                                </svg>
                                <span>More</span>
                            </button>
                        )}

                        {canWrite && (
                            <button
                                type="button"
                                className="cb-pw-hero-btn cb-pw-hero-btn-primary"
                                onClick={() => workspaceFileInputRef.current?.click()}
                                title="Upload file to workspace"
                            >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="17 8 12 3 7 8" />
                                    <line x1="12" y1="3" x2="12" y2="15" />
                                </svg>
                                <span>Upload File</span>
                            </button>
                        )}
                    </div>

                    {/* Compact Project Size Card (Matching Reference) */}
                    <div className="cb-pw-storage-summary-card">
                        <div className="cb-pw-storage-text-wrap">
                            <span className="cb-pw-storage-label">PROJECT SIZE</span>
                            <span className="cb-pw-storage-val">{formatBytes(totalBytes)}</span>
                            <span className="cb-pw-storage-sub">
                                {totalFilesCount} {totalFilesCount === 1 ? 'file' : 'files'} • {totalFoldersCount} {totalFoldersCount === 1 ? 'folder' : 'folders'}
                            </span>
                        </div>
                        <div className="cb-pw-storage-donut-wrap">
                            <svg viewBox="0 0 36 36" className="cb-pw-circular-chart">
                                <path
                                    className="cb-pw-circle-bg"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                                <path
                                    className="cb-pw-circle-fill"
                                    strokeDasharray={`${storagePercent}, 100`}
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                                <text x="18" y="20.35" className="cb-pw-percentage">{storagePercent}%</text>
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── 3. Navigation Tabs Bar (Matching Reference) ─────────────── */}
            <div className="cb-pw-tabs-bar">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        type="button"
                        className={`cb-pw-tab-btn ${activeTab === tab.key ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        {tab.icon}
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* ── 4. Main Body Content by Tab ─────────────────────────────── */}
            <div className="cb-pw-body-content">
                {activeTab === "files" && (
                    <div className="cb-pw-files-view-wrap">
                        {/* Action & Filter Controls Bar */}
                        <div className="cb-pw-files-controls-bar">
                            {/* Breadcrumbs */}
                            <div className="cb-pw-breadcrumbs">
                                <span className="cb-pw-bc-root" onClick={() => jumpTo(-1)}>
                                    All Files
                                </span>
                                <span className="cb-pw-bc-sep">&gt;</span>
                                {subPath.map((item, idx) => (
                                    <React.Fragment key={item.id || idx}>
                                        <span
                                            className={`cb-pw-bc-item ${idx === subPath.length - 1 ? 'active' : ''}`}
                                            onClick={() => jumpTo(idx)}
                                        >
                                            {item.name}
                                        </span>
                                        {idx < subPath.length - 1 && <span className="cb-pw-bc-sep">&gt;</span>}
                                    </React.Fragment>
                                ))}
                            </div>

                            {/* Right View & Sort Controls */}
                            <div className="cb-pw-controls-right">
                                <div className="cb-pw-search-box">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="11" cy="11" r="8" />
                                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                    </svg>
                                    <input
                                        type="text"
                                        placeholder="Search files..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="cb-pw-search-input"
                                    />
                                    {searchQuery && (
                                        <button type="button" className="cb-pw-search-clear" onClick={() => setSearchQuery("")}>✕</button>
                                    )}
                                </div>

                                {/* View Switcher */}
                                <div className="cb-pw-view-toggle-wrap">
                                    <button
                                        type="button"
                                        className={`cb-pw-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                                        onClick={() => setViewMode('grid')}
                                        title="Grid view"
                                    >
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="3" width="7" height="7" rx="1" />
                                            <rect x="14" y="3" width="7" height="7" rx="1" />
                                            <rect x="14" y="14" width="7" height="7" rx="1" />
                                            <rect x="3" y="14" width="7" height="7" rx="1" />
                                        </svg>
                                    </button>
                                    <button
                                        type="button"
                                        className={`cb-pw-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                                        onClick={() => setViewMode('list')}
                                        title="List view"
                                    >
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="8" y1="6" x2="21" y2="6" />
                                            <line x1="8" y1="12" x2="21" y2="12" />
                                            <line x1="8" y1="18" x2="21" y2="18" />
                                            <line x1="3" y1="6" x2="3.01" y2="6" />
                                            <line x1="3" y1="12" x2="3.01" y2="12" />
                                            <line x1="3" y1="18" x2="3.01" y2="18" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Sort dropdown */}
                                <div className="cb-pw-sort-wrap">
                                    <select
                                        className="cb-pw-sort-select"
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                    >
                                        <option value="name">Name</option>
                                        <option value="size">Size</option>
                                        <option value="date">Date</option>
                                    </select>
                                </div>
                            </div>
                        </div>



                        {/* Content States */}
                        {loading ? (
                            <div className="cb-pw-grid-skeleton">
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <div key={i} className="cb-pw-card-skeleton cb-skeleton" />
                                ))}
                            </div>
                        ) : (
                            <>
                                {contents.folders.length === 0 && contents.files.length === 0 ? (
                                    /* Single Elegant Integrated Empty State */
                                    <div className="cb-pw-empty-state-modern">
                                        <div className="cb-pw-empty-glow-box">
                                            <svg viewBox="0 0 24 24" width="40" height="40" fill="#7c3aed">
                                                <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                                            </svg>
                                        </div>
                                        <h3 className="cb-pw-empty-title">This project is empty</h3>
                                        <p className="cb-pw-empty-subtitle">
                                            {canWrite
                                                ? "Upload files or create subfolders to start collaborating with your team."
                                                : "No files or subfolders have been added to this workspace yet."}
                                        </p>
                                        {canWrite && (
                                            <div className="cb-pw-empty-actions-row">
                                                <button
                                                    type="button"
                                                    className="btn btn-primary cb-pw-empty-btn-primary"
                                                    onClick={() => workspaceFileInputRef.current?.click()}
                                                >
                                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                        <polyline points="17 8 12 3 7 8" />
                                                        <line x1="12" y1="3" x2="12" y2="15" />
                                                    </svg>
                                                    <span>Upload File</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-secondary cb-pw-empty-btn-secondary"
                                                    onClick={() => setShowCreateFolder(true)}
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                                                        <line x1="12" y1="11" x2="12" y2="17" />
                                                        <line x1="9" y1="14" x2="15" y2="14" />
                                                    </svg>
                                                    <span>Create Folder</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : viewMode === "grid" ? (
                                    <div className="cb-pw-grid-container">
                                        {/* Folder Cards */}
                                        {filteredFolders.map((folder, idx) => {
                                            const isEditingFolder = editingItem && editingItem.type === 'folder' && editingItem.id === folder.id;
                                            const isTarget = dropTargetId === folder.id;
                                            const palette = folderPalette[idx % folderPalette.length];
                                            const countText = `${folder.childrenCount || folder.fileCount || (folder.files ? folder.files.length : (folder.totalFiles ?? 0))} items`;

                                            return (
                                                <div
                                                    key={folder.id}
                                                    className={`cb-folder-tile ${isTarget ? 'drag-over' : ''}`}
                                                    style={{
                                                        "--folder-glow": palette.glow
                                                    }}
                                                    onClick={() => {
                                                        if (!isEditingFolder) openSubFolder(folder);
                                                    }}
                                                    onMouseEnter={() => prefetchProjectFolder(folder.id)}
                                                    draggable={!isEditingFolder}
                                                    onDragStart={(e) => handleDragStartItem && handleDragStartItem(e, { type: 'folder', id: folder.id, name: folder.name })}
                                                    onDragEnd={handleDragEndItem}
                                                    onDragOver={(e) => handleDragOverTarget && handleDragOverTarget(e, folder.id)}
                                                    onDragLeave={(e) => handleDragLeaveTarget && handleDragLeaveTarget(e, folder.id)}
                                                    onDrop={(e) => handleDropOnTarget && handleDropOnTarget(e, folder.id)}
                                                >
                                                    <div className="cb-folder-tile-top">
                                                        <div className="cb-folder-icon-glow" style={{ color: palette.iconColor, background: palette.gradient }}>
                                                            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                                                                <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z" />
                                                            </svg>
                                                        </div>

                                                        {canWrite && !isEditingFolder && (
                                                            <button
                                                                type="button"
                                                                className="cb-folder-action-trigger"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    openActionSheet?.(folder, 'folder', effectiveRole);
                                                                }}
                                                                aria-label="Folder Options"
                                                                title="Folder options"
                                                            >
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                                    <circle cx="12" cy="12" r="2" />
                                                                    <circle cx="19" cy="12" r="2" />
                                                                    <circle cx="5" cy="12" r="2" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                    </div>

                                                    <div className="cb-folder-tile-body">
                                                        {isEditingFolder ? (
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
                                                                <span className="cb-folder-tile-name" title={folder.name}>
                                                                    {folder.name}
                                                                </span>
                                                                {folder._isOptimistic ? (
                                                                    <span className="cb-optimistic-tag">Creating...</span>
                                                                ) : (
                                                                    <span className="cb-folder-tile-sub">
                                                                        {countText}
                                                                    </span>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* File Cards */}
                                        {filteredFiles.map(file => {
                                            const fileName = file.orgName || file.name || "Untitled";
                                            const info = getFileDisplayInfo(fileName, file.mimeType);
                                            const isEditingFile = editingItem && editingItem.type === 'file' && editingItem.id === file.id;
                                            return (
                                                <div
                                                    key={file.id}
                                                    className="cb-pw-file-card"
                                                    onClick={(e) => {
                                                        if (!isEditingFile) previewFile?.(e, file);
                                                    }}
                                                >
                                                    <div className="cb-pw-file-preview-box">
                                                        {info.type === "video" ? (
                                                            <div className="cb-pw-video-thumb">
                                                                <svg width="28" height="28" viewBox="0 0 24 24" fill="#a855f7">
                                                                    <polygon points="5 3 19 12 5 21 5 3" />
                                                                </svg>
                                                            </div>
                                                        ) : (
                                                            <span
                                                                className="cb-pw-file-badge"
                                                                style={{ background: info.bg, color: info.color }}
                                                            >
                                                                {info.label}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {isEditingFile ? (
                                                        <form
                                                            onSubmit={(e) => handleRenameSubmit(e, file.id, 'file')}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="cb-rename-inline-form"
                                                            style={{ marginTop: 4, width: '100%' }}
                                                        >
                                                            <input
                                                                value={renameValue}
                                                                onChange={(e) => setRenameValue(e.target.value)}
                                                                className="cb-rename-inline-input"
                                                                autoFocus
                                                                style={{ width: '100%' }}
                                                            />
                                                            <button type="submit" className="cb-rename-save-btn">Save</button>
                                                        </form>
                                                    ) : (
                                                        <div className="cb-pw-item-info">
                                                            <span className="cb-pw-item-name" title={fileName}>
                                                                {fileName}
                                                            </span>
                                                            {file._isOptimistic ? (
                                                                <span className="cb-optimistic-tag">Uploading...</span>
                                                            ) : (
                                                                <span className="cb-pw-item-meta">
                                                                    {formatBytes(file.size || 0)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                    {!isEditingFile && (
                                                        <button
                                                            type="button"
                                                            className="cb-pw-item-overflow-btn"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openActionSheet?.(file, 'file', effectiveRole);
                                                            }}
                                                            aria-label="File menu"
                                                        >
                                                            ⋮
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}

                                        {/* Upload File Dropzone Tile */}
                                        {canWrite && (
                                            <div
                                                className="cb-pw-upload-tile"
                                                onClick={() => workspaceFileInputRef.current?.click()}
                                            >
                                                <div className="cb-pw-upload-tile-icon">
                                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                        <polyline points="17 8 12 3 7 8" />
                                                        <line x1="12" y1="3" x2="12" y2="15" />
                                                    </svg>
                                                </div>
                                                <span className="cb-pw-upload-tile-title">Upload File</span>
                                                <span className="cb-pw-upload-tile-sub">or drag and drop</span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* List View */
                                    <div className="cb-recent-files-table-wrap">
                                        <table className="cb-recent-table">
                                            <thead>
                                                <tr>
                                                    <th style={{ width: "45%" }}>Name</th>
                                                    <th>Size / Items</th>
                                                    <th>Last Modified</th>
                                                    <th style={{ textAlign: "right" }}>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredFolders.map((folder, idx) => {
                                                    const isEditingFolder = editingItem && editingItem.type === 'folder' && editingItem.id === folder.id;
                                                    const isTarget = dropTargetId === folder.id;
                                                    const palette = folderPalette[idx % folderPalette.length];
                                                    const countText = `${folder.childrenCount || folder.fileCount || (folder.files ? folder.files.length : (folder.totalFiles ?? 0))} items`;

                                                    return (
                                                        <tr
                                                            key={folder.id}
                                                            className={`cb-recent-row ${isTarget ? 'drag-over' : ''}`}
                                                            onClick={() => {
                                                                if (!isEditingFolder) openSubFolder(folder);
                                                            }}
                                                            onMouseEnter={() => prefetchProjectFolder(folder.id)}
                                                            draggable={!isEditingFolder}
                                                            onDragStart={(e) => handleDragStartItem && handleDragStartItem(e, { type: 'folder', id: folder.id, name: folder.name })}
                                                            onDragEnd={handleDragEndItem}
                                                            onDragOver={(e) => handleDragOverTarget && handleDragOverTarget(e, folder.id)}
                                                            onDragLeave={(e) => handleDragLeaveTarget && handleDragLeaveTarget(e, folder.id)}
                                                            onDrop={(e) => handleDropOnTarget && handleDropOnTarget(e, folder.id)}
                                                        >
                                                            <td>
                                                                <div className="cb-recent-name-cell">
                                                                    <div
                                                                        className="cb-file-icon-badge cb-folder-badge-icon"
                                                                        style={{
                                                                            background: palette.gradient,
                                                                            color: palette.iconColor,
                                                                            borderColor: palette.glow,
                                                                            width: 28,
                                                                            height: 28,
                                                                            borderRadius: 6,
                                                                            display: 'inline-flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            marginRight: 8,
                                                                            flexShrink: 0
                                                                        }}
                                                                    >
                                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                                            <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z" />
                                                                        </svg>
                                                                    </div>
                                                                    {isEditingFolder ? (
                                                                        <form
                                                                            onSubmit={(e) => handleRenameSubmit(e, folder.id, 'folder')}
                                                                            onClick={(e) => e.stopPropagation()}
                                                                            className="cb-rename-inline-form"
                                                                        >
                                                                            <input
                                                                                value={renameValue}
                                                                                onChange={(e) => setRenameValue(e.target.value)}
                                                                                className="cb-rename-inline-input"
                                                                                autoFocus
                                                                            />
                                                                            <button type="submit" className="cb-rename-save-btn">Save</button>
                                                                        </form>
                                                                    ) : (
                                                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                                                            <span className="cb-recent-file-title" title={folder.name}>{folder.name}</span>
                                                                            {folder._isOptimistic && <span className="cb-optimistic-tag">Creating...</span>}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="cb-cell-muted">{countText}</td>
                                                            <td className="cb-cell-muted">{formatDate(folder.updatedAt || folder.createdAt)}</td>
                                                            <td style={{ textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                                                                {canWrite && !isEditingFolder && (
                                                                    <button
                                                                        type="button"
                                                                        className="cb-recent-action-btn"
                                                                        onClick={() => openActionSheet?.(folder, 'folder', effectiveRole)}
                                                                        title="Folder options"
                                                                    >
                                                                        ⋮
                                                                    </button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}

                                                {filteredFiles.map(file => {
                                                    const fileName = file.orgName || file.name || "Untitled";
                                                    const info = getFileDisplayInfo(fileName, file.mimeType);
                                                    const isEditingFile = editingItem && editingItem.type === 'file' && editingItem.id === file.id;
                                                    return (
                                                        <tr
                                                            key={file.id}
                                                            className="cb-recent-row"
                                                            onClick={(e) => {
                                                                if (!isEditingFile) previewFile?.(e, file);
                                                            }}
                                                        >
                                                            <td>
                                                                <div className="cb-recent-name-cell">
                                                                    <span className="cb-recent-file-badge" style={{ background: info.bg, color: info.color }}>
                                                                        {info.label}
                                                                    </span>
                                                                    {isEditingFile ? (
                                                                        <form
                                                                            onSubmit={(e) => handleRenameSubmit(e, file.id, 'file')}
                                                                            onClick={(e) => e.stopPropagation()}
                                                                            className="cb-rename-inline-form"
                                                                        >
                                                                            <input
                                                                                value={renameValue}
                                                                                onChange={(e) => setRenameValue(e.target.value)}
                                                                                className="cb-rename-inline-input"
                                                                                autoFocus
                                                                            />
                                                                            <button type="submit" className="cb-rename-save-btn">Save</button>
                                                                        </form>
                                                                    ) : (
                                                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                                                            <span className="cb-recent-file-title" title={fileName}>{fileName}</span>
                                                                            {file._isOptimistic && <span className="cb-optimistic-tag">Uploading...</span>}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="cb-cell-muted">{formatBytes(file.size || 0)}</td>
                                                            <td className="cb-cell-muted">{formatDate(file.updatedAt || file.createdAt)}</td>
                                                            <td style={{ textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                                                                <button
                                                                    type="button"
                                                                    className="cb-btn-icon-sm"
                                                                    onClick={(e) => downloadFile?.(e, file.id, fileName)}
                                                                    title="Download"
                                                                >
                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                                        <polyline points="7 10 12 15 17 10" />
                                                                        <line x1="12" y1="15" x2="12" y2="3" />
                                                                    </svg>
                                                                </button>
                                                                {!isEditingFile && (
                                                                    <button
                                                                        type="button"
                                                                        className="cb-recent-action-btn"
                                                                        onClick={() => openActionSheet?.(file, 'file', effectiveRole)}
                                                                    >
                                                                        ⋮
                                                                    </button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {/* ── 5. Bottom Row: Recent Activity + Quick Actions (Matching Reference) ── */}
                                {subPath.length === 0 && (
                                    <div className="cb-pw-bottom-grid">
                                        {/* Left Card: Recent Activity */}
                                        <div className="cb-pw-bottom-card cb-pw-activity-card">
                                            <div className="cb-pw-bottom-card-header">
                                                <h3 className="cb-pw-bottom-card-title">Recent Activity</h3>
                                                {isOwnerOrAdmin && (
                                                    <button
                                                        type="button"
                                                        className="cb-pw-view-all-link"
                                                        onClick={() => setActiveTab("activity")}
                                                    >
                                                        View all &rarr;
                                                    </button>
                                                )}
                                            </div>
                                            <div className="cb-pw-bottom-activity-list">
                                                {activityLoading ? (
                                                    <div className="cb-activity-loading">
                                                        <span className="cb-spinner-sm" />
                                                        <span>Loading activity...</span>
                                                    </div>
                                                ) : recentActivities.length > 0 ? (
                                                    recentActivities.map((act, i) => {
                                                        const { performer, actionText, time, bg, color, icon } = getActivityInfo(act);
                                                        return (
                                                            <div key={act.id || i} className="cb-pw-act-item">
                                                                <div className="cb-pw-act-icon-box" style={{ background: bg, color: color, borderColor: color }}>
                                                                    {icon}
                                                                </div>
                                                                <div className="cb-pw-act-text-wrap">
                                                                    <p className="cb-pw-act-msg">
                                                                        <strong>{performer}</strong> {actionText}
                                                                    </p>
                                                                    <span className="cb-pw-act-date">{time}</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                ) : (
                                                    <div className="cb-pw-act-empty">
                                                        <span>No recent activity in this workspace yet.</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Right Card: Quick Actions & Collaboration Banner */}
                                        <div className="cb-pw-bottom-right-col">
                                            <div className="cb-pw-bottom-card cb-pw-quick-actions-card">
                                                <h3 className="cb-pw-bottom-card-title">Quick Actions</h3>
                                                <div className="cb-pw-quick-buttons-row">
                                                    {canWrite && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                className="btn btn-primary btn-sm"
                                                                onClick={() => workspaceFileInputRef.current?.click()}
                                                            >
                                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                                                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                                    <polyline points="17 8 12 3 7 8" />
                                                                    <line x1="12" y1="3" x2="12" y2="15" />
                                                                </svg>
                                                                <span>Upload File</span>
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="btn btn-outline btn-sm"
                                                                onClick={() => setShowCreateFolder(true)}
                                                            >
                                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                                                                </svg>
                                                                <span>New Folder</span>
                                                            </button>
                                                        </>
                                                    )}

                                                    {inviteCode && (
                                                        <button
                                                            type="button"
                                                            className="btn btn-outline btn-sm"
                                                            onClick={handleCopyInvite}
                                                        >
                                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                                                <circle cx="8.5" cy="7" r="4" />
                                                                <line x1="20" y1="8" x2="20" y2="14" />
                                                                <line x1="23" y1="11" x2="17" y2="11" />
                                                            </svg>
                                                            <span>Invite Member</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Collaborate Better Card */}
                                            <div
                                                className="cb-pw-collaborate-card"
                                                onClick={handleCopyInvite}
                                                role="button"
                                                tabIndex={0}
                                            >
                                                <div className="cb-pw-collab-icon-box">
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                                        <circle cx="9" cy="7" r="4" />
                                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                                    </svg>
                                                </div>
                                                <div className="cb-pw-collab-text-wrap">
                                                    <span className="cb-pw-collab-title">Collaborate better</span>
                                                    <span className="cb-pw-collab-sub">Invite your team and start building together.</span>
                                                </div>
                                                <svg className="cb-pw-collab-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                    <polyline points="9 18 15 12 9 6" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {activeTab === "members" && (
                    <div className="cb-workspace-panel-wrap">
                        <FolderMembers folderId={project.id} />
                    </div>
                )}

                {activeTab === "activity" && isOwnerOrAdmin && (
                    <div className="cb-workspace-panel-wrap">
                        <ActivityLogs folderId={project.id} />
                    </div>
                )}

                {activeTab === "requests" && isOwnerOrAdmin && (
                    <div className="cb-workspace-panel-wrap">
                        <FolderRequests
                            folderId={project.id}
                            onRequestHandled={onRefresh}
                            onNotify={(msg, type) => showToast?.(msg, type)}
                        />
                    </div>
                )}

                {activeTab === "settings" && (
                    <div className="cb-workspace-panel-wrap">
                        {isOwner ? (
                            <OwnerPanel
                                folderId={project.id}
                                onNotify={(msg, type) => showToast?.(msg, type)}
                                onRefresh={onRefresh}
                                onProjectDeleted={onProjectDeleted}
                            />
                        ) : isAdmin ? (
                            <AdminPanel
                                folderId={project.id}
                                onNotify={(msg, type) => showToast?.(msg, type)}
                                onRefresh={onRefresh}
                            />
                        ) : null}
                    </div>
                )}
            </div>

            {/* ── 6. Mobile Sticky Bottom Actions ─────────────────────────── */}
            {canWrite && (
                <div className="cb-pw-mobile-sticky-actions">
                    <button
                        type="button"
                        className="btn btn-primary cb-pw-mobile-action-btn"
                        onClick={() => workspaceFileInputRef.current?.click()}
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        <span>Upload File</span>
                    </button>
                    <button
                        type="button"
                        className="btn btn-outline cb-pw-mobile-action-btn"
                        onClick={() => setShowCreateFolder(true)}
                    >
                        <span>+ New Folder</span>
                    </button>
                </div>
            )}

            {/* ── 7. Create Subfolder Modal ────────────────────────────────────── */}
            {showCreateFolder && (
                <div 
                    className="file-preview-modal-backdrop" 
                    onClick={() => {
                        setShowCreateFolder(false);
                        setNewFolderName("");
                    }}
                >
                    <div 
                        className="file-preview-modal-card custom-modal-card cb-pw-modal-card" 
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="cb-pw-modal-header">
                            <div className="cb-pw-create-folder-header">
                                <div className="cb-pw-modal-icon-badge">
                                    <svg viewBox="0 0 24 24" width="22" height="22" fill="#8b5cf6">
                                        <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                                    </svg>
                                </div>
                                <div className="cb-pw-modal-header-text">
                                    <h2 className="cb-pw-modal-title">Create New Folder</h2>
                                    <p className="cb-pw-modal-subtitle">
                                        Inside <span className="cb-pw-folder-highlight">{subPath.length > 0 ? (folderMetadata?.name || "Folder") : project.name}</span>
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="preview-close-btn"
                                onClick={() => {
                                    setShowCreateFolder(false);
                                    setNewFolderName("");
                                }}
                                aria-label="Close modal"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleCreateFolderSubmit} className="cb-pw-modal-form">
                            <div className="cb-pw-input-group">
                                <label className="cb-pw-input-label">Folder Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Design Assets, Documents, Invoices..."
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                    className="input-field cb-pw-modal-input"
                                    autoFocus
                                    required
                                />
                            </div>

                            <div className="cb-pw-modal-actions">
                                <button
                                    type="button"
                                    className="btn btn-secondary cb-pw-btn-cancel"
                                    onClick={() => {
                                        setShowCreateFolder(false);
                                        setNewFolderName("");
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary cb-pw-btn-submit"
                                    disabled={isCreatingFolder || !newFolderName.trim()}
                                >
                                    {isCreatingFolder ? (
                                        <>
                                            <span className="cb-spinner-sm" />
                                            <span>Creating...</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                                                <line x1="12" y1="5" x2="12" y2="19" />
                                                <line x1="5" y1="12" x2="19" y2="12" />
                                            </svg>
                                            <span>Create Folder</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default React.memo(ProjectView);
