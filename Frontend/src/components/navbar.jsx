import { Link, useLocation, useNavigate } from "react-router-dom";

export default function Navbar() {
    const location = useLocation();
    const navigate = useNavigate();
    const isAuthenticated = !!localStorage.getItem("accessToken");

    const handleLogout = () => {
        localStorage.removeItem("accessToken");
        navigate("/login");
    };

    return (
        <nav>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg className="sidebar-logo" viewBox="0 0 24 24" style={{ width: '20px', height: '20px' }}>
                    <path d="M19.35,10.03C18.67,6.59 15.64,4 12,4C9.11,4 6.6,5.64 5.35,8.03C2.34,8.36 0,10.9 0,14C0,17.1 2.9,20 6,20H19C21.76,20 24,17.76 24,15C24,12.36 21.95,10.22 19.35,10.03Z" />
                </svg>
                <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-h)', letterSpacing: '-0.3px' }}>CloudBox</span>
            </div>

            <div className="nav-links">
                {isAuthenticated ? (
                    <>
                        <Link to="/dashboard" className={location.pathname === "/dashboard" ? "active" : ""}>Dashboard</Link>
                        <button onClick={handleLogout} className="nav-btn">Log Out</button>
                    </>
                ) : (
                    <>
                        <Link to="/login" className={location.pathname === "/login" ? "active" : ""}>Log In</Link>
                        <Link to="/" className={location.pathname === "/" ? "active" : ""}>Sign Up</Link>
                    </>
                )}
            </div>
        </nav>
    );
}