import React, { useState } from 'react';
import axios from '../api/axios';
<<<<<<< HEAD
import { UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';
=======
>>>>>>> main

const JoinSharedFolder = ({ onJoined }) => {
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      const res = await axios.post('api/folder/join', { inviteCode: inviteCode.trim() });
<<<<<<< HEAD
      setMessage({ text: res.data.message || 'Join request sent successfully! Awaiting owner/admin approval.', type: 'success' });
=======
      setMessage({ text: res.data.message || 'Join request sent successfully!', type: 'success' });
>>>>>>> main
      setInviteCode('');
      if (onJoined) onJoined(res.data.data || res.data);
    } catch (err) {
      setMessage({
<<<<<<< HEAD
        text: err.response?.data?.error || err.response?.data?.message || 'Failed to join folder',
=======
        text: err.response?.data?.error || err.response?.data?.message || 'Failed to join project',
>>>>>>> main
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
<<<<<<< HEAD
    <div className="shared-view-panel">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(2, 132, 199, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-cyan)' }}>
          <UserPlus size={18} />
        </div>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-heading)' }}>Join Shared Workspace</h3>
          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Enter an invite code provided by a workspace Owner or Admin.</p>
        </div>
      </div>

      <form onSubmit={handleJoin} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <input
          type="text"
          className="input-field"
          placeholder="Enter 8-character invite code (e.g. CBX-8912)"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          required
          style={{ flex: '1', minWidth: '240px', fontFamily: 'var(--font-mono)' }}
        />
        <button type="submit" className="btn btn-primary btn-glow" disabled={loading}>
          {loading ? 'Submitting...' : 'Join Workspace'}
        </button>
      </form>

      {message.text && (
        <div style={{
          marginTop: '14px',
          padding: '12px 14px',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: message.type === 'error' ? 'rgba(225, 29, 72, 0.1)' : 'rgba(5, 150, 105, 0.1)',
          border: `1px solid ${message.type === 'error' ? 'rgba(225, 29, 72, 0.25)' : 'rgba(5, 150, 105, 0.25)'}`,
          color: message.type === 'error' ? 'var(--accent-rose)' : 'var(--accent-emerald)'
        }}>
          {message.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          <span>{message.text}</span>
        </div>
=======
    <div className="shared-folder-card">
      <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <input
          type="text"
          className="input-field"
          placeholder="Enter Invite Code..."
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          required
          autoFocus
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Joining...' : 'Join Project'}
          </button>
        </div>
      </form>

      {message.text && (
        <p className={message.type === 'error' ? 'error-msg' : 'success-msg'} style={{ marginTop: '10px' }}>
          {message.text}
        </p>
>>>>>>> main
      )}
    </div>
  );
};

export default JoinSharedFolder;
