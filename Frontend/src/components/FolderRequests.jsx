import React, { useState, useEffect, useCallback } from 'react';
import axios from '../api/axios';
import { formatDate } from '../utils/formatters';

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
          {requests.map((req) => {
            const id = req.id || req._id;
            const isProcessing = processingId === id;
            return (
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
      )}
    </div>
  );
};

export default FolderRequests;
