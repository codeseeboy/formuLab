import { NextRequest, NextResponse } from 'next/server';
import { Client, Databases, Users, ID, Query } from 'node-appwrite';

export const runtime = 'nodejs';

function getAdminClient() {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    .setKey(process.env.APPWRITE_API_KEY!);
  return { databases: new Databases(client), users: new Users(client) };
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.APPWRITE_API_KEY) {
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    const { orgId, inviterUserId, email, role } = await req.json();
    const normalizedEmail = String(email ?? '').trim().toLowerCase();

    if (!orgId || !inviterUserId || !normalizedEmail || !role) {
      return NextResponse.json({ error: 'orgId, inviterUserId, email, role required' }, { status: 400 });
    }

    const { databases, users } = getAdminClient();
    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;

    const existingMembers = await databases.listDocuments(dbId, 'members', [
      Query.equal('org_id', orgId),
      Query.limit(100),
    ]);

    const userList = await users.list([Query.equal('email', normalizedEmail), Query.limit(1)]);
    const targetUser = userList.users[0];

    if (targetUser) {
      const already = existingMembers.documents.some((m) => m.user_id === targetUser.$id);
      if (already) {
        return NextResponse.json({ error: 'User is already a team member' }, { status: 409 });
      }

      await databases.createDocument(dbId, 'members', ID.unique(), {
        user_id: targetUser.$id,
        org_id: orgId,
        role,
        invited_by: inviterUserId,
        joined_at: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        status: 'added',
        message: `${normalizedEmail} added to the team`,
      });
    }

    const pending = await databases.listDocuments(dbId, 'org_invites', [
      Query.equal('org_id', orgId),
      Query.equal('email', normalizedEmail),
      Query.equal('status', 'pending'),
      Query.limit(1),
    ]);

    if (pending.documents.length > 0) {
      return NextResponse.json({ error: 'Invite already pending for this email' }, { status: 409 });
    }

    await databases.createDocument(dbId, 'org_invites', ID.unique(), {
      org_id: orgId,
      email: normalizedEmail,
      role,
      invited_by: inviterUserId,
      status: 'pending',
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      status: 'pending',
      message: `Invite saved. ${normalizedEmail} will join when they sign up with this email.`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invite failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
