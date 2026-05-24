// ============================================================
// FormuLab — Appwrite Database Bootstrap Script
// ============================================================
// Usage: node src/scripts/init-db.js
// Requires: APPWRITE_API_KEY in .env.local
// ============================================================

import { Client, Databases, Storage, Permission, Role } from 'node-appwrite';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../../.env.local') });

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

if (!PROJECT_ID || !API_KEY || !DATABASE_ID) {
  console.error('Missing env: NEXT_PUBLIC_APPWRITE_PROJECT_ID, APPWRITE_API_KEY, NEXT_PUBLIC_APPWRITE_DATABASE_ID');
  process.exit(1);
}

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
const databases = new Databases(client);
const storage = new Storage(client);

// Authenticated users only (org isolation enforced in app queries + server APIs)
const userPermissions = [
  Permission.read(Role.users()),
  Permission.create(Role.users()),
  Permission.update(Role.users()),
  Permission.delete(Role.users()),
];

const collections = [
  { id: 'organizations', name: 'Organizations' },
  { id: 'members', name: 'Members' },
  { id: 'active_ingredients', name: 'Active Ingredients' },
  { id: 'formulations', name: 'Formulations' },
  { id: 'recipe_ingredients', name: 'Recipe Ingredients' },
  { id: 'stability_tests', name: 'Stability Tests' },
  { id: 'troubleshooting_sessions', name: 'Troubleshooting Sessions' },
  { id: 'reports', name: 'Reports' },
  { id: 'audit_log', name: 'Audit Log' },
  { id: 'knowledge_documents', name: 'Knowledge Documents' },
  { id: 'knowledge_chunks', name: 'Knowledge Chunks' },
  { id: 'org_invites', name: 'Organization Invites' },
];

const buckets = [
  { id: 'reports', name: 'Reports' },
  { id: 'org-logos', name: 'Organization Logos' },
  { id: 'knowledge-files', name: 'Knowledge Files' },
];

