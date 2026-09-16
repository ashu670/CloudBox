import React from "react";
import { formatBytes, formatDate } from "../../utils/formatters";

export default function RightSidebar({
    storagePercent = 0,
    usedStorageBytes = 0,
    limitStorageBytes = 0,
    storageBreakdown = {},
    recentActivity = [],
    activityLoading = false,
    rootFolderId,
    fetchRecentActivity,
    setSharedPanel
}) {
    const displayUsed = formatBytes(usedStorageBytes);
    const displayLimit = limitStorageBytes > 0 ? formatBytes(limitStorageBytes) : "10 GB";

    // Storage breakdown calculations
    const stats = storageBreakdown?.stats || {};
    const imgBytes = stats.image || 0;
    const docBytes = stats.document || 0;
    const vidBytes = stats.video || 0;
    const audBytes = stats.audio || 0;
    const sumKnown = imgBytes + docBytes + vidBytes + audBytes;
    const otherBytes = Math.max(0, usedStorageBytes - sumKnown);

    const baseLimit = limitStorageBytes > 0 ? limitStorageBytes : Math.max(usedStorageBytes, 1);
    const imgDash = Math.round((imgBytes / baseLimit) * 289);
    const docDash = Math.round((docBytes / baseLimit) * 289);
    const vidDash = Math.round((vidBytes / baseLimit) * 289);
    const audDash = Math.round((audBytes / baseLimit) * 289);
    const otherDash = Math.round((otherBytes / baseLimit) * 289);

    const docOffset = -imgDash;
    const vidOffset = -(imgDash + docDash);
    const audOffset = -(imgDash + docDash + vidDash);
    const otherOffset = -(imgDash + docDash + vidDash + audDash);

    return (
        <aside className="cb-right-sidebar-modern">
            {/* Card 1: Storage Overview */}
            <div className="cb-card-modern cb-storage-overview-card">
                <div className="cb-card-header-modern">
                    <h3 className="cb-card-title-modern">Storage Overview</h3>
                </div>

                <div className="cb-storage-donut-row">
                    {/* SVG Donut Chart */}
                    <div className="cb-donut-wrapper">
                        <svg viewBox="0 0 120 120" className="cb-donut-svg">
                            {/* Base track */}
                            <circle cx="60" cy="60" r="46" fill="transparent" stroke="var(--border-subtle, #ede9fe)" strokeWidth="12" />
                            
                            {imgDash > 0 && (
                                <circle
                                    cx="60" cy="60" r="46"
                                    fill="transparent"
                                    stroke="#8b5cf6"
                                    strokeWidth="12"
                                    strokeDasharray={`${imgDash} 289`}
                                    strokeDashoffset="0"
                                    transform="rotate(-90 60 60)"
                                />
                            )}
                            {docDash > 0 && (
                                <circle
                                    cx="60" cy="60" r="46"
                                    fill="transparent"
                                    stroke="#3b82f6"
                                    strokeWidth="12"
                                    strokeDasharray={`${docDash} 289`}
                                    strokeDashoffset={docOffset}
                                    transform="rotate(-90 60 60)"
                                />
                            )}
                            {vidDash > 0 && (
                                <circle
                                    cx="60" cy="60" r="46"
                                    fill="transparent"
                                    stroke="#fb7185"
                                    strokeWidth="12"
                                    strokeDasharray={`${vidDash} 289`}
                                    strokeDashoffset={vidOffset}
                                    transform="rotate(-90 60 60)"
                                />
                            )}
                            {audDash > 0 && (
                                <circle
                                    cx="60" cy="60" r="46"
                                    fill="transparent"
                                    stroke="#f59e0b"
                                    strokeWidth="12"
                                    strokeDasharray={`${audDash} 289`}
                                    strokeDashoffset={audOffset}
                                    transform="rotate(-90 60 60)"
                                />
                            )}
                            {otherDash > 0 && (
                                <circle
                                    cx="60" cy="60" r="46"
                                    fill="transparent"
                                    stroke="#10b981"
                                    strokeWidth="12"
                                    strokeDasharray={`${otherDash} 289`}
                                    strokeDashoffset={otherOffset}
                                    transform="rotate(-90 60 60)"
                                />
                            )}
                        </svg>

                        <div className="cb-donut-center-text">
                            <span className="cb-donut-val">{displayUsed}</span>
                            <span className="cb-donut-sub">of {displayLimit}</span>
                        </div>
                    </div>

                    {/* Breakdown Legend */}
                    <div className="cb-donut-legend">
                        <div className="cb-legend-item">
                            <span className="cb-legend-dot dot-purple"></span>
                            <span className="cb-legend-label">Images</span>
                            <span className="cb-legend-val">{formatBytes(imgBytes)}</span>
                        </div>
                        <div className="cb-legend-item">
                            <span className="cb-legend-dot dot-blue"></span>
                            <span className="cb-legend-label">Documents</span>
                            <span className="cb-legend-val">{formatBytes(docBytes)}</span>
                        </div>
                        <div className="cb-legend-item">
                            <span className="cb-legend-dot dot-coral"></span>
                            <span className="cb-legend-label">Videos</span>
                            <span className="cb-legend-val">{formatBytes(vidBytes)}</span>
                        </div>
                        <div className="cb-legend-item">
                            <span className="cb-legend-dot dot-amber"></span>
                            <span className="cb-legend-label">Audio</span>
                            <span className="cb-legend-val">{formatBytes(audBytes)}</span>
                        </div>
                        <div className="cb-legend-item">
                            <span className="cb-legend-dot dot-green"></span>
                            <span className="cb-legend-label">Other</span>
                            <span className="cb-legend-val">{formatBytes(otherBytes)}</span>
                        </div>
                    </div>
                </div>

                <div className="cb-storage-bottom-row">
                    <button
                        type="button"
                        className="cb-manage-storage-text-link"
                        onClick={() => { }}
                    >
                        Manage storage &rarr;
                    </button>
                </div>
            </div>

            {/* Card 2: Recent Activity */}
            <div className="cb-card-modern cb-activity-card-modern">
                <div className="cb-card-header-modern">
                    <h3 className="cb-card-title-modern">Recent Activity</h3>
                    <button
                        type="button"
                        className="cb-view-all-link-modern"
                        onClick={() => rootFolderId && rootFolderId !== -1 && fetchRecentActivity && fetchRecentActivity(rootFolderId)}
                    >
                        View all &rarr;
                    </button>
                </div>

                <div className="cb-activity-list-modern">
                    <div className="cb-empty-activity-box" style={{ padding: "20px 8px", textAlign: "center" }}>
                        <p style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-main)", margin: "0 0 4px 0" }}>No recent activity</p>
                        <span style={{ fontSize: "11.5px", color: "var(--text-muted)", lineHeight: 1.4, display: "block" }}>
                            Actions you perform on your folders & files will appear here.
                        </span>
                    </div>
                </div>
            </div>

            {/* Card 3: Work Better Together */}
            <div className="cb-card-modern cb-work-together-card">
                <div className="cb-work-left">
                    <h4 className="cb-work-title">Work Better Together</h4>
                    <p className="cb-work-subtitle">
                        Create a project and start collaborating with your team.
                    </p>
                    <button
                        type="button"
                        className="cb-btn-create-project"
                        onClick={() => setSharedPanel && setSharedPanel('create')}
                    >
                        <span className="cb-btn-plus-icon">+</span>
                        <span>Create Project</span>
                    </button>
                </div>

                <div className="cb-work-avatars-graphic">
                    <svg viewBox="0 0 130 90" fill="none" className="cb-avatars-svg" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
                        {/* Avatar 1 (Left background) */}
                        <circle cx="28" cy="38" r="10" fill="#c4b5fd" fillOpacity="0.55" />
                        <path d="M8 90 C8 64, 48 64, 48 90 Z" fill="#c4b5fd" fillOpacity="0.55" />

                        {/* Avatar 3 (Right background) */}
                        <circle cx="102" cy="40" r="10" fill="#c4b5fd" fillOpacity="0.45" />
                        <path d="M82 90 C82 66, 122 66, 122 90 Z" fill="#c4b5fd" fillOpacity="0.45" />

                        {/* Avatar 2 (Center in front, prominent) */}
                        <circle cx="65" cy="30" r="13" fill="#a78bfa" fillOpacity="0.85" />
                        <path d="M38 90 C38 56, 92 56, 92 90 Z" fill="#a78bfa" fillOpacity="0.85" />
                    </svg>
                </div>
            </div>
        </aside>
    );
}
