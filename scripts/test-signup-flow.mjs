import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Client, Account, Databases, ID } from 'appwrite';

const env = {};
for (const line of readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../.env.local'), 'utf8').split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const eq = t.indexOf('=');
  if (eq > 0) env[t.slice(0, eq)] = t.slice(eq + 1).trim();
}

const client = new Client()
  .setEndpoint(env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

const account = new Account(client);
const databases = new Databases(client);
const suffix = Date.now();
const email = `test-${suffix}@mail.test`;
const password = 'TestPass123!';
const DB = env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

try {
  const user = await account.create(ID.unique(), email, password, 'Test User');
  await account.createEmailPasswordSession(email, password);

  const org = await databases.createDocument(DB, 'organizations', ID.unique(), {
    name: 'Test Org',
    slug: `test-org-${suffix}`,
    logo_url: '',
    plan: 'free',
    created_at: new Date().toISOString(),
  });

  const member = await databases.createDocument(DB, 'members', ID.unique(), {
    user_id: user.$id,
    org_id: org.$id,
    role: 'owner',
    invited_by: user.$id,
    joined_at: new Date().toISOString(),
  });

  console.log('✅ SIGNUP FLOW OK');
  console.log({ email, userId: user.$id, orgId: org.$id, memberId: member.$id });
} catch (e) {
  console.error('❌ SIGNUP FAILED:', e.message || e);
  process.exit(1);
}
