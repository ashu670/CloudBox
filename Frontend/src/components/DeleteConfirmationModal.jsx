import React, { useEffect } from "react";
import { lockBodyScroll, unlockBodyScroll } from "../utils/scrollLock";

export default function DeleteConfirmationModal({
    isOpen,
    item,
    type = "folder",
    containsFiles = false,
    isPermanent = false,
    isDeleting = false,
    onClose,
    onConfirm
}) {
    useEffect(() => {
        if (!isOpen) return;
        lockBodyScroll();
        const handleKeyDown = (e) => {
            if (e.key === "Escape" && !isDeleting) {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            unlockBodyScroll();
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, isDeleting, onClose]);

    if (!isOpen || !item) return null;

    const itemName = item.name || item.orgName || (type === "folder" ? "Folder" : "File");

    const getModalTitle = () => {
        if (containsFiles) return "Folder contains files";
        if (isPermanent) return `Permanently delete ${type === "folder" ? "folder" : "file"}?`;
        return `Delete ${type === "folder" ? "folder" : "file"}?`;
    };

    const getConfirmButtonText = () => {
        if (isDeleting) {
            return (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                    <span className="spinner" style={{ width: "14px", height: "14px", borderWidth: "2px" }}></span>
                    <span>Deleting...</span>
                </span>
            );
        }
        if (containsFiles) return "Delete Anyway";
        if (isPermanent) return "Delete Forever";
        return "Delete";
    };

    return (
        <div className="file-preview-modal-backdrop" onClick={() => !isDeleting && onClose()}>
            <div
                className="file-preview-modal-card custom-modal-card cb-delete-confirm-card"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                style={{ maxWidth: "440px", width: "90%" }}
            >
                <div className="cb-delete-modal-top">
                    <div className={`cb-delete-modal-icon-wrap ${containsFiles ? "warning" : "danger"}`}>
                        {containsFiles ? (
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                <line x1="12" y1="9" x2="12" y2="13" />
                                <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                        ) : (
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                <line x1="10" y1="11" x2="10" y2="17" />
                                <line x1="14" y1="11" x2="14" y2="17" />
                            </svg>
                        )}
                    </div>
                    <button
                        type="button"
                        className="preview-close-btn"
                        onClick={onClose}
                        disabled={isDeleting}
                        aria-label="Close modal"
                    >
                        ✕
                    </button>
                </div>

                <div className="cb-delete-modal-content">
                    <h2 className="cb-delete-modal-title">
                        {getModalTitle()}
                    </h2>
                    <p className="cb-delete-modal-desc">
                        {containsFiles ? (
                            <>
                                <strong>"{itemName}"</strong> contains files or subfolders. Do you still want to delete it and move all its contents to trash?
                            </>
                        ) : isPermanent ? (
                            <>
                                Are you sure you want to permanently delete <strong>"{itemName}"</strong>? This item will be removed forever and cannot be restored.
                            </>
                        ) : (
                            <>
                                Are you sure you want to delete <strong>"{itemName}"</strong>? You can restore it later from Trash.
                            </>
                        )}
                    </p>
                </div>

                <div className="cb-delete-modal-actions">
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={onClose}
                        disabled={isDeleting}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className={`btn ${containsFiles ? "btn-danger-force" : "btn-danger"}`}
                        onClick={() => onConfirm(containsFiles)}
                        disabled={isDeleting}
                        autoFocus
                    >
                        {getConfirmButtonText()}
                    </button>
                </div>
            </div>
        </div>
    );
}
