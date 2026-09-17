import React, { useState } from 'react';
import axios from '../api/axios';

const CreateSharedFolder = ({ onFolderCreated, onClose }) => {
  const [folderName, setFolderName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [createdName, setCreatedName] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!folderName.trim()) return;

    setLoading(true);
    setError('');
    try {
      const res = await axios.post('api/folder/create-shared', { name: folderName.trim() });
      const data = res.data.data || res.data.folder || res.data;
      const code = data?.inviteCode || res.data.inviteCode;
      setInviteCode(code || '');
      setCreatedName(folderName.trim());
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
      {!inviteCode ? (
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
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px 0' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '14px', borderRadius: '10px' }}>
            <div style={{ fontWeight: '700', color: '#10b981', marginBottom: '6px' }}>
              ✓ Project "{createdName}" created successfully!
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
              Share this invite code with teammates so they can join your workspace.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-subtle, #f1f5f9)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', display: 'block' }}>Invite Code</span>
              <code style={{ fontSize: '16px', fontWeight: '800', color: '#6366f1', letterSpacing: '1px' }}>{inviteCode}</code>
            </div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleCopy}>
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-primary" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      )}

      {error && <p className="error-msg" style={{ marginTop: '10px' }}>{error}</p>}
    </div>
  );
};

export default CreateSharedFolder;
