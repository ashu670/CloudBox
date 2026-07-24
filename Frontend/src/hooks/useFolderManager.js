import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";

export function useFolderManager() {
    const [folders, setFolders] = useState([]);
    const [files, setFiles] = useState([]);
    const [currentFolderId, setCurrentFolderId] = useState(-1);
    const [history, setHistory] = useState([]);
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
            const fetchId = folderId === -1 ? -1 : folderId;
            const { data } = await axios.get(`api/folder/fetch/${fetchId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const fetchedChildren = data.children?.children || [];
            addToCache(fetchedChildren);
            setTreeNodes(prev => ({ ...prev, [folderId]: fetchedChildren }));
        } catch (err) {
            console.error("Error fetching tree subfolders:", err);
        }
    }, [addToCache]);

    const fetchFolders = useCallback(async (id = currentFolderId) => {
        setLoading(true);
        try {
            const token = localStorage.getItem("accessToken");
            const { data } = await axios.get(`api/folder/fetch/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFolders(data.children?.children || []);
            setFiles(data.children?.files || []);
            addToCache(data.children?.children || []);
            if (data.children && data.children.id !== null) {
                setFoldersCache(prev => ({ ...prev, [data.children.id]: data.children }));
            }
        } catch (err) {
            if (err.response?.status === 401 || err.response?.status === 403) {
                showToast("Session expired. Please log in again.", "error");
                navigate("/login");
            } else {
                showToast(err.response?.data?.error || "Unable to fetch contents.", "error");
            }
        } finally {
            setLoading(false);
        }
    }, [currentFolderId, navigate, addToCache, showToast]);

    const rebuildHistory = useCallback((folderId) => {
        const path = [];
        let currentId = folderId;
        while (currentId && currentId !== -1 && currentId !== 0) {
            const folder = foldersCache[currentId];
            if (!folder) break;
            path.unshift({ id: folder.id, name: folder.name, pid: folder.pid });
            currentId = folder.pid;
        }
        return path;
    }, [foldersCache]);

    useEffect(() => {
        fetchTreeSubfolders(-1);
    }, [fetchTreeSubfolders]);

    useEffect(() => {
        fetchFolders();
    }, [fetchFolders]);

    const handleFolderSelect = useCallback((folder) => {
        if (folder.id > 0) {
            setFoldersCache(prev => ({
                ...prev,
                [folder.id]: { ...prev[folder.id], ...folder },
            }));
        }
        if (folder.id === -1 || folder.id === 0) {
            setCurrentFolderId(-1);
            setHistory([]);
        } else {
            setCurrentFolderId(folder.id);
            setHistory(rebuildHistory(folder.id));
        }
    }, [rebuildHistory]);

    const createFolder = async (e) => {
        e.preventDefault();
        if (!folderName.trim()) return;
        try {
            const token = localStorage.getItem("accessToken");
            await axios.post("api/folder/create", {
                name: folderName,
                pid: currentFolderId === -1 ? null : currentFolderId
            }, { headers: { Authorization: `Bearer ${token}` } });
            showToast("Folder created successfully", "success");
            setFolderName("");
            setShowCreator(false);
            fetchFolders();
            fetchTreeSubfolders(currentFolderId);
        } catch (err) {
            showToast(err.response?.data?.error || "Failed to create folder", "error");
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
        } catch (err) {
            showToast(err.response?.data?.error || "Failed to delete folder", "error");
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
        } catch (err) {
            showToast(err.response?.data?.error || "Failed to delete file", "error");
        }
    };

    const downloadFile = async (e, fileId, orgName) => {
        e.stopPropagation();
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
            showToast(err.response?.data?.error || `Failed to rename ${type}`, "error");
        }
    };

    const executeMove = async () => {
        if (!movingItem) return;
        if (movingItem.type === 'file' && currentFolderId <= 0) {
            showToast("Files cannot be moved to root.", "error");
            return;
        }
        if (movingItem.type === 'folder' && movingItem.id === currentFolderId) {
            showToast("Cannot move a folder into itself.", "error");
            return;
        }
        try {
            const token = localStorage.getItem("accessToken");
            const targetPid = currentFolderId === -1 ? 0 : currentFolderId;
            const endpoint = movingItem.type === 'folder' 
                ? `api/folder/move/${movingItem.id}/${targetPid}` 
                : `api/file/move/${movingItem.id}/${targetPid}`;
            
            await axios.patch(endpoint, {}, { headers: { Authorization: `Bearer ${token}` } });
            showToast("Item moved successfully", "success");
            if (movingItem.type === 'folder') {
                fetchTreeSubfolders(-1);
                fetchTreeSubfolders(currentFolderId);
            }
            setMovingItem(null);
            fetchFolders();
        } catch (err) {
            showToast(err.response?.data?.error || "Failed to move item", "error");
        }
    };

    const handleFileUpload = async (file) => {
        if (!file) return;
        setIsUploading(true);
        if (currentFolderId <= 0) {
            showToast("Please open a folder first.", "error");
            setIsUploading(false);
            return;
        }
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folderId", currentFolderId);
        try {
            const token = localStorage.getItem("accessToken");
            await axios.post("api/file/upload", formData, {
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
            });
            showToast(`File "${file.name}" uploaded successfully`, "success");
            fetchFolders();
        } catch (err) {
            showToast(err.response?.data?.error || "File upload failed", "error");
        } finally {
            setIsUploading(false);
        }
    };

    const toggleFolderExpand = useCallback(async (folderId, e) => {
        e.stopPropagation();
        const isExpanded = expandedFolders[folderId];
        setExpandedFolders(prev => ({ ...prev, [folderId]: !isExpanded }));
        if (!isExpanded && !treeNodes[folderId]) {
            await fetchTreeSubfolders(folderId);
        }
    }, [expandedFolders, treeNodes, fetchTreeSubfolders]);

    const goBack = () => {
        const temp = [...history];
        temp.pop();
        setHistory(temp);
        setCurrentFolderId(temp.length === 0 ? -1 : temp[temp.length - 1].id);
    };

    const refreshAfterSharedAction = useCallback(async () => {
        await fetchFolders(currentFolderId);
        await fetchTreeSubfolders(-1);
        if (currentFolderId > 0) {
            await fetchTreeSubfolders(currentFolderId);
        }
    }, [currentFolderId, fetchFolders, fetchTreeSubfolders]);

    const currentFolderInfo = currentFolderId > 0 ? foldersCache[currentFolderId] : null;

    return {
        folders, files, currentFolderId, history, folderName, setFolderName,
        loading, isUploading, isDragging, setIsDragging, showCreator, setShowCreator,
        editingItem, setEditingItem, renameValue, setRenameValue, movingItem, setMovingItem,
        toasts, expandedFolders, treeNodes, foldersCache, currentFolderInfo,
        createFolder, deleteFolder, deleteFile,
        downloadFile, handleRenameSubmit, executeMove, handleFileUpload,
        handleFolderSelect, toggleFolderExpand, goBack, refreshAfterSharedAction
    };
}