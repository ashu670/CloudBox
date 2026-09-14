import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Zap,
  FolderTree,
  Users,
  Eye,
  FileCode,
  Lock,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  ChevronDown,
  HardDrive,
  Share2,
  Layers,
  FileText,
  Video,
  Music,
  Image as ImageIcon,
  Clock,
  KeyRound,
  Cloud,
  Check,
  X,
  Search,
  Download,
  FolderPlus,
  Shield,
  Activity,
  ChevronRight,
  Copy,
  Terminal,
  Database,
  RefreshCw,
  Cpu
} from 'lucide-react';
import bgVideo from '../assets/vd1.mp4';

export default function Landing() {
  const [activeFaq, setActiveFaq] = useState(null);
  const [activeRoleTab, setActiveRoleTab] = useState('OWNER');
  const [activeDemoFolder, setActiveDemoFolder] = useState('assets');
  const [filterQuery, setFilterQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeFormatTab, setActiveFormatTab] = useState('code');

<<<<<<< HEAD
=======
  const generateRandomInviteCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "CBX-";
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const [inviteCode, setInviteCode] = useState(() => generateRandomInviteCode());

>>>>>>> main
  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

<<<<<<< HEAD
  const handleCopyCode = () => {
    navigator.clipboard.writeText('CBX-7942');
=======
  const handleCopyCode = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(inviteCode);
      }
    } catch {
      // fallback
    }
>>>>>>> main
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

<<<<<<< HEAD
=======
  const handleRegenerateCode = () => {
    setInviteCode(generateRandomInviteCode());
    setCopiedCode(false);
  };

