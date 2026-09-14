<<<<<<< HEAD
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut, LayoutDashboard, Menu, X, UserPlus, LogIn } from "lucide-react";

export default function Navbar() {
    const location = useLocation();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);
=======
import { Link, useLocation, useNavigate } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

export default function Navbar({ searchQuery, setSearchQuery, userProfile, onToggleSidebar }) {
    const location = useLocation();
    const navigate = useNavigate();
>>>>>>> main
    const isAuthenticated = !!localStorage.getItem("accessToken");

    const handleLogout = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("currentFolderId");
<<<<<<< HEAD
        localStorage.removeItem("folderHistory");
        navigate("/login");
    };

    const isLanding = location.pathname === "/";

    return (
        <nav className="navbar-wrapper">
            <div className="navbar-container">
                {/* Ultra-Premium Geometric Brand Logo */}
                <Link to="/" className="nav-brand" onClick={() => setMobileOpen(false)}>
                    <div className="brand-logo-container">
                        <div className="brand-icon-wrapper">
                            <svg className="brand-svg-icon" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <defs>
                                    <linearGradient id="cbGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#c084fc" />
                                        <stop offset="50%" stopColor="#8b5cf6" />
                                        <stop offset="100%" stopColor="#4f46e5" />
                                    </linearGradient>
                                    <linearGradient id="cbGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#38bdf8" />
                                        <stop offset="100%" stopColor="#6366f1" />
                                    </linearGradient>
                                </defs>
                                <path d="M20 4L34 12V28L20 36L6 28V12L20 4Z" fill="url(#cbGrad1)" fillOpacity="0.2" stroke="url(#cbGrad1)" strokeWidth="1.5" />
                                <path d="M20 4L34 12L20 20L6 12L20 4Z" fill="url(#cbGrad1)" fillOpacity="0.6" />
                                <path d="M6 12L20 20V36L6 28V12Z" fill="url(#cbGrad2)" fillOpacity="0.4" />
                                <path d="M34 12L20 20V36L34 28V12Z" fill="url(#cbGrad1)" fillOpacity="0.85" />
                                <circle cx="20" cy="20" r="4.5" fill="#ffffff" filter="drop-shadow(0 0 6px #22d3ee)" />
                            </svg>
                            <div className="brand-icon-sparkle"></div>
                        </div>
                    </div>
                    <div className="brand-name-group">
                        <span className="brand-title">Cloud<span className="brand-gradient-text">Box</span></span>
                        <span className="brand-pro-tag">ENTERPRISE</span>
                    </div>
                </Link>

                {/* Desktop Links */}
                <div className="nav-center-links">
                    {isLanding ? (
                        <>
                            <a href="#features" className="nav-link">Features</a>
                            <a href="#workflow" className="nav-link">Workflow</a>
                            <a href="#comparison" className="nav-link">Comparison</a>
                            <a href="#faq" className="nav-link">FAQ</a>
                        </>
                    ) : (
                        <Link to="/" className="nav-link">Home</Link>
                    )}
                </div>

                {/* Right Action CTAs */}
                <div className="nav-right-actions">
                    {isAuthenticated ? (
                        <>
                            <Link
                                to="/dashboard"
                                className={`btn ${location.pathname === "/dashboard" ? "btn-primary" : "btn-secondary"} btn-sm`}
                            >
                                <LayoutDashboard size={15} /> Dashboard
                            </Link>
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="btn btn-secondary btn-sm"
                                title="Sign out of account"
                            >
                                <LogOut size={15} /> Log Out
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                to="/login"
                                className={`btn ${location.pathname === "/login" ? "btn-primary" : "btn-secondary"} btn-sm`}
                            >
                                <LogIn size={15} /> Sign In
                            </Link>
                            <Link
                                to="/signup"
                                className="btn btn-primary btn-sm btn-glow"
                            >
                                <UserPlus size={15} /> Get Started
                            </Link>
                        </>
                    )}

                    {/* Mobile Hamburger Toggle */}
                    <button
                        type="button"
                        className="mobile-menu-btn"
                        onClick={() => setMobileOpen(!mobileOpen)}
                        aria-label="Toggle navigation menu"
                    >
                        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Dropdown Menu */}
            {mobileOpen && (
                <div className="mobile-menu-dropdown">
                    {isLanding && (
                        <>
                            <a href="#features" className="nav-link" onClick={() => setMobileOpen(false)}>Features</a>
                            <a href="#workflow" className="nav-link" onClick={() => setMobileOpen(false)}>Workflow</a>
                            <a href="#comparison" className="nav-link" onClick={() => setMobileOpen(false)}>Comparison</a>
                            <a href="#faq" className="nav-link" onClick={() => setMobileOpen(false)}>FAQ</a>
                        </>
                    )}
                    {isAuthenticated ? (
                        <>
                            <Link to="/dashboard" className="btn btn-primary btn-sm" onClick={() => setMobileOpen(false)}>
                                <LayoutDashboard size={15} /> Dashboard
                            </Link>
                            <button type="button" onClick={() => { setMobileOpen(false); handleLogout(); }} className="btn btn-secondary btn-sm">
                                <LogOut size={15} /> Log Out
                            </button>
                        </>
                    ) : (
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <Link to="/login" className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => setMobileOpen(false)}>
                                Sign In
                            </Link>
                            <Link to="/signup" className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => setMobileOpen(false)}>
                                Get Started
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </nav>
=======
        localStorage.removeItem("rootFolderId");
        localStorage.removeItem("folderHistory");
        navigate("/");
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
                    <Link to="/" className="brand-link">
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
                        <Link to="/signup" className={`btn-signup ${location.pathname === "/signup" ? "active" : ""}`}>Sign Up</Link>
                    </div>
                )}
            </div>
        </header>
>>>>>>> main
    );
}