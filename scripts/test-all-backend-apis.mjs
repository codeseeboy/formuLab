/**
 * Full backend API test suite for FormuLab
 * - Multi-LLM Backend (Render)
 * - Appwrite BaaS (cloud)
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { randomBytes } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = {};
for (const line of readFileSync(resolve(__dirname, '../.env.local'), 'utf8').split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const eq = t.indexOf('=');
  if (eq > 0) env[t.slice(0, eq)] = t.slice(eq + 1).trim();
}

const LLM_BASE = 'https://llm-backend-635x.onrender.com';
const APPWRITE = env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const PROJECT = env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const DATABASE = env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

const COLLECTIONS = [
  'organizations', 'members', 'active_ingredients', 'formulations',
  'recipe_ingredients', 'stability_tests', 'troubleshooting_sessions',
  'reports', 'audit_log',
];

const results = [];
function pass(name, detail = '') { results.push({ name, ok: true, detail }); console.log(`[PASS] ${name}${detail ? ` — ${detail}` : ''}`); }
function fail(name, detail = '') { results.push({ name, ok: false, detail }); console.log(`[FAIL] ${name}${detail ? ` — ${detail}` : ''}`); }

async function jsonFetch(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  let body;
  try { body = text ? JSON.parse(text) : {}; } catch { body = { raw: text.slice(0, 300) }; }
  return { res, body };
}

function extractSessionCookie(res) {
  const cookies = res.headers.getSetCookie?.() || [];
  const main = cookies.find((c) => c.startsWith(`a_session_${PROJECT}=`) && !c.includes('_legacy'));
  return main?.split(';')[0] || '';
}

// ===================== LLM Backend =====================
console.log('\n--- Multi-LLM Backend (Render) ---\n');

{
  const { res, body } = await jsonFetch(`${LLM_BASE}/`);
  res.ok && body.name ? pass('GET /', `name=${body.name}`) : fail('GET /', `${res.status}`);
}

{
  const { res, body } = await jsonFetch(`${LLM_BASE}/health`);
  res.ok ? pass('GET /health', JSON.stringify(body).slice(0, 80)) : fail('GET /health', `${res.status}`);
}

{
  const { res, body } = await jsonFetch(`${LLM_BASE}/api/providers`);
  res.ok ? pass('GET /api/providers', `providers=${Object.keys(body.providers || body).join(',') || 'ok'}`) : fail('GET /api/providers', `${res.status}`);
}

{
  const { res, body } = await jsonFetch(`${LLM_BASE}/api/generate/json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: 'Return JSON: {"test":"pass"}',
      system: 'Respond only with valid JSON.',
      preferred_provider: 'gemini',
      temperature: 0.1,
    }),
  });
  res.ok && body.success ? pass('POST /api/generate/json', `provider=${body.provider || 'n/a'}`) : fail('POST /api/generate/json', `${res.status} ${body.error || ''}`);
}

{
  const form = new FormData();
  form.append('prompt', 'Say hello in one word.');
  form.append('system', 'Be brief.');
  form.append('preferred_provider', 'gemini');
  const res = await fetch(`${LLM_BASE}/api/generate`, { method: 'POST', body: form });
  const body = await res.json().catch(() => ({}));
  res.ok && body.success ? pass('POST /api/generate (multipart)', `response=${String(body.response).slice(0, 40)}`) : fail('POST /api/generate (multipart)', `${res.status} ${body.error || ''}`);
}

// ===================== Appwrite =====================
console.log('\n--- Appwrite BaaS ---\n');

const projectHeaders = { 'Content-Type': 'application/json', 'X-Appwrite-Project': PROJECT };

{
  const { res, body } = await jsonFetch(`${APPWRITE}/account`, { headers: projectHeaders });
  res.status === 401 ? pass('GET /account (unauthenticated)', '401 as expected') : fail('GET /account (unauthenticated)', `${res.status}`);
}

const suffix = randomBytes(4).toString('hex');
const email = `formulab-api-${suffix}@mail.test`;
const password = `ApiTest_${suffix}!`;
const userId = `uid${suffix}`;

let authCookie = '';
{
  const { res, body } = await jsonFetch(`${APPWRITE}/account`, {
    method: 'POST',
    headers: projectHeaders,
    body: JSON.stringify({ userId, email, password, name: 'API Tester' }),
  });
  res.status === 201 ? pass('POST /account (signup)', `id=${body.$id}`) : fail('POST /account (signup)', `${res.status} ${body.message}`);
}

{
  const { res, body } = await jsonFetch(`${APPWRITE}/account/sessions/email`, {
    method: 'POST',
    headers: projectHeaders,
    body: JSON.stringify({ email, password }),
  });
  if (res.ok) {
    authCookie = extractSessionCookie(res);
    pass('POST /account/sessions/email', `session=${body.$id}`);
  } else {
    fail('POST /account/sessions/email', body.message);
  }
}

const authHeaders = {
  ...projectHeaders,
  Cookie: authCookie,
};

if (authCookie) {
  {
    const { res, body } = await jsonFetch(`${APPWRITE}/account`, { headers: authHeaders });
    res.ok ? pass('GET /account (authenticated)', body.email) : fail('GET /account (authenticated)', body.message);
  }

  {
    const { res, body } = await jsonFetch(`${APPWRITE}/account/sessions/current`, { headers: authHeaders });
    res.ok ? pass('GET /account/sessions/current', body.$id) : fail('GET /account/sessions/current', body.message);
  }
}

for (const coll of COLLECTIONS) {
  const { res, body } = await jsonFetch(
    `${APPWRITE}/databases/${DATABASE}/collections/${coll}/documents`,
    { headers: authCookie ? authHeaders : projectHeaders }
  );
  if (res.status === 200) {
    pass(`GET /databases/.../collections/${coll}/documents`, `total=${body.total}`);
  } else if (res.status === 404 && body.message?.includes('could not be found')) {
    fail(`GET collections/${coll}/documents`, 'collection not initialized');
  } else {
    fail(`GET collections/${coll}/documents`, `${res.status} ${body.message || ''}`);
  }
}

for (const bucket of ['reports', 'org-logos']) {
  const { res, body } = await jsonFetch(`${APPWRITE}/storage/buckets/${bucket}`, {
    headers: authCookie ? authHeaders : projectHeaders,
  });
  if (res.status === 200) pass(`GET /storage/buckets/${bucket}`, body.name);
  else if (res.status === 404) fail(`GET /storage/buckets/${bucket}`, 'bucket not found');
  else fail(`GET /storage/buckets/${bucket}`, `${res.status} ${body.message || ''}`);
}

// ===================== Frontend =====================
console.log('\n--- Next.js Frontend ---\n');
try {
  const res = await fetch('http://localhost:3000', { signal: AbortSignal.timeout(10000) });
  const html = await res.text();
  res.ok && html.includes('FormuLab') ? pass('GET http://localhost:3000', 'app loads') : fail('GET http://localhost:3000', `status=${res.status}`);
} catch (e) {
  fail('GET http://localhost:3000', e.message);
}

const ok = results.filter((r) => r.ok).length;
const bad = results.filter((r) => !r.ok).length;
console.log(`\n=== TOTAL: ${ok} passed, ${bad} failed (${results.length} tests) ===`);
if (bad > 0 && results.some((r) => r.detail?.includes('not initialized'))) {
  console.log('\nTo fix Appwrite collections: add APPWRITE_API_KEY to .env.local, then run:');
  console.log('  npm install node-appwrite dotenv');
  console.log('  node src/scripts/init-db.js\n');
}
process.exit(bad > 0 ? 1 : 0);
