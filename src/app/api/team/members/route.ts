import { NextRequest, NextResponse } from 'next/server';
import { Client, Databases, Users, Query } from 'node-appwrite';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    if (!process.env.APPWRITE_API_KEY) {
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    const orgId = req.nextUrl.searchParams.get('orgId');
    if (!orgId) {
      return NextResponse.json({ error: 'orgId required' }, { status: 400 });
    }

    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setKey(process.env.APPWRITE_API_KEY!);

    const databases = new Databases(client);
    const users = new Users(client);
    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;

    const membersRes = await databases.listDocuments(dbId, 'members', [
      Query.equal('org_id', orgId),
      Query.orderDesc('joined_at'),
      Query.limit(50),
    ]);

    const enriched = await Promise.all(
      membersRes.documents.map(async (m) => {
        try {
          const u = await users.get(m.user_id as string);
          return {
            $id: m.$id,
            user_id: m.user_id,
            org_id: m.org_id,
            role: m.role,
            joined_at: m.joined_at,
            name: u.name,
            email: u.email,
          };
        } catch {
          return {
            $id: m.$id,
            user_id: m.user_id,
            org_id: m.org_id,
            role: m.role,
            joined_at: m.joined_at,
            name: 'User',
            email: '',
          };
        }
      })
    );

    const invitesRes = await databases.listDocuments(dbId, 'org_invites', [
      Query.equal('org_id', orgId),
      Query.equal('status', 'pending'),
      Query.limit(20),
    ]);

    return NextResponse.json({
      members: enriched,
      pendingInvites: invitesRes.documents.map((i) => ({
        $id: i.$id,
        email: i.email,
        role: i.role,
        created_at: i.created_at,
      })),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load team';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
