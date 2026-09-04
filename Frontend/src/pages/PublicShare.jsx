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
    const [textContent, setTextContent] = useState(null);
    const [loadingText, setLoadingText] = useState(false);

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

    useEffect(() => {
        if (!shareData || !shareData.downloadUrl || !shareData.file?.mimeType) return;
        const { mimeType } = shareData.file;
        const { downloadUrl } = shareData;

        if (
            mimeType.startsWith("text/") ||
            mimeType === "application/json" ||
            mimeType.includes("javascript") ||
            mimeType.includes("xml")
        ) {
            setLoadingText(true);
            fetch(downloadUrl)
                .then((res) => res.text())
                .then((text) => {
                    setTextContent(text);
                    setLoadingText(false);
                })
                .catch(() => {
                    setTextContent("Failed to load text preview.");
                    setLoadingText(false);
                });
        }
    }, [shareData]);

    const handleDownload = () => {
        if (shareData?.downloadUrl) {
            const link = document.createElement("a");
            link.href = shareData.downloadUrl;
            link.setAttribute("download", shareData.file?.orgName || "download");
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        }
    };

    if (loading) {
        return (
            <div style={{ height: "100vh", width: "100vw", display: "flex", flexDirection: "column", backgroundColor: "var(--bg-app)" }}>
                <Navbar />
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ textAlign: "center" }}>
                        <div className="spinner" style={{ margin: "0 auto" }}></div>
                        <p style={{ marginTop: "16px", color: "var(--text-secondary)", fontSize: "14.5px" }}>Loading shared file viewer...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !shareData) {
        return (
            <div style={{ height: "100vh", width: "100vw", display: "flex", flexDirection: "column", backgroundColor: "var(--bg-app)" }}>
                <Navbar />
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
                    <div className="auth-card" style={{ textAlign: "center", padding: "40px 28px", maxWidth: "440px", width: "100%" }}>
                        <div style={{ color: "#ef4444", marginBottom: "16px" }}>
                            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
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

    const { file, ownerName, downloadUrl } = shareData;
    const mimeType = file.mimeType || "";

    const renderFullViewportPreview = () => {
        if (!downloadUrl) return null;

        if (mimeType.startsWith("image/")) {
            return (
                <div style={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "#0c0d10", padding: "8px" }}>
                    <img
                        src={downloadUrl}
                        alt={file.orgName}
                        style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: "4px" }}
                    />
                </div>
            );
        }

        if (mimeType === "application/pdf") {
            const pdfSrc = `${downloadUrl}#toolbar=0&navpanes=0`;
            return (
                <div style={{ width: "100%", height: "100%", backgroundColor: "#1e1e24" }}>
                    <iframe
                        src={pdfSrc}
                        title={file.orgName}
                        style={{ width: "100%", height: "100%", border: "none", display: "block" }}
                    />
                </div>
            );
        }

        if (mimeType.startsWith("video/")) {
            return (
                <div style={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "#000" }}>
                    <video
                        controls
                        controlsList="nodownload"
                        autoPlay
                        src={downloadUrl}
                        style={{ maxWidth: "100%", maxHeight: "100%" }}
                    >
                        Your browser does not support video playback.
                    </video>
                </div>
            );
        }

        if (mimeType.startsWith("audio/")) {
            return (
                <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", backgroundColor: "#0c0d10", padding: "16px" }}>
                    <div style={{ padding: "32px 20px", borderRadius: "20px", backgroundColor: "#181920", border: "1px solid #2a2b36", textAlign: "center", maxWidth: "440px", width: "100%", boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>
                        <div style={{ transform: "scale(1.8)", margin: "16px 0 24px 0" }}>
                            <FileIcon mimeType={mimeType} />
                        </div>
                        <h3 style={{ fontSize: "16.5px", fontWeight: "600", color: "#fff", marginBottom: "6px", wordBreak: "break-all" }}>{file.orgName}</h3>
                        <p style={{ fontSize: "12.5px", color: "#9ca3af", marginBottom: "20px" }}>{formatBytes(file.size)}</p>
                        <audio controls controlsList="nodownload" src={downloadUrl} style={{ width: "100%" }}>
                            Your browser does not support audio playback.
                        </audio>
                    </div>
                </div>
            );
        }

        if (
            mimeType.startsWith("text/") ||
            mimeType === "application/json" ||
            mimeType.includes("javascript") ||
            mimeType.includes("xml")
        ) {
            return (
                <div style={{ width: "100%", height: "100%", backgroundColor: "#0d1117", overflow: "hidden" }}>
                    {loadingText ? (
                        <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center" }}>
                            <div className="spinner"></div>
                        </div>
                    ) : (
                        <pre style={{ width: "100%", height: "100%", padding: "16px", overflow: "auto", fontSize: "13px", margin: 0, color: "#c9d1d9", fontFamily: "Consolas, Monaco, 'Andale Mono', monospace", lineHeight: "1.4" }}>
                            <code>{textContent}</code>
                        </pre>
                    )}
                </div>
            );
        }

        return (
            <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", backgroundColor: "#0c0d10", padding: "16px" }}>
                <div style={{ padding: "40px 24px", borderRadius: "20px", backgroundColor: "#181920", border: "1px solid #2a2b36", textAlign: "center", maxWidth: "420px", width: "100%", boxShadow: "0 10px 40px rgba(0,0,0,0.5)", display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
                    <div style={{ transform: "scale(2.2)", margin: "8px 0" }}>
                        <FileIcon mimeType={mimeType} />
                    </div>
                    <h3 style={{ fontSize: "17px", fontWeight: "600", color: "#fff", margin: 0, wordBreak: "break-all" }}>{file.orgName}</h3>
                    <p style={{ fontSize: "13px", color: "#9ca3af", margin: 0 }}>
                        Direct preview is not available for this file format.
                    </p>
                    <button onClick={handleDownload} className="btn btn-primary" style={{ width: "100%", padding: "11px", fontSize: "14.5px", fontWeight: "600", marginTop: "6px", justifyContent: "center" }}>
                        Download ({formatBytes(file.size)})
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div style={{ height: "100vh", width: "100vw", display: "flex", flexDirection: "column", overflow: "hidden", backgroundColor: "#0e0e11" }}>
            <style>{`
                .ps-header {
                    min-height: 60px;
                    padding: 0 16px;
                    background-color: #16171f;
                    border-bottom: 1px solid #282936;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                    z-index: 10;
                    box-sizing: border-box;
                }
                .ps-info {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    min-width: 0;
                    flex: 1;
                }
                .ps-title {
                    font-size: 15px;
                    font-weight: 600;
                    color: #f3f4f6;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    margin: 0;
                }
                .ps-meta {
                    font-size: 12px;
                    color: #9ca3af;
                    display: flex;
                    gap: 6px;
                    align-items: center;
                    margin-top: 2px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .ps-actions {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    flex-shrink: 0;
                }
                .ps-signin-btn {
                    padding: 7px 14px;
                    font-size: 13px;
                    font-weight: 600;
                    text-decoration: none;
                    color: #ffffff;
                    background-color: rgba(255, 255, 255, 0.12);
                    border: 1px solid rgba(255, 255, 255, 0.25);
                    border-radius: 8px;
                    display: inline-flex;
                    align-items: center;
                    white-space: nowrap;
                }
                .ps-signin-btn:hover {
                    background-color: rgba(255, 255, 255, 0.2);
                }
                .ps-dl-btn {
                    padding: 7px 16px;
                    font-size: 13.5px;
                    font-weight: 600;
                    border-radius: 8px;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    white-space: nowrap;
                }
                @media (max-width: 580px) {
                    .ps-header {
                        padding: 8px 12px;
                        min-height: auto;
                        gap: 6px;
                    }
                    .ps-info {
                        gap: 8px;
                    }
                    .ps-title {
                        font-size: 13.5px;
                    }
                    .ps-meta {
                        font-size: 11px;
                    }
                    .ps-dl-btn {
                        padding: 6px 10px;
                        font-size: 12px;
                    }
                    .ps-signin-btn {
                        padding: 6px 10px;
                        font-size: 12px;
                    }
                    .ps-hide-sm {
                        display: none;
                    }
                }
            `}</style>
            
            {/* Drive-Style 100% Mobile Responsive Top Bar */}
            <header className="ps-header">
                
                {/* File Title & Owner info */}
                <div className="ps-info">
                    <div style={{ display: "flex", alignItems: "center", transform: "scale(1.1)", flexShrink: 0 }}>
                        <FileIcon mimeType={file.mimeType} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                        <h2 className="ps-title">{file.orgName}</h2>
                        <div className="ps-meta">
                            <span>Shared by <strong style={{ color: "#3b82f6" }}>{ownerName || "User"}</strong></span>
                            <span>•</span>
                            <span>{formatBytes(file.size)}</span>
                            <span className="ps-hide-sm">•</span>
                            <span className="ps-hide-sm">Shared {formatDate(file.createdAt)}</span>
                        </div>
                    </div>
                </div>

                {/* Right Actions */}
                <div className="ps-actions">
                    {downloadUrl && (
                        <button onClick={handleDownload} className="btn btn-primary ps-dl-btn">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            <span>Download</span>
                        </button>
                    )}
                    <Link to="/login" className="ps-signin-btn">
                        Sign in
                    </Link>
                </div>
            </header>

            {/* Google Drive Style Full Canvas Area */}
            <main style={{ flex: 1, width: "100%", height: "calc(100vh - 60px)", overflow: "hidden", position: "relative" }}>
                {renderFullViewportPreview()}
            </main>

        </div>
    );
}
