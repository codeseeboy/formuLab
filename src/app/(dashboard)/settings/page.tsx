'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import * as accountService from '@/lib/services/account.service';
import * as orgService from '@/lib/services/org.service';
import * as teamService from '@/lib/services/team.service';
import { listAuditLog } from '@/lib/services/audit.service';
import { slugify } from '@/lib/utils';
import type { AuditLogEntry, MemberRole } from '@/lib/types';
import type { TeamMemberView } from '@/lib/services/team.service';
import {
  User, Building2, Users, Shield, Save, CheckCircle2, AlertCircle, ScrollText,
} from 'lucide-react';

export default function SettingsPage() {
  const { user, org, member, refreshUser } = useAuth();
  const [activeSection, setActiveSection] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [profile, setProfile] = useState({ name: user?.name || '' });
  const [orgSettings, setOrgSettings] = useState({ name: org?.name || '', slug: org?.slug || '' });
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });

  const [teamMembers, setTeamMembers] = useState<TeamMemberView[]>([]);
  const [pendingInvites, setPendingInvites] = useState<{ $id: string; email: string; role: string }[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<MemberRole>('scientist');

  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    if (user) setProfile({ name: user.name || '' });
  }, [user]);

  useEffect(() => {
    if (org) setOrgSettings({ name: org.name || '', slug: org.slug || '' });
  }, [org]);

  const loadTeam = useCallback(async () => {
    if (!org?.$id) return;
    try {
      const data = await teamService.fetchTeamMembers(org.$id);
      setTeamMembers(data.members);
      setPendingInvites(data.pendingInvites);
    } catch {
      setTeamMembers([]);
      setPendingInvites([]);
    }
  }, [org?.$id]);

  const loadAudit = useCallback(async () => {
    if (!org?.$id) return;
    try {
      const entries = await listAuditLog(org.$id, 40);
      setAuditLog(entries);
    } catch {
      setAuditLog([]);
    }
  }, [org?.$id]);

  useEffect(() => {
    if (activeSection === 'team') loadTeam();
    if (activeSection === 'audit') loadAudit();
  }, [activeSection, loadTeam, loadAudit]);

  const flash = (msg: string, isErr = false) => {
    if (isErr) {
      setError(msg);
      setSuccess('');
    } else {
      setSuccess(msg);
      setError('');
    }
    setTimeout(() => {
      setSuccess('');
      setError('');
    }, 4000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await accountService.updateProfileName(profile.name);
      await refreshUser();
      flash('Profile updated successfully');
    } catch (err: unknown) {
      flash(err instanceof Error ? err.message : 'Failed to update profile', true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!org?.$id) return;
    setIsSaving(true);
    try {
      await orgService.updateOrganization(org.$id, {
        name: orgSettings.name.trim(),
        slug: slugify(orgSettings.slug || orgSettings.name),
      });
      await refreshUser();
      flash('Organization updated successfully');
    } catch (err: unknown) {
      flash(err instanceof Error ? err.message : 'Failed to update organization', true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.next !== passwords.confirm) {
      flash('New passwords do not match', true);
      return;
    }
    setIsSaving(true);
    try {
      await accountService.changePassword(passwords.current, passwords.next);
      setPasswords({ current: '', next: '', confirm: '' });
      flash('Password updated successfully');
    } catch (err: unknown) {
      flash(err instanceof Error ? err.message : 'Failed to update password', true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!org || !user) return;
    setIsSaving(true);
    try {
      const res = await teamService.inviteTeamMember({
        orgId: org.$id,
        inviterUserId: user.$id,
        email: inviteEmail,
        role: inviteRole,
      });
      setInviteEmail('');
      flash(res.message || 'Invite sent');
      await loadTeam();
    } catch (err: unknown) {
      flash(err instanceof Error ? err.message : 'Invite failed', true);
    } finally {
      setIsSaving(false);
    }
  };

  const canManageTeam = member?.role === 'owner' || member?.role === 'admin';

  const sections = [
    { id: 'profile', label: 'Profile', icon: <User size={16} /> },
    { id: 'organization', label: 'Organization', icon: <Building2 size={16} /> },
    { id: 'team', label: 'Team Members', icon: <Users size={16} /> },
    { id: 'security', label: 'Security', icon: <Shield size={16} /> },
    { id: 'audit', label: 'Audit Log', icon: <ScrollText size={16} /> },
  ];

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Profile, organization, team, security, and audit trail</p>
        </div>
      </div>

      {success && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
          padding: 'var(--space-3) var(--space-4)', background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-lg)',
          marginBottom: 'var(--space-6)', color: 'var(--color-success)', fontSize: 'var(--text-sm)',
        }}>
          <CheckCircle2 size={16} /> {success}
        </div>
      )}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
          padding: 'var(--space-3) var(--space-4)', background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-lg)',
          marginBottom: 'var(--space-6)', color: 'var(--color-danger)', fontSize: 'var(--text-sm)',
        }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 'var(--space-6)' }}>
        <div className="card" style={{ padding: 'var(--space-3)', height: 'fit-content' }}>
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              className={`sidebar-nav-item ${activeSection === section.id ? 'active' : ''}`}
              onClick={() => setActiveSection(section.id)}
            >
              {section.icon} {section.label}
            </button>
          ))}
        </div>

        <div>
          {activeSection === 'profile' && (
            <div className="card animate-fadeIn">
              <div className="card-header"><h3 className="card-title">Profile Settings</h3></div>
              <form onSubmit={handleSaveProfile}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-input" value={profile.name} onChange={(e) => setProfile({ name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" value={user?.email || ''} disabled />
                  <span className="form-hint">Change email in Appwrite account settings if needed</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-6)' }}>
                  <button type="submit" className="btn btn-primary" disabled={isSaving}>
                    <Save size={14} /> Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeSection === 'organization' && (
            <div className="card animate-fadeIn">
              <div className="card-header"><h3 className="card-title">Organization Settings</h3></div>
              <form onSubmit={handleSaveOrg}>
                <div className="form-group">
                  <label className="form-label">Organization Name</label>
                  <input className="form-input" value={orgSettings.name} onChange={(e) => setOrgSettings({ ...orgSettings, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Slug</label>
                  <input className="form-input" value={orgSettings.slug} onChange={(e) => setOrgSettings({ ...orgSettings, slug: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Plan</label>
                  <span className="badge badge-brand">{(org?.plan || 'free').toUpperCase()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-6)' }}>
                  <button type="submit" className="btn btn-primary" disabled={isSaving}>
                    <Save size={14} /> Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeSection === 'team' && (
            <div className="card animate-fadeIn">
              <div className="card-header"><h3 className="card-title">Team Members</h3></div>

              {teamMembers.map((m) => (
                <div key={m.$id} style={{
                  padding: 'var(--space-4)', marginBottom: 8, background: 'var(--color-bg-tertiary)',
                  borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--color-brand), var(--color-accent))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700,
                  }}>
                    {m.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{m.name}</div>
                    <div className="text-muted" style={{ fontSize: 'var(--text-xs)' }}>{m.email}</div>
                  </div>
                  <span className="badge badge-brand">{m.role}</span>
                </div>
              ))}

              {pendingInvites.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <h4 style={{ fontSize: 'var(--text-sm)', marginBottom: 8 }}>Pending invites</h4>
                  {pendingInvites.map((i) => (
                    <div key={i.$id} className="text-muted" style={{ fontSize: 'var(--text-sm)', marginBottom: 4 }}>
                      {i.email} — {i.role} (awaiting signup)
                    </div>
                  ))}
                </div>
              )}

              {canManageTeam && (
                <form onSubmit={handleInvite} style={{ marginTop: 'var(--space-6)', paddingTop: 'var(--space-6)', borderTop: '1px solid var(--color-border)' }}>
                  <h4 style={{ marginBottom: 12 }}>Invite by email</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <input className="form-input" type="email" placeholder="colleague@company.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <select className="form-select" value={inviteRole} onChange={(e) => setInviteRole(e.target.value as MemberRole)}>
                        <option value="scientist">Scientist</option>
                        <option value="admin">Admin</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={isSaving}>
                    <Users size={14} /> Send invite
                  </button>
                </form>
              )}
            </div>
          )}

          {activeSection === 'security' && (
            <div className="card animate-fadeIn">
              <div className="card-header"><h3 className="card-title">Change Password</h3></div>
              <form onSubmit={handleChangePassword}>
                <div className="form-group">
                  <label className="form-label">Current password</label>
                  <input className="form-input" type="password" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} required autoComplete="current-password" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">New password</label>
                    <input className="form-input" type="password" value={passwords.next} onChange={(e) => setPasswords({ ...passwords, next: e.target.value })} required minLength={8} autoComplete="new-password" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Confirm</label>
                    <input className="form-input" type="password" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} required autoComplete="new-password" />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary" disabled={isSaving}>
                    <Shield size={14} /> Update Password
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeSection === 'audit' && (
            <div className="card animate-fadeIn">
              <div className="card-header"><h3 className="card-title">Audit Log</h3></div>
              <p className="text-muted" style={{ fontSize: 'var(--text-sm)', marginBottom: 16 }}>
                Recent actions in your organization (formulations, troubleshooting, etc.).
              </p>
              {auditLog.length === 0 ? (
                <p className="text-muted">No audit entries yet.</p>
              ) : (
                auditLog.map((entry) => (
                  <div key={entry.$id} style={{ padding: '12px 0', borderBottom: '1px solid var(--color-border)', fontSize: 'var(--text-sm)' }}>
                    <strong>{entry.action}</strong>
                    <span className="text-muted"> · {entry.entity_type} · {new Date(entry.timestamp).toLocaleString()}</span>
                    {entry.details && <div className="text-muted" style={{ marginTop: 4 }}>{entry.details}</div>}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
