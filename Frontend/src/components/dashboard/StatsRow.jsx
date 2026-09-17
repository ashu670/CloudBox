import React from "react";

export default function StatsRow({ dashboardStats = {}, onStatClick }) {
    const totalFiles = Number(dashboardStats.totalFiles || 0);
    const totalFolders = Number(dashboardStats.totalFolders || 0);
    const totalProjects = Number(dashboardStats.projects ?? dashboardStats.totalProjects ?? 0);
    const sharedWithMe = Number(dashboardStats.sharedWithMe || 0);

    return (
        <div className="cb-stats-row-4">
            {/* Card 1: Total Files */}
            <div
                className="cb-stat-card-modern"
                onClick={() => onStatClick?.('files')}
                style={{ cursor: onStatClick ? 'pointer' : 'default' }}
            >
                <div className="cb-stat-icon-wrap-modern icon-blue">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                        <polyline points="13 2 13 9 20 9" />
                    </svg>
                </div>
                <div className="cb-stat-body-modern">
                    <span className="cb-stat-label-modern">Total Files</span>
                    <div className="cb-stat-value-row">
                        <span className="cb-stat-value-modern">{totalFiles}</span>
                    </div>
                </div>
            </div>

            {/* Card 2: Folders */}
            <div
                className="cb-stat-card-modern"
                onClick={() => onStatClick?.('files')}
                style={{ cursor: onStatClick ? 'pointer' : 'default' }}
            >
                <div className="cb-stat-icon-wrap-modern icon-amber">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#f59e0b">
                        <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                    </svg>
                </div>
                <div className="cb-stat-body-modern">
                    <span className="cb-stat-label-modern">Folders</span>
                    <div className="cb-stat-value-row">
                        <span className="cb-stat-value-modern">{totalFolders}</span>
                    </div>
                </div>
            </div>

            {/* Card 3: Projects */}
            <div
                className="cb-stat-card-modern"
                onClick={() => onStatClick?.('projects')}
                style={{ cursor: onStatClick ? 'pointer' : 'default' }}
            >
                <div className="cb-stat-icon-wrap-modern icon-purple">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                </div>
                <div className="cb-stat-body-modern">
                    <span className="cb-stat-label-modern">Projects</span>
                    <div className="cb-stat-value-row">
                        <span className="cb-stat-value-modern">{totalProjects}</span>
                    </div>
                </div>
            </div>

            {/* Card 4: Shared with me */}
            <div
                className="cb-stat-card-modern"
                onClick={() => onStatClick?.('shared')}
                style={{ cursor: onStatClick ? 'pointer' : 'default' }}
            >
                <div className="cb-stat-icon-wrap-modern icon-indigo">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                </div>
                <div className="cb-stat-body-modern">
                    <span className="cb-stat-label-modern">Shared with me</span>
                    <div className="cb-stat-value-row">
                        <span className="cb-stat-value-modern">{sharedWithMe}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
