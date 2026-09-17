import React from "react";
import { formatBytes } from "../../utils/formatters";

// ── time-ago helper ──────────────────────────────────────────────────────────
function timeAgo(dateStr) {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.round(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} min${mins > 1 ? "s" : ""} ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
    const days = Math.round(hrs / 24);
    return `${days} day${days > 1 ? "s" : ""} ago`;
}

// ── activity icon by action ──────────────────────────────────────────────────
function ActivityIcon({ action = "" }) {
    const a = (action || "").toLowerCase();
    if (a.includes("upload")) return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" />
            <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
        </svg>
    );
    if (a.includes("delete") || a.includes("trash")) return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
            <path d="M10 11v6M14 11v6M9 6V4h6v2" />
        </svg>
    );
    if (a.includes("folder") || a.includes("create")) return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
    );
    if (a.includes("share") || a.includes("link")) return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
    );
    if (a.includes("download")) return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="8 17 12 21 16 17" /><line x1="12" y1="12" x2="12" y2="21" />
            <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29" />
        </svg>
    );
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
        </svg>
    );
}

const ACTION_COLORS = {
    upload: "cb-act-blue",
    delete: "cb-act-red",
    trash: "cb-act-red",
    folder: "cb-act-amber",
    create: "cb-act-amber",
    share: "cb-act-purple",
    link: "cb-act-purple",
    download: "cb-act-indigo",
};

function getActivityColor(action = "") {
    const a = action.toLowerCase();
    for (const [key, cls] of Object.entries(ACTION_COLORS)) {
        if (a.includes(key)) return cls;
    }
    return "cb-act-indigo";
}

// ── Donut segment definitions ─────────────────────────────────────────────────
// r=46 → circumference ≈ 289  (2π×46)
const R = 46;
const CIRC = 2 * Math.PI * R; // ≈ 289

export default function RightSidebar({
    storagePercent = 0,
    usedStorageBytes = 0,
    limitStorageBytes = 0,
    storageBreakdown = {},
    recentActivity = [],
    activityLoading = false,
    rootFolderId,
    fetchRecentActivity,
    setSharedPanel,
}) {
    const numUsed = Number(usedStorageBytes || 0);
    const numLimit = Number(limitStorageBytes || 0);
    const displayUsed = formatBytes(numUsed);
    const displayLimit = numLimit > 0 ? formatBytes(numLimit) : "500 MB";

    const stats = storageBreakdown?.stats || storageBreakdown || {};
    const imgBytes = Number(stats.image || 0);
    const docBytes = Number(stats.document || 0);
    const vidBytes = Number(stats.video || 0);
    const audBytes = Number(stats.audio || 0);
    const sumKnown = imgBytes + docBytes + vidBytes + audBytes;
    const otherBytes = Math.max(0, numUsed - sumKnown);

    const base = numLimit > 0 ? numLimit : Math.max(numUsed, 1);
    function seg(b) { return Math.max(0, (b / base) * CIRC); }

    const imgLen = seg(imgBytes);
    const docLen = seg(docBytes);
    const vidLen = seg(vidBytes);
    const audLen = seg(audBytes);
    const otherLen = seg(otherBytes);

    // Offsets: each arc starts after previous (negative offset = rotate CW)
    const SEGS = [
        { len: imgLen, off: 0, color: "#6366f1", dot: "dot-indigo", label: "Images", bytes: imgBytes },
        { len: docLen, off: -(imgLen), color: "#ec4899", dot: "dot-pink", label: "Documents", bytes: docBytes },
        { len: vidLen, off: -(imgLen + docLen), color: "#f97316", dot: "dot-orange", label: "Videos", bytes: vidBytes },
        { len: audLen, off: -(imgLen + docLen + vidLen), color: "#eab308", dot: "dot-yellow", label: "Audio", bytes: audBytes },
        { len: otherLen, off: -(imgLen + docLen + vidLen + audLen), color: "#22c55e", dot: "dot-green", label: "Other", bytes: otherBytes },
    ];

    const hasUsage = numUsed > 0;

    return (
        <aside className="cb-right-sidebar-modern">
            {/* ── Card 1: Storage Overview ── */}
            <div className="cb-card-modern cb-storage-overview-card">
                <div className="cb-card-header-modern">
                    <h3 className="cb-card-title-modern">Storage Overview</h3>
                </div>

                <div className="cb-storage-donut-row">
                    <div className="cb-donut-wrapper">
                        <svg viewBox="0 0 120 120" className="cb-donut-svg">
                            {/* track */}
                            <circle cx="60" cy="60" r={R} fill="transparent" stroke="var(--donut-track,#e2e8f0)" strokeWidth="12" />
                            {hasUsage ? (
                                SEGS.map((s, i) =>
                                    s.len > 0.5 ? (
                                        <circle
                                            key={i}
                                            cx="60" cy="60" r={R}
                                            fill="transparent"
                                            stroke={s.color}
                                            strokeWidth="12"
                                            strokeLinecap="butt"
                                            strokeDasharray={`${s.len} ${CIRC}`}
                                            strokeDashoffset={s.off}
                                            transform="rotate(-90 60 60)"
                                        />
                                    ) : null
                                )
                            ) : (
                                <circle cx="60" cy="60" r={R}
                                    fill="transparent" stroke="#c7d2fe" strokeWidth="12"
                                    strokeDasharray={`10 ${CIRC - 10}`} transform="rotate(-90 60 60)"
                                />
                            )}
                        </svg>
                        <div className="cb-donut-center-text">
                            <span className="cb-donut-val">{displayUsed}</span>
                            <span className="cb-donut-sub">of {displayLimit}</span>
                        </div>
                    </div>

                    <div className="cb-donut-legend">
                        {SEGS.map((s, i) => (
                            <div className="cb-legend-item" key={i}>
                                <span className={`cb-legend-dot ${s.dot}`} />
                                <span className="cb-legend-label">{s.label}</span>
                                <span className="cb-legend-val">{formatBytes(s.bytes)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="cb-storage-bottom-row">
                    <button type="button" className="cb-manage-storage-text-link">
                        Manage storage &rarr;
                    </button>
                </div>
            </div>

            {/* ── Card 2: Recent Activity ── */}
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
                    {/* TODO: implement activity data rendering */}
                    <div className="cb-empty-activity-box">
                        <div className="cb-empty-act-icon">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                            </svg>
                        </div>
                        <p className="cb-empty-act-title">No recent activity</p>
                        <span className="cb-empty-act-sub">
                            Actions you perform on your folders &amp; files will appear here.
                        </span>
                    </div>
                </div>

            </div>

            {/* ── Card 3: Work Better Together ── */}
            <div className="cb-work-together-card">
                <div className="cb-work-left">
                    <h4 className="cb-work-title">Work Better Together</h4>
                    <p className="cb-work-subtitle">
                        Create a project and start collaborating with your team.
                    </p>
                    <button
                        type="button"
                        className="cb-btn-create-project"
                        onClick={() => setSharedPanel && setSharedPanel("create")}
                    >
                        <span className="cb-btn-plus-icon">+</span>
                        <span>Create Project</span>
                    </button>
                </div>

                <div className="cb-work-avatars-graphic">
                    <svg viewBox="0 0 130 90" fill="none" className="cb-avatars-svg" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
                        <circle cx="28" cy="38" r="10" fill="#c4b5fd" fillOpacity="0.55" />
                        <path d="M8 90 C8 64,48 64,48 90 Z" fill="#c4b5fd" fillOpacity="0.55" />
                        <circle cx="102" cy="40" r="10" fill="#c4b5fd" fillOpacity="0.45" />
                        <path d="M82 90 C82 66,122 66,122 90 Z" fill="#c4b5fd" fillOpacity="0.45" />
                        <circle cx="65" cy="30" r="13" fill="#a78bfa" fillOpacity="0.85" />
                        <path d="M38 90 C38 56,92 56,92 90 Z" fill="#a78bfa" fillOpacity="0.85" />
                    </svg>
                </div>
            </div>
        </aside>
    );
}
