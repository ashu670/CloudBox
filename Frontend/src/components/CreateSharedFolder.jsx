import React, { useState } from 'react';
import axios from '../api/axios';

const CreateSharedFolder = ({ onFolderCreated }) => {
  const [folderName, setFolderName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!folderName.trim()) return;

    setLoading(true);
    setError('');
    try {
      const res = await axios.post('api/folder/create-shared', { name: folderName });
      const data = res.data.data || res.data.folder || res.data;
      const code = data?.inviteCode || res.data.inviteCode;
      setInviteCode(code || '');
      setFolderName('');
      if (onFolderCreated) onFolderCreated(data);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="shared-folder-card">
      <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <input
          type="text"
          className="input-field"
          placeholder="Project Name..."
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          required
          autoFocus
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </form>

      {error && <p className="error-msg" style={{ marginTop: '10px' }}>{error}</p>}

      {inviteCode && (
        <div className="invite-code-container" style={{ marginTop: '14px' }}>
          <p style={{ margin: 0 }}><strong>Invite Code:</strong> <code>{inviteCode}</code></p>
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleCopy}>
            {copied ? 'Copied!' : 'Copy Invite Code'}
          </button>
        </div>
      )}
    </div>
  );
};

export default CreateSharedFolder;
