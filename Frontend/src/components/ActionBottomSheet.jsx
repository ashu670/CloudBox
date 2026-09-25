import React, { useEffect } from "react";
import { DownloadIcon, ShareIcon, MoveIcon, RenameIcon, DeleteIcon, OpenIcon, PreviewIcon } from "./ActionIcons";
import { lockBodyScroll, unlockBodyScroll } from "../utils/scrollLock";

const getIcon = (type) => {
    switch (type) {
        case 'open': return <OpenIcon size={20} />;
        case 'preview': return <PreviewIcon size={20} />;
        case 'download': return <DownloadIcon size={20} />;
        case 'share': return <ShareIcon size={20} />;
        case 'move': return <MoveIcon size={20} />;
        case 'rename': return <RenameIcon size={20} />;
        case 'delete': return <DeleteIcon size={20} />;
        default: return null;
    }
};

export default function ActionBottomSheet({ activeItem, onClose }) {
    useEffect(() => {
        if (!activeItem) return;
        lockBodyScroll();
        return () => {
            unlockBodyScroll();
        };
    }, [activeItem]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    if (!activeItem) return null;

    const { name, isFolder, isProject, actions, userRole } = activeItem;

    const getSubtitle = () => {
        if (isProject) {
            return userRole ? `${userRole} • Project Workspace Options` : "Project Options";
        }
        if (isFolder) {
            return userRole ? `${userRole} • Folder Options` : "Folder Options";
        }
        return userRole ? `${userRole} • File Options` : "File Options";
    };

    return (
        <div className="cb-action-modal-backdrop" onClick={onClose}>
            <div className="cb-action-modal-card" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="cb-action-modal-header">
                    <div className="cb-action-item-info">
                        <div className={`cb-action-type-badge ${isProject ? 'cb-action-project-badge' : isFolder ? 'folder-badge' : 'file-badge'}`}>
                            {isProject ? (
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                                    <path d="M3 7v10a3 3 0 003 3h12a3 3 0 003-3V9a3 3 0 00-3-3h-6l-2-2H6a3 3 0 00-3 3z" fill="#7c3aed" />
                                </svg>
                            ) : isFolder ? (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="#f59e0b">
                                    <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                                </svg>
                            ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                                    <polyline points="13 2 13 9 20 9" />
                                </svg>
                            )}
                        </div>
                        <div className="cb-action-header-texts">
                            <h3 className="cb-action-item-title" title={name}>{name}</h3>
                            <span className="cb-action-item-sub">{getSubtitle()}</span>
                        </div>
                    </div>
                    <button type="button" className="preview-close-btn" onClick={onClose} aria-label="Close menu">✕</button>
                </div>

                {/* Actions Grid */}
                <div className="cb-action-modal-list">
                    {actions.map((act, idx) => (
                        <button
                            key={idx}
                            type="button"
                            className={`cb-action-option-btn ${act.danger ? 'danger-action' : ''}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                onClose();
                                act.onClick(e);
                            }}
                        >
                            <span className="cb-action-icon-box">{act.icon || getIcon(act.type)}</span>
                            <div className="cb-action-label-box">
                                <span className="cb-action-label">{act.label}</span>
                            </div>
                            <span className="cb-action-chevron">&rsaquo;</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
