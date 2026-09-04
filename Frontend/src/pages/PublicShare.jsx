import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "../api/axios";
import { formatBytes, formatDate } from "../utils/formatters";
import FileIcon from "../components/fileIcon";
import Navbar from "../components/navbar";

export default function PublicShare() {
    const { token } = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [shareData, setShareData] = useState(null);

    useEffect(() => {
        const fetchPublicShare = async () => {
            try {
                setLoading(true);
                setError("");
                const res = await axios.get(`api/public/share/${token}`);
                if (res.data?.success) {
                    setShareData(res.data.data);
                } else {
                    setError(res.data?.message || "Invalid or expired share link.");
                }
            } catch (err) {
                setError(err.response?.data?.message || "Invalid or expired share link.");
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchPublicShare();
        }
    }, [token]);

    const handleDownload = () => {
        if (shareData?.downloadUrl) {
            window.location.href = shareData.downloadUrl;
        }
    };

    if (loading) {
        return (
            <div className="app-container">
                <Navbar />
                <div className="auth-wrapper">
                    <div className="loading-container">
                        <div className="spinner"></div>
                        <p style={{ marginTop: "12px", color: "var(--text-secondary)" }}>Loading shared file...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !shareData) {
        return (
            <div className="app-container">
                <Navbar />
                <div className="auth-wrapper">
                    <div className="auth-card" style={{ textAlign: "center", padding: "40px 24px", maxWidth: "420px" }}>
                        <div style={{ color: "#ef4444", marginBottom: "16px" }}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                        </div>
                        <h2 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "8px" }}>Share Link Error</h2>
                        <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "24px" }}>
                            {error || "This share link is invalid or has expired."}
                        </p>
                        <Link to="/login" className="btn btn-primary" style={{ textDecoration: "none", width: "100%", justifyContent: "center" }}>
                            Go to CloudBox Home
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const { file, downloadUrl } = shareData;

    return (
        <div className="app-container">
            <Navbar />
            <div className="auth-wrapper">
                <div className="auth-card" style={{ maxWidth: "440px", textAlign: "center", padding: "36px 28px" }}>
                    <div className="auth-header" style={{ alignItems: "center" }}>
                        <h1 style={{ fontSize: "22px", fontWeight: "700" }}>Shared File</h1>
                        <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Someone shared a file with you via CloudBox</p>
                    </div>

                    <div style={{ margin: "20px 0", padding: "20px 16px", backgroundColor: "var(--bg-app)", borderRadius: "12px", border: "1px solid var(--border-color)", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                        <div style={{ transform: "scale(1.6)", margin: "10px 0" }}>
                            <FileIcon mimeType={file.mimeType} />
                        </div>
                        <h3 style={{ fontSize: "17px", fontWeight: "600", color: "var(--text-main)", wordBreak: "break-all", margin: "4px 0 0 0" }}>
                            {file.orgName}
                        </h3>
                        <div style={{ fontSize: "12.5px", color: "var(--text-muted)", display: "flex", gap: "8px", alignItems: "center" }}>
                            <span>{formatBytes(file.size)}</span>
                            <span>•</span>
                            <span>Shared {formatDate(file.createdAt)}</span>
                        </div>
                    </div>

                    {downloadUrl ? (
                        <button onClick={handleDownload} className="btn btn-primary" style={{ width: "100%", padding: "12px", fontSize: "15px", fontWeight: "600", justifyContent: "center" }}>
                            Download File
                        </button>
                    ) : (
                        <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>File download currently unavailable.</p>
                    )}

                    <div className="auth-footer" style={{ marginTop: "8px" }}>
                        Want your own cloud storage?{" "}
                        <Link to="/login">Sign in to CloudBox</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
