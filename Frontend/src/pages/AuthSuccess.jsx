import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/navbar";

export default function AuthSuccess() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const token = searchParams.get("token");
        if (token) {
            localStorage.setItem("accessToken", token);
            localStorage.removeItem("currentFolderId");
            localStorage.removeItem("rootFolderId");
            localStorage.removeItem("folderHistory");
            navigate("/dashboard");
        } else {
            navigate("/login");
        }
    }, [searchParams, navigate]);

    return (
        <div className="app-container">
            <Navbar />
            <div className="auth-wrapper">
                <div className="auth-card" style={{ textAlign: "center" }}>
                    <h2>Authenticating...</h2>
                    <p style={{ marginTop: "10px", color: "var(--text-muted)" }}>Completing Google sign-in</p>
                </div>
            </div>
        </div>
    );
}
