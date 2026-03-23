import { getSession } from 'next-auth/react';

export type UserRole = 'member' | 'alumni' | 'admin';

export interface AuthUser {
  id?: string;
  email?: string;
  name?: string;
  role: UserRole;
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const session = await getSession();
  if (!session?.user) return null;

  const role = (session.user as any).role as UserRole || 'pledges';

  return {
    id: (session.user as any).id as string | undefined,
    email: session.user.email as string | undefined,
    name: session.user.name as string | undefined,
    role,
  };
}

export function hasRole(user: AuthUser | null, requiredRole: UserRole): boolean {
  if (!user) return false;
  const hierarchy = { alumni: 3, actives: 2, pledges: 1 };
  return hierarchy[user.role] >= hierarchy[requiredRole];
}