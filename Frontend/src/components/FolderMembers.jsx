import React, { useState, useEffect, useCallback } from 'react';
import axios from '../api/axios';
<<<<<<< HEAD
import { Users, User, Shield, ShieldAlert, Edit3, Eye } from 'lucide-react';
=======
>>>>>>> main

const FolderMembers = ({ folderId }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchMembers = useCallback(async () => {
    if (!folderId) return;
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`api/folder/members/${folderId}`);
      const list = res.data.data || res.data.members || res.data;
      setMembers(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to fetch members');
    } finally {
      setLoading(false);
    }
  }, [folderId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

<<<<<<< HEAD
  const getRoleBadge = (role) => {
    const roleMap = {
      OWNER: { bg: 'rgba(217, 119, 6, 0.12)', color: 'var(--accent-amber)', border: 'rgba(217, 119, 6, 0.25)', icon: <Shield size={12} /> },
      ADMIN: { bg: 'var(--accent-primary-subtle)', color: 'var(--accent-primary)', border: 'var(--border-glow)', icon: <ShieldAlert size={12} /> },
      EDITOR: { bg: 'rgba(5, 150, 105, 0.12)', color: 'var(--accent-emerald)', border: 'rgba(5, 150, 105, 0.25)', icon: <Edit3 size={12} /> },
      VIEWER: { bg: 'rgba(2, 132, 199, 0.12)', color: 'var(--accent-cyan)', border: 'rgba(2, 132, 199, 0.25)', icon: <Eye size={12} /> },
    };
    const current = roleMap[role] || roleMap.VIEWER;
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        background: current.bg,
        color: current.color,
        border: `1px solid ${current.border}`,
        padding: '3px 10px',
        borderRadius: '999px',
        fontSize: '11px',
        fontWeight: 700
      }}>
        {current.icon} {role}
      </span>
    );
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>Loading members list...</div>;
  if (error) return <div className="error-banner">{error}</div>;

  return (
    <div className="shared-view-panel">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--accent-primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
          <Users size={18} />
        </div>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-heading)' }}>Workspace Members</h3>
          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>All active collaborators and their assigned permissions in this folder.</p>
        </div>
      </div>

      {members.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px 20px', background: 'var(--bg-subtle)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No members found for this workspace.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          {members.map((member) => (
            <div
              key={member.userId || member.id || member._id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                padding: '14px 16px',
                borderRadius: '12px',
                boxShadow: 'var(--shadow-xs)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent-primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)', flexShrink: 0 }}>
                  <User size={16} />
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-heading)', fontSize: '13.5px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {member.name || member.user?.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {member.email || member.user?.email}
                  </div>
                </div>
              </div>
              <div>
                {getRoleBadge(member.role)}
              </div>
            </div>
          ))}
        </div>
=======
  if (loading) return <p className="shared-loading">Loading members...</p>;
  if (error) return <p className="error-msg">{error}</p>;

  return (
    <div className="folder-members-container">
      <h4>Project Members</h4>
      {members.length === 0 ? (
        <p className="shared-empty">No members found.</p>
      ) : (
        <ul className="members-list">
          {members.map((member) => (
            <li key={member.userId || member.id || member._id} className="member-card">
              <div>
                <strong>{member.name || member.user?.name}</strong>
                <p>{member.email || member.user?.email}</p>
              </div>
              <span className="role-tag">{member.role}</span>
            </li>
          ))}
        </ul>
>>>>>>> main
      )}
    </div>
  );
};

export default FolderMembers;
