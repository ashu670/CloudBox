import { useState, useRef, useEffect } from "react";

export default function ActionMenu({ items }) {
    const [open, setOpen] = useState(false);
    const [dropUp, setDropUp] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setOpen(false);
            }
        };

        if (open) {
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("touchstart", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, [open]);

    const handleToggle = (e) => {
        e.stopPropagation();
        if (!open && menuRef.current) {
            const rect = menuRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            // If less than 170px space below, pop upwards
            setDropUp(spaceBelow < 170);
        }
        setOpen(!open);
    };

    return (
        <div className="action-menu-container" ref={menuRef} onClick={(e) => e.stopPropagation()}>
            <button 
                type="button"
                className="action-dots-btn"
                onClick={handleToggle}
                title="Actions"
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="5" r="2" />
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="12" cy="19" r="2" />
                </svg>
            </button>

            {open && (
                <div className={`action-dropdown-menu ${dropUp ? 'drop-up' : ''}`}>
                    {items.map((item, idx) => (
                        <button
                            key={idx}
                            type="button"
                            className={`action-dropdown-item ${item.danger ? 'danger' : ''}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                setOpen(false);
                                item.onClick(e);
                            }}
                        >
                            <span className="dropdown-item-icon">{item.icon}</span>
                            <span>{item.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
