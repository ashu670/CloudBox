import React from "react";

export default function FilesSection({ setActiveNav }) {
    return (
        <section className="cb-section-recent-files">
            <div className="cb-section-header">
                <h2 className="cb-section-title-modern">Recent Files</h2>
                <button
                    type="button"
                    className="cb-view-all-link-modern"
                    onClick={() => setActiveNav?.('files')}
                >
                    View all &rarr;
                </button>
            </div>

            <div className="cb-in-progress-card">
                <div className="cb-in-progress-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                        <polyline points="13 2 13 9 20 9" />
                    </svg>
                </div>
                <div className="cb-in-progress-text-wrap">
                    <span className="cb-in-progress-title">This section is in progress</span>
                    <span className="cb-in-progress-sub">Recent files and activity logs will appear here soon.</span>
                </div>
            </div>
        </section>
    );
}
