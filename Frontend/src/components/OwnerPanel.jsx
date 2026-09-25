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
  folder:      'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z',
  users:       'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  shield:      'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  clock:       'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
  file:        'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6',
  hdd:         'M22 12H2M22 12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v6zM6 16h.01M10 16h.01',
  key:         'M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4',
  copy:        'M20 9H11a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2z M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1',
  refresh:     'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15',
  check:       'M20 6L9 17l-5-5',
  trash:       'M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
  arrowRight:  'M5 12h14M12 5l7 7-7 7',
  toggleOn:    'M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0zM1 12h6M17 12h6',
  toggleOff:   'M7 12a5 5 0 1 1 10 0 5 5 0 0 1-10 0zM1 12h6M17 12h6',
  chevDown:    'M6 9l6 6 6-6',
  close:       'M18 6L6 18M6 6l12 12',
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

/* ─── Role Selector ──────────────────────────────────────────────────────── */
const RoleSelect = ({ value, onChange, disabled }) => (
  <div className="cb-op-role-select-wrap">
    <select
      className="cb-op-role-select"
      value={value}
      onChange={onChange}
      disabled={disabled}
    >
      <option value="ADMIN">Admin</option>
      <option value="EDITOR">Editor</option>
      <option value="VIEWER">Viewer</option>
    </select>
    <Icon d={Icons.chevDown} size={12} className="cb-op-role-chevron" />
  </div>
);