>>>>>>> main
  const demoFolderData = {
    assets: [
      { name: 'enterprise-architecture-v2.pdf', meta: '4.2 MB • Updated 2m ago', type: 'pdf', action: 'Stream' },
      { name: 'product-walkthrough-4k.mp4', meta: '18.6 MB • 60 FPS HDR', type: 'video', action: 'Play' },
      { name: 'auth-service-cluster.ts', meta: '128 KB • TypeScript', type: 'code', action: 'View' },
      { name: 'brand-identity-vector.svg', meta: '52 KB • Vector Asset', type: 'image', action: 'Get' },
    ],
    docs: [
      { name: 'api-specifications-v3.md', meta: '240 KB • REST / GraphQL', type: 'code', action: 'View' },
      { name: 'security-whitepaper-aes256.pdf', meta: '1.8 MB • Compliance', type: 'pdf', action: 'Stream' },
      { name: 'team-onboarding-sop.pdf', meta: '3.1 MB • Updated today', type: 'pdf', action: 'Stream' },
      { name: 'database-migration-plan.sql', meta: '85 KB • PostgreSQL', type: 'code', action: 'View' },
    ],
    media: [
      { name: 'launch-keynote-4k.mp4', meta: '120 MB • 4K UHD Pro', type: 'video', action: 'Play' },
      { name: 'podcast-episode-04.mp3', meta: '48 MB • 320kbps Audio', type: 'audio', action: 'Listen' },
      { name: 'ui-design-screens-highres.png', meta: '8.4 MB • Retina 2x', type: 'image', action: 'Inspect' },
      { name: 'brand-motion-intro.mov', meta: '64 MB • ProRes 422', type: 'video', action: 'Play' },
    ],
    code: [
      { name: 'distributed-worker-pool.go', meta: '34 KB • Go 1.22', type: 'code', action: 'View' },
      { name: 'encryption-engine-aes.rs', meta: '92 KB • Rust Crates', type: 'code', action: 'View' },
      { name: 'docker-compose.prod.yml', meta: '12 KB • Orchestration', type: 'code', action: 'Inspect' },
      { name: 'schema.prisma', meta: '8 KB • Prisma ORM', type: 'code', action: 'View' },
    ]
  };

  const filteredFiles = (demoFolderData[activeDemoFolder] || []).filter(f =>
    f.name.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const roleInfo = {
    OWNER: {
      badge: 'OWNER (Full Workspace Control)',
      desc: 'Create subfolders, delete items, toggle invite codes, promote Admins, approve/reject requests, and transfer ownership.',
      color: '#f59e0b',
      perms: ['Full Folder Hierarchy', 'Manage Role Permissions', 'Revoke Invite Keys', 'Transfer Ownership', 'Live Audit Trail']
    },
    ADMIN: {
      badge: 'ADMIN (Management & Operations)',
      desc: 'Approve join requests, manage Editor and Viewer roles, upload/delete files, and inspect folder activity logs.',
      color: '#8b5cf6',
      perms: ['Upload & Delete Files', 'Approve Join Requests', 'Manage Editors/Viewers', 'Inspect Activity Logs']
    },
    EDITOR: {
      badge: 'EDITOR (Active Collaborator)',
      desc: 'Upload new files, organize directory items, preview documents, and download files with collaborative write access.',
      color: '#10b981',
      perms: ['Upload Files', 'Organize Folder Items', 'Download Assets', 'In-Browser Previews']
    },
    VIEWER: {
      badge: 'VIEWER (Zero-Alteration Read-Only)',
      desc: 'Zero alteration access. Stream and preview in-browser media, inspect folder trees, and download files securely.',
      color: '#06b6d4',
      perms: ['Browse Folder Structure', 'Stream Audio & Video', 'View Code & Documents', 'Secure Downloads']
    }
  };

  const faqs = [
    {
      q: 'What makes CloudBox different from standard cloud storage drives?',
      a: 'CloudBox is purpose-built for fast-moving teams and developers. It features a hierarchical directory tree with drag-and-drop file organization, granular role hierarchies (Owner, Admin, Editor, Viewer), invite-code approval workflows, and in-browser multi-format media streaming without mandatory downloads.'
    },
    {
      q: 'How do shared folders and invite codes work?',
      a: 'When an Owner generates a shared folder, an exclusive invite code is generated. Other team members submit this invite code from their dashboard, and Owners/Admins can approve or decline requests in real time from the folder request drawer.'
    },
    {
      q: 'Can I preview files in the browser before downloading?',
      a: 'Yes! CloudBox supports instant rich previews for PDFs, high-resolution images, full-length HTML5 video, audio tracks, and source code files with syntax styling.'
    },
    {
      q: 'Is my data secure and encrypted?',
      a: 'Every file uploaded to CloudBox is protected with industry-standard AES-256 encryption at rest and TLS 1.3 in transit. Role-based authorization ensures users only access files they are explicitly approved for.'
    },
    {
      q: 'Does CloudBox support single sign-on with Google?',
      a: 'Absolutely. You can sign up with email and password or use one-click Google OAuth authentication.'
    }
  ];

  return (
    <div className="landing-page">

      {/* ============================================================
          HERO — Full Viewport Video Background (Reference Site Style)
          ============================================================ */}
      <section className="hero-section">
        {/* Background Video */}
        <video
          className="hero-video-bg"
          src={bgVideo}
          autoPlay
          loop
          muted
          playsInline
        />
        {/* Translucent Dark Overlay — lets video breathe, keeps text legible */}
        <div className="hero-video-overlay" />

        {/* Hero Content */}
        <div className="hero-content-wrapper">
          <div className="hero-inner">

            <div className="hero-badge-pill">
              <Sparkles size={14} />
              <span>CloudBox 2.5 Enterprise — Zero-Latency Hierarchical Storage</span>
            </div>

            <h1 className="hero-title">
              Cloud Storage Built for<br />
              <span className="hero-title-accent">High-Velocity Teams</span>
            </h1>

            <p className="hero-subtitle">
              Organize nested folder trees, collaborate with granular role-based permissions,
              stream multimedia directly in-browser, and audit activity trails in real-time.
            </p>

            <div className="hero-cta-row">
              <Link to="/signup" className="btn-hero-primary">
                Get Started Free <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="btn-hero-ghost">
                Sign In to Workspace
              </Link>
            </div>

            {/* Stats row */}
            <div className="hero-stats-row">
              <div className="hero-stat">
                <span className="hero-stat-val">99.999%</span>
                <span className="hero-stat-label">Uptime</span>
              </div>
              <div className="hero-stat-divider" />
              <div className="hero-stat">
                <span className="hero-stat-val">&lt;15ms</span>
                <span className="hero-stat-label">Stream Latency</span>
              </div>
              <div className="hero-stat-divider" />
              <div className="hero-stat">
                <span className="hero-stat-val">AES-256</span>
                <span className="hero-stat-label">Encryption</span>
              </div>
              <div className="hero-stat-divider" />
              <div className="hero-stat">
                <span className="hero-stat-val">100%</span>
                <span className="hero-stat-label">Audit Trail</span>
              </div>
            </div>

          </div>

          {/* Glassmorphic Console — floats over the video */}
          <div className="hero-console-glass">
            {/* Console Top Bar */}
            <div className="console-top-bar">
              <div className="window-dots">
                <span className="dot red"></span>
                <span className="dot yellow"></span>
                <span className="dot green"></span>
              </div>
              <div className="console-title-text">
                <Shield size={12} className="console-status-icon" />
                <span>cloudbox-enterprise-vault // secure-tree-v2.5</span>
                <span className="console-badge-secure">ENCRYPTED</span>
              </div>
              <div className="console-status-pill">
                <span className="live-dot-pulse"></span> LIVE
              </div>
            </div>

            {/* Console Body */}
            <div className="console-body-grid">
              {/* Sidebar */}
              <div className="console-sidebar-mock">
                <div className="console-sidebar-header">
                  <span>DIRECTORY</span>
                  <FolderPlus size={12} className="console-add-icon" />
                </div>
                <div className="console-tree-nodes">
                  {[
                    { key: 'assets', icon: <FolderTree size={13} />, label: '📁 Production Assets' },
                    { key: 'docs', icon: <FileText size={13} />, label: '📄 Design Specs' },
                    { key: 'media', icon: <Video size={13} />, label: '🎬 4K Media Stream' },
                    { key: 'code', icon: <FileCode size={13} />, label: '⚡ Backend API' },
                  ].map(item => (
                    <div
                      key={item.key}
                      className={`console-node ${activeDemoFolder === item.key ? 'active' : ''}`}
                      onClick={() => setActiveDemoFolder(item.key)}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Files */}
              <div className="console-files-mock">
                <div className="console-files-header">
                  <span>EXPLORER ({filteredFiles.length})</span>
                  <div className="console-search-pill">
                    <Search size={11} />
                    <input
                      type="text"
                      placeholder="Filter..."
                      value={filterQuery}
                      onChange={(e) => setFilterQuery(e.target.value)}
                      className="console-search-input"
                    />
                  </div>
                </div>
                <div className="console-files-list">
                  {filteredFiles.map((file, idx) => (
                    <div key={idx} className="console-file-row">
                      <div className="console-file-info">
                        <div className={`console-file-icon ${file.type}`}>
                          {file.type === 'pdf' && <FileText size={14} />}
                          {file.type === 'video' && <Video size={14} />}
                          {file.type === 'code' && <FileCode size={14} />}
                          {file.type === 'image' && <ImageIcon size={14} />}
                          {file.type === 'audio' && <Music size={14} />}
                        </div>
                        <div>
                          <div className="console-file-name">{file.name}</div>
                          <div className="console-file-meta">{file.meta}</div>
                        </div>
                      </div>
                      <span className="console-file-action">
                        <Eye size={12} /> {file.action}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="console-stats-mock">
                <div className="console-stats-card">
                  <div className="console-stats-label">VAULT USAGE</div>
                  <div className="console-stats-val">1.28 TB<span className="console-stats-sub"> / 2TB</span></div>
                  <div className="console-progress-bar">
                    <div className="console-progress-fill" style={{ width: '64%' }}></div>
                  </div>
                </div>
                <div className="console-activity-card">
                  <div className="console-stats-label">ACTIVITY</div>
                  <div className="console-activity-item">
                    <span className="activity-badge up">UP</span>
                    <span>architecture.pdf</span>
                  </div>
                  <div className="console-activity-item">
                    <span className="activity-badge auth">JOIN</span>
                    <span>Alex M. approved</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Console Footer */}
            <div className="console-bottom-bar">
              <div className="console-bottom-tag">
                <CheckCircle2 size={12} className="text-emerald" />
                <span>AES-256 Protected</span>
              </div>
              <div className="console-bottom-actions">
                <span>12ms</span><span>•</span><span>99.999% SLA</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Bento Grid */}
      <section id="features" className="features-section">
        <div className="landing-container">
          
          <div className="section-header">
            <span className="section-tag">Core Architecture</span>
            <h2 className="section-title">Engineered for Precision and Control</h2>
            <p className="section-desc">
              Every detail is crafted to provide full control over your files, sharing permissions, and collaborative workflows.
            </p>
          </div>

          <div className="bento-grid">
            
            {/* Bento Card 1: Granular Role Hierarchy (Span 8) */}
            <div className="bento-card bento-col-8">
              <div className="bento-header">
                <div className="bento-icon">
                  <ShieldCheck size={22} />
                </div>
                <h3 className="bento-title">Granular Role-Based Access Control</h3>
                <p className="bento-text">
                  Safeguard your assets with clear role separation. Manage permissions dynamically across individual shared workspaces.
                </p>
              </div>

              {/* Interactive Role Switcher */}
              <div className="bento-preview-widget">
                <div className="role-matrix-preview">
                  {Object.keys(roleInfo).map((role) => (
                    <div
                      key={role}
                      className="role-pill-card"
                      style={{
                        borderColor: activeRoleTab === role ? roleInfo[role].color : undefined,
                        borderWidth: activeRoleTab === role ? '2px' : '1px',
                        background: activeRoleTab === role ? 'rgba(124, 58, 237, 0.05)' : '#ffffff',
                        cursor: 'pointer'
                      }}
                      onClick={() => setActiveRoleTab(role)}
                    >
                      <div className="role-name" style={{ color: roleInfo[role].color }}>{role}</div>
                      <div className="role-perm">Click to Inspect</div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: '14px', padding: '14px', background: '#ffffff', borderRadius: '10px', border: '1px solid rgba(124, 58, 237, 0.15)', boxShadow: '0 2px 8px rgba(15, 10, 42, 0.04)' }}>
                  <div style={{ fontWeight: 800, fontSize: '14px', color: roleInfo[activeRoleTab].color, marginBottom: '4px' }}>
                    {roleInfo[activeRoleTab].badge}
                  </div>
                  <p style={{ fontSize: '13px', color: '#475569', marginBottom: '12px', lineHeight: '1.5' }}>
                    {roleInfo[activeRoleTab].desc}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {roleInfo[activeRoleTab].perms.map((p, i) => (
                      <span key={i} style={{ fontSize: '11.5px', fontWeight: 600, background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '3px 10px', borderRadius: '6px', color: '#0f172a' }}>
                        ✓ {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bento Card 2: Instant Invite System (Span 4) */}
            <div className="bento-card bento-col-4">
              <div className="bento-header">
                <div className="bento-icon cyan">
                  <KeyRound size={22} />
                </div>
                <h3 className="bento-title">Zero-Friction Invites</h3>
                <p className="bento-text">
                  Generate unique 8-character invite keys. Enable or disable join codes at any moment with a single click.
                </p>
              </div>

              <div className="bento-preview-widget" style={{ textAlign: 'center', background: '#f8f7ff', border: '1px solid rgba(124, 58, 237, 0.12)', padding: '18px', borderRadius: '12px' }}>
<<<<<<< HEAD
                <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: '8px' }}>Active Invite Code</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: 900, color: '#0284c7', letterSpacing: '4px', background: 'rgba(2, 132, 199, 0.08)', padding: '10px 14px', borderRadius: '8px', border: '1.5px dashed rgba(2, 132, 199, 0.35)' }}>
                  CBX-7942
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="btn-copy-code-pill"
                  style={{
                    marginTop: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-pill)',
                    background: copiedCode ? 'rgba(16, 185, 129, 0.12)' : '#ffffff',
                    border: '1px solid',
                    borderColor: copiedCode ? '#059669' : '#cbd5e1',
                    color: copiedCode ? '#059669' : '#1e293b',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {copiedCode ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                  <span>{copiedCode ? 'Key Copied!' : 'Copy Invite Key'}</span>
                </button>
=======
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px' }}>Active Invite Code</span>
                  <button
                    type="button"
                    onClick={handleRegenerateCode}
                    title="Generate New Code"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0284c7', padding: '2px 4px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600 }}
                  >
                    <RefreshCw size={12} />
                    <span>Refresh</span>
                  </button>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: 900, color: '#0284c7', letterSpacing: '4px', background: 'rgba(2, 132, 199, 0.08)', padding: '10px 14px', borderRadius: '8px', border: '1.5px dashed rgba(2, 132, 199, 0.35)' }}>
                  {inviteCode}
                </div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '12px' }}>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="btn-copy-code-pill"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      fontWeight: 700,
                      padding: '6px 14px',
                      borderRadius: 'var(--radius-pill)',
                      background: copiedCode ? 'rgba(16, 185, 129, 0.12)' : '#ffffff',
                      border: '1px solid',
                      borderColor: copiedCode ? '#059669' : '#cbd5e1',
                      color: copiedCode ? '#059669' : '#1e293b',
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {copiedCode ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                    <span>{copiedCode ? 'Key Copied!' : 'Copy Invite Key'}</span>
                  </button>
                </div>
>>>>>>> main
              </div>
            </div>

            {/* Bento Card 3: In-Browser Multi-format Streamer (Span 4) */}
            <div className="bento-card bento-col-4">
              <div className="bento-header">
                <div className="bento-icon emerald">
                  <Eye size={22} />
                </div>
                <h3 className="bento-title">Universal Preview</h3>
                <p className="bento-text">
                  Inspect documents, code, audio, and high-bitrate video straight in your browser.
                </p>
              </div>

              <div className="format-tabs-bar" style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
                {['code', 'pdf', 'video', 'audio'].map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setActiveFormatTab(fmt)}
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '5px 10px',
                      borderRadius: '6px',
                      border: '1px solid',
                      borderColor: activeFormatTab === fmt ? '#7c3aed' : '#cbd5e1',
                      background: activeFormatTab === fmt ? '#ede9fe' : '#ffffff',
                      color: activeFormatTab === fmt ? '#7c3aed' : '#475569',
                      cursor: 'pointer',
                      textTransform: 'uppercase'
                    }}
                  >
                    {fmt}
                  </button>
                ))}
              </div>

              <div className="format-preview-screen" style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
                {activeFormatTab === 'code' && (
                  <div style={{ color: '#0284c7' }}>
                    <div><span style={{ color: '#ec4899' }}>const</span> stream = <span style={{ color: '#3b82f6' }}>await</span> vault.<span style={{ color: '#d97706' }}>openStream</span>();</div>
                    <div style={{ color: '#94a3b8', marginTop: '3px' }}>// zero-buffer pipeline active</div>
                  </div>
                )}
                {activeFormatTab === 'pdf' && (
                  <div style={{ color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={20} color="#e11d48" />
                    <div>
                      <div style={{ fontWeight: 700 }}>architecture-v2.pdf</div>
                      <div style={{ color: '#64748b', fontSize: '11px' }}>Page 1 / 14 • Vector Rendered</div>
                    </div>
                  </div>
                )}
                {activeFormatTab === 'video' && (
                  <div style={{ color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Video size={20} color="#059669" />
                    <div>
                      <div style={{ fontWeight: 700 }}>4K HDR Video Stream</div>
                      <div style={{ color: '#64748b', fontSize: '11px' }}>H.265 / AV1 Native Decode</div>
                    </div>
                  </div>
                )}
                {activeFormatTab === 'audio' && (
                  <div style={{ color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Music size={20} color="#d97706" />
                    <div>
                      <div style={{ fontWeight: 700 }}>Spatial Audio Track</div>
                      <div style={{ color: '#64748b', fontSize: '11px' }}>Lossless FLAC Stream</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bento Card 4: Hierarchical Directory Tree & Drag Drop (Span 4) */}
            <div className="bento-card bento-col-4">
              <div className="bento-header">
                <div className="bento-icon">
                  <FolderTree size={22} />
                </div>
                <h3 className="bento-title">Virtual Tree File System</h3>
                <p className="bento-text">
                  Nested multi-level directory structure with recursive navigation and instant updates.
                </p>
              </div>

              <div className="bento-preview-widget" style={{ fontFamily: 'var(--font-mono)', fontSize: '12.5px', background: '#f8f7ff', padding: '16px', borderRadius: '12px', border: '1px solid rgba(124, 58, 237, 0.12)', lineHeight: '1.7' }}>
                <div style={{ color: '#7c3aed', fontWeight: 800 }}>📁 Root Workspace</div>
                <div style={{ paddingLeft: '14px', color: '#334155', fontWeight: 600 }}>├── 📁 Design Assets</div>
                <div style={{ paddingLeft: '28px', color: '#0284c7', fontWeight: 700 }}>└── 📄 hero-graphic.png</div>
                <div style={{ paddingLeft: '14px', color: '#334155', fontWeight: 600 }}>└── 📁 Production Build</div>
              </div>
            </div>

            {/* Bento Card 5: Real-time Audit & Activity Trails (Span 4) */}
            <div className="bento-card bento-col-4">
              <div className="bento-header">
                <div className="bento-icon cyan">
                  <Clock size={22} />
                </div>
                <h3 className="bento-title">Complete Audit Trail</h3>
                <p className="bento-text">
                  Chronological tamper-evident activity logs. Track file uploads, deletions, and approvals.
                </p>
              </div>

              <div className="bento-preview-widget" style={{ fontSize: '12.5px', background: '#f8f7ff', padding: '16px', borderRadius: '12px', border: '1px solid rgba(124, 58, 237, 0.12)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span style={{ background: 'rgba(5, 150, 105, 0.12)', color: '#059669', padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 800 }}>UPLOAD</span>
                  <span style={{ color: '#0f172a', fontWeight: 700 }}>production-v2.5.zip</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ background: 'rgba(124, 58, 237, 0.12)', color: '#7c3aed', padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 800 }}>APPROVE</span>
                  <span style={{ color: '#0f172a', fontWeight: 700 }}>Alex Morgan joined</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="workflow" className="workflow-section">
        <div className="landing-container">
          
          <div className="section-header">
            <span className="section-tag">Frictionless Workflow</span>
            <h2 className="section-title">Up and Running in Under 60 Seconds</h2>
            <p className="section-desc">
              Get your team onboarded, organize your assets, and share securely with three intuitive steps.
            </p>
          </div>

          <div className="workflow-steps">
            
            <div className="step-card">
              <span className="step-number">STEP 01</span>
              <h3 className="step-title">Create or Join Workspace</h3>
              <p className="bento-text">
                Sign up in seconds or sign in with Google. Create your own private folder hierarchy or enter an invite code to join a team repository.
              </p>
            </div>

            <div className="step-card">
              <span className="step-number">STEP 02</span>
              <h3 className="step-title">Upload & Organize</h3>
              <p className="bento-text">
                Drag and drop files directly onto folders in the directory tree. Rename, move, and categorize data with zero latency.
              </p>
            </div>

            <div className="step-card">
              <span className="step-number">STEP 03</span>
              <h3 className="step-title">Collaborate & Stream</h3>
              <p className="bento-text">
                Assign granular roles to members, approve incoming requests, stream videos/audio in the browser, and monitor audit trails.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* Comparison Section */}
      <section id="comparison" className="comparison-section">
        <div className="landing-container">
          
          <div className="section-header">
            <span className="section-tag">Why CloudBox</span>
            <h2 className="section-title">Built for Modern Productivity</h2>
            <p className="section-desc">
              Compare CloudBox against legacy generic cloud drives.
            </p>
          </div>

          <div className="comparison-table-wrapper">
            <table className="comp-table">
              <thead>
                <tr>
                  <th>Feature & Capability</th>
                  <th className="highlight-th">CloudBox Enterprise</th>
                  <th>Legacy Cloud Drives</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Granular Hierarchical Roles (Owner / Admin / Editor / Viewer)</td>
                  <td className="highlight-td"><Check size={18} color="#059669" /> Native & Configurable</td>
                  <td><X size={18} color="#e11d48" /> Basic Read / Write only</td>
                </tr>
                <tr>
                  <td>Shared Folder Invite Code & Approval Workflow</td>
                  <td className="highlight-td"><Check size={18} color="#059669" /> One-Click Codes & Requests</td>
                  <td><X size={18} color="#e11d48" /> Complex Email Invitations</td>
                </tr>
                <tr>
                  <td>In-Browser Multi-format Media & Code Streamer</td>
                  <td className="highlight-td"><Check size={18} color="#059669" /> Full In-Browser Streaming</td>
                  <td><X size={18} color="#e11d48" /> Downloads Required</td>
                </tr>
                <tr>
                  <td>Live Audit Trail & Timestamped History</td>
                  <td className="highlight-td"><Check size={18} color="#059669" /> Built-in Activity Logs</td>
                  <td><X size={18} color="#e11d48" /> Paid Enterprise Addon</td>
                </tr>
                <tr>
                  <td>Interactive Virtual Folder Tree Navigation</td>
                  <td className="highlight-td"><Check size={18} color="#059669" /> Drag-to-Tree Supported</td>
                  <td><X size={18} color="#e11d48" /> Rigid Flat Views</td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section id="faq" className="faq-section">
        <div className="landing-container">
          
          <div className="section-header">
            <span className="section-tag">Frequently Asked Questions</span>
            <h2 className="section-title">Everything You Need to Know</h2>
          </div>

          <div className="faq-list">
            {faqs.map((faq, index) => (
              <div key={index} className={`faq-item ${activeFaq === index ? 'open' : ''}`}>
                <button
                  type="button"
                  className="faq-question"
                  onClick={() => toggleFaq(index)}
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    size={18}
                    style={{
                      transform: activeFaq === index ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s ease',
                      flexShrink: 0
                    }}
                  />
                </button>
                {activeFaq === index && (
                  <div className="faq-answer">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>


      {/* CTA Banner */}
      <section className="cta-section">
        <div className="landing-container">
          <div className="cta-banner-card">
            <h2 className="cta-banner-title">
              Ready for Intelligent Cloud Storage?
            </h2>
            <p className="cta-banner-desc">
              Join teams worldwide who trust CloudBox for high-security file organization, instant media streaming, and granular role management.
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/signup" className="btn btn-primary btn-lg btn-glow">
                Create Free Account <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="btn-hero-ghost btn-lg">
                Log In to Workspace
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Ultra-Compact Modern Footer */}
      <footer className="footer-wrapper">
        <div className="landing-container">
          
          <div className="footer-compact-row">
            {/* Brand with pure white 'Cloud' */}
            <div className="footer-compact-brand">
              <div className="nav-brand">
                <div className="brand-icon-wrapper">
                  <Cloud size={16} />
                </div>
                <span className="footer-brand-title">
                  <span className="cloud-white">Cloud</span><span className="brand-gradient-text">Box</span>
                </span>
              </div>
            </div>

            {/* Horizontal Links in ONE single line */}
            <div className="footer-horizontal-nav">
              <span className="nav-group-label">Product:</span>
              <a href="#features">Features</a>
              <span className="nav-dot">•</span>
              <a href="#workflow">Workflow</a>
              <span className="nav-dot">•</span>
              <a href="#comparison">Comparison</a>
              <span className="nav-dot">•</span>
              <a href="#faq">FAQ</a>

              <span className="nav-divider">|</span>

              <span className="nav-group-label">Access:</span>
              <Link to="/login">Sign In</Link>
              <span className="nav-dot">•</span>
              <Link to="/signup">Create Account</Link>
              <span className="nav-dot">•</span>
              <Link to="/dashboard">Dashboard</Link>
            </div>

            {/* System Status */}
            <div className="status-indicator">
              <span className="status-dot"></span>
              <span>Operational</span>
            </div>
          </div>

          {/* Bottom Bar: Copyright & Creators */}
          <div className="footer-bottom">
            <div>© {new Date().getFullYear()} CloudBox Inc. All rights reserved.</div>
            <div className="footer-creators">
              <span className="creators-label">Built by</span>
              <a
                href="https://github.com/atulkumar1016"
                target="_blank"
                rel="noopener noreferrer"
                className="creator-badge"
                title="Atul Kumar (@atulkumar1016)"
              >
                <img
                  src="https://github.com/atulkumar1016.png"
                  alt="atulkumar1016"
                  className="creator-avatar"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <span>atulkumar1016</span>
              </a>
              <span className="creator-separator">&</span>
              <a
                href="https://github.com/ashu670"
                target="_blank"
                rel="noopener noreferrer"
                className="creator-badge"
                title="Ashu (@ashu670)"
              >
                <img
                  src="https://github.com/ashu670.png"
                  alt="ashu670"
                  className="creator-avatar"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <span>ashu670</span>
              </a>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
