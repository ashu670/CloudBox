import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";

export function useFolderManager() {
    const [folders, setFolders] = useState([]);
    const [files, setFiles] = useState([]);
    const [userProfile, setUserProfile] = useState(null);
    const [storageBreakdown, setStorageBreakdown] = useState({ image: 0, video: 0, audio: 0, document: 0 });
    const [searchQuery, setSearchQuery] = useState("");
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

    const navigate = useNavigate();

    const showToast = useCallback((message, type = "success") => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    }, []);

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
                    setCurrentFolderId(prev => (prev === -1 || prev === 0 ? rId : prev));
                }
            }
            fetchStorageBreakdown();
        } catch (err) {
            console.error("Failed to fetch user profile:", err);
        }
    }, [fetchStorageBreakdown]);

    const addToCache = useCallback((folderList) => {
        if (!folderList || !Array.isArray(folderList)) return;
        setFoldersCache(prev => {
            const next = { ...prev };
            folderList.forEach(f => { next[f.id] = f; });
            return next;
        });
    }, []);

    const fetchTreeSubfolders = useCallback(async (folderId) => {
        try {
            const token = localStorage.getItem("accessToken");
            const fetchId = (folderId === -1 && rootFolderId !== -1) ? rootFolderId : folderId;
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


    const fetchFolders = useCallback(async (id = currentFolderId) => {
        setLoading(true);
        try {
            const token = localStorage.getItem("accessToken");
            const fetchId = (id === -1 && rootFolderId !== -1) ? rootFolderId : id;
            const { data } = await axios.get(`api/folder/fetch/${fetchId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFolders(data.children?.children || []);
            setFiles(data.children?.files || []);
            addToCache(data.children?.children || []);
            if (data.children && data.children.id !== null) {
                setFoldersCache(prev => ({ ...prev, [data.children.id]: data.children }));
            }
        } catch (err) {
            if (err.response?.status === 401) {
                showToast("Session expired. Please log in again.", "error");
                navigate("/login");
            } else {
                showToast(err.response?.data?.message || err.response?.data?.error || "Unable to fetch contents.", "error");
            }
        } finally {
            setLoading(false);
        }
    }, [currentFolderId, rootFolderId, navigate, addToCache, showToast]);

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

    useEffect(() => {
        fetchUserProfile();
        fetchTreeSubfolders(-1);
    }, [fetchUserProfile, fetchTreeSubfolders]);

    useEffect(() => {
        fetchFolders();
    }, [fetchFolders]);

    useEffect(() => {
        localStorage.setItem("currentFolderId", currentFolderId);
        localStorage.setItem("folderHistory", JSON.stringify(history));
    }, [currentFolderId, history]);

    const handleFolderSelect = useCallback((folder) => {
        const targetId = (folder.id === -1 || folder.id === 0) ? (rootFolderId !== -1 ? rootFolderId : -1) : folder.id;
        if (targetId > 0) {
            setFoldersCache(prev => ({
                ...prev,
                [targetId]: { ...prev[targetId], ...folder, id: targetId },
            }));
        }
        if (targetId === -1 || targetId === rootFolderId) {
            setCurrentFolderId(targetId);
            setHistory([]);
        } else {
            setCurrentFolderId(targetId);
            setHistory(rebuildHistory(targetId));
        }
    }, [rebuildHistory, rootFolderId]);

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
            fetchFolders();
            fetchUserProfile();
        } catch (err) {
            showToast(err.response?.data?.message || err.response?.data?.error || "Failed to delete file", "error");
        }
    };

    const [previewItem, setPreviewItem] = useState(null);

    const previewFile = async (e, file) => {
        if (e) e.stopPropagation();
        try {
            const token = localStorage.getItem("accessToken");
            const response = await axios.get(`api/file/download/${file.id}`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: "blob"
            });
            const url = window.URL.createObjectURL(new Blob([response.data], { type: file.mimeType }));
            setPreviewItem({ file, url, mimeType: file.mimeType });
        } catch (err) {
            console.error("Preview error:", err);
            showToast("Failed to load file preview", "error");
        }
    };

    const closePreview = () => {
        if (previewItem?.url) {
            window.URL.revokeObjectURL(previewItem.url);
        }
        setPreviewItem(null);
    };

    const downloadFile = async (e, fileId, orgName) => {
        if (e) e.stopPropagation();
        try {
            const token = localStorage.getItem("accessToken");
            const response = await axios.get(`api/file/download/${fileId}`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: "blob"
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", orgName);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
            showToast("Download started successfully", "success");
        } catch (err) {
            console.error("Download error:", err);
            showToast("Failed to download file", "error");
        }
    };

    const handleRenameSubmit = async (e, id, type) => {
        e.preventDefault();
        if (!renameValue.trim()) return;
        try {
            const token = localStorage.getItem("accessToken");
            const endpoint = type === 'folder' ? `api/folder/rename/${id}` : `api/file/rename/${id}`;
            await axios.patch(endpoint, { newName: renameValue }, { headers: { Authorization: `Bearer ${token}` } });
            showToast(`${type} renamed successfully`, "success");
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
            'fileName' : file.name,
            'fileSize' : file.size,
            'mimeType' : file.type || "application/octet-stream",
            'folderId' : destId
        };
        try {
            const token = localStorage.getItem("accessToken");
            const response = await axios.post("api/file/upload", uploadData, {
                headers: { Authorization: `Bearer ${token}`}
            });
            const {signedUrl, stoName} = response.data.data;
            await uploadFile(file, signedUrl);
            await axios.post("api/file/upload/complete", {stoName}, {
                headers: {Authorization: `Bearer ${token}`}
            });

            showToast(`File "${file.name}" uploaded successfully`, "success");
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

    const goBack = () => {
        const temp = [...history];
        temp.pop();
        setHistory(temp);
        const targetId = temp.length === 0 ? (rootFolderId !== -1 ? rootFolderId : -1) : temp[temp.length - 1].id;
        setCurrentFolderId(targetId);
    };

    const refreshAfterSharedAction = useCallback(async () => {
        await fetchFolders(currentFolderId);
        await fetchTreeSubfolders(-1);
        if (currentFolderId > 0) {
            await fetchTreeSubfolders(currentFolderId);
        }
        fetchUserProfile();
    }, [currentFolderId, fetchFolders, fetchTreeSubfolders, fetchUserProfile]);

    const currentFolderInfo = currentFolderId > 0 ? foldersCache[currentFolderId] : null;

    // Filter files and folders based on searchQuery
    const filteredFolders = searchQuery.trim() 
        ? folders.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
        : folders;

    const filteredFiles = searchQuery.trim()
        ? files.filter(f => f.orgName.toLowerCase().includes(searchQuery.toLowerCase()))
        : files;

    return {
        folders, files, filteredFolders, filteredFiles, userProfile, storageBreakdown, searchQuery, setSearchQuery,
        rootFolderId, currentFolderId, history, folderName, setFolderName,
        loading, isUploading, isDragging, setIsDragging, showCreator, setShowCreator,
        editingItem, setEditingItem, renameValue, setRenameValue, movingItem, setMovingItem,
        previewItem, previewFile, closePreview,
        toasts, expandedFolders, treeNodes, foldersCache, currentFolderInfo,
        createFolder, deleteFolder, deleteFile,
        downloadFile, handleRenameSubmit, executeMove, moveItemToFolder, handleFileUpload,
        handleFolderSelect, toggleFolderExpand, goBack, refreshAfterSharedAction, showToast
    };
}