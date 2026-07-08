'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getProfile } from '@/lib/portal-api';
import { normalizeUserProfile } from '@/lib/profile';
import { formatMemberGroup } from '@/lib/portal-format';
import { isRedirectError } from '@/lib/is-redirect-error';
import ProfileForm from './ProfileForm';

const ACCENT_HEADING = {
  blue: 'text-blue-900 dark:text-blue-100',
  amber: 'text-amber-900 dark:text-amber-100',
  red: 'text-red-900 dark:text-red-100',
};

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
    </div>
  );
}
