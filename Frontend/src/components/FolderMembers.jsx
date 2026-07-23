import React, { useState, useEffect, useCallback } from 'react';
import axios from '../api/axios';

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

  if (loading) return <p className="shared-loading">Loading members...</p>;
  if (error) return <p className="error-msg">{error}</p>;

  return (
    <div className="folder-members-container">
      <h4>Folder Members</h4>
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
      )}
    </div>
  );
};

export default FolderMembers;
