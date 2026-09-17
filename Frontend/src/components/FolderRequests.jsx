import React, { useState, useEffect, useCallback } from 'react';
import axios from '../api/axios';
import { formatDate } from '../utils/formatters';

export default function FolderRequests({ folderId, onRequestHandled, onNotify }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
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

  if (loading) {
    return (
      <div className="cb-requests-loading">
        <div className="spinner" />
        <span>Loading join requests...</span>
      </div>
    );
  }

  if (error) {
    return <div className="cb-requests-error">{error}</div>;
  }

  return (
    <div className="cb-requests-panel">
      <div className="cb-requests-panel-header">
        <div>
          <h3 className="cb-requests-title">Pending Join Requests</h3>
          <p className="cb-requests-subtitle">
            Review and approve collaborators requesting to join this workspace ({requests.length})
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={fetchRequests}
          title="Refresh join requests"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      {requests.length === 0 ? (
        <div className="cb-requests-empty">
          <div className="cb-requests-empty-icon">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <h4>No pending requests</h4>
          <p>When teammates use your invite code to join, their access requests will appear here for review.</p>
        </div>
      ) : (
        <div className="cb-requests-list">
          {requests.map((req) => {
            const id = req.id || req._id;
            const isProcessing = processingId === id;
            const name = req.user?.name || req.userName || `User #${req.requestedBy || ''}`;
            const email = req.user?.email || req.email || '';
            const initials = name.slice(0, 2).toUpperCase();
            const dateStr = formatDate(req.requestedAt || req.createdAt);

            return (
              <div key={id} className="cb-request-card">
                <div className="cb-request-left">
                  <div className="cb-request-avatar">{initials}</div>
                  <div className="cb-request-details">
                    <span className="cb-request-name">{name}</span>
                    {email && <span className="cb-request-email">{email}</span>}
                    <span className="cb-request-date">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      Requested {dateStr}
                    </span>
                  </div>
                </div>

                <div className="cb-request-actions">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm cb-btn-approve"
                    disabled={isProcessing}
                    onClick={() => handleApprove(id)}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Approve</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm cb-btn-reject"
                    disabled={isProcessing}
                    onClick={() => handleReject(id)}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
