/** Update collection + bucket permissions only (skip create) */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Client, Databases, Storage, Permission, Role } from 'node-appwrite';

const env = {};
for (const line of readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../.env.local'), 'utf8').split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const eq = t.indexOf('=');
  if (eq > 0) env[t.slice(0, eq)] = t.slice(eq + 1).trim();
}

const client = new Client()
  .setEndpoint(env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(env.APPWRITE_API_KEY);

const databases = new Databases(client);
const storage = new Storage(client);
const DB = env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const perms = [
  Permission.read(Role.users()),
  Permission.create(Role.users()),
  Permission.update(Role.users()),
  Permission.delete(Role.users()),
];

const collections = [
  'organizations', 'members', 'active_ingredients', 'formulations',
  'recipe_ingredients', 'stability_tests', 'troubleshooting_sessions', 'reports', 'audit_log',
];

console.log('Updating permissions only...\n');
let ok = 0, fail = 0;

for (const id of collections) {
  try {
    await databases.updateCollection(DB, id, id, perms);
    console.log(`✅ ${id}`);
    ok++;
  } catch (e) {
    console.log(`❌ ${id}: ${e.message}`);
    fail++;
  }
}

for (const id of ['reports', 'org-logos']) {
  try {
    await storage.updateBucket(id, id, perms);
    console.log(`✅ bucket ${id}`);
    ok++;
  } catch (e) {
    console.log(`❌ bucket ${id}: ${e.message}`);
    fail++;
  }
}

console.log(`\nDone: ${ok} ok, ${fail} failed`);
if (fail > 0) process.exit(1);
