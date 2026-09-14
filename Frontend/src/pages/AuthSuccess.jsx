import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Cloud, ShieldCheck } from "lucide-react";

export default function AuthSuccess() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const token = searchParams.get("token");
        if (token) {
            localStorage.setItem("accessToken", token);
            setTimeout(() => {
                navigate("/dashboard");
            }, 600);
        } else {
            navigate("/login");
        }
    }, [searchParams, navigate]);

    return (
        <div className="auth-page-wrapper">
            <div className="auth-split-card" style={{ maxWidth: '440px', gridTemplateColumns: '1fr', textAlign: 'center', padding: '48px 32px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                    <div className="brand-icon-wrapper" style={{ width: '64px', height: '64px', borderRadius: '16px' }}>
                        <Cloud size={36} />
                    </div>
                    
                    <div>
                        <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px' }}>
                            Authenticating Workspace
                        </h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                            Securing your connection and decrypting workspace keys...
                        </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', fontSize: '13px', fontWeight: 600, background: 'rgba(16, 185, 129, 0.1)', padding: '6px 14px', borderRadius: '999px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                        <ShieldCheck size={16} />
                        <span>Google Verification Confirmed</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