/* ══════════════════════════════════════════════════════════════════════════
   OWNER PANEL COMPONENT
══════════════════════════════════════════════════════════════════════════ */
const OwnerPanel = ({ folderId, onNotify, onRefresh, onProjectDeleted }) => {
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [copied, setCopied]       = useState(false);
  const [busy, setBusy]           = useState(false);
  const [activeTab, setActiveTab] = useState('members');

  const token = () => localStorage.getItem('accessToken');

  const fetch = useCallback(async () => {
    if (!folderId) return;
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`api/folder/owner-panel/${folderId}`, {
        headers: { Authorization: `Bearer ${token()}` }
      });
      setData(res.data.data);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load Owner Panel');
    } finally {
      setLoading(false);
    }
  }, [folderId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  /* ── Helpers ── */
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

  const handleDeleteProject = async () => {
    if (!window.confirm(`Are you sure you want to delete project "${data?.folderName || ''}"? All files and member access will be permanently deleted.`)) return;
    setBusy(true);
    try {
      await axios.delete(`api/folder/delete/${folderId}`, {
        headers: { Authorization: `Bearer ${token()}` }
      });
      onNotify?.('Project deleted successfully', 'success');
      if (onProjectDeleted) {
        onProjectDeleted();
      } else {
        onRefresh?.();
      }
    } catch (e) {
      onNotify?.(e.response?.data?.error || e.response?.data?.message || 'Failed to delete project', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = () => {
    if (!data?.currentInviteCode) return;
    navigator.clipboard.writeText(data.currentInviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onNotify?.('Invite code copied to clipboard!', 'success');
  };

  const handleRegenerate = () => {
    if (!window.confirm('Generate a new code? The current one will be invalidated immediately.')) return;
    act(
      () => axios.post('api/folder/invite/regenerate', { folderId }, { headers: { Authorization: `Bearer ${token()}` } }),
      'New invite code generated!'
    );
  };

  const handleInviteStatus = (endpoint, msg) =>
    act(
      () => axios.post(`api/folder/invite/${endpoint}`, { folderId }, { headers: { Authorization: `Bearer ${token()}` } }),
      msg
    );

  const handleRemove = (userId, name) => {
    if (!window.confirm(`Remove ${name} from this project?`)) return;
    act(
      () => axios.delete(`api/folder/members/${folderId}/${userId}`, { headers: { Authorization: `Bearer ${token()}` } }),
      `${name} removed from project`
    );
  };

  const handleRoleChange = (userId, name, newRole) =>
    act(
      () => axios.patch('api/folder/members/role', { folderId, userId, newRole }, { headers: { Authorization: `Bearer ${token()}` } }),
      `${name}'s role updated to ${newRole}`
    );

  const handleTransfer = (userId, name) => {
    if (!window.confirm(`Transfer project ownership to ${name}? You will become an Admin.`)) return;
    act(
      () => axios.patch('api/folder/transfer-ownership', { folderId, newOwnerUserId: userId }, { headers: { Authorization: `Bearer ${token()}` } }),
      `Ownership transferred to ${name}`
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
        <span>Loading Owner Panel...</span>
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
      <div className="cb-op-banner cb-op-banner-owner">
        <div className="cb-op-banner-left">
          <div className="cb-op-banner-icon">
            <Icon d={Icons.shield} size={24} />
          </div>
          <div className="cb-op-banner-details">
            <div className="cb-op-banner-title-row">
              <h2 className="cb-op-banner-title">Owner Management Panel</h2>
              <span className="cb-op-visibility-badge">
                <span className="cb-op-dot" />
                {data.visibility || 'PUBLIC'}
              </span>
            </div>
            <p className="cb-op-banner-sub">
              Manage members, permissions, access codes, and project settings for <strong>{data.folderName}</strong>
            </p>
          </div>
        </div>

        <button
          type="button"
          className="btn cb-op-btn-danger"
          onClick={handleDeleteProject}
          disabled={busy}
        >
          <Icon d={Icons.trash} size={14} />
          <span>Delete Project</span>
        </button>
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

      {/* ── 3. Invite Code Card ── */}
      <div className="cb-op-invite-card">
        <div className="cb-op-invite-left">
          <div className="cb-op-invite-icon">
            <Icon d={Icons.key} size={20} />
          </div>
          <div className="cb-op-invite-info">
            <div className="cb-op-invite-title-row">
              <span className="cb-op-invite-label">INVITE CODE</span>
              <span className={`cb-op-status-pill ${data.isInviteActive ? 'active' : 'disabled'}`}>
                {data.isInviteActive ? 'Active' : 'Disabled'}
              </span>
            </div>
            <div className="cb-op-code-box">
              <code className="cb-op-code-text">{data.currentInviteCode || '—'}</code>
            </div>
          </div>
        </div>

        <div className="cb-op-invite-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleCopy}
            disabled={!data.currentInviteCode || busy}
          >
            <Icon d={copied ? Icons.check : Icons.copy} size={14} style={{ color: copied ? '#10b981' : 'inherit' }} />
            <span>{copied ? 'Copied!' : 'Copy Code'}</span>
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleRegenerate}
            disabled={busy}
          >
            <Icon d={Icons.refresh} size={14} />
            <span>Regenerate</span>
          </button>
          {data.isInviteActive ? (
            <button
              type="button"
              className="btn btn-secondary btn-sm cb-op-btn-warn"
              onClick={() => handleInviteStatus('disable', 'Invite disabled')}
              disabled={busy}
            >
              <span>Disable</span>
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-secondary btn-sm cb-op-btn-success"
              onClick={() => handleInviteStatus('enable', 'Invite enabled')}
              disabled={busy}
            >
              <span>Enable</span>
            </button>
          )}
          <button
            type="button"
            className="btn btn-secondary btn-sm cb-op-btn-danger-outline"
            onClick={() => handleInviteStatus('expire', 'Invite code expired')}
            disabled={busy || !data.isInviteActive}
          >
            <span>Expire</span>
          </button>
        </div>
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
                        <span className="cb-op-you-badge">You</span>
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
                  <span className="cb-op-cell-dim">Workspace Owner</span>
                </td>
              </tr>

              {/* Members List */}
              {allMembers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="cb-op-empty-cell">
                    <div className="cb-op-empty-wrap">
                      <Icon d={Icons.users} size={24} style={{ color: 'var(--text-dim)' }} />
                      <p>No team members have joined this workspace yet.</p>
                      <span className="cb-op-empty-sub">Share the invite code above to collaborate with teammates.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                allMembers.map((m) => (
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
                      <RoleSelect
                        value={m.role}
                        disabled={busy}
                        onChange={(e) => handleRoleChange(m.userId, m.name, e.target.value)}
                      />
                    </td>
                    <td className="cb-op-cell-muted">{formatDate(m.joinedAt)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="cb-op-row-actions">
                        <button
                          type="button"
                          className="cb-op-action-btn cb-op-transfer-btn"
                          onClick={() => handleTransfer(m.userId, m.name)}
                          disabled={busy}
                          title="Transfer Project Ownership"
                        >
                          <Icon d={Icons.arrowRight} size={13} />
                          <span>Transfer</span>
                        </button>
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
                      </div>
                    </td>
                  </tr>
                ))
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

export default OwnerPanel;
