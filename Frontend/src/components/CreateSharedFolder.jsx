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
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to create shared folder');
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
      <h3>Create Shared Folder</h3>
      <form onSubmit={handleCreate}>
        <input
          type="text"
          className="input-field"
          placeholder="Folder Name"
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          required
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Creating...' : 'Create Shared Folder'}
        </button>
      </form>

      {error && <p className="error-msg">{error}</p>}

      {inviteCode && (
        <div className="invite-code-container">
          <p><strong>Invite Code:</strong> <code>{inviteCode}</code></p>
          <button type="button" className="btn btn-secondary" onClick={handleCopy}>
            {copied ? 'Copied!' : 'Copy Invite Code'}
          </button>
        </div>
      )}
    </div>
  );
};

export default CreateSharedFolder;
