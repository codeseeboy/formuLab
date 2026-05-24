// ============================================================
// FormuLab — Authentication Service
// ============================================================

import { account, databases, ID, DATABASE_ID, Query } from '../appwrite';
import { COLLECTIONS } from '../constants';
import { slugify } from '../utils';
import type { AuthUser, Organization, Member } from '../types';

function isSessionActiveError(err: unknown): boolean {
  const message = String((err as { message?: string })?.message ?? '').toLowerCase();
  return message.includes('session is active') || message.includes('prohibited when a session');
}

/** Create email session only when needed (Appwrite blocks duplicate sessions). */
async function ensureEmailPasswordSession(email: string, password: string): Promise<void> {
  const normalizedEmail = email.toLowerCase();

  try {
    const user = await account.get();
    if (user.email?.toLowerCase() === normalizedEmail) return;
    await account.deleteSession('current');
  } catch {
    // No active session
  }

  try {
    await account.createEmailPasswordSession(email, password);
  } catch (err: unknown) {
    if (!isSessionActiveError(err)) throw err;
    const user = await account.get();
    if (user.email?.toLowerCase() === normalizedEmail) return;
    throw err;
  }
}

async function processPendingInvites(userId: string, email: string): Promise<void> {
  try {
    await fetch('/api/team/process-invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, email }),
    });
  } catch {
    /* non-blocking */
  }
}

/**
 * Sign up a new user and create their organization
 */
export async function signUp(
  email: string,
  password: string,
  name: string,
  orgName: string
): Promise<{ user: AuthUser; org: Organization }> {
  let user: AuthUser;

  try {
    user = (await account.create(ID.unique(), email, password, name)) as unknown as AuthUser;
    await ensureEmailPasswordSession(email, password);
  } catch (err: unknown) {
    const code = (err as { code?: number })?.code;
    if (code !== 409) throw err;
    // Account exists from a previous partial signup — sign in and continue
    await ensureEmailPasswordSession(email, password);
    user = (await account.get()) as unknown as AuthUser;
  }

  // Create the organization
  const org = await databases.createDocument(
    DATABASE_ID,
    COLLECTIONS.ORGANIZATIONS,
    ID.unique(),
    {
      name: orgName,
      slug: slugify(orgName),
      logo_url: '',
      plan: 'free',
      created_at: new Date().toISOString(),
    }
  );

  // Add the user as owner of the org
  await databases.createDocument(
    DATABASE_ID,
    COLLECTIONS.MEMBERS,
    ID.unique(),
    {
      user_id: user.$id,
      org_id: org.$id,
      role: 'owner',
      invited_by: user.$id,
      joined_at: new Date().toISOString(),
    }
  );

  await processPendingInvites(user.$id, email);

  return {
    user: user as unknown as AuthUser,
    org: org as unknown as Organization,
  };
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string) {
  await ensureEmailPasswordSession(email, password);
  const user = await account.get();
  await processPendingInvites(user.$id, email);
}

/**
 * Sign out the current user
 */
export async function signOut() {
  return await account.deleteSession('current');
}

/**
 * Get the currently logged-in user
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const user = await account.get();
    return user as unknown as AuthUser;
  } catch {
    return null;
  }
}

/**
 * Check if a session exists
 */
export async function getSession() {
  try {
    return await account.getSession('current');
  } catch {
    return null;
  }
}

/**
 * Get the user's organization membership
 */
export async function getUserMembership(userId: string): Promise<Member | null> {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.MEMBERS,
      [Query.equal('user_id', userId), Query.limit(1)]
    );
    if (response.documents.length > 0) {
      return response.documents[0] as unknown as Member;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Get organization by ID
 */
export async function getOrganization(orgId: string): Promise<Organization | null> {
  try {
    const doc = await databases.getDocument(
      DATABASE_ID,
      COLLECTIONS.ORGANIZATIONS,
      orgId
    );
    return doc as unknown as Organization;
  } catch {
    return null;
  }
}
