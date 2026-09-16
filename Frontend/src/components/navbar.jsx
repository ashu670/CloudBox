import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import ThemeToggle from "./ThemeToggle";
import { formatBytes } from "../utils/formatters";

export default function Navbar({ searchQuery, setSearchQuery, userProfile, onToggleSidebar, storagePercent }) {
    const location = useLocation();
    const navigate = useNavigate();
    const isAuthenticated = !!localStorage.getItem("accessToken");
    const [avatarOpen, setAvatarOpen] = useState(false);
    const dropdownRef = useRef(null);

    const handleLogout = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("currentFolderId");
        localStorage.removeItem("rootFolderId");
        localStorage.removeItem("folderHistory");
        setAvatarOpen(false);
        navigate("/");
    };

    const isDashboard = location.pathname === "/dashboard";

    // Close dropdown on outside click
    useEffect(() => {
        if (!avatarOpen) return;
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setAvatarOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [avatarOpen]);

    const pct = Math.min(storagePercent || 0, 100);
    const usedStorage = userProfile?.usedStorage != null ? Number(userProfile.usedStorage) : 0;
    const storageLimit = userProfile?.storageLimit != null ? Number(userProfile.storageLimit) : 0;
    const usedLabel = `${formatBytes(usedStorage)} of ${storageLimit > 0 ? formatBytes(storageLimit) : "10 GB"}`;

    const displayName = userProfile?.name || (userProfile?.email ? userProfile.email.split("@")[0] : "User");
    const avatarInitials = userProfile?.name
        ? userProfile.name.split(" ").filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase()
        : (userProfile?.email ? userProfile.email.slice(0, 2).toUpperCase() : "U");

    return (
        <header className="topbar">
            <div className="topbar-left">
                {isDashboard && onToggleSidebar && (
                    <button type="button" className="mobile-menu-btn" onClick={onToggleSidebar} title="Toggle Sidebar">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="3" y1="12" x2="21" y2="12" />
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <line x1="3" y1="18" x2="21" y2="18" />
                        </svg>
                    </button>
                )}

                <div className="topbar-brand">
                    <Link to="/" className="brand-link">
                        <svg className="cloudbox-logo" viewBox="0 0 24 24">
                            <path fill="#6366f1" d="M19.35,10.03C18.67,6.59 15.64,4 12,4C9.11,4 6.6,5.64 5.35,8.03C2.34,8.36 0,10.9 0,14C0,17.1 2.9,20 6,20H19C21.76,20 24,17.76 24,15C24,12.36 21.95,10.22 19.35,10.03Z" />
                        </svg>
                        <span className="brand-name">CloudBox</span>
                    </Link>
                </div>
            </div>

            {(isDashboard || isAuthenticated) && setSearchQuery !== undefined && (
                <div className="topbar-search">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search files, folders, or projects..."
                        value={searchQuery || ""}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                    {searchQuery ? (
                        <button type="button" className="clear-search-btn" onClick={() => setSearchQuery("")}>
                            &times;
                        </button>
                    ) : (
                        <span className="search-shortcut-badge">Ctrl K</span>
                    )}
                </div>
            )}

            <div className="topbar-actions">
                {isDashboard && <ThemeToggle />}

                {isDashboard && (
                    <button type="button" className="nav-icon-btn notification-bell-btn" title="Notifications">
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                        <span className="bell-unread-dot"></span>
                    </button>
                )}

                {(isAuthenticated || isDashboard) ? (
                    <div className="user-avatar-wrapper" ref={dropdownRef}>
                        <button
                            type="button"
                            className="topbar-user-pill-btn"
                            title={displayName}
                            onClick={() => setAvatarOpen(prev => !prev)}
                            aria-expanded={avatarOpen}
                        >
                            <div className="topbar-avatar-circle">
                                {avatarInitials}
                            </div>
                            <div className="topbar-user-text-wrap">
                                <span className="topbar-user-name">{displayName}</span>
                                <span className="topbar-user-workspace">Personal workspace</span>
                            </div>
                            <svg className={`topbar-chevron ${avatarOpen ? 'open' : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </button>

                        {avatarOpen && (
                            <div className="avatar-dropdown">
                                <div className="avatar-dropdown-header">
                                    <span className="avatar-dropdown-name">{displayName}</span>
                                    {userProfile?.email && (
                                        <span className="avatar-dropdown-email">{userProfile.email}</span>
                                    )}
                                </div>

                                <div className="avatar-dropdown-storage">
                                    <div className="avatar-dropdown-storage-label">
                                        Storage — {pct}% used
                                    </div>
                                    <div className="avatar-storage-bar-track">
                                        <div className="avatar-storage-bar-fill" style={{ width: `${pct}%` }} />
                                    </div>
                                    <div className="avatar-storage-used">{usedLabel} used</div>
                                </div>

                                <div className="avatar-dropdown-menu">
                                    <button type="button" className="avatar-dropdown-item" disabled>
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                            <circle cx="12" cy="7" r="4" />
                                        </svg>
                                        Account Settings
                                    </button>
                                    <button type="button" className="avatar-dropdown-item danger" onClick={handleLogout}>
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                            <polyline points="16 17 21 12 16 7" />
                                            <line x1="21" y1="12" x2="9" y2="12" />
                                        </svg>
                                        Logout
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="topbar-auth-links">
                        <Link to="/login" className="btn btn-secondary btn-sm">Log in</Link>
                        <Link to="/signup" className="btn btn-primary btn-sm">Sign up</Link>
                    </div>
                )}
            </div>
        </header>
    );
}