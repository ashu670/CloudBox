import React from "react";

export default function HeroBanner({
    userName,
    isUploading,
    onUploadClick,
    onCreateFolderClick,
    onNewProjectClick,
    onFileInputChange
}) {
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
    };

    const displayName = userName ? userName.trim() : "there";

    return (
        <div className="cb-hero-card">
            {/* Left Content */}
            <div className="cb-hero-left">
                <span className="cb-hero-eyebrow">WELCOME BACK 👏</span>
                <h1 className="cb-hero-title">
                    {getGreeting()}, {displayName}
                </h1>
                <p className="cb-hero-subtitle">
                    Manage your files, folders, and projects all in one place.
                </p>

                <div className="cb-hero-actions">
                    <div className="cb-upload-btn-group">
                        <button
                            type="button"
                            className="cb-btn-upload"
                            onClick={onUploadClick}
                            disabled={isUploading}
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            <span>{isUploading ? "Uploading…" : "Upload File"}</span>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="cb-btn-chevron">
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </button>
                    </div>

                    <button
                        type="button"
                        className="cb-btn-outlined"
                        onClick={onCreateFolderClick}
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                        </svg>
                        <span>Create Folder</span>
                    </button>

                    <button
                        type="button"
                        className="cb-btn-outlined"
                        onClick={onNewProjectClick}
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="8.5" cy="7" r="4" />
                            <line x1="20" y1="8" x2="20" y2="14" />
                            <line x1="23" y1="11" x2="17" y2="11" />
                        </svg>
                        <span>New Project</span>
                    </button>
                </div>
            </div>

            {/* Seamless Organic Wave Layers in Card Background */}
            <div className="cb-hero-waves-bg" aria-hidden="true">
                <svg viewBox="0 0 500 200" preserveAspectRatio="none" className="cb-hero-waves-svg">
                    <defs>
                        <linearGradient id="hero-wave-1" x1="1" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.18" />
                            <stop offset="60%" stopColor="#a855f7" stopOpacity="0.08" />
                            <stop offset="100%" stopColor="#c084fc" stopOpacity="0.02" />
                        </linearGradient>
                        <linearGradient id="hero-wave-2" x1="1" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.14" />
                            <stop offset="50%" stopColor="#818cf8" stopOpacity="0.06" />
                            <stop offset="100%" stopColor="#c7d2fe" stopOpacity="0.01" />
                        </linearGradient>
                    </defs>
                    <path
                        fill="url(#hero-wave-1)"
                        d="M200,200 C270,120 330,60 420,10 C450,-8 480,-2 500,0 L500,200 Z"
                    />
                    <path
                        fill="url(#hero-wave-2)"
                        d="M130,200 C230,160 300,120 380,80 C440,50 475,30 500,20 L500,200 Z"
                    />
                </svg>
            </div>

            {/* Right Side Stacked Words */}
            <div className="cb-hero-right-modern">
                <div className="cb-hero-stacked-words">
                    <span className="cb-stacked-word">Store</span>
                    <span className="cb-stacked-word">Organize</span>
                    <span className="cb-stacked-word">Collaborate</span>
                    <div className="cb-stacked-underline" />
                </div>
            </div>
        </div>
    );
}
