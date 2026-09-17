import React, { useState, useEffect, useCallback } from 'react';
import axios from '../api/axios';
import { formatDate } from '../utils/formatters';

const actionConfig = {
  JOIN_REQUEST: {
    label: "Join Request",
    color: "#8b5cf6",
    bg: "rgba(139, 92, 246, 0.12)",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <line x1="20" y1="8" x2="20" y2="14" />
        <line x1="23" y1="11" x2="17" y2="11" />
      </svg>
    )
  },
  APPROVE_REQUEST: {
    label: "Member Approved",
    color: "#10b981",
    bg: "rgba(16, 185, 129, 0.12)",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    )
  },
  REJECT_REQUEST: {
    label: "Request Rejected",
    color: "#ef4444",
    bg: "rgba(239, 68, 68, 0.12)",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    )
  },
  UPLOAD_FILE: {
    label: "File Uploaded",
    color: "#3b82f6",
    bg: "rgba(59, 130, 246, 0.12)",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    )
  },
  CREATE_FOLDER: {
    label: "Folder Created",
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.12)",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        <line x1="12" y1="11" x2="12" y2="17" />
        <line x1="9" y1="14" x2="15" y2="14" />
      </svg>
    )
  },
  SHARE_FOLDER: {
    label: "Folder Shared",
    color: "#6366f1",
    bg: "rgba(99, 102, 241, 0.12)",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </svg>
    )
  },
  DELETE_FOLDER: {
    label: "Folder Deleted",
    color: "#ef4444",
    bg: "rgba(239, 68, 68, 0.12)",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </svg>
    )
  },
  DELETE_FILE: {
    label: "File Deleted",
    color: "#ef4444",
    bg: "rgba(239, 68, 68, 0.12)",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </svg>
    )
  },
  OWNER_TRANSFERRED: {
    label: "Ownership Transferred",
    color: "#d97706",
    bg: "rgba(217, 119, 6, 0.12)",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    )
  },
  ROLE_UPDATED: {
    label: "Role Updated",
    color: "#8b5cf6",
    bg: "rgba(139, 92, 246, 0.12)",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="8.5" cy="7" r="4" />
      </svg>
    )
  }
};

export default function ActivityLogs({ folderId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchActivities = useCallback(async () => {
    if (!folderId) return;
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.get(`api/folder/activities/${folderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLogs(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to fetch activity logs.');
    } finally {
      setLoading(false);
    }
  }, [folderId]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  if (loading) {
    return (
      <div className="cb-activity-loading">
        <div className="spinner" />
        <span>Loading activity history...</span>
      </div>
    );
  }

  if (error) {
    return <div className="cb-activity-error">{error}</div>;
  }

  return (
    <div className="cb-activity-panel">
      <div className="cb-activity-panel-header">
        <div>
          <h3 className="cb-activity-title">Folder Activity History</h3>
          <p className="cb-activity-subtitle">
            Timeline of updates, file uploads, member actions, and changes in this folder ({logs.length})
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={fetchActivities}
          title="Refresh activity logs"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      {logs.length === 0 ? (
        <div className="cb-activity-empty">
          <div className="cb-activity-empty-icon">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h4>No activity logs yet</h4>
          <p>Recent file uploads, folder creation, and member activities will be tracked and displayed here.</p>
        </div>
      ) : (
        <div className="cb-activity-timeline">
          {logs.map((log) => {
            const actKey = log.action || "";
            const cfg = actionConfig[actKey] || {
              label: actKey.replace(/_/g, " "),
              color: "#64748b",
              bg: "rgba(100, 116, 139, 0.12)",
              icon: (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                </svg>
              )
            };

            const performer = log.userName || "User";
            const email = log.userEmail ? `(${log.userEmail})` : "";
            const dateStr = formatDate(log.createdAt);

            return (
              <div key={log.id} className="cb-timeline-item">
                <div className="cb-timeline-icon-wrap" style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.color }}>
                  {cfg.icon}
                </div>
                <div className="cb-timeline-content">
                  <div className="cb-timeline-top">
                    <span className="cb-timeline-badge" style={{ background: cfg.bg, color: cfg.color }}>
                      {cfg.label}
                    </span>
                    <span className="cb-timeline-time">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      {dateStr}
                    </span>
                  </div>

                  {log.message && (
                    <p className="cb-timeline-message">{log.message}</p>
                  )}

                  <div className="cb-timeline-performer">
                    <span>Performed by: <strong>{performer}</strong> {email}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
