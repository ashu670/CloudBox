import { useState } from "react";
import axios, { API_BASE_URL } from "../api/axios";
import { useNavigate, Link } from "react-router-dom";
<<<<<<< HEAD
import { Mail, Lock, Eye, EyeOff, LogIn, ShieldCheck, CheckCircle2, AlertCircle, Loader2, Sparkles } from "lucide-react";
import authVideo from "../assets/vd1.mp4";
=======
import Navbar from "../components/navbar";
>>>>>>> main

export default function Login() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        email: "",
        password: ""
    });
<<<<<<< HEAD
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
=======
    const [error, setError] = useState("");
>>>>>>> main

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
<<<<<<< HEAD
        setLoading(true);
=======
>>>>>>> main

        try {
            const res = await axios.post("api/auth/login", form);
            localStorage.setItem("accessToken", res.data.accessToken);
<<<<<<< HEAD
            navigate("/dashboard");
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.message || "Invalid credentials. Please verify your email and password.");
        } finally {
            setLoading(false);
=======
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
>>>>>>> main
        }
    };

    return (
<<<<<<< HEAD
        <div className="auth-page-wrapper">
            <div className="auth-split-card">
                
                {/* Left Side: Product Showcase with Video & Security Badges */}
                <div className="auth-hero-pane">
                    <video
                        src={authVideo}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="auth-hero-video-bg"
                    />
                    <div className="auth-hero-overlay"></div>

                    <div className="auth-hero-content">
                        <div className="auth-hero-badge">
                            <Sparkles size={14} />
                            <span>Enterprise Cloud Security</span>
                        </div>

                        <h2 className="auth-hero-title">
                            Welcome back to <span className="brand-gradient-text">CloudBox</span>
                        </h2>

                        <p className="auth-hero-desc">
                            Seamless hierarchical virtual drive, real-time collaboration, and lightning-fast media streaming across all your devices.
                        </p>

                        <ul className="auth-hero-bullets">
                            <li className="auth-bullet-item">
                                <div className="auth-bullet-icon"><CheckCircle2 size={14} /></div>
                                <span>Sub-millisecond nested folder tree navigation</span>
                            </li>
                            <li className="auth-bullet-item">
                                <div className="auth-bullet-icon"><CheckCircle2 size={14} /></div>
                                <span>High-performance media streaming without downloading</span>
                            </li>
                            <li className="auth-bullet-item">
                                <div className="auth-bullet-icon"><CheckCircle2 size={14} /></div>
                                <span>Enterprise-grade cryptographic access controls</span>
                            </li>
                        </ul>
                    </div>

                    <div className="auth-hero-footer">
                        <ShieldCheck size={16} style={{ color: '#38bdf8' }} />
                        <span>Protected by 256-bit AES encryption & RBAC security</span>
                    </div>
                </div>

                {/* Right Side: Auth Form */}
                <div className="auth-form-pane">
                    <div className="auth-form-header">
                        <h1 className="auth-form-title">Sign In</h1>
                        <p className="auth-form-desc">Enter your credentials to access your CloudBox workspace</p>
                    </div>

                    {error && (
                        <div className="auth-error-banner">
                            <AlertCircle size={18} style={{ flexShrink: 0 }} />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form-body">
                        
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <div className="input-with-icon">
                                <Mail className="input-icon-left" size={18} />
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="name@company.com"
                                    value={form.email}
                                    onChange={handleChange}
                                    className="form-input"
                                    required
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <div className="input-with-icon">
                                <Lock className="input-icon-left" size={18} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    placeholder="••••••••••••"
                                    value={form.password}
                                    onChange={handleChange}
                                    className="form-input"
                                    required
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    className="input-icon-right"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                    aria-label="Toggle password visibility"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn-auth-submit"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={18} className="spin-slow" />
                                    <span>Authenticating...</span>
                                </>
                            ) : (
                                <>
                                    <LogIn size={18} />
                                    <span>Sign In to Account</span>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="auth-divider">
                        <span>OR CONTINUE WITH</span>
                    </div>

                    <a
                        href={`${API_BASE_URL}/api/auth/google`}
                        className="btn-google-auth"
                        id="google-signin-btn"
                    >
                        <div className="google-icon-box">
                            <svg width="18" height="18" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                            </svg>
                        </div>
                        <span className="btn-google-text">Continue with Google</span>
                    </a>

                    <div className="auth-footer-note">
                        Don't have an account? <Link to="/signup">Create one free</Link>
                    </div>
                </div>

=======
        <div className="app-container">
            <Navbar />
            <div className="auth-wrapper">
                <div className="auth-card">
                    <div className="auth-header">
                        <div className="auth-header-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                                <polyline points="10 17 15 12 10 7"/>
                                <line x1="15" y1="12" x2="3" y2="12"/>
                            </svg>
                        </div>
                        <h1>Welcome Back</h1>
                        <p>Log in to access your CloudBox workspace</p>
                    </div>

                    {error && (
                        <div style={{ color: "#ef4444", background: "#fef2f2", border: "1px solid #fecaca", padding: "10px 14px", borderRadius: "10px", fontSize: "13px", fontWeight: 500 }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <input
                            type="email"
                            name="email"
                            placeholder="Email Address"
                            value={form.email}
                            onChange={handleChange}
                            className="input-field"
                            required
                        />

                        <input
                            type="password"
                            name="password"
                            placeholder="Password"
                            value={form.password}
                            onChange={handleChange}
                            className="input-field"
                            required
                        />

                        <button type="submit" className="btn btn-primary auth-submit-btn">
                            Log In
                        </button>
                    </form>

                    <div className="auth-divider">
                        <span>OR</span>
                    </div>

                    <a
                        href={`${API_BASE_URL}/api/auth/google`}
                        className="btn-google"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                        </svg>
                        Continue with Google
                    </a>

                    <div className="auth-footer">
                        Don't have an account? <Link to="/signup">Sign up</Link>
                    </div>
                </div>
>>>>>>> main
            </div>
        </div>
    );
}