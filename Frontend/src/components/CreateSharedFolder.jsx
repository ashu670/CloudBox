import React, { useState } from 'react';
import axios from '../api/axios';
import { FolderPlus, Copy, Check } from 'lucide-react';

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
    <div className="shared-view-panel">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--accent-primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
          <FolderPlus size={18} />
        </div>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-heading)' }}>Create Shared Workspace</h3>
          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Create a collaborative folder with an exclusive join invite code.</p>
        </div>
      </div>

      <form onSubmit={handleCreate} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <input
          type="text"
          className="input-field"
          placeholder="e.g. Design System & Assets"
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          required
          style={{ flex: '1', minWidth: '240px' }}
        />
        <button type="submit" className="btn btn-primary btn-glow" disabled={loading}>
          {loading ? 'Creating...' : 'Create Shared Folder'}
        </button>
      </form>

      {error && (
        <div className="error-banner" style={{ marginTop: '14px' }}>
          {error}
        </div>
      )}

      {inviteCode && (
        <div style={{
          marginTop: '18px',
          padding: '16px',
          background: 'var(--accent-primary-subtle)',
          border: '1px solid var(--border-glow)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>Workspace Generated</div>
            <div style={{ fontSize: '14px', color: 'var(--text-heading)', marginTop: '2px' }}>
              Share this invite code: <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', color: 'var(--accent-primary)', letterSpacing: '1px', marginLeft: '6px' }}>{inviteCode}</strong>
            </div>
          </div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleCopy}>
            {copied ? <Check size={14} color="#059669" /> : <Copy size={14} />}
            {copied ? 'Copied to Clipboard!' : 'Copy Code'}
          </button>
        </div>
      )}
    </div>
  );
};

export default CreateSharedFolder;
