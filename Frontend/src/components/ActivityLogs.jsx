import React, { useState, useEffect, useCallback } from 'react';
import axios from '../api/axios';
import { formatDate } from '../utils/formatters';
<<<<<<< HEAD
import { History, RefreshCw, User, Clock } from 'lucide-react';
=======
>>>>>>> main

const ActivityLogs = ({ folderId }) => {
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
      setError(err.response?.data?.error || 'Failed to fetch activity logs.');
    } finally {
      setLoading(false);
    }
  }, [folderId]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

<<<<<<< HEAD
  const getActionColor = (action) => {
    if (!action) return { bg: 'var(--bg-subtle)', color: 'var(--text-muted)' };
    const act = action.toUpperCase();
    if (act.includes('UPLOAD') || act.includes('CREATE')) return { bg: 'rgba(5, 150, 105, 0.12)', color: 'var(--accent-emerald)' };
    if (act.includes('DELETE') || act.includes('REMOVE')) return { bg: 'rgba(225, 29, 72, 0.12)', color: 'var(--accent-rose)' };
    if (act.includes('APPROVE') || act.includes('JOIN')) return { bg: 'var(--accent-primary-subtle)', color: 'var(--accent-primary)' };
    if (act.includes('RENAME') || act.includes('MOVE')) return { bg: 'rgba(2, 132, 199, 0.12)', color: 'var(--accent-cyan)' };
    return { bg: 'rgba(217, 119, 6, 0.12)', color: 'var(--accent-amber)' };
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>Loading activity logs...</div>;
  if (error) return <div className="error-banner">{error}</div>;

  return (
    <div className="shared-view-panel">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--accent-primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
            <History size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-heading)' }}>Folder Activity Trail</h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Chronological record of all user events and asset modifications.</p>
          </div>
        </div>

        <button type="button" className="btn btn-secondary btn-sm" onClick={fetchActivities}>
          <RefreshCw size={13} /> Refresh Logs
        </button>
      </div>

      {logs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px 20px', background: 'var(--bg-subtle)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No activity records found for this workspace yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {logs.map((log) => {
            const badge = getActionColor(log.action);
            return (
              <div
                key={log.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  padding: '14px 18px',
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-xs)'
                }}
              >
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: badge.color, marginTop: '5px', flexShrink: 0, boxShadow: `0 0 8px ${badge.color}` }}></div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ background: badge.bg, color: badge.color, padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.5px' }}>
                      {log.action}
                    </span>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} /> {formatDate(log.createdAt)}
                    </span>
                  </div>
                  <p style={{ fontSize: '13.5px', color: 'var(--text-heading)', marginBottom: '6px' }}>{log.description}</p>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User size={13} /> {log.userName} <span style={{ color: 'var(--text-dim)' }}>({log.userEmail})</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
=======
  if (loading) return <div className="panel-loading-spinner"><div className="spinner"></div><p>Loading activity logs...</p></div>;
  if (error) return <div className="error-card"><p className="error-msg">{error}</p></div>;

  return (
    <div className="activity-logs-container">
      <div className="panel-section-card">
        <div className="card-header-flex">
          <h3>Folder Activity History</h3>
          <button type="button" className="btn btn-secondary btn-sm" onClick={fetchActivities}>Refresh Logs</button>
        </div>
        
        {logs.length === 0 ? (
          <div className="logs-empty-state">
            <p className="text-muted">No activity logs recorded for this folder yet.</p>
          </div>
        ) : (
          <div className="logs-timeline-list">
            {logs.map((log) => (
              <div key={log.id} className="timeline-log-item">
                <div className="log-icon-col">
                  <div className="log-bullet-circle"></div>
                </div>
                <div className="log-content-col">
                  <div className="log-header-row">
                    <span className="log-action-tag">{log.action}</span>
                    <span className="log-time-stamp">{formatDate(log.createdAt)}</span>
                  </div>
                  <p className="log-desc-text">{log.description}</p>
                  <div className="log-operator-details text-muted">
                    Performed by: <strong>{log.userName}</strong> ({log.userEmail})
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
>>>>>>> main
    </div>
  );
};

export default ActivityLogs;
