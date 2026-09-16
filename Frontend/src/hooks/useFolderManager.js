import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";

const CACHE_STORAGE_KEY = "cloudbox_folder_content_cache";

function getInitialCache() {
    try {
        const stored = sessionStorage.getItem(CACHE_STORAGE_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch {
        return {};
    }
}

function saveCacheToStorage(cache) {
    try {
        sessionStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(cache));
    } catch {
        // Ignore quota/access errors
    }
}

export function useFolderManager() {
    const [folders, setFolders] = useState([]);
    const [files, setFiles] = useState([]);
    const [rootFolders, setRootFolders] = useState([]); // always root-level children
    const [userProfile, setUserProfile] = useState(null);
    const [storageBreakdown, setStorageBreakdown] = useState({ image: 0, video: 0, audio: 0, document: 0 });
    const [dashboardStats, setDashboardStats] = useState({ totalFiles: 0, totalFolders: 0, projects: 0, sharedWithMe: 0 });
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResult, setSearchResult] = useState({
        folders: [],
        files: []
    });
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState(null);
    const [rootFolderId, setRootFolderId] = useState(() => {
        const saved = localStorage.getItem("rootFolderId");
        return saved ? Number(saved) : -1;
    });

    const [currentFolderId, setCurrentFolderId] = useState(() => {
        const saved = localStorage.getItem("currentFolderId");
        if (saved && Number(saved) !== -1) return Number(saved);
        const rootSaved = localStorage.getItem("rootFolderId");
        return rootSaved ? Number(rootSaved) : -1;
    });
    const [history, setHistory] = useState(() => {
        const saved = localStorage.getItem("folderHistory");
        return saved ? JSON.parse(saved) : [];
    });
    const [folderName, setFolderName] = useState("");
    const [loading, setLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [showCreator, setShowCreator] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [renameValue, setRenameValue] = useState("");
    const [movingItem, setMovingItem] = useState(null);
    const [toasts, setToasts] = useState([]);
    const [expandedFolders, setExpandedFolders] = useState({ "-1": true });
    const [treeNodes, setTreeNodes] = useState({});
    const [foldersCache, setFoldersCache] = useState({});

    // Fast in-memory & sessionStorage cache for 0ms instant folder loading
    const contentCacheRef = useRef(getInitialCache());
    const activeFolderIdRef = useRef(currentFolderId);

    const navigate = useNavigate();

    const showToast = useCallback((message, type = "success") => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    }, []);

    const invalidateCache = useCallback((folderId = null) => {
        if (folderId !== null && folderId !== undefined) {
            delete contentCacheRef.current[folderId];
            if (folderId === -1 || folderId === 0) {
                delete contentCacheRef.current[-1];
                delete contentCacheRef.current[0];
            }
        } else {
            contentCacheRef.current = {};
        }
        saveCacheToStorage(contentCacheRef.current);
    }, []);

    const addToCache = useCallback((folderList) => {
        if (!folderList || !Array.isArray(folderList)) return;
        setFoldersCache(prev => {
            const next = { ...prev };
            folderList.forEach(f => { next[f.id] = f; });
            return next;
        });
    }, []);

    const rebuildHistory = useCallback((folderId) => {
        const path = [];
        let currentId = folderId;
        while (currentId && currentId !== -1 && currentId !== 0 && currentId !== rootFolderId) {
            const folder = foldersCache[currentId];
            if (!folder || folder.isRoot) break;
            path.unshift({ id: folder.id, name: folder.name, pid: folder.pid });
            currentId = folder.pid;
        }
        return path;
    }, [foldersCache, rootFolderId]);

    const fetchTreeSubfolders = useCallback(async (folderId) => {
        try {
            const token = localStorage.getItem("accessToken");
            const fetchId = (folderId === -1 && rootFolderId !== -1) ? rootFolderId : folderId;
            if (fetchId === -1) return;
            const { data } = await axios.get(`api/folder/fetch/${fetchId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const fetchedChildren = data.children?.children || [];
            const fetchedFiles = data.children?.files || [];
            addToCache(fetchedChildren);
            setTreeNodes(prev => ({
                ...prev,
                [folderId]: {
                    subfolders: fetchedChildren,
                    files: fetchedFiles
                },
                ...(fetchId !== folderId ? {
                    [fetchId]: {
                        subfolders: fetchedChildren,
                        files: fetchedFiles
                    }
                } : {})
            }));
        } catch (err) {
            console.error("Error fetching tree subfolders:", err);
        }
    }, [addToCache, rootFolderId]);

    const fetchStorageBreakdown = useCallback(async () => {
        try {
            const token = localStorage.getItem("accessToken");
            if (!token) return;
            const { data } = await axios.get("api/file/storage-breakdown", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (data.data && data.data.stats) {
                setStorageBreakdown(data.data.stats);
            }
        } catch (err) {
            console.error("Failed to fetch storage breakdown:", err);
        }
    }, []);

    const fetchDashboardStats = useCallback(async () => {
        try {
            const token = localStorage.getItem("accessToken");
            if (!token) return;
            const { data } = await axios.get("api/folder/stats", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (data.success && data.data) {
                setDashboardStats(data.data);
            }
        } catch (err) {
            console.error("Failed to fetch dashboard stats:", err);
        }
    }, []);

    const fetchFolders = useCallback(async (id = null, isBackgroundSync = false) => {
        const targetId = (id !== null && id !== undefined) ? id : activeFolderIdRef.current;
        const fetchId = (targetId === -1 || targetId === 0) ? (rootFolderId !== -1 ? rootFolderId : -1) : targetId;
        if (fetchId === -1 || fetchId === 0 || !fetchId) {
            setLoading(false);
            return;
        }

        // Only mark this folder as active when it's a user-initiated navigation.
        // Background syncs (e.g. silent root refresh) must NOT overwrite the ref
        // or they'll break the race-condition guard for the folder the user is viewing.
        if (!isBackgroundSync) {
            activeFolderIdRef.current = fetchId;
        }

        // Synchronous render from cache
        const cached = contentCacheRef.current[fetchId] || (fetchId === rootFolderId ? contentCacheRef.current[-1] : null);
        if (cached) {
            setFolders(cached.folders || []);
            setFiles(cached.files || []);
            // Populate rootFolders from cache too
            if (fetchId === rootFolderId) {
                setRootFolders(cached.folders || []);
            }
            if (cached.folderInfo && cached.folderInfo.id) {
                setFoldersCache(prev => ({ ...prev, [cached.folderInfo.id]: cached.folderInfo }));
            }
            if (!isBackgroundSync) {
                setLoading(false);
            }
        } else if (!isBackgroundSync) {
            setLoading(true);
        }

        try {
            const token = localStorage.getItem("accessToken");
            if (!token) {
                setLoading(false);
                return;
            }
            const { data } = await axios.get(`api/folder/fetch/${fetchId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const fetchedChildren = data.children?.children || [];
            const fetchedFiles = data.children?.files || [];
            const fetchedInfo = data.children || null;

            // Save to persistent cache
            const entry = {
                folders: fetchedChildren,
                files: fetchedFiles,
                folderInfo: fetchedInfo,
                timestamp: Date.now()
            };
            contentCacheRef.current[fetchId] = entry;
            if (fetchId === rootFolderId) {
                contentCacheRef.current[-1] = entry;
            }
            saveCacheToStorage(contentCacheRef.current);

            addToCache(fetchedChildren);
            if (fetchedInfo && fetchedInfo.id !== null) {
                setFoldersCache(prev => ({ ...prev, [fetchedInfo.id]: fetchedInfo }));
            }

            // ALWAYS update rootFolders when we fetch root — regardless of which folder user is viewing
            if (fetchId === rootFolderId) {
                setRootFolders(fetchedChildren);
            }

            // Guard against race conditions: only update the active view if user is still on this folder
            if (activeFolderIdRef.current === fetchId || (fetchId === rootFolderId && (activeFolderIdRef.current === -1 || activeFolderIdRef.current === 0))) {
                setFolders(fetchedChildren);
                setFiles(fetchedFiles);
                setLoading(false);
            }
        } catch (err) {
            if (err.response?.status === 401) {
                showToast("Session expired. Please log in again.", "error");
                navigate("/login");
            } else if (fetchId !== -1 && fetchId !== rootFolderId) {
                if (activeFolderIdRef.current === fetchId) {
                    localStorage.removeItem("currentFolderId");
                    setCurrentFolderId(rootFolderId !== -1 ? rootFolderId : -1);
                    setHistory([]);
                }
            } else {
                showToast(err.response?.data?.message || err.response?.data?.error || "Unable to fetch contents.", "error");
            }
        } finally {
            if (activeFolderIdRef.current === fetchId) {
                setLoading(false);
            }
        }
    }, [rootFolderId, navigate, addToCache, showToast]);

    // Pre-fetch folder contents silently on hover
    const prefetchFolder = useCallback(async (folderId) => {
        if (!folderId && folderId !== 0) return;
        const fetchId = (folderId === -1 || folderId === 0) ? (rootFolderId !== -1 ? rootFolderId : -1) : folderId;
        if (fetchId === -1 || fetchId === 0 || !fetchId) return;

        const existing = contentCacheRef.current[fetchId];
        if (existing && Date.now() - existing.timestamp < 30000) {
            return; // Cache is still fresh (less than 30s old)
        }

        try {
            const token = localStorage.getItem("accessToken");
            if (!token) return;
            const { data } = await axios.get(`api/folder/fetch/${fetchId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const fetchedChildren = data.children?.children || [];
            const fetchedFiles = data.children?.files || [];
            const fetchedInfo = data.children || null;

            addToCache(fetchedChildren);
            const entry = {
                folders: fetchedChildren,
                files: fetchedFiles,
                folderInfo: fetchedInfo,
                timestamp: Date.now()
            };
            contentCacheRef.current[fetchId] = entry;
            if (fetchId === rootFolderId) {
                contentCacheRef.current[-1] = entry;
            }
            saveCacheToStorage(contentCacheRef.current);
        } catch {
            // Silently ignore prefetch errors
        }
    }, [addToCache, rootFolderId]);

    const fetchUserProfile = useCallback(async () => {
        try {
            const token = localStorage.getItem("accessToken");
            if (!token) return;
            const { data } = await axios.get("api/auth/profile", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (data.user) {
                setUserProfile(data.user);
                const rId = data.user.rootFolderId || data.root;
                if (rId) {
                    setRootFolderId(rId);
                    localStorage.setItem("rootFolderId", rId);
                    setCurrentFolderId(prev => {
                        if (prev === -1 || prev === 0) {
                            fetchFolders(rId);
                            return rId;
                        } else {
                            // User is in a subfolder — still fetch root silently to populate
                            // rootFolders (needed for sidebar Projects list)
                            fetchFolders(rId, true);
                        }
                        return prev;
                    });
                }
            }
            fetchStorageBreakdown();
            fetchDashboardStats();
        } catch (err) {
            console.error("Failed to fetch user profile:", err);
        }
    }, [fetchStorageBreakdown, fetchDashboardStats, fetchFolders]);

    useEffect(() => {
        fetchUserProfile();
    }, [fetchUserProfile]);

    const isInitialMount = useRef(true);
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            const targetId = (currentFolderId && currentFolderId !== -1 && currentFolderId !== 0)
                ? currentFolderId
                : (rootFolderId && rootFolderId !== -1 ? rootFolderId : null);
            if (targetId) {
                fetchFolders(targetId);
            }
        }
    }, [currentFolderId, rootFolderId, fetchFolders]);

    useEffect(() => {
        localStorage.setItem("currentFolderId", currentFolderId);
        localStorage.setItem("folderHistory", JSON.stringify(history));
    }, [currentFolderId, history]);

    const handleFolderSelect = useCallback((folder) => {
        const targetId = (folder.id === -1 || folder.id === 0) ? (rootFolderId !== -1 ? rootFolderId : -1) : folder.id;
        activeFolderIdRef.current = targetId;

        if (targetId > 0) {
            setFoldersCache(prev => ({
                ...prev,
                [targetId]: { ...prev[targetId], ...folder, id: targetId },
            }));
        }

        // Instant synchronous state update if in cache
        const cached = contentCacheRef.current[targetId] || (targetId === rootFolderId ? contentCacheRef.current[-1] : null);
        if (cached) {
            setFolders(cached.folders || []);
            setFiles(cached.files || []);
            setLoading(false);
        } else {
            setFolders([]);
            setFiles([]);
            setLoading(true);
        }

        if (targetId === -1 || targetId === rootFolderId) {
            setCurrentFolderId(targetId);
            setHistory([]);
        } else {
            setCurrentFolderId(targetId);
            setHistory(rebuildHistory(targetId));
        }
        setSearchQuery("");
        fetchFolders(targetId, Boolean(cached));
    }, [fetchFolders, rebuildHistory, rootFolderId]);

    const goBack = useCallback(() => {
        if (history.length > 1) {
            const prevFolder = history[history.length - 2];
            handleFolderSelect(prevFolder);
        } else {
            handleFolderSelect({ id: rootFolderId !== -1 ? rootFolderId : -1, name: "Root" });
        }
    }, [history, handleFolderSelect, rootFolderId]);

    const createFolder = async (e) => {
        e.preventDefault();
        if (!folderName.trim()) return;
        try {
            const token = localStorage.getItem("accessToken");
            const targetPid = (currentFolderId === -1 || currentFolderId === 0) ? (rootFolderId !== -1 ? rootFolderId : null) : currentFolderId;
            await axios.post("api/folder/create", {
                name: folderName,
                pid: targetPid
            }, { headers: { Authorization: `Bearer ${token}` } });
            showToast("Folder created successfully", "success");
            setFolderName("");
            setShowCreator(false);
            invalidateCache(targetPid);
            if (targetPid !== rootFolderId) invalidateCache(rootFolderId);
            fetchFolders();
            fetchTreeSubfolders(targetPid || -1);
        } catch (err) {
            showToast(err.response?.data?.message || err.response?.data?.error || "Failed to create folder", "error");
        }
    };

    const deleteFolder = async (e, folderId) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure?")) return;
        try {
            const token = localStorage.getItem("accessToken");
            await axios.delete(`api/folder/delete/${folderId}`, { headers: { Authorization: `Bearer ${token}` } });
            showToast("Folder deleted successfully", "success");
            invalidateCache(currentFolderId);
            invalidateCache(rootFolderId);
            invalidateCache(folderId);
            fetchFolders();
            fetchTreeSubfolders(currentFolderId);
            fetchUserProfile();
        } catch (err) {
            showToast(err.response?.data?.message || err.response?.data?.error || "Failed to delete folder", "error");
        }
    };

    const deleteFile = async (e, fileId) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure?")) return;
        try {
            const token = localStorage.getItem("accessToken");
            await axios.delete(`api/file/delete/${fileId}`, { headers: { Authorization: `Bearer ${token}` } });
            showToast("File deleted successfully", "success");
            invalidateCache(currentFolderId);
            invalidateCache(rootFolderId);
            fetchFolders();
            fetchUserProfile();
        } catch (err) {
            showToast(err.response?.data?.message || err.response?.data?.error || "Failed to delete file", "error");
        }
    };

    const [previewItem, setPreviewItem] = useState(null);

    const inferMimeType = (fileName = "") => {
        const lower = (fileName || "").toLowerCase();
        if (lower.endsWith(".pdf")) return "application/pdf";
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".gif")) return "image/gif";
        if (lower.endsWith(".webp")) return "image/webp";
        if (lower.endsWith(".svg")) return "image/svg+xml";
        if (lower.endsWith(".mp4")) return "video/mp4";
        if (lower.endsWith(".webm")) return "video/webm";
        if (lower.endsWith(".mov")) return "video/quicktime";
        if (lower.endsWith(".mp3")) return "audio/mpeg";
        if (lower.endsWith(".wav")) return "audio/wav";
        if (lower.endsWith(".ogg")) return "audio/ogg";
        if (lower.endsWith(".txt")) return "text/plain";
        if (lower.endsWith(".json")) return "application/json";
        if (lower.endsWith(".js") || lower.endsWith(".jsx")) return "text/javascript";
        if (lower.endsWith(".ts") || lower.endsWith(".tsx")) return "text/typescript";
        if (lower.endsWith(".html") || lower.endsWith(".htm")) return "text/html";
        if (lower.endsWith(".css")) return "text/css";
        if (lower.endsWith(".md")) return "text/markdown";
        return "application/octet-stream";
    };

    const previewFile = async (e, file) => {
        if (e && typeof e.stopPropagation === 'function') e.stopPropagation();

        // Defensively normalize target file object or identifier
        let target = file;
        if (!target && e) {
            if (e.id) target = e;
            else if (typeof e === 'number' || typeof e === 'string') target = { id: e };
        }

        if (!target || !target.id) {
            console.warn("previewFile called without a valid file object:", { e, file });
            return;
        }

        try {
            const token = localStorage.getItem("accessToken");
            const res = await axios.get(`api/file/preview/${target.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data?.success && res.data?.data?.url) {
                const { url, mimeType, orgName, size } = res.data.data;
                const fileName = orgName || target.orgName || target.name || "File";
                const inferredMime = mimeType || target.mimeType || inferMimeType(fileName);
                setPreviewItem({
                    file: {
                        ...target,
                        orgName: fileName,
                        size: size || target.size || 0,
                        mimeType: inferredMime
                    },
                    url,
                    mimeType: inferredMime,
                    isSignedUrl: true
                });
            } else {
                throw new Error("Invalid preview data received from server");
            }
        } catch (err) {
            console.error("Preview error:", err);
            showToast(err.response?.data?.message || err.response?.data?.Error || "Failed to load file preview", "error");
        }
    };

    const closePreview = () => {
        if (previewItem?.url && !previewItem?.isSignedUrl) {
            window.URL.revokeObjectURL(previewItem.url);
        }
        setPreviewItem(null);
    };

    const downloadFile = async (e, fileId, orgName) => {
        if (e) e.stopPropagation();
        try {
            const token = localStorage.getItem("accessToken");
            const res = await axios.get(`api/file/download/${fileId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const downloadUrl = res.data?.data?.downloadUrl || res.data?.url;
            const fileName = res.data?.data?.orgName || res.data?.name || orgName || "download";

            if (!downloadUrl) throw new Error("No download URL received.");

            // Direct native browser download from Firebase Storage signed URL
            const link = document.createElement("a");
            link.href = downloadUrl;
            link.setAttribute("download", fileName);
            link.style.display = "none";
            document.body.appendChild(link);
            link.click();
            link.remove();

            showToast("Download started successfully", "success");
        } catch (err) {
            console.error("Download error:", err);
            showToast("Failed to download file", "error");
        }
    };

    const [shareModalItem, setShareModalItem] = useState(null);

    const openShareModal = useCallback((itemOrId) => {
        if (typeof itemOrId === "object" && itemOrId !== null) {
            setShareModalItem(itemOrId);
        } else if (typeof itemOrId === "number" || typeof itemOrId === "string") {
            const foundFile = files.find(f => f.id === Number(itemOrId));
            setShareModalItem(foundFile || { id: Number(itemOrId), orgName: "File" });
        }
    }, [files]);

    const closeShareModal = useCallback(() => {
        setShareModalItem(null);
    }, []);

    const shareFile = useCallback((fileId) => {
        openShareModal(fileId);
    }, [openShareModal]);

    const handleRenameSubmit = async (e, id, type) => {
        e.preventDefault();
        if (!renameValue.trim()) return;
        try {
            const token = localStorage.getItem("accessToken");
            const endpoint = type === 'folder' ? `api/folder/rename/${id}` : `api/file/rename/${id}`;
            await axios.patch(endpoint, { newName: renameValue }, { headers: { Authorization: `Bearer ${token}` } });
            showToast(`${type} renamed successfully`, "success");
            invalidateCache(currentFolderId);
            invalidateCache(rootFolderId);
            invalidateCache(id);
            if (type === 'folder') fetchTreeSubfolders(currentFolderId);
            setEditingItem(null);
            fetchFolders();
        } catch (err) {
            showToast(err.response?.data?.message || err.response?.data?.error || `Failed to rename ${type}`, "error");
        }
    };

    const moveItemToFolder = async (item, targetFolderId) => {
        if (!item || !item.id || !item.type) return;

        let targetPid = (targetFolderId === -1 || targetFolderId === 0) ? (rootFolderId !== -1 ? rootFolderId : 0) : Number(targetFolderId);

        if (item.type === 'file' && targetPid === 0) {
            showToast("Files cannot be moved to Root folder.", "error");
            return;
        }

        if (item.type === 'folder' && item.id === targetPid) {
            showToast("Cannot move a folder into itself.", "error");
            return;
        }

        try {
            const token = localStorage.getItem("accessToken");
            const endpoint = item.type === 'folder'
                ? `api/folder/move/${item.id}/${targetPid}`
                : `api/file/move/${item.id}/${targetPid}`;

            await axios.patch(endpoint, {}, { headers: { Authorization: `Bearer ${token}` } });
            showToast(`Moved "${item.name || 'item'}" successfully`, "success");

            invalidateCache(currentFolderId);
            invalidateCache(targetFolderId);
            invalidateCache(rootFolderId);

            fetchTreeSubfolders(-1);
            if (currentFolderId > 0) fetchTreeSubfolders(currentFolderId);
            if (targetFolderId > 0 && targetFolderId !== currentFolderId) fetchTreeSubfolders(targetFolderId);
            setMovingItem(null);
            fetchFolders();
        } catch (err) {
            showToast(err.response?.data?.message || err.response?.data?.error || "Failed to move item", "error");
        }
    };

    const executeMove = async () => {
        if (!movingItem) return;
        await moveItemToFolder(movingItem, currentFolderId);
    };

    async function uploadFile(file, signedUrl) {
        const response = await fetch(signedUrl, {
            method: "PUT",
            headers: {
                "Content-Type": file.type || "application/octet-stream"
            },
            body: file
        });

        if (!response.ok) {
            throw new Error("Failed to upload file to Firebase");
        }
    }

    const handleFileUpload = async (file, targetFolderId = null) => {
        if (!file) return;
        let destId = targetFolderId || currentFolderId;
        if (destId === -1 || destId === 0) {
            destId = rootFolderId !== -1 ? rootFolderId : -1;
        }
        setIsUploading(true);
        const uploadData = {
            'fileName': file.name,
            'fileSize': file.size,
            'mimeType': file.type || "application/octet-stream",
            'folderId': destId
        };
        try {
            const token = localStorage.getItem("accessToken");
            const response = await axios.post("api/file/upload", uploadData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const { signedUrl, stoName } = response.data.data;
            await uploadFile(file, signedUrl);
            await axios.post("api/file/upload/complete", { stoName }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            showToast(`File "${file.name}" uploaded successfully`, "success");
            invalidateCache(destId);
            invalidateCache(currentFolderId);
            invalidateCache(rootFolderId);
            fetchFolders();
            fetchUserProfile();
        } catch (err) {
            showToast(err.response?.data?.error || err.response?.data?.message || "File upload failed", "error");
        } finally {
            setIsUploading(false);
        }
    };

    const toggleFolderExpand = useCallback(async (folderId, e) => {
        if (e && typeof e.stopPropagation === 'function') {
            e.stopPropagation();
        }
        const rootIdKey = rootFolderId !== -1 ? rootFolderId : -1;
        const isRootTarget = folderId === -1 || folderId === 0 || folderId === rootIdKey;
        const targetId = isRootTarget ? rootIdKey : folderId;

        const currentVal = expandedFolders[targetId] !== undefined
            ? expandedFolders[targetId]
            : (expandedFolders[-1] !== undefined ? expandedFolders[-1] : isRootTarget);
        const newVal = !currentVal;

        setExpandedFolders(prev => ({
            ...prev,
            [targetId]: newVal,
            ...(isRootTarget ? { "-1": newVal } : {})
        }));

        if (newVal && !treeNodes[targetId]) {
            await fetchTreeSubfolders(targetId);
        }
    }, [expandedFolders, treeNodes, fetchTreeSubfolders, rootFolderId]);

    const refreshAfterSharedAction = useCallback(async () => {
        invalidateCache();
        // Always refresh root so sidebar sharedFolders stays in sync
        await fetchFolders(rootFolderId !== -1 ? rootFolderId : currentFolderId);
        if (currentFolderId !== rootFolderId && currentFolderId > 0) {
            await fetchFolders(currentFolderId);
        }
        await fetchTreeSubfolders(-1);
        if (currentFolderId > 0) {
            await fetchTreeSubfolders(currentFolderId);
        }
        fetchUserProfile();
    }, [currentFolderId, rootFolderId, fetchFolders, fetchTreeSubfolders, fetchUserProfile, invalidateCache]);

    const currentFolderInfo = currentFolderId > 0 ? foldersCache[currentFolderId] : null;

    useEffect(() => {
        const query = searchQuery.trim();

        if (!query) {
            setSearchResult({
                folders: [],
                files: []
            });
            setSearchLoading(false);
            setSearchError(null);
            return;
        }

        setSearchLoading(true);
        setSearchError(null);

        const controller = new AbortController();

        const timer = setTimeout(async () => {
            try {
                const response = await axios.get(`api/folder/search/${encodeURIComponent(query)}`, {
                    signal: controller.signal
                });
                if (!controller.signal.aborted) {
                    setSearchResult(response.data?.result || { folders: [], files: [] });
                    setSearchError(null);
                    setSearchLoading(false);
                }
            } catch (error) {
                if (axios.isCancel(error) || error?.name === "CanceledError" || controller.signal.aborted) {
                    return;
                }
                console.error("search failed: ", error);
                setSearchError("Unable to search right now. Please try again.");
                setSearchResult({
                    folders: [],
                    files: []
                });
                setSearchLoading(false);
            }
        }, 300);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [searchQuery]);

    const isRootContext = currentFolderId === -1 || currentFolderId === 0 || currentFolderId === rootFolderId;

    // Filter files and folders based on searchQuery and active folder context
    const filteredFolders = searchQuery.trim()
        ? searchResult.folders
        : isRootContext
            ? folders.filter(f => !f.isShared)
            : folders;

    const filteredFiles = searchQuery.trim()
        ? searchResult.files
        : files;

    return {
        folders, files, rootFolders, filteredFolders, filteredFiles, userProfile, storageBreakdown, dashboardStats, searchQuery, setSearchQuery,
        searchLoading, searchError,
        rootFolderId, currentFolderId, history, folderName, setFolderName,
        loading, isUploading, isDragging, setIsDragging, showCreator, setShowCreator,
        editingItem, setEditingItem, renameValue, setRenameValue, movingItem, setMovingItem,
        previewItem, previewFile, closePreview,
        toasts, expandedFolders, treeNodes, foldersCache, currentFolderInfo,
        createFolder, deleteFolder, deleteFile,
        downloadFile, shareFile, openShareModal, closeShareModal, shareModalItem, handleRenameSubmit, executeMove, moveItemToFolder, handleFileUpload,
        handleFolderSelect, prefetchFolder, invalidateCache, toggleFolderExpand, goBack, refreshAfterSharedAction, showToast
    };
}