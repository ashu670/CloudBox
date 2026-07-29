import React, { useState, useEffect, useCallback } from 'react';
import axios from '../api/axios';
import { formatBytes, formatDate } from '../utils/formatters';

/* ─── tiny icon helpers ─────────────────────────────────────────────────── */
const Icon = ({ d, size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}>
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
};

/* ─── role badge ─────────────────────────────────────────────────────────── */
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

/* ─── stat card ──────────────────────────────────────────────────────────── */
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

/* ─── role selector ──────────────────────────────────────────────────────── */
const RoleSelect = ({ value, onChange, disabled }) => (
  <div className="op-role-select-wrap">
    <select className="op-role-select" value={value} onChange={onChange} disabled={disabled}>
      <option value="ADMIN">Admin</option>
      <option value="EDITOR">Editor</option>
      <option value="VIEWER">Viewer</option>
    </select>
    <Icon d={Icons.chevDown} size={12} className="op-role-chevron" />
  </div>
);

/* ══════════════════════════════════════════════════════════════════════════
   OWNER PANEL
══════════════════════════════════════════════════════════════════════════ */
const OwnerPanel = ({ folderId, onNotify, onRefresh }) => {
  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [copied, setCopied]         = useState(false);
  const [busy, setBusy]             = useState(false);
  const [activeTab, setActiveTab]   = useState('members');

  const token = () => localStorage.getItem('accessToken');

  const fetch = useCallback(async () => {
    if (!folderId) return;
    setLoading(true); setError('');
    try {
      const res = await axios.get(`api/folder/owner-panel/${folderId}`,
        { headers: { Authorization: `Bearer ${token()}` } });
      setData(res.data.data);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load Owner Panel');
    } finally { setLoading(false); }
  }, [folderId]);

  useEffect(() => { fetch(); }, [fetch]);

  /* ── helpers ── */
  const act = async (fn, successMsg) => {
    setBusy(true);
    try { await fn(); onNotify?.(successMsg, 'success'); await fetch(); onRefresh?.(); }
    catch (e) { onNotify?.(e.response?.data?.error || 'Action failed', 'error'); }
    finally { setBusy(false); }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(data.currentInviteCode);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
    onNotify?.('Invite code copied!', 'success');
  };

  const handleRegenerate = () => {
    if (!window.confirm('Generate a new code? The current one will be invalidated immediately.')) return;
    act(() => axios.post('api/folder/invite/regenerate', { folderId },
      { headers: { Authorization: `Bearer ${token()}` } }),
    'New invite code generated!');
  };

  const handleInviteStatus = (endpoint, msg) =>
    act(() => axios.post(`api/folder/invite/${endpoint}`, { folderId },
      { headers: { Authorization: `Bearer ${token()}` } }), msg);

  const handleRemove = (userId, name) => {
    if (!window.confirm(`Remove ${name} from this folder?`)) return;
    act(() => axios.delete(`api/folder/members/${folderId}/${userId}`,
      { headers: { Authorization: `Bearer ${token()}` } }),
    `${name} removed`);
  };

  const handleRoleChange = (userId, name, newRole) =>
    act(() => axios.patch('api/folder/members/role', { folderId, userId, newRole },
      { headers: { Authorization: `Bearer ${token()}` } }),
    `${name}'s role changed to ${newRole}`);

  const handleTransfer = (userId, name) => {
    if (!window.confirm(`Transfer ownership to ${name}? You will become an Admin.`)) return;
    act(() => axios.patch('api/folder/transfer-ownership', { folderId, newOwnerUserId: userId },
      { headers: { Authorization: `Bearer ${token()}` } }),
    `Ownership transferred to ${name}`);
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
      <span>Loading Owner Panel…</span>
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
      <div className="op-banner op-banner-owner">
        <div className="op-banner-icon"><Icon d={Icons.shield} size={22} /></div>
        <div>
          <div className="op-banner-title">Owner Panel</div>
          <div className="op-banner-sub">{data.folderName}</div>
        </div>
        <div className="op-banner-badge">{data.visibility}</div>
      </div>

      {/* ── Stats ── */}
      <div className="op-stats-row">
        <StatCard icon={Icons.users}  label="Total Members"    value={data.totalMembers}          accent="#6d28d9" />
        <StatCard icon={Icons.clock}  label="Pending Requests" value={data.pendingJoinRequests}    accent="#d97706" />
        <StatCard icon={Icons.file}   label="Files"            value={data.filesCount}             accent="#0369a1" />
        <StatCard icon={Icons.hdd}    label="Storage Used"     value={formatBytes(data.storageUsed)} accent="#15803d" />
      </div>

      {/* ── Invite Card ── */}
      <div className="op-invite-card">
        <div className="op-invite-left">
          <div className="op-invite-icon"><Icon d={Icons.key} size={18} /></div>
          <div>
            <div className="op-invite-label">Invite Code</div>
            <div className="op-invite-code">{data.currentInviteCode || '—'}</div>
          </div>
          <span className={`op-invite-status ${data.isInviteActive ? 'op-status-active' : 'op-status-off'}`}>
            {data.isInviteActive ? 'Active' : 'Disabled'}
          </span>
        </div>
        <div className="op-invite-actions">
          <button className="op-btn op-btn-ghost" onClick={handleCopy} disabled={!data.currentInviteCode || busy}>
            <Icon d={copied ? Icons.check : Icons.copy} size={14} />
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button className="op-btn op-btn-outline" onClick={handleRegenerate} disabled={busy}>
            <Icon d={Icons.refresh} size={14} /> Regenerate
          </button>
          {data.isInviteActive ? (
            <button className="op-btn op-btn-danger-outline" onClick={() => handleInviteStatus('disable', 'Invite disabled')} disabled={busy}>
              Disable
            </button>
          ) : (
            <button className="op-btn op-btn-success-outline" onClick={() => handleInviteStatus('enable', 'Invite enabled')} disabled={busy}>
              Enable
            </button>
          )}
          <button className="op-btn op-btn-danger-outline" onClick={() => handleInviteStatus('expire', 'Invite expired')} disabled={busy || !data.isInviteActive}>
            Expire
          </button>
        </div>
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
                      <div className="op-member-name">{data.owner?.name} <span className="op-you-label">you</span></div>
                      <div className="op-member-email">{data.owner?.email}</div>
                    </div>
                  </div>
                </td>
                <td><RoleBadge role="OWNER" /></td>
                <td className="op-cell-muted">—</td>
                <td />
              </tr>
              {/* Other members */}
              {allMembers.length === 0 && (
                <tr>
                  <td colSpan={4} className="op-empty-row">
                    No members have joined yet. Share the invite code.
                  </td>
                </tr>
              )}
              {allMembers.map(m => (
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
                  <td>
                    <RoleSelect value={m.role} disabled={busy}
                      onChange={e => handleRoleChange(m.userId, m.name, e.target.value)} />
                  </td>
                  <td className="op-cell-muted">{formatDate(m.joinedAt)}</td>
                  <td>
                    <div className="op-row-actions">
                      <button className="op-btn op-btn-ghost op-btn-xs"
                        onClick={() => handleTransfer(m.userId, m.name)} disabled={busy}>
                        <Icon d={Icons.arrowRight} size={12} /> Transfer
                      </button>
                      <button className="op-btn op-btn-danger op-btn-xs"
                        onClick={() => handleRemove(m.userId, m.name)} disabled={busy}>
                        <Icon d={Icons.trash} size={12} /> Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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

export default OwnerPanel;
