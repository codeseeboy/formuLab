import { NextRequest, NextResponse } from 'next/server';
import { Client, Databases, ID, Query } from 'node-appwrite';

export const runtime = 'nodejs';

/** Accept pending org invites for a user email (call after login/signup). */
export async function POST(req: NextRequest) {
  try {
    if (!process.env.APPWRITE_API_KEY) {
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    const { userId, email } = await req.json();
    const normalizedEmail = String(email ?? '').trim().toLowerCase();

    if (!userId || !normalizedEmail) {
      return NextResponse.json({ error: 'userId and email required' }, { status: 400 });
    }

    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setKey(process.env.APPWRITE_API_KEY!);

    const databases = new Databases(client);
    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;

    const invites = await databases.listDocuments(dbId, 'org_invites', [
      Query.equal('email', normalizedEmail),
      Query.equal('status', 'pending'),
      Query.limit(10),
    ]);

    let accepted = 0;
    for (const inv of invites.documents) {
      const orgId = inv.org_id as string;
      const existing = await databases.listDocuments(dbId, 'members', [
        Query.equal('org_id', orgId),
        Query.equal('user_id', userId),
        Query.limit(1),
      ]);
      if (existing.documents.length === 0) {
        await databases.createDocument(dbId, 'members', ID.unique(), {
          user_id: userId,
          org_id: orgId,
          role: inv.role,
          invited_by: inv.invited_by,
          joined_at: new Date().toISOString(),
        });
        accepted++;
      }
      await databases.updateDocument(dbId, 'org_invites', inv.$id, { status: 'accepted' });
    }

    return NextResponse.json({ success: true, accepted });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Process invites failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
