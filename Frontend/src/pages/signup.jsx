import { useState } from "react";
import axios, { API_BASE_URL } from "../api/axios";
import { useNavigate, Link } from "react-router-dom";
import { User, Mail, Lock, Eye, EyeOff, UserPlus, ShieldCheck, CheckCircle2, AlertCircle, Loader2, Sparkles } from "lucide-react";
import authVideo from "../assets/vd1.mp4";

export default function Signup() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: ""
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await axios.post("api/auth/signup", form);
            localStorage.setItem("accessToken", res.data.accessToken);
            navigate("/dashboard");
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.message || "Signup failed. Please check your information and try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page-wrapper">
            <div className="auth-split-card">
                
                {/* Left Side: Showcase with Video */}
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
                            <span>Instant Setup • Free Tier Included</span>
                        </div>

                        <h2 className="auth-hero-title">
                            Start storing & collaborating with <span className="brand-gradient-text">CloudBox</span>
                        </h2>

                        <p className="auth-hero-desc">
                            Unlock high-speed cloud storage, granular access permissions, encrypted shared folders, and real-time team synchronization.
                        </p>

                        <ul className="auth-hero-bullets">
                            <li className="auth-bullet-item">
                                <div className="auth-bullet-icon"><CheckCircle2 size={14} /></div>
                                <span>Create shared team folders with custom invite keys</span>
                            </li>
                            <li className="auth-bullet-item">
                                <div className="auth-bullet-icon"><CheckCircle2 size={14} /></div>
                                <span>Assign Owner, Admin, Editor & Viewer roles</span>
                            </li>
                            <li className="auth-bullet-item">
                                <div className="auth-bullet-icon"><CheckCircle2 size={14} /></div>
                                <span>Full drag-and-drop virtual filesystem experience</span>
                            </li>
                        </ul>
                    </div>

                    <div className="auth-hero-footer">
                        <ShieldCheck size={16} style={{ color: '#38bdf8' }} />
                        <span>Enterprise-grade encryption and SOC2-compliant design</span>
                    </div>
                </div>

                {/* Right Side: Signup Form */}
                <div className="auth-form-pane">
                    <div className="auth-form-header">
                        <h1 className="auth-form-title">Create Account</h1>
                        <p className="auth-form-desc">Get started with your free CloudBox workspace today</p>
                    </div>

                    {error && (
                        <div className="auth-error-banner">
                            <AlertCircle size={18} style={{ flexShrink: 0 }} />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form-body">
                        
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <div className="input-with-icon">
                                <User className="input-icon-left" size={18} />
                                <input
                                    name="name"
                                    placeholder="Alex Morgan"
                                    value={form.name}
                                    onChange={handleChange}
                                    className="form-input"
                                    required
                                    autoComplete="name"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <div className="input-with-icon">
                                <Mail className="input-icon-left" size={18} />
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="alex@example.com"
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
                                    placeholder="Minimum 6 characters"
                                    value={form.password}
                                    onChange={handleChange}
                                    className="form-input"
                                    required
                                    autoComplete="new-password"
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
                                    <span>Creating Account...</span>
                                </>
                            ) : (
                                <>
                                    <UserPlus size={18} />
                                    <span>Create Free Account</span>
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
                        id="google-signup-btn"
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
                        Already have an account? <Link to="/login">Sign In</Link>
                    </div>
                </div>

            </div>
        </div>
    );
}