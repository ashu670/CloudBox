import { Link, useLocation, useNavigate } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

export default function Navbar({ searchQuery, setSearchQuery, userProfile, onToggleSidebar }) {
    const location = useLocation();
    const navigate = useNavigate();
    const isAuthenticated = !!localStorage.getItem("accessToken");

    const handleLogout = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("currentFolderId");
        localStorage.removeItem("folderHistory");
        navigate("/login");
    };

    const isDashboard = location.pathname === "/dashboard";

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
                    <Link to="/dashboard" className="brand-link">
                        <svg className="cloudbox-logo" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M19.35,10.03C18.67,6.59 15.64,4 12,4C9.11,4 6.6,5.64 5.35,8.03C2.34,8.36 0,10.9 0,14C0,17.1 2.9,20 6,20H19C21.76,20 24,17.76 24,15C24,12.36 21.95,10.22 19.35,10.03Z" />
                        </svg>
                        <span className="brand-name">CloudBox</span>
                    </Link>
                </div>
            </div>

            {isDashboard && isAuthenticated && setSearchQuery !== undefined && (
                <div className="topbar-search">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search files and folders..."
                        value={searchQuery || ""}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                    {searchQuery && (
                        <button type="button" className="clear-search-btn" onClick={() => setSearchQuery("")}>
                            &times;
                        </button>
                    )}
                </div>
            )}

            <div className="topbar-actions">
                <ThemeToggle />

                {isAuthenticated ? (
                    <div className="user-profile-menu">
                        {userProfile && (
                            <div className="user-avatar-badge" title={userProfile.email}>
                                {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : "U"}
                            </div>
                        )}
                        <button onClick={handleLogout} className="btn-logout">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <polyline points="16 17 21 12 16 7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                            <span>Log Out</span>
                        </button>
                    </div>
                ) : (
                    <div className="nav-links">
                        <Link to="/login" className={location.pathname === "/login" ? "active" : ""}>Log In</Link>
                        <Link to="/" className={`btn-signup ${location.pathname === "/" ? "active" : ""}`}>Sign Up</Link>
                    </div>
                )}
            </div>
        </header>
    );
}