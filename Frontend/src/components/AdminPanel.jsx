import React, { useState, useEffect, useCallback } from 'react';
import axios from '../api/axios';
import { formatBytes, formatDate } from '../utils/formatters';

/* ─── Tiny Icon Helper ────────────────────────────────────────────────────── */
const Icon = ({ d, size = 16, className = '', style = {} }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
  >
    <path d={d} />
  </svg>
);

const Icons = {
  users:    'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  shield:   'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  clock:    'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
  file:     'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6',
  hdd:      'M22 12H2M22 12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v6zM6 16h.01M10 16h.01',
  check:    'M20 6L9 17l-5-5',
  trash:    'M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
  lock:     'M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4',
  close:    'M18 6L6 18M6 6l12 12',
};

/* ─── Role Badge ─────────────────────────────────────────────────────────── */
const RoleBadge = ({ role }) => {
  const map = {
    OWNER:  { bg: 'rgba(245, 158, 11, 0.12)', color: '#d97706', border: 'rgba(245, 158, 11, 0.3)' },
    ADMIN:  { bg: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6', border: 'rgba(139, 92, 246, 0.3)' },
    EDITOR: { bg: 'rgba(16, 185, 129, 0.12)', color: '#10b981', border: 'rgba(16, 185, 129, 0.3)' },
    VIEWER: { bg: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' },
  };
  const s = map[role] || map.VIEWER;
  return (
    <span
      className="cb-role-badge"
      style={{
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
      }}
    >
      {role}
    </span>
  );
};

/* ─── Stat Card ──────────────────────────────────────────────────────────── */
const StatCard = ({ icon, label, value, bg, color }) => (
  <div className="cb-op-stat-card">
    <div className="cb-op-stat-icon" style={{ background: bg, color: color }}>
      <Icon d={icon} size={18} />
    </div>
    <div className="cb-op-stat-info">
      <span className="cb-op-stat-label">{label}</span>
      <span className="cb-op-stat-value">{value}</span>
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════════════════════════
   ADMIN PANEL COMPONENT
══════════════════════════════════════════════════════════════════════════ */
const AdminPanel = ({ folderId, onNotify, onRefresh }) => {
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [busy, setBusy]           = useState(false);
  const [activeTab, setActiveTab] = useState('members');

  const token = () => localStorage.getItem('accessToken');

  const fetch = useCallback(async () => {
    if (!folderId) return;
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`api/folder/admin-panel/${folderId}`, {
        headers: { Authorization: `Bearer ${token()}` }
      });
      setData(res.data.data);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load Admin Panel');
    } finally {
      setLoading(false);
    }
  }, [folderId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const act = async (fn, successMsg) => {
    setBusy(true);
    try {
      await fn();
      onNotify?.(successMsg, 'success');
      await fetch();
      onRefresh?.();
    } catch (e) {
      onNotify?.(e.response?.data?.error || 'Action failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = (userId, name) => {
    if (!window.confirm(`Remove member ${name} from this project?`)) return;
    act(
      () => axios.delete(`api/folder/members/${folderId}/${userId}`, { headers: { Authorization: `Bearer ${token()}` } }),
      `${name} removed from project`
    );
  };

  const handleApprove = (id) =>
    act(
      () => axios.patch('api/folder/request/approve', { requestId: id, folderId }, { headers: { Authorization: `Bearer ${token()}` } }),
      'Join request approved'
    );

  const handleReject = (id) =>
    act(
      () => axios.patch('api/folder/request/reject', { requestId: id, folderId }, { headers: { Authorization: `Bearer ${token()}` } }),
      'Join request rejected'
    );

  /* ── Render States ── */
  if (loading) {
    return (
      <div className="cb-op-center-state">
        <div className="cb-op-spinner" />
        <span>Loading Admin Panel...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cb-op-center-state cb-op-error-state">
        <Icon d={Icons.shield} size={32} />
        <span>{error}</span>
      </div>
    );
  }

  if (!data) return null;

  const allMembers = [...(data.admins || []), ...(data.members || [])];

  return (
    <div className="cb-op-root">

      {/* ── 1. Hero Header Banner ── */}
      <div className="cb-op-banner cb-op-banner-admin">
        <div className="cb-op-banner-left">
          <div className="cb-op-banner-icon cb-op-banner-icon-admin">
            <Icon d={Icons.shield} size={24} />
          </div>
          <div className="cb-op-banner-details">
            <div className="cb-op-banner-title-row">
              <h2 className="cb-op-banner-title">Admin Management Panel</h2>
              <span className="cb-op-visibility-badge">
                <span className="cb-op-dot" />
                {data.visibility || 'PUBLIC'}
              </span>
            </div>
            <p className="cb-op-banner-sub">
              Manage member access, approve requests, and monitor project files for <strong>{data.folderName}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* ── 2. Statistics Grid ── */}
      <div className="cb-op-stats-grid">
        <StatCard
          icon={Icons.users}
          label="Total Members"
          value={data.totalMembers}
          bg="rgba(124, 58, 237, 0.1)"
          color="#7c3aed"
        />
        <StatCard
          icon={Icons.clock}
          label="Pending Requests"
          value={data.pendingJoinRequests}
          bg="rgba(245, 158, 11, 0.1)"
          color="#d97706"
        />
        <StatCard
          icon={Icons.file}
          label="Files in Workspace"
          value={data.filesCount}
          bg="rgba(59, 130, 246, 0.1)"
          color="#3b82f6"
        />
        <StatCard
          icon={Icons.hdd}
          label="Storage Used"
          value={formatBytes(data.storageUsed)}
          bg="rgba(16, 185, 129, 0.1)"
          color="#10b981"
        />
      </div>

      {/* ── 3. Restricted Notice Pill ── */}
      <div className="cb-op-notice">
        <div className="cb-op-notice-icon">
          <Icon d={Icons.lock} size={15} />
        </div>
        <p className="cb-op-notice-text">
          As an <strong>Admin</strong>, you can remove Editors/Viewers and manage join requests. Project ownership and invite code administration are managed by the Project Owner.
        </p>
      </div>

      {/* ── 4. Tabs Navigation ── */}
      <div className="cb-op-tabs-bar">
        <button
          type="button"
          className={`cb-op-tab ${activeTab === 'members' ? 'active' : ''}`}
          onClick={() => setActiveTab('members')}
        >
          <Icon d={Icons.users} size={15} />
          <span>Members ({allMembers.length + 1})</span>
        </button>
        <button
          type="button"
          className={`cb-op-tab ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          <Icon d={Icons.clock} size={15} />
          <span>Pending Requests ({data.pendingRequests?.length || 0})</span>
        </button>
      </div>

      {/* ── 5. Members Tab Table ── */}
      {activeTab === 'members' && (
        <div className="cb-op-table-container">
          <table className="cb-op-table">
            <thead>
              <tr>
                <th style={{ width: '40%' }}>Member</th>
                <th style={{ width: '22%' }}>Role</th>
                <th style={{ width: '20%' }}>Joined</th>
                <th style={{ width: '18%', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Owner Row */}
              <tr className="cb-op-row-owner">
                <td>
                  <div className="cb-op-member-cell">
                    <div className="cb-op-avatar cb-op-avatar-owner">
                      {data.owner?.name?.[0]?.toUpperCase() || 'O'}
                    </div>
                    <div className="cb-op-member-meta">
                      <div className="cb-op-member-name">
                        <span>{data.owner?.name || 'Project Owner'}</span>
                      </div>
                      <span className="cb-op-member-email">{data.owner?.email}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <RoleBadge role="OWNER" />
                </td>
                <td className="cb-op-cell-muted">—</td>
                <td style={{ textAlign: 'right' }}>
                  <span className="cb-op-cell-dim">Cannot modify</span>
                </td>
              </tr>

              {/* Members List */}
              {allMembers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="cb-op-empty-cell">
                    <div className="cb-op-empty-wrap">
                      <Icon d={Icons.users} size={24} style={{ color: 'var(--text-dim)' }} />
                      <p>No team members have joined this workspace yet.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                allMembers.map((m) => {
                  const isRemovable = m.role === 'EDITOR' || m.role === 'VIEWER';
                  return (
                    <tr key={m.userId} className="cb-op-table-row">
                      <td>
                        <div className="cb-op-member-cell">
                          <div className="cb-op-avatar">
                            {m.name?.[0]?.toUpperCase() || 'M'}
                          </div>
                          <div className="cb-op-member-meta">
                            <span className="cb-op-member-name">{m.name}</span>
                            <span className="cb-op-member-email">{m.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <RoleBadge role={m.role} />
                      </td>
                      <td className="cb-op-cell-muted">{formatDate(m.joinedAt)}</td>
                      <td style={{ textAlign: 'right' }}>
                        {isRemovable ? (
                          <button
                            type="button"
                            className="cb-op-action-btn cb-op-remove-btn"
                            onClick={() => handleRemove(m.userId, m.name)}
                            disabled={busy}
                            title="Remove Member"
                          >
                            <Icon d={Icons.trash} size={13} />
                            <span>Remove</span>
                          </button>
                        ) : (
                          <span className="cb-op-cell-dim">Cannot modify</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── 6. Pending Requests Tab ── */}
      {activeTab === 'requests' && (
        <div className="cb-op-requests-container">
          {!data.pendingRequests || data.pendingRequests.length === 0 ? (
            <div className="cb-op-empty-requests">
              <div className="cb-op-empty-icon-box">
                <Icon d={Icons.clock} size={28} />
              </div>
              <h4 className="cb-op-empty-title">No pending requests</h4>
              <p className="cb-op-empty-desc">
                When users request access to join this workspace, their requests will appear here for your approval.
              </p>
            </div>
          ) : (
            <div className="cb-op-requests-list">
              {data.pendingRequests.map((req) => (
                <div key={req.id} className="cb-op-request-card">
                  <div className="cb-op-member-cell">
                    <div className="cb-op-avatar cb-op-avatar-req">
                      {req.name?.[0]?.toUpperCase() || 'R'}
                    </div>
                    <div className="cb-op-member-meta">
                      <span className="cb-op-member-name">{req.name}</span>
                      <span className="cb-op-member-email">{req.email}</span>
                      <span className="cb-op-req-time">Requested {formatDate(req.requestedAt)}</span>
                    </div>
                  </div>

                  <div className="cb-op-request-actions">
                    <button
                      type="button"
                      className="btn btn-primary btn-sm cb-op-approve-btn"
                      onClick={() => handleApprove(req.id)}
                      disabled={busy}
                    >
                      <Icon d={Icons.check} size={14} />
                      <span>Approve</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm cb-op-reject-btn"
                      onClick={() => handleReject(req.id)}
                      disabled={busy}
                    >
                      <Icon d={Icons.close} size={13} />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default AdminPanel;
