import React, { useEffect } from "react";
import { DownloadIcon, ShareIcon, MoveIcon, RenameIcon, DeleteIcon } from "./ActionIcons";

const getIcon = (type) => {
    switch (type) {
        case 'download': return <DownloadIcon size={22} />;
        case 'share': return <ShareIcon size={22} />;
        case 'move': return <MoveIcon size={22} />;
        case 'rename': return <RenameIcon size={22} />;
        case 'delete': return <DeleteIcon size={22} />;
        default: return null;
    }
};

export default function ActionBottomSheet({ activeItem, onClose }) {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    if (!activeItem) return null;

    const { name, actions } = activeItem;

    return (
        <div className="bottom-sheet-backdrop" onClick={onClose}>
            <div className="bottom-sheet-container" onClick={(e) => e.stopPropagation()}>
                <div className="bottom-sheet-handle"></div>

                <div className="bottom-sheet-header">
                    <span className="bottom-sheet-title">{name}</span>
                    <button type="button" className="bottom-sheet-close" onClick={onClose}>✕</button>
                </div>

                <div className="bottom-sheet-actions">
                    {actions.map((act, idx) => (
                        <button
                            key={idx}
                            type="button"
                            className={`bottom-sheet-btn ${act.danger ? 'danger' : ''}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                onClose();
                                act.onClick(e);
                            }}
                        >
                            <span className="sheet-btn-icon">{act.icon || getIcon(act.type)}</span>
                            <span className="sheet-btn-label">{act.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
