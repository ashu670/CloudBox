import { useState } from "react";
import axios from "../api/axios";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        email: "",
        password: ""
    });
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const res = await axios.post("api/auth/login", form);
            localStorage.setItem("accessToken", res.data.accessToken);
            navigate("/dashboard");
        } catch (err) {
            setError(err.response?.data?.error || "Login failed. Please verify credentials.");
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-card">
                <div className="auth-header">
                    <h1>Welcome Back</h1>
                    <p>Log in to access your files</p>
                </div>

                {error && (
                    <div style={{ color: "#ef4444", background: "#fee2e2", padding: "10px", borderRadius: "6px", fontSize: "13px", fontWeight: 500 }}>
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

                    <button type="submit" className="btn btn-primary" style={{ justifyContent: "center", padding: "10px" }}>
                        Log In
                    </button>
                </form>

                <div className="auth-footer">
                    Don't have an account? <Link to="/">Sign up</Link>
                </div>
            </div>
        </div>
    );
}