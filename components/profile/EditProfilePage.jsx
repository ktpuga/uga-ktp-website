'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserX, Ban, AlertTriangle, X } from 'lucide-react';
import { getProfile, getBlockedUsers, unblockUser, deleteAccount } from '@/lib/portal-api';
import { normalizeUserProfile } from '@/lib/profile';
import { formatMemberGroup, memberDisplayName } from '@/lib/portal-format';
import { isRedirectError } from '@/lib/is-redirect-error';
import { logoutEverywhere } from '@/lib/auth-actions';
import ProfileForm from './ProfileForm';

const ACCENT_HEADING = {
  blue: 'text-blue-900 dark:text-blue-100',
  amber: 'text-amber-900 dark:text-amber-100',
  red: 'text-red-900 dark:text-red-100',
};

function BlockedUsersCard() {
  const [blocked, setBlocked] = useState(null);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  function load() {
    getBlockedUsers()
      .then(setBlocked)
      .catch((err) => {
        if (isRedirectError(err)) throw err;
        setError(err.message ?? 'Could not load blocked members');
      });
  }

  useEffect(load, []);

  async function handleUnblock(userId) {
    setBusyId(userId);
    try {
      await unblockUser(userId);
      setBlocked((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      if (isRedirectError(err)) throw err;
      window.alert(err.message ?? 'Failed to unblock');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Ban className="h-4 w-4" /> Blocked Members
        </CardTitle>
        <CardDescription>People you've blocked can't message you, and you won't see their messages in group chats.</CardDescription>
      </CardHeader>
      <CardContent>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {blocked === null ? (
          <p className="py-4 text-sm text-muted-foreground">Loading...</p>
        ) : blocked.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">You haven't blocked anyone.</p>
        ) : (
          <div className="space-y-2">
            {blocked.map((user) => (
              <div key={user.id} className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 dark:border-slate-700">
                <span className="text-sm text-gray-900 dark:text-slate-100">{memberDisplayName(user)}</span>
                <Button type="button" variant="outline" size="sm" onClick={() => handleUnblock(user.id)} disabled={busyId === user.id}>
                  {busyId === user.id ? 'Unblocking...' : 'Unblock'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DeleteAccountDialog({ onClose }) {
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      await deleteAccount();
      await logoutEverywhere();
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Failed to delete account');
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-lg bg-white p-5 dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <p className="flex items-center gap-2 font-semibold text-red-700 dark:text-red-400">
            <AlertTriangle className="h-4 w-4" /> Delete your account
          </p>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm text-gray-600 dark:text-slate-400">
          This removes your personal info (name, email, phone, major, and everything else on your profile) and signs
          you out everywhere. Your existing messages, photos, and committee history stay in place for other members —
          they'll just show as coming from a deleted user instead of removing them entirely.
        </p>
        <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
          This does <strong>not</strong> remove you from the fraternity's Authentik account — that's handled
          separately by eboard. This only deletes your KTP Life profile data.
        </p>
        <label className="mt-4 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Type <span className="font-mono">delete</span> to confirm
        </label>
        <input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-slate-700 dark:bg-slate-950"
        />
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-4 flex gap-2">
          <Button
            className="flex-1 bg-red-700 hover:bg-red-800"
            onClick={handleDelete}
            disabled={confirmText.trim().toLowerCase() !== 'delete' || deleting}
          >
            {deleting ? 'Deleting...' : 'Permanently Delete My Account'}
          </Button>
          <Button variant="outline" onClick={onClose} disabled={deleting}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}

function DangerZoneCard() {
  const [open, setOpen] = useState(false);

  return (
    <Card className="border-red-200 dark:border-red-900">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg text-red-700 dark:text-red-400 sm:text-xl">
          <UserX className="h-4 w-4" /> Danger Zone
        </CardTitle>
        <CardDescription>Permanently delete your KTP Life account.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button type="button" variant="outline" className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400" onClick={() => setOpen(true)}>
          Delete My Account
        </Button>
      </CardContent>
      {open && <DeleteAccountDialog onClose={() => setOpen(false)} />}
    </Card>
  );
}

export default function EditProfilePage({ accent = 'blue', portalLabel = 'Portal' }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getProfile()
      .then((data) => setProfile(normalizeUserProfile(data)))
      .catch((err) => {
        if (isRedirectError(err)) throw err;
        setError(err.message ?? 'Could not load your profile');
      })
      .finally(() => setLoading(false));
  }, []);

  const heading = ACCENT_HEADING[accent] ?? ACCENT_HEADING.blue;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className={`mb-2 text-2xl font-bold sm:text-3xl ${heading}`}>Edit Profile</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 sm:text-base">
          Update your {portalLabel} account details. Username and member group are managed by admins.
        </p>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/40">
          <CardContent className="pt-6 text-sm text-red-700 dark:text-red-300">{error}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Profile Information</CardTitle>
          <CardDescription>
            Changes are saved to your KTP account immediately.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground py-6">Loading profile...</p>
          ) : profile ? (
            <ProfileForm
              mode="edit"
              variant="portal"
              accent={accent}
              defaultValues={profile}
              readOnly={{
                username: profile.username ?? '',
                memberGroup: formatMemberGroup(profile.member_group) ?? profile.member_group ?? '',
              }}
            />
          ) : null}
        </CardContent>
      </Card>

      <BlockedUsersCard />
      <DangerZoneCard />

      <p className="text-center text-xs text-slate-500 dark:text-slate-400">
        <a href="/community-guidelines" target="_blank" rel="noreferrer" className="hover:underline">Community Guidelines</a>
        {' · '}
        <a href="/privacy" target="_blank" rel="noreferrer" className="hover:underline">Privacy Policy</a>
      </p>
    </div>
  );
}
