import { useState } from "react";
import axios, { API_BASE_URL } from "../api/axios";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, LogIn, AlertCircle, Loader2, ArrowRight } from "lucide-react";

export default function Login() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        email: "",
        password: ""
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
        if (error) setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setIsSubmitting(true);

        try {
            const res = await axios.post("api/auth/login", form);
            localStorage.setItem("accessToken", res.data.accessToken);
            localStorage.removeItem("folderHistory");
            if (res.data.root) {
                localStorage.setItem("rootFolderId", res.data.root);
                localStorage.setItem("currentFolderId", res.data.root);
            } else {
                localStorage.removeItem("rootFolderId");
                localStorage.removeItem("currentFolderId");
            }
            navigate("/dashboard");
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.message || "Login failed. Please verify credentials.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="auth-page-bg">
            {/* Background Ambient Glows */}
            <div className="auth-bg-ambient-orb auth-orb-1" aria-hidden="true" />
            <div className="auth-bg-ambient-orb auth-orb-2" aria-hidden="true" />
            <div className="auth-bg-grid" aria-hidden="true" />

            {/* Top Brand Nav */}
            <header className="auth-nav">
                <Link to="/" className="auth-brand-logo" aria-label="CloudBox Home">
                    <div className="auth-brand-icon-wrapper">
                        <svg className="cloudbox-logo-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4C9.11 4 6.6 5.64 5.35 8.04C2.34 8.36 0 10.91 0 14C0 17.31 2.69 20 6 20H19C21.76 20 24 17.76 24 15C24 12.36 21.95 10.22 19.35 10.04Z" fill="currentColor" />
                        </svg>
                    </div>
                    <span className="auth-brand-name">CloudBox</span>
                </Link>
                <div className="auth-nav-actions">
                    <span className="auth-nav-prompt">Don't have an account?</span>
                    <Link to="/signup" className="btn-auth-nav-link">
                        <span>Sign Up</span>
                        <ArrowRight size={14} className="auth-nav-arrow" />
                    </Link>
                </div>
            </header>

            {/* Main Auth Content */}
            <main className="auth-wrapper">
                <div className="auth-card">
                    <div className="auth-header">
                        <div className="auth-header-badge">
                            <LogIn size={22} className="auth-badge-icon" />
                        </div>
                        <h1 className="auth-title">Welcome Back</h1>
                        <p className="auth-subtitle">Sign in to your CloudBox workspace</p>
                    </div>

                    {error && (
                        <div className="auth-error-banner" role="alert">
                            <AlertCircle size={17} className="auth-error-icon" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form" noValidate={false}>
                        <div className="auth-input-group">
                            <label className="auth-label" htmlFor="login-email">Email Address</label>
                            <div className="auth-input-wrapper">
                                <Mail size={18} className="auth-input-icon" />
                                <input
                                    id="login-email"
                                    type="email"
                                    name="email"
                                    placeholder="you@company.com"
                                    value={form.email}
                                    onChange={handleChange}
                                    className="auth-input"
                                    autoComplete="email"
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        <div className="auth-input-group">
                            <div className="auth-label-row">
                                <label className="auth-label" htmlFor="login-password">Password</label>
                            </div>
                            <div className="auth-input-wrapper">
                                <Lock size={18} className="auth-input-icon" />
                                <input
                                    id="login-password"
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    placeholder="Enter your password"
                                    value={form.password}
                                    onChange={handleChange}
                                    className="auth-input auth-input-password"
                                    autoComplete="current-password"
                                    required
                                    disabled={isSubmitting}
                                />
                                <button
                                    type="button"
                                    className="auth-eye-btn"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    tabIndex={0}
                                >
                                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn-auth-submit"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={18} className="spin-icon" />
                                    <span>Signing in...</span>
                                </>
                            ) : (
                                <>
                                    <span>Sign In to Workspace</span>
                                    <LogIn size={17} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="auth-divider">
                        <span>OR</span>
                    </div>

                    <a
                        href={`${API_BASE_URL}/api/auth/google`}
                        className="btn-google"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                        </svg>
                        <span>Continue with Google</span>
                    </a>

                    <div className="auth-footer">
                        <span>New to CloudBox?</span> <Link to="/signup" className="auth-footer-link">Create an account</Link>
                    </div>
                </div>
            </main>
        </div>
    );
}