import React, { useState, useEffect, useCallback } from 'react';
import axios from '../api/axios';

const roleColors = {
  OWNER:  { bg: "rgba(245, 158, 11, 0.12)", color: "#d97706", border: "rgba(245, 158, 11, 0.3)" },
  ADMIN:  { bg: "rgba(139, 92, 246, 0.12)", color: "#8b5cf6", border: "rgba(139, 92, 246, 0.3)" },
  EDITOR: { bg: "rgba(16, 185, 129, 0.12)", color: "#10b981", border: "rgba(16, 185, 129, 0.3)" },
  VIEWER: { bg: "rgba(59, 130, 246, 0.12)", color: "#3b82f6", border: "rgba(59, 130, 246, 0.3)" },
};

const FolderMembers = ({ folderId }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
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

  if (loading) {
    return (
      <div className="cb-members-loading">
        <div className="spinner" />
        <span>Loading project members...</span>
      </div>
    );
  }

  if (error) {
    return <div className="cb-members-error">{error}</div>;
  }

  return (
    <div className="cb-members-panel">
      <div className="cb-members-panel-header">
        <div>
          <h3 className="cb-members-title">Project Members</h3>
          <p className="cb-members-subtitle">
            All team members and collaborators in this workspace ({members.length})
          </p>
        </div>
      </div>

      {members.length === 0 ? (
        <div className="cb-members-empty">No members found in this project.</div>
      ) : (
        <div className="cb-members-list">
          {members.map((member) => {
            const name = member.name || member.user?.name || member.email?.split('@')[0] || 'User';
            const email = member.email || member.user?.email || '';
            const role = (member.role || 'VIEWER').toUpperCase();
            const badge = roleColors[role] || roleColors.VIEWER;
            const initials = name.slice(0, 2).toUpperCase();

            return (
              <div key={member.userId || member.id || member._id || email} className="cb-member-row">
                <div className="cb-member-avatar">{initials}</div>
                <div className="cb-member-details">
                  <span className="cb-member-name">{name}</span>
                  {email && <span className="cb-member-email">{email}</span>}
                </div>
                <div className="cb-member-role-badge" style={{ background: badge.bg, color: badge.color, borderColor: badge.border }}>
                  {role}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FolderMembers;
