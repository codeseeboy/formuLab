import { databases, ID, DATABASE_ID, Query } from '../appwrite';
import { COLLECTIONS } from '../constants';
import type { AuditLogEntry } from '../types';

export async function logAudit(params: {
  orgId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: string;
}): Promise<void> {
  try {
    await databases.createDocument(DATABASE_ID, COLLECTIONS.AUDIT_LOG, ID.unique(), {
      org_id: params.orgId,
      user_id: params.userId,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId,
      details: params.details?.slice(0, 4000) ?? '',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Audit log failed', err);
  }
}

export async function listAuditLog(orgId: string, limit = 50): Promise<AuditLogEntry[]> {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.AUDIT_LOG, [
    Query.equal('org_id', orgId),
    Query.orderDesc('timestamp'),
    Query.limit(limit),
  ]);
  return res.documents as unknown as AuditLogEntry[];
}
