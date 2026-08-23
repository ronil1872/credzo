import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks';
import { Profile } from '../../../types';
import { AddTeamMemberModal } from './AddTeamMemberModal';
import { EditTeamMemberModal } from './EditTeamMemberModal';
import { DeactivateUserDialog } from './DeactivateUserDialog';
import { ResetPasswordModal } from './ResetPasswordModal';
import '../crm.css';

interface StaffWithStats extends Profile {
  loanLeadsCount: number;
  insuranceLeadsCount: number;
  totalLeadsCount: number;
}

export const TeamManagementTab: React.FC = () => {
  const { profile } = useAuth();
  const isAdminOrOwner = profile?.role === 'ADMIN' || profile?.role === 'OWNER';

  const [teamMembers, setTeamMembers] = useState<StaffWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [statusDialogProfile, setStatusDialogProfile] = useState<Profile | null>(null);
  const [resetPasswordProfile, setResetPasswordProfile] = useState<Profile | null>(null);

  const fetchTeamData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Fetch organization profiles under RLS
      const [profilesRes, loanLeadsRes, insLeadsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: true }),
        supabase
          .from('leads')
          .select('id, assigned_to'),
        supabase
          .from('insurance_leads')
          .select('id, assigned_to'),
      ]);

      if (profilesRes.error) {
        console.error('[Credzo CRM] Error fetching team profiles:', profilesRes.error);
        setErrorMsg(`Failed to load team members: ${profilesRes.error.message}`);
        return;
      }

      const rawProfiles = (profilesRes.data as Profile[]) || [];
      const loanLeads = loanLeadsRes.data || [];
      const insLeads = insLeadsRes.data || [];

      // Calculate lead assignment counts per staff profile
      const enriched: StaffWithStats[] = rawProfiles.map((p) => {
        const loanCount = loanLeads.filter((l) => l.assigned_to === p.id).length;
        const insCount = insLeads.filter((i) => i.assigned_to === p.id).length;
        return {
          ...p,
          loanLeadsCount: loanCount,
          insuranceLeadsCount: insCount,
          totalLeadsCount: loanCount + insCount,
        };
      });

      setTeamMembers(enriched);
    } catch (err: unknown) {
      console.error('[Credzo CRM] Unexpected exception loading team members:', err);
      setErrorMsg('Unexpected network error occurred while loading team data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTeamData();
  }, [fetchTeamData]);

  // Handle Created User
  const handleUserCreated = (newProfile: Profile) => {
    setSuccessMsg(`Team member ${newProfile.full_name} was provisioned successfully.`);
    fetchTeamData(true);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // Handle Updated User
  const handleUserUpdated = (updatedProfile: Profile) => {
    setTeamMembers((prev) =>
      prev.map((m) =>
        m.id === updatedProfile.id
          ? {
              ...m,
              ...updatedProfile,
            }
          : m
      )
    );
    setSuccessMsg(`Updated profile for ${updatedProfile.full_name}.`);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // Filter Team Members
  const filteredMembers = useMemo(() => {
    return teamMembers.filter((m) => {
      if (roleFilter !== 'ALL' && m.role !== roleFilter) return false;
      if (statusFilter === 'ACTIVE' && m.is_active === false) return false;
      if (statusFilter === 'INACTIVE' && m.is_active !== false) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchName = m.full_name?.toLowerCase().includes(q);
        const matchMobile = m.mobile?.includes(q);
        if (!matchName && !matchMobile) return false;
      }
      return true;
    });
  }, [teamMembers, roleFilter, statusFilter, search]);

  const formatDate = (iso?: string | null) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  if (!isAdminOrOwner) {
    return (
      <div className="crm-card" style={{ padding: 'var(--space-6)' }}>
        <div style={{ textAlign: 'center', maxWidth: 460, margin: '0 auto' }}>
          <span style={{ fontSize: '2rem', display: 'block', marginBottom: 'var(--space-2)' }}>🔒</span>
          <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 var(--space-2)' }}>
            Restricted Administrator Access
          </h3>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            Team and staff account management is reserved for Organization Owners and Administrators. If you require access changes, please contact your manager.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Tab Header & Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
        <div>
          <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Team & Staff Management
          </h2>
          <p style={{ margin: '2px 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
            Manage staff profiles, CRM roles, access status, and lead assignment workloads.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`crm-refresh-btn ${refreshing ? 'spinning' : ''}`}
            onClick={() => fetchTeamData(true)}
            disabled={loading || refreshing}
            title="Refresh team members"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.19" />
            </svg>
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setShowAddModal(true)}
          >
            + Add Team Member
          </button>
        </div>
      </div>

      {/* Alerts */}
      {errorMsg && (
        <div className="form-alert-error" style={{ marginBottom: 'var(--space-4)' }} role="alert">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div
          style={{
            padding: '12px 16px',
            background: 'rgba(5, 150, 105, 0.1)',
            border: '1px solid rgba(5, 150, 105, 0.3)',
            borderRadius: 'var(--radius-lg)',
            color: 'var(--color-success)',
            fontWeight: 600,
            marginBottom: 'var(--space-4)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
          role="status"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{successMsg}</span>
        </div>
      )}

      {/* Team Filter / Search Toolbar */}
      <div className="crm-card" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="crm-filters-bar">
          <input
            type="search"
            className="crm-search-input"
            placeholder="Search by staff name or mobile number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="crm-select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="ALL">All Roles</option>
            <option value="OWNER">OWNER</option>
            <option value="ADMIN">ADMIN</option>
            <option value="STAFF">STAFF</option>
          </select>

          <select
            className="crm-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>
        </div>

        {/* Desktop Table View */}
        <div className="leads-table-wrapper">
          <table className="leads-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Mobile</th>
                <th>Role</th>
                <th>Status</th>
                <th>Assigned Leads</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j}>
                        <div className="skeleton-bar" style={{ width: '80%', height: 14 }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <p className="empty-state-title">No team members found</p>
                      <p className="empty-state-desc">
                        {search || roleFilter !== 'ALL' || statusFilter !== 'ALL'
                          ? 'Try clearing the search or role filters.'
                          : 'Click "+ Add Team Member" to provision your staff accounts.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => {
                  const isMemberOwner = member.role === 'OWNER';
                  const isActive = member.is_active !== false;

                  return (
                    <tr key={member.id}>
                      {/* 1. Member Name & ID */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 'var(--radius-full)',
                              background: isMemberOwner
                                ? '#fef3c7'
                                : member.role === 'ADMIN'
                                ? '#f3e8ff'
                                : '#eff6ff',
                              color: isMemberOwner
                                ? '#b45309'
                                : member.role === 'ADMIN'
                                ? '#7e22ce'
                                : '#1d4ed8',
                              fontWeight: 800,
                              fontSize: '0.75rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {member.full_name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                              {member.full_name}
                            </div>
                            <span className="lead-ref-pill">#{member.id.slice(0, 8).toUpperCase()}</span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Mobile */}
                      <td>
                        {member.mobile ? (
                          <a
                            href={`tel:+91${member.mobile}`}
                            style={{ color: 'inherit', textDecoration: 'none', fontWeight: 500 }}
                          >
                            +91 {member.mobile}
                          </a>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>

                      {/* 3. Role */}
                      <td>
                        <span
                          className={`status-badge ${
                            member.role === 'OWNER'
                              ? 'NEW'
                              : member.role === 'ADMIN'
                              ? 'CONTACTED'
                              : 'DOCUMENTS'
                          }`}
                          style={{
                            background:
                              member.role === 'OWNER'
                                ? '#fef3c7'
                                : member.role === 'ADMIN'
                                ? '#f3e8ff'
                                : '#eff6ff',
                            color:
                              member.role === 'OWNER'
                                ? '#b45309'
                                : member.role === 'ADMIN'
                                ? '#7e22ce'
                                : '#1d4ed8',
                          }}
                        >
                          {member.role}
                        </span>
                      </td>

                      {/* 4. Status */}
                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 'var(--font-size-xs)',
                            fontWeight: 700,
                            color: isActive ? '#047857' : '#dc2626',
                            background: isActive ? '#d1fae5' : '#fee2e2',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-full)',
                          }}
                        >
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: 'var(--radius-full)',
                              background: isActive ? '#059669' : '#dc2626',
                            }}
                          />
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* 5. Assigned Leads */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                            {member.totalLeadsCount} Leads
                          </span>
                          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                            {member.loanLeadsCount} Loans • {member.insuranceLeadsCount} Insurance
                          </span>
                        </div>
                      </td>

                      {/* 6. Joined Date */}
                      <td>
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                          {formatDate(member.created_at)}
                        </span>
                      </td>

                      {/* 7. Actions */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <button
                            type="button"
                            className="btn btn-outline btn-xs"
                            onClick={() => setEditingProfile(member)}
                            title="Edit contact information or role"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="btn btn-outline btn-xs"
                            onClick={() => setResetPasswordProfile(member)}
                            title="Send password reset link"
                          >
                            Reset Password
                          </button>

                          {!isMemberOwner && (
                            <button
                              type="button"
                              className={`btn btn-xs ${isActive ? 'btn-outline-danger' : 'btn-outline'}`}
                              onClick={() => setStatusDialogProfile(member)}
                              title={isActive ? 'Deactivate staff account' : 'Reactivate staff account'}
                            >
                              {isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="leads-mobile-list">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="lead-mobile-card">
                <div className="skeleton-row" style={{ height: 40 }} />
                <div className="skeleton-row" style={{ height: 60 }} />
              </div>
            ))
          ) : filteredMembers.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state-title">No team members found</p>
            </div>
          ) : (
            filteredMembers.map((member) => {
              const isMemberOwner = member.role === 'OWNER';
              const isActive = member.is_active !== false;

              return (
                <div key={member.id} className="lead-mobile-card">
                  <div className="lead-mobile-header">
                    <div>
                      <div className="lead-mobile-applicant">{member.full_name}</div>
                      <div className="lead-mobile-city">
                        {member.mobile ? `+91 ${member.mobile}` : 'No phone registered'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span className={`status-badge ${member.role === 'OWNER' ? 'NEW' : member.role === 'ADMIN' ? 'CONTACTED' : 'DOCUMENTS'}`}>
                        {member.role}
                      </span>
                      <span
                        style={{
                          fontSize: '0.625rem',
                          fontWeight: 700,
                          color: isActive ? '#047857' : '#dc2626',
                          background: isActive ? '#d1fae5' : '#fee2e2',
                          padding: '2px 6px',
                          borderRadius: 'var(--radius-full)',
                        }}
                      >
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  <div className="lead-mobile-details" style={{ margin: 'var(--space-3) 0' }}>
                    <div>
                      <span className="info-label">Assigned Workload</span>
                      <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                        {member.totalLeadsCount} Total Leads
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                        {member.loanLeadsCount} Loans • {member.insuranceLeadsCount} Insurance
                      </div>
                    </div>
                    <div>
                      <span className="info-label">Joined</span>
                      <div style={{ fontWeight: 600 }}>{formatDate(member.created_at)}</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: isMemberOwner ? '1fr 1fr' : '1fr 1fr 1fr', gap: 'var(--space-2)', paddingTop: 'var(--space-2)', borderTop: '1px solid var(--border-subtle)' }}>
                    <button
                      type="button"
                      className="btn btn-outline btn-xs"
                      onClick={() => setEditingProfile(member)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline btn-xs"
                      onClick={() => setResetPasswordProfile(member)}
                    >
                      Reset Pwd
                    </button>

                    {!isMemberOwner && (
                      <button
                        type="button"
                        className={`btn btn-xs ${isActive ? 'btn-outline-danger' : 'btn-outline'}`}
                        onClick={() => setStatusDialogProfile(member)}
                      >
                        {isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 4. Modals */}
      <AddTeamMemberModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onUserCreated={handleUserCreated}
      />

      <EditTeamMemberModal
        isOpen={Boolean(editingProfile)}
        onClose={() => setEditingProfile(null)}
        targetProfile={editingProfile}
        onUserUpdated={handleUserUpdated}
      />

      <DeactivateUserDialog
        isOpen={Boolean(statusDialogProfile)}
        onClose={() => setStatusDialogProfile(null)}
        targetProfile={statusDialogProfile}
        onStatusChanged={handleUserUpdated}
      />

      <ResetPasswordModal
        isOpen={Boolean(resetPasswordProfile)}
        onClose={() => setResetPasswordProfile(null)}
        targetProfile={resetPasswordProfile}
        targetEmail={resetPasswordProfile?.mobile ? undefined : undefined}
      />
    </div>
  );
};