/** @type {Record<string, Array<{ type: string, key: string; size?: number; required?: boolean; min?: number; max?: number; default?: unknown }>>} */
const SCHEMA = {
  organizations: [
    { type: 'string', key: 'name', size: 255, required: true },
    { type: 'string', key: 'slug', size: 255, required: true },
    { type: 'string', key: 'logo_url', size: 2048, required: false },
    { type: 'string', key: 'plan', size: 32, required: true },
    { type: 'string', key: 'created_at', size: 64, required: true },
  ],
  members: [
    { type: 'string', key: 'user_id', size: 64, required: true },
    { type: 'string', key: 'org_id', size: 64, required: true },
    { type: 'string', key: 'role', size: 32, required: true },
    { type: 'string', key: 'invited_by', size: 64, required: true },
    { type: 'string', key: 'joined_at', size: 64, required: true },
  ],
  active_ingredients: [
    { type: 'string', key: 'org_id', size: 64, required: true },
    { type: 'string', key: 'name', size: 255, required: true },
    { type: 'string', key: 'iupac_name', size: 512, required: false },
    { type: 'string', key: 'cas_number', size: 64, required: false },
    { type: 'float', key: 'molecular_weight', required: false },
    { type: 'float', key: 'melting_point', required: false },
    { type: 'float', key: 'solubility_water', required: false },
    { type: 'float', key: 'log_p', required: false },
    { type: 'float', key: 'vapor_pressure', required: false },
    { type: 'float', key: 'pka', required: false },
    { type: 'float', key: 'technical_purity', required: false },
    { type: 'string', key: 'physical_form', size: 32, required: false },
    { type: 'float', key: 'particle_size_d50', required: false },
    { type: 'string', key: 'hazard_class', size: 128, required: false },
    { type: 'string', key: 'target_pest_category', size: 32, required: false },
    { type: 'string', key: 'notes', size: 4096, required: false },
    { type: 'string', key: 'created_by', size: 64, required: false },
    { type: 'string', key: 'created_at', size: 64, required: true },
  ],
  formulations: [
    { type: 'string', key: 'org_id', size: 64, required: true },
    { type: 'string', key: 'ai_id', size: 64, required: false },
    { type: 'string', key: 'name', size: 255, required: true },
    { type: 'string', key: 'status', size: 32, required: true },
    { type: 'string', key: 'formulation_type', size: 16, required: false },
    { type: 'float', key: 'target_ai_loading', required: false },
    { type: 'string', key: 'recommended_types', size: 16384, required: false },
    { type: 'string', key: 'surfactant_strategy', size: 16384, required: false },
    { type: 'string', key: 'stability_assessment', size: 16384, required: false },
    { type: 'string', key: 'recipe_json', size: 32768, required: false },
    { type: 'integer', key: 'version', required: false },
    { type: 'string', key: 'created_by', size: 64, required: false },
    { type: 'string', key: 'created_at', size: 64, required: true },
    { type: 'string', key: 'updated_at', size: 64, required: false },
  ],
  recipe_ingredients: [
    { type: 'string', key: 'formulation_id', size: 64, required: true },
    { type: 'string', key: 'ingredient_name', size: 255, required: true },
    { type: 'string', key: 'ingredient_role', size: 32, required: false },
    { type: 'float', key: 'quantity', required: false },
    { type: 'string', key: 'unit', size: 32, required: false },
    { type: 'string', key: 'supplier', size: 255, required: false },
    { type: 'string', key: 'notes', size: 2048, required: false },
    { type: 'integer', key: 'sort_order', required: false },
  ],
  stability_tests: [
    { type: 'string', key: 'formulation_id', size: 64, required: true },
    { type: 'string', key: 'test_type', size: 64, required: true },
    { type: 'integer', key: 'duration_days', required: false },
    { type: 'string', key: 'result_status', size: 32, required: false },
    { type: 'string', key: 'observations', size: 4096, required: false },
    { type: 'string', key: 'data_json', size: 16384, required: false },
    { type: 'string', key: 'tested_by', size: 64, required: false },
    { type: 'string', key: 'tested_at', size: 64, required: false },
  ],
  troubleshooting_sessions: [
    { type: 'string', key: 'org_id', size: 64, required: true },
    { type: 'string', key: 'formulation_id', size: 64, required: false },
    { type: 'string', key: 'issue_category', size: 64, required: true },
    { type: 'string', key: 'description', size: 8192, required: true },
    { type: 'string', key: 'ai_diagnosis', size: 32768, required: false },
    { type: 'string', key: 'resolution_notes', size: 4096, required: false },
    { type: 'boolean', key: 'resolved', required: false },
    { type: 'string', key: 'created_by', size: 64, required: false },
    { type: 'string', key: 'created_at', size: 64, required: true },
  ],
  reports: [
    { type: 'string', key: 'org_id', size: 64, required: true },
    { type: 'string', key: 'formulation_id', size: 64, required: false },
    { type: 'string', key: 'title', size: 255, required: true },
    { type: 'string', key: 'report_type', size: 64, required: true },
    { type: 'string', key: 'file_id', size: 64, required: false },
    { type: 'string', key: 'generated_by', size: 64, required: false },
    { type: 'string', key: 'generated_at', size: 64, required: true },
  ],
  audit_log: [
    { type: 'string', key: 'org_id', size: 64, required: true },
    { type: 'string', key: 'user_id', size: 64, required: true },
    { type: 'string', key: 'action', size: 128, required: true },
    { type: 'string', key: 'entity_type', size: 64, required: true },
    { type: 'string', key: 'entity_id', size: 64, required: true },
    { type: 'string', key: 'details', size: 4096, required: false },
    { type: 'string', key: 'timestamp', size: 64, required: true },
  ],
  knowledge_documents: [
    { type: 'string', key: 'org_id', size: 64, required: true },
    { type: 'string', key: 'title', size: 512, required: true },
    { type: 'string', key: 'filename', size: 512, required: true },
    { type: 'string', key: 'source_type', size: 32, required: true },
    { type: 'string', key: 'mime_type', size: 128, required: false },
    { type: 'integer', key: 'chunk_count', required: true },
    { type: 'string', key: 'file_id', size: 64, required: false },
    { type: 'string', key: 'created_by', size: 64, required: true },
    { type: 'string', key: 'created_at', size: 64, required: true },
  ],
  knowledge_chunks: [
    { type: 'string', key: 'org_id', size: 64, required: true },
    { type: 'string', key: 'document_id', size: 64, required: true },
    { type: 'integer', key: 'chunk_index', required: true },
    { type: 'string', key: 'content', size: 16384, required: true },
    { type: 'string', key: 'source_title', size: 512, required: true },
    { type: 'string', key: 'source_type', size: 32, required: true },
    { type: 'string', key: 'created_at', size: 64, required: true },
  ],
  org_invites: [
    { type: 'string', key: 'org_id', size: 64, required: true },
    { type: 'string', key: 'email', size: 255, required: true },
    { type: 'string', key: 'role', size: 32, required: true },
    { type: 'string', key: 'invited_by', size: 64, required: true },
    { type: 'string', key: 'status', size: 32, required: true },
    { type: 'string', key: 'created_at', size: 64, required: true },
  ],
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function ensureCollection(coll) {
  try {
    await databases.createCollection(DATABASE_ID, coll.id, coll.name, userPermissions);
    console.log(`✅ Collection '${coll.id}' created.`);
  } catch (error) {
    if (error.code === 409) {
      await databases.updateCollection(DATABASE_ID, coll.id, coll.name, userPermissions);
      console.log(`✅ Collection '${coll.id}' permissions updated.`);
    } else {
      console.error(`❌ Collection '${coll.id}':`, error.message);
    }
  }
}

async function ensureAttribute(collectionId, attr) {
  const { type, key, size = 255, required = false, min, max, default: defaultVal } = attr;
  try {
    if (type === 'string') {
      await databases.createStringAttribute(DATABASE_ID, collectionId, key, size, required, defaultVal ?? undefined);
    } else if (type === 'integer') {
      await databases.createIntegerAttribute(DATABASE_ID, collectionId, key, required, min, max, defaultVal ?? undefined);
    } else if (type === 'float') {
      await databases.createFloatAttribute(DATABASE_ID, collectionId, key, required, min, max, defaultVal ?? undefined);
    } else if (type === 'boolean') {
      await databases.createBooleanAttribute(DATABASE_ID, collectionId, key, required, defaultVal ?? undefined);
    }
    console.log(`   + ${collectionId}.${key}`);
    await sleep(300);
  } catch (error) {
    if (error.code === 409) {
      console.log(`   ~ ${collectionId}.${key} (exists)`);
    } else {
      console.error(`   ! ${collectionId}.${key}:`, error.message);
    }
  }
}

async function ensureBucket(bucket) {
  try {
    await storage.createBucket(bucket.id, bucket.name, userPermissions);
    console.log(`✅ Bucket '${bucket.id}' created.`);
  } catch (error) {
    if (error.code === 409) {
      await storage.updateBucket(bucket.id, bucket.name, userPermissions);
      console.log(`✅ Bucket '${bucket.id}' permissions updated.`);
    } else {
      console.error(`❌ Bucket '${bucket.id}':`, error.message);
    }
  }
}

async function init() {
  console.log(`Initializing database: ${DATABASE_ID}...\n`);

  for (const coll of collections) {
    await ensureCollection(coll);
  }

  console.log('\nCreating collection attributes (this may take a minute)...\n');
  for (const coll of collections) {
    const attrs = SCHEMA[coll.id] || [];
    if (attrs.length === 0) continue;
    console.log(`📋 ${coll.id}:`);
    for (const attr of attrs) {
      await ensureAttribute(coll.id, attr);
    }
  }

  console.log('\nCreating indexes...');
  const indexes = [
    { collection: 'members', key: 'idx_user_id', attrs: ['user_id'] },
    { collection: 'members', key: 'idx_org_id', attrs: ['org_id'] },
    { collection: 'active_ingredients', key: 'idx_org_id', attrs: ['org_id'] },
    { collection: 'formulations', key: 'idx_org_id', attrs: ['org_id'] },
    { collection: 'reports', key: 'idx_org_id', attrs: ['org_id'] },
    { collection: 'knowledge_chunks', key: 'idx_rag_org', attrs: ['org_id'] },
    { collection: 'knowledge_documents', key: 'idx_rag_docs_org', attrs: ['org_id'] },
    { collection: 'troubleshooting_sessions', key: 'idx_ts_org', attrs: ['org_id'] },
    { collection: 'audit_log', key: 'idx_audit_org', attrs: ['org_id'] },
    { collection: 'stability_tests', key: 'idx_stab_form', attrs: ['formulation_id'] },
    { collection: 'org_invites', key: 'idx_invite_email', attrs: ['email'] },
    { collection: 'org_invites', key: 'idx_invite_org', attrs: ['org_id'] },
  ];
  for (const idx of indexes) {
    try {
      await databases.createIndex(DATABASE_ID, idx.collection, idx.key, 'key', idx.attrs);
      console.log(`   + ${idx.collection}.${idx.key}`);
    } catch (error) {
      if (error.code === 409) console.log(`   ~ ${idx.collection}.${idx.key} (exists)`);
      else console.error(`   ! ${idx.collection}.${idx.key}:`, error.message);
    }
  }

  console.log('\nInitializing storage buckets...');
  for (const bucket of buckets) {
    await ensureBucket(bucket);
  }

  console.log('\n🎉 Database + schema ready!');
}

init().catch(console.error);
