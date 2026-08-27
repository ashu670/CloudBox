import React, { useState } from "react";

export default function MoveItemModal({ movingItem, foldersCache, currentFolderId, onMove, onClose }) {
    const [selectedFolderId, setSelectedFolderId] = useState(currentFolderId <= 0 ? 0 : currentFolderId);

    if (!movingItem) return null;

    // Filter available destination folders (exclude movingItem if it's a folder)
    const availableFolders = Object.values(foldersCache || {}).filter(
        f => f && f.id && !(movingItem.type === 'folder' && f.id === movingItem.id)
    );

    return (
        <div className="file-preview-modal-backdrop" onClick={onClose}>
            <div className="file-preview-modal-card" style={{ maxWidth: "440px", padding: "20px" }} onClick={(e) => e.stopPropagation()}>
                <div className="preview-header">
                    <span className="preview-title" style={{ fontWeight: 600, fontSize: "16px" }}>Move "{movingItem.name}"</span>
                    <button className="preview-close-btn" onClick={onClose}>✕</button>
                </div>
                <div className="preview-body" style={{ display: "flex", flexDirection: "column", gap: "16px", paddingTop: "14px" }}>
                    <p style={{ fontSize: "13.5px", color: "var(--text-muted)", margin: 0 }}>
                        Choose destination folder:
                    </p>

                    <div className="folder-select-list" style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "240px", overflowY: "auto" }}>
                        {movingItem.type !== 'file' && (
                            <div 
                                className={`folder-select-item ${selectedFolderId === 0 ? 'selected' : ''}`}
                                onClick={() => setSelectedFolderId(0)}
                                style={{
                                    padding: "10px 14px",
                                    borderRadius: "8px",
                                    border: selectedFolderId === 0 ? "1px solid var(--accent-primary)" : "1px solid var(--border-color)",
                                    background: selectedFolderId === 0 ? "var(--accent-light)" : "var(--bg-app)",
                                    color: selectedFolderId === 0 ? "var(--accent-primary)" : "var(--text-main)",
                                    cursor: "pointer",
                                    fontWeight: 500,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px"
                                }}
                            >
                                📁 <span>Root Drive</span>
                            </div>
                        )}

                        {availableFolders.map(folder => (
                            <div 
                                key={folder.id}
                                className={`folder-select-item ${selectedFolderId === folder.id ? 'selected' : ''}`}
                                onClick={() => setSelectedFolderId(folder.id)}
                                style={{
                                    padding: "10px 14px",
                                    borderRadius: "8px",
                                    border: selectedFolderId === folder.id ? "1px solid var(--accent-primary)" : "1px solid var(--border-color)",
                                    background: selectedFolderId === folder.id ? "var(--accent-light)" : "var(--bg-app)",
                                    color: selectedFolderId === folder.id ? "var(--accent-primary)" : "var(--text-main)",
                                    cursor: "pointer",
                                    fontWeight: 500,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px"
                                }}
                            >
                                📁 <span>{folder.name}</span>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
                            Cancel
                        </button>
                        <button 
                            type="button" 
                            className="btn btn-primary btn-sm" 
                            onClick={() => onMove(selectedFolderId)}
                        >
                            Move Here
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
