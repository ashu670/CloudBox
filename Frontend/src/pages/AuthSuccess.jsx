import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function AuthSuccess() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const token = searchParams.get("token");
        if (token) {
            localStorage.setItem("accessToken", token);
            navigate("/dashboard");
        } else {
            navigate("/login");
        }
    }, [searchParams, navigate]);

    return (
        <div className="auth-wrapper">
            <div className="auth-card" style={{ textAlign: "center" }}>
                <h2>Authenticating...</h2>
                <p style={{ marginTop: "10px", color: "var(--text-muted)" }}>Completing Google sign-in</p>
            </div>
        </div>
    );
}
