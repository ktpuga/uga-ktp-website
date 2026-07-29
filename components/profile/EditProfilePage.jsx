'use client';

import { useEffect, useState } from 'react';
import { User, ShieldOff, AlertTriangle, X, UserX, ExternalLink, Info } from 'lucide-react';
import { getProfile, getBlockedUsers, unblockUser, deleteAccount } from '@/lib/portal-api';
import { normalizeUserProfile } from '@/lib/profile';
import { formatMemberGroup, memberDisplayName, memberInitials } from '@/lib/portal-format';
import { isRedirectError } from '@/lib/is-redirect-error';
import { logoutEverywhere } from '@/lib/auth-actions';
import { cn } from '@/lib/utils';
import ProfileForm from './ProfileForm';
import LegacyEditProfilePage from './LegacyEditProfilePage';

const ACCENT_THEMES = {
  blue: { base: '#1e3a8a', gradient: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)', light: '#1d4ed8', muted: 'rgba(30,58,138,0.10)' },
  red: { base: '#7f1d1d', gradient: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)', light: '#991b1b', muted: 'rgba(127,29,29,0.10)' },
  amber: { base: '#b45309', gradient: 'linear-gradient(135deg, #b45309 0%, #d97706 100%)', light: '#d97706', muted: 'rgba(180,83,9,0.10)' },
  teal: { base: '#134e4a', gradient: 'linear-gradient(135deg, #134e4a 0%, #0f766e 100%)', light: '#0f766e', muted: 'rgba(19,78,74,0.10)' },
};

function tint(hex, alpha) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

// ─── Section card ───

function SectionCard({ accent, icon, title, description, children, danger = false }) {
  return (
    <div className={cn('overflow-hidden rounded-2xl border bg-card shadow-sm', danger ? 'border-destructive/30' : 'border-border')}>
      <div
        className="flex items-start gap-3 border-b px-6 py-5"
        style={{
          background: danger ? 'rgba(127,29,29,0.04)' : tint(accent.base, 0.03),
          borderColor: danger ? 'rgba(127,29,29,0.15)' : undefined,
        }}
      >
        <div
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white"
          style={{ background: danger ? 'linear-gradient(135deg,#7f1d1d 0%,#991b1b 100%)' : accent.gradient }}
        >
          {icon}
        </div>
        <div>
          <h2 className="text-sm font-semibold" style={{ color: danger ? '#991b1b' : 'inherit' }}>{title}</h2>
          {description && <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</p>}
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

// ─── Member group badge ───

function MemberGroupBadge({ group, accent }) {
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white" style={{ background: accent.gradient }}>
      {formatMemberGroup(group)}
    </span>
  );
}

// ─── Avatar circle ───

function Avatar({ member, size = 32, accent }) {
  const [err, setErr] = useState(false);
  return (
    <div className="shrink-0 overflow-hidden rounded-full" style={{ width: size, height: size }} aria-hidden="true">
      {!err ? (
        <img
          src={`/api/users/${member.id}/profile-picture/media`}
          alt=""
          width={size}
          height={size}
          className="h-full w-full object-cover"
          onError={() => setErr(true)}
        />
      ) : (
        <div
          className="flex h-full w-full select-none items-center justify-center font-semibold text-white"
          style={{ background: accent.gradient, fontSize: size * 0.37 }}
        >
          {memberInitials(member)}
        </div>
      )}
    </div>
  );
}

// ─── Delete Account Modal ───

function DeleteAccountModal({ accent, onClose, onConfirm }) {
  const [typed, setTyped] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const confirmed = typed === 'delete';

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  async function handleConfirm() {
    setDeleting(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Failed to delete account');
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Delete account">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-destructive/30 bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-destructive/15 bg-destructive/5 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/15">
              <AlertTriangle size={14} className="text-destructive" />
            </div>
            <p className="text-sm font-semibold text-destructive">Delete My Account</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close">
            <X size={14} />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-destructive">What will be removed</p>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li className="flex items-start gap-1.5"><span className="mt-0.5 text-destructive">•</span> Your name, email, phone, major, and graduation year</li>
              <li className="flex items-start gap-1.5"><span className="mt-0.5 text-destructive">•</span> Profile photo and bio</li>
              <li className="flex items-start gap-1.5"><span className="mt-0.5 text-destructive">•</span> LinkedIn and Calendly links</li>
              <li className="flex items-start gap-1.5"><span className="mt-0.5 text-destructive">•</span> Active sessions on all devices</li>
            </ul>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">What stays in place</p>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li className="flex items-start gap-1.5"><span className="mt-0.5">•</span> Messages and photos — attributed to &ldquo;Deleted Member&rdquo;</li>
              <li className="flex items-start gap-1.5"><span className="mt-0.5">•</span> Committee and event history</li>
            </ul>
          </div>

          <div
            className="flex items-start gap-2.5 rounded-xl border px-4 py-3"
            style={{ background: tint(accent.base, 0.04), borderColor: tint(accent.base, 0.18) }}
          >
            <Info size={13} className="mt-0.5 shrink-0" style={{ color: accent.light }} />
            <p className="text-xs leading-relaxed text-muted-foreground">
              This only deletes your <span className="font-semibold text-foreground">KTP Life profile</span>. It does <span className="font-semibold text-foreground">not</span> remove your Authentik / SSO account — an eboard officer handles that separately.
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
              Type <span className="font-mono font-bold text-destructive">delete</span> to confirm
            </label>
            <input
              autoFocus
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="delete"
              className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2"
              style={{ ['--tw-ring-color']: 'rgba(220,38,38,0.25)' }}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
          <button type="button" onClick={onClose} disabled={deleting} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!confirmed || deleting}
            className="rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-white transition-opacity hover:bg-destructive/90 disabled:opacity-35"
          >
            {deleting ? 'Deleting...' : 'Permanently Delete My Account'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main revamped page ───

function RevampedEditProfilePage({ accentKey, portalLabel }) {
  const accent = ACCENT_THEMES[accentKey] ?? ACCENT_THEMES.blue;
  const [profile, setProfile] = useState(null);
  const [blockedMembers, setBlockedMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    Promise.all([getProfile(), getBlockedUsers()])
      .then(([profileData, blocked]) => {
        setProfile(normalizeUserProfile(profileData));
        setBlockedMembers(Array.isArray(blocked) ? blocked : []);
      })
      .catch((err) => {
        if (isRedirectError(err)) throw err;
        setError(err.message ?? 'Could not load your settings');
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleUnblock(userId) {
    await unblockUser(userId);
    setBlockedMembers((prev) => prev.filter((m) => m.id !== userId));
  }

  async function handleDeleteAccount() {
    await deleteAccount();
    await logoutEverywhere();
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-16 pt-8 sm:px-6">
      <div className="mb-8">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: accent.light }}>
          Alpha Iota Chapter
        </p>
        <h1 className="font-serif text-3xl font-normal leading-tight tracking-tight text-foreground">Settings</h1>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Loading settings...</p>
      ) : (
        <div className="space-y-6">
          <SectionCard
            accent={accent}
            icon={<User size={14} strokeWidth={1.75} />}
            title="Profile Information"
            description={`Update your ${portalLabel} account details. Changes are saved immediately.`}
          >
            <div
              className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border px-4 py-3"
              style={{ background: tint(accent.base, 0.03) }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ background: accent.gradient }}
                  aria-hidden="true"
                >
                  {memberInitials(profile)}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">@{profile.username}</p>
                  <p className="text-[11px] text-muted-foreground">Username is managed by Eboard</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MemberGroupBadge group={profile.member_group} accent={accent} />
                <span className="text-[11px] text-muted-foreground">Admin-managed</span>
              </div>
            </div>

            <ProfileForm mode="edit" variant="portal" accent={accentKey} defaultValues={profile} />
          </SectionCard>

          <SectionCard
            accent={accent}
            icon={<ShieldOff size={14} strokeWidth={1.75} />}
            title="Blocked Members"
            description="People you've blocked can't message you, and you won't see their messages in group chats."
          >
            {blockedMembers.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: tint(accent.base, 0.08) }}>
                  <UserX size={18} style={{ color: accent.light }} />
                </div>
                <p className="text-sm text-muted-foreground">You haven&apos;t blocked anyone.</p>
              </div>
            ) : (
              <ul role="list" className="divide-y divide-border">
                {blockedMembers.map((member) => (
                  <li key={member.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <Avatar member={member} size={34} accent={accent} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{memberDisplayName(member)}</p>
                      <p className="text-[11px] text-muted-foreground">@{member.username}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUnblock(member.id)}
                      className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      Unblock
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard accent={accent} icon={<AlertTriangle size={14} strokeWidth={1.75} />} title="Danger Zone" danger>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">Delete My Account</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  Permanently removes your profile data and signs you out everywhere. Your messages and history stay in place.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="shrink-0 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
              >
                Delete Account
              </button>
            </div>
          </SectionCard>
        </div>
      )}

      <div className="mt-10 flex items-center justify-center gap-4">
        <a href="/community-guidelines" target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
          Community Guidelines <ExternalLink size={10} />
        </a>
        <span className="text-muted-foreground/40" aria-hidden="true">·</span>
        <a href="/privacy" target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
          Privacy Policy <ExternalLink size={10} />
        </a>
      </div>

      {showDeleteModal && (
        <DeleteAccountModal accent={accent} onClose={() => setShowDeleteModal(false)} onConfirm={handleDeleteAccount} />
      )}
    </div>
  );
}

const REVAMPED_KEYS = new Set(['blue', 'red', 'amber', 'teal']);

export default function EditProfilePage({ accent = 'blue', portalLabel = 'Portal' }) {
  if (!REVAMPED_KEYS.has(accent)) {
    return <LegacyEditProfilePage accent={accent} portalLabel={portalLabel} />;
  }
  return <RevampedEditProfilePage accentKey={accent} portalLabel={portalLabel} />;
}
