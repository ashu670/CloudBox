import React, { useState, useEffect, useCallback } from 'react';
import axios from '../api/axios';
import { formatDate } from '../utils/formatters';
<<<<<<< HEAD
import { Inbox, Check, X, User, Clock } from 'lucide-react';
=======
>>>>>>> main

const FolderRequests = ({ folderId, onRequestHandled, onNotify }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState(null);

  const fetchRequests = useCallback(async () => {
    if (!folderId) return;
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`api/folder/requests/${folderId}`);
      const list = res.data.data || res.data.requests || res.data;
      setRequests(Array.isArray(list) ? list : []);
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || '';
      if (msg.toLowerCase().includes('no join requests')) {
        setRequests([]);
      } else {
        setError(msg || 'Failed to load requests');
      }
    } finally {
      setLoading(false);
    }
  }, [folderId]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async (requestId) => {
    setProcessingId(requestId);
    setRequests((prev) => prev.filter((r) => (r.id || r._id) !== requestId));
    try {
      await axios.patch('api/folder/request/approve', { requestId, folderId });
      onNotify?.('User approved successfully! They can now access this folder.', 'success');
      onRequestHandled?.();
    } catch (err) {
      await fetchRequests();
      onNotify?.(err.response?.data?.error || err.response?.data?.message || 'Failed to approve request', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId) => {
    setProcessingId(requestId);
    setRequests((prev) => prev.filter((r) => (r.id || r._id) !== requestId));
    try {
      await axios.patch('api/folder/request/reject', { requestId, folderId });
      onNotify?.('Join request rejected.', 'success');
      onRequestHandled?.();
    } catch (err) {
      await fetchRequests();
      onNotify?.(err.response?.data?.error || err.response?.data?.message || 'Failed to reject request', 'error');
    } finally {
      setProcessingId(null);
    }
  };

<<<<<<< HEAD
  if (loading) return <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>Loading join requests...</div>;
  if (error) return <div className="error-banner">{error}</div>;

  return (
    <div className="shared-view-panel">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--accent-primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
          <Inbox size={18} />
        </div>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-heading)' }}>Pending Join Requests</h3>
          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Review and approve access requests for this shared workspace.</p>
        </div>
      </div>

      {requests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px 20px', background: 'var(--bg-subtle)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No pending join requests for this folder right now.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
=======
  if (loading) return <p className="shared-loading">Loading requests...</p>;
  if (error) return <p className="error-msg">{error}</p>;

  return (
    <div className="folder-requests-container">
      <h4>Pending Join Requests</h4>
      {requests.length === 0 ? (
        <div className="shared-empty-state">
          <p>No pending requests for this folder.</p>
        </div>
      ) : (
        <ul className="requests-list">
>>>>>>> main
          {requests.map((req) => {
            const id = req.id || req._id;
            const isProcessing = processingId === id;
            return (
<<<<<<< HEAD
              <div
                key={id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  padding: '14px 18px',
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-xs)',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'var(--accent-primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)', flexShrink: 0 }}>
                    <User size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-heading)', fontSize: '14px' }}>
                      {req.user?.name || req.userName || `User #${req.requestedBy}`}
                    </div>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                      {req.user?.email || req.email || '—'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={11} /> Requested {formatDate(req.requestedAt || req.createdAt)}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="op-btn op-btn-success"
                    disabled={isProcessing}
                    onClick={() => handleApprove(id)}
                  >
                    <Check size={14} /> Approve
                  </button>
                  <button
                    type="button"
                    className="op-btn op-btn-danger"
                    disabled={isProcessing}
                    onClick={() => handleReject(id)}
                  >
                    <X size={14} /> Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
=======
              <li key={id} className="request-card">
                <div className="request-info">
                  <strong>{req.user?.name || req.userName || `User #${req.requestedBy}`}</strong>
                  <span className="request-email">{req.user?.email || req.email || '—'}</span>
                  <span className="request-date">
                    Requested {formatDate(req.requestedAt || req.createdAt)}
                  </span>
                </div>
                <div className="request-actions">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={isProcessing}
                    onClick={() => handleApprove(id)}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm btn-reject"
                    disabled={isProcessing}
                    onClick={() => handleReject(id)}
                  >
                    Reject
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
>>>>>>> main
      )}
    </div>
  );
};

export default FolderRequests;
