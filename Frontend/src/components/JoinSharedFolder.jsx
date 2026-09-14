import React, { useState } from 'react';
import axios from '../api/axios';

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
      setMessage({ text: res.data.message || 'Join request sent successfully!', type: 'success' });
      setInviteCode('');
      if (onJoined) onJoined(res.data.data || res.data);
    } catch (err) {
      setMessage({
        text: err.response?.data?.error || err.response?.data?.message || 'Failed to join project',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
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
      )}
    </div>
  );
};

export default JoinSharedFolder;
