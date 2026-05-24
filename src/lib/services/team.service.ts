import type { MemberRole } from '../types';

export interface TeamMemberView {
  $id: string;
  user_id: string;
  org_id: string;
  role: string;
  joined_at: string;
  name: string;
  email: string;
}

export async function fetchTeamMembers(orgId: string) {
  const res = await fetch(`/api/team/members?orgId=${encodeURIComponent(orgId)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to load team');
  return data as {
    members: TeamMemberView[];
    pendingInvites: { $id: string; email: string; role: string; created_at: string }[];
  };
}

export async function inviteTeamMember(params: {
  orgId: string;
  inviterUserId: string;
  email: string;
  role: MemberRole;
}) {
  const res = await fetch('/api/team/invite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Invite failed');
  return data;
}
