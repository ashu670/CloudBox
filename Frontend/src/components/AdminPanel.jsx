import React, { useState, useEffect, useCallback } from 'react';
import axios from '../api/axios';
import { formatBytes, formatDate } from '../utils/formatters';

/* ─── icon helper ─────────────────────────────────────────────────────────── */
const Icon = ({ d, size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}>
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
};

/* ─── role badge ──────────────────────────────────────────────────────────── */
const RoleBadge = ({ role }) => {
  const map = {
    OWNER:  { bg: '#fef3c7', color: '#b45309', border: '#fde68a' },
    ADMIN:  { bg: '#ede9fe', color: '#6d28d9', border: '#ddd6fe' },
    EDITOR: { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' },
    VIEWER: { bg: '#f0f9ff', color: '#0369a1', border: '#bae6fd' },
  };
  const s = map[role] || map.VIEWER;
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      padding: '2px 10px', borderRadius: '999px', fontSize: '11px',
      fontWeight: 700, letterSpacing: '0.5px', whiteSpace: 'nowrap',
      display: 'inline-block',
    }}>{role}</span>
  );
};

/* ─── stat card ───────────────────────────────────────────────────────────── */
const StatCard = ({ icon, label, value, accent }) => (
  <div className="op-stat-card" style={{ borderTop: `3px solid ${accent}` }}>
    <div className="op-stat-icon" style={{ background: accent + '18', color: accent }}>
      <Icon d={icon} size={18} />
    </div>
    <div>
      <div className="op-stat-label">{label}</div>
      <div className="op-stat-value">{value}</div>
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════════════════════════
   ADMIN PANEL
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
    setLoading(true); setError('');
    try {
      const res = await axios.get(`api/folder/admin-panel/${folderId}`,
        { headers: { Authorization: `Bearer ${token()}` } });
      setData(res.data.data);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load Admin Panel');
    } finally { setLoading(false); }
  }, [folderId]);

  useEffect(() => { fetch(); }, [fetch]);

  const act = async (fn, successMsg) => {
    setBusy(true);
    try { await fn(); onNotify?.(successMsg, 'success'); await fetch(); onRefresh?.(); }
    catch (e) { onNotify?.(e.response?.data?.error || 'Action failed', 'error'); }
    finally { setBusy(false); }
  };

  const handleRemove = (userId, name) => {
    if (!window.confirm(`Remove member ${name} from this folder?`)) return;
    act(() => axios.delete(`api/folder/members/${folderId}/${userId}`,
      { headers: { Authorization: `Bearer ${token()}` } }),
    `${name} removed`);
  };

  const handleApprove = (id) =>
    act(() => axios.patch('api/folder/request/approve', { requestId: id, folderId },
      { headers: { Authorization: `Bearer ${token()}` } }), 'Request approved');

  const handleReject = (id) =>
    act(() => axios.patch('api/folder/request/reject', { requestId: id, folderId },
      { headers: { Authorization: `Bearer ${token()}` } }), 'Request rejected');

  /* ── render ── */
  if (loading) return (
    <div className="op-center-state">
      <div className="op-spinner" />
      <span>Loading Admin Panel…</span>
    </div>
  );
  if (error) return (
    <div className="op-center-state op-error-state">
      <Icon d={Icons.shield} size={32} />
      <span>{error}</span>
    </div>
  );
  if (!data) return null;

  const allMembers = [...(data.admins || []), ...(data.members || [])];

  return (
    <div className="op-root">

      {/* ── Banner ── */}
      <div className="op-banner op-banner-admin">
        <div className="op-banner-icon"><Icon d={Icons.shield} size={22} /></div>
        <div>
          <div className="op-banner-title">Admin Panel</div>
          <div className="op-banner-sub">{data.folderName}</div>
        </div>
        <div className="op-banner-badge">{data.visibility}</div>
      </div>

      {/* ── Stats ── */}
      <div className="op-stats-row">
        <StatCard icon={Icons.users}  label="Total Members"    value={data.totalMembers}            accent="#6d28d9" />
        <StatCard icon={Icons.clock}  label="Pending Requests" value={data.pendingJoinRequests}      accent="#d97706" />
        <StatCard icon={Icons.file}   label="Files"            value={data.filesCount}               accent="#0369a1" />
        <StatCard icon={Icons.hdd}    label="Storage Used"     value={formatBytes(data.storageUsed)} accent="#15803d" />
      </div>

      {/* ── Restricted Notice ── */}
      <div className="op-notice">
        <Icon d={Icons.lock} size={14} />
        <span>As an Admin you can remove <strong>Members</strong> and manage join requests. Owner operations are restricted.</span>
      </div>

      {/* ── Tabs ── */}
      <div className="op-tabs">
        {[
          { key: 'members',  label: `Members (${allMembers.length + 1})` },
          { key: 'requests', label: `Pending (${data.pendingRequests?.length || 0})` },
        ].map(t => (
          <button key={t.key} className={`op-tab ${activeTab === t.key ? 'op-tab-active' : ''}`}
            onClick={() => setActiveTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Members Table ── */}
      {activeTab === 'members' && (
        <div className="op-table-wrap">
          <table className="op-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Role</th>
                <th>Joined</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Owner row */}
              <tr className="op-row-owner">
                <td>
                  <div className="op-member-cell">
                    <div className="op-avatar op-avatar-owner">{data.owner?.name?.[0]?.toUpperCase()}</div>
                    <div>
                      <div className="op-member-name">{data.owner?.name}</div>
                      <div className="op-member-email">{data.owner?.email}</div>
                    </div>
                  </div>
                </td>
                <td><RoleBadge role="OWNER" /></td>
                <td className="op-cell-muted">—</td>
                <td className="op-cell-muted" style={{ textAlign: 'right', fontSize: 11 }}>Cannot modify</td>
              </tr>

              {allMembers.length === 0 && (
                <tr><td colSpan={4} className="op-empty-row">No members have joined yet.</td></tr>
              )}

              {allMembers.map(m => {
                const isRemovable = m.role === 'EDITOR' || m.role === 'VIEWER';
                return (
                  <tr key={m.userId} className="op-table-row">
                    <td>
                      <div className="op-member-cell">
                        <div className="op-avatar">{m.name?.[0]?.toUpperCase()}</div>
                        <div>
                          <div className="op-member-name">{m.name}</div>
                          <div className="op-member-email">{m.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><RoleBadge role={m.role} /></td>
                    <td className="op-cell-muted">{formatDate(m.joinedAt)}</td>
                    <td style={{ textAlign: 'right' }}>
                      {isRemovable ? (
                        <button className="op-btn op-btn-danger op-btn-xs"
                          onClick={() => handleRemove(m.userId, m.name)} disabled={busy}>
                          <Icon d={Icons.trash} size={12} /> Remove
                        </button>
                      ) : (
                        <span className="op-cell-muted" style={{ fontSize: 11 }}>Cannot modify</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Pending Requests ── */}
      {activeTab === 'requests' && (
        <div className="op-requests-list">
          {(!data.pendingRequests || data.pendingRequests.length === 0) ? (
            <div className="op-empty-requests">
              <Icon d={Icons.clock} size={28} />
              <span>No pending requests</span>
            </div>
          ) : data.pendingRequests.map(req => (
            <div key={req.id} className="op-request-item">
              <div className="op-member-cell">
                <div className="op-avatar">{req.name?.[0]?.toUpperCase()}</div>
                <div>
                  <div className="op-member-name">{req.name}</div>
                  <div className="op-member-email">{req.email}</div>
                  <div className="op-member-email" style={{ marginTop: 1 }}>
                    Requested {formatDate(req.requestedAt)}
                  </div>
                </div>
              </div>
              <div className="op-row-actions">
                <button className="op-btn op-btn-success op-btn-sm" onClick={() => handleApprove(req.id)} disabled={busy}>
                  <Icon d={Icons.check} size={13} /> Approve
                </button>
                <button className="op-btn op-btn-danger-outline op-btn-sm" onClick={() => handleReject(req.id)} disabled={busy}>
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default AdminPanel;
