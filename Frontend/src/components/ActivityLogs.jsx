import React, { useState, useEffect, useCallback } from 'react';
import axios from '../api/axios';
import { formatDate } from '../utils/formatters';

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
    </div>
  );
};

export default ActivityLogs;
