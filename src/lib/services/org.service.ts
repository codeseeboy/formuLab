// ============================================================
// FormuLab — Organization Service
// ============================================================

import { databases, ID, DATABASE_ID, Query } from '../appwrite';
import { COLLECTIONS } from '../constants';
import type { Organization, Member, MemberRole } from '../types';

/**
 * Create a new organization
 */
export async function createOrganization(
  name: string,
  slug: string,
  userId: string
): Promise<Organization> {
  const org = await databases.createDocument(
    DATABASE_ID,
    COLLECTIONS.ORGANIZATIONS,
    ID.unique(),
    {
      name,
      slug,
      logo_url: '',
      plan: 'free',
      created_at: new Date().toISOString(),
    }
  );

  // Add creator as owner
  await databases.createDocument(
    DATABASE_ID,
    COLLECTIONS.MEMBERS,
    ID.unique(),
    {
      user_id: userId,
      org_id: org.$id,
      role: 'owner',
      invited_by: userId,
      joined_at: new Date().toISOString(),
    }
  );

  return org as unknown as Organization;
}

/**
 * Get an organization by ID
 */
export async function getOrganization(orgId: string): Promise<Organization> {
  const doc = await databases.getDocument(
    DATABASE_ID,
    COLLECTIONS.ORGANIZATIONS,
    orgId
  );
  return doc as unknown as Organization;
}

/**
 * Update organization details
 */
export async function updateOrganization(
  orgId: string,
  data: Partial<Pick<Organization, 'name' | 'slug' | 'logo_url'>>
): Promise<Organization> {
  const doc = await databases.updateDocument(
    DATABASE_ID,
    COLLECTIONS.ORGANIZATIONS,
    orgId,
    data
  );
  return doc as unknown as Organization;
}

/**
 * List all members of an organization
 */
export async function getMembers(orgId: string): Promise<Member[]> {
  const response = await databases.listDocuments(
    DATABASE_ID,
    COLLECTIONS.MEMBERS,
    [
      Query.equal('org_id', orgId),
      Query.orderDesc('joined_at'),
    ]
  );
  return response.documents as unknown as Member[];
}

/**
 * Add a member to an organization
 */
export async function addMember(
  orgId: string,
  userId: string,
  role: MemberRole,
  invitedBy: string
): Promise<Member> {
  const doc = await databases.createDocument(
    DATABASE_ID,
    COLLECTIONS.MEMBERS,
    ID.unique(),
    {
      user_id: userId,
      org_id: orgId,
      role,
      invited_by: invitedBy,
      joined_at: new Date().toISOString(),
    }
  );
  return doc as unknown as Member;
}

/**
 * Update a member's role
 */
export async function updateMemberRole(
  memberId: string,
  role: MemberRole
): Promise<Member> {
  const doc = await databases.updateDocument(
    DATABASE_ID,
    COLLECTIONS.MEMBERS,
    memberId,
    { role }
  );
  return doc as unknown as Member;
}

/**
 * Remove a member from an organization
 */
export async function removeMember(memberId: string): Promise<void> {
  await databases.deleteDocument(
    DATABASE_ID,
    COLLECTIONS.MEMBERS,
    memberId
  );
}
