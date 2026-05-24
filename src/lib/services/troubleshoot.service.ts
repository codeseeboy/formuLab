import { databases, ID, DATABASE_ID, Query } from '../appwrite';
import { COLLECTIONS } from '../constants';
import type { TroubleshootingSession, IssueCategory, TroubleshootDiagnosis } from '../types';

export async function saveTroubleshootSession(params: {
  orgId: string;
  userId: string;
  issueCategory: IssueCategory;
  description: string;
  diagnosis: TroubleshootDiagnosis;
  formulationId?: string;
}): Promise<TroubleshootingSession> {
  const doc = await databases.createDocument(DATABASE_ID, COLLECTIONS.TROUBLESHOOTING, ID.unique(), {
    org_id: params.orgId,
    formulation_id: params.formulationId ?? '',
    issue_category: params.issueCategory,
    description: params.description.slice(0, 8000),
    ai_diagnosis: JSON.stringify(params.diagnosis),
    resolution_notes: '',
    resolved: false,
    created_by: params.userId,
    created_at: new Date().toISOString(),
  });
  return doc as unknown as TroubleshootingSession;
}

export async function listTroubleshootSessions(orgId: string, limit = 30): Promise<TroubleshootingSession[]> {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.TROUBLESHOOTING, [
    Query.equal('org_id', orgId),
    Query.orderDesc('created_at'),
    Query.limit(limit),
  ]);
  return res.documents as unknown as TroubleshootingSession[];
}

export async function updateSessionResolution(
  sessionId: string,
  resolutionNotes: string,
  resolved: boolean
): Promise<TroubleshootingSession> {
  const doc = await databases.updateDocument(DATABASE_ID, COLLECTIONS.TROUBLESHOOTING, sessionId, {
    resolution_notes: resolutionNotes,
    resolved,
  });
  return doc as unknown as TroubleshootingSession;
}
