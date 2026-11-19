const MAX_NOTE_LENGTH = 1000;
const MAX_REQUESTS_PER_HOUR = 5;
const LEASE_DURATION_MS = 5 * 60 * 1000;

function json(body, status = 200, origin) {
  const headers = { 'content-type': 'application/json', 'cache-control': 'no-store' };
  if (origin) headers['access-control-allow-origin'] = origin;
  return new Response(JSON.stringify(body), { status, headers });
}

function allowedOrigin(request, env) {
  const origin = request.headers.get('Origin');
  return origin === env.SITE_ORIGIN ? origin : null;
}

function piAuthorized(request, env) {
  const authorization = request.headers.get('Authorization');
  return authorization === `Bearer ${env.PI_TOKEN}`;
}

async function hashIp(request, env) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const bytes = new TextEncoder().encode(`${env.IP_HASH_SECRET}:${ip}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

async function validTurnstile(token, request, env) {
  const form = new FormData();
  form.append('secret', env.TURNSTILE_SECRET);
  form.append('response', token);
  form.append('remoteip', request.headers.get('CF-Connecting-IP') || '');
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST', body: form
  });
  return response.ok && (await response.json()).success === true;
}

async function submit(request, env, origin) {
  if (!origin) return json({ error: 'Origin is not allowed.' }, 403);
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Expected JSON.' }, 400, origin); }
  const note = typeof body.note === 'string' ? body.note.trim() : '';
  if (!note || note.length > MAX_NOTE_LENGTH) {
    return json({ error: `Note must be between 1 and ${MAX_NOTE_LENGTH} characters.` }, 400, origin);
  }
  if (typeof body.turnstileToken !== 'string' || !(await validTurnstile(body.turnstileToken, request, env))) {
    return json({ error: 'Anti-spam verification failed.' }, 400, origin);
  }

  const now = Date.now();
  const ipHash = await hashIp(request, env);
  const recent = await env.DB.prepare(
    'SELECT COUNT(*) AS count FROM notes WHERE ip_hash = ? AND created_at > ?'
  ).bind(ipHash, now - 60 * 60 * 1000).first();
  if (recent.count >= MAX_REQUESTS_PER_HOUR) {
    return json({ error: 'Please wait before sending another note.' }, 429, origin);
  }
  const id = crypto.randomUUID();
  await env.DB.prepare('INSERT INTO notes (id, note, created_at, ip_hash) VALUES (?, ?, ?, ?)')
    .bind(id, note, now, ipHash).run();
  return json({ accepted: true, id }, 202, origin);
}

async function next(request, env) {
  if (!piAuthorized(request, env)) return json({ error: 'Unauthorized.' }, 401);
  const now = Date.now();
  const candidate = await env.DB.prepare(
    "SELECT id, note FROM notes WHERE status = 'pending' OR (status = 'leased' AND lease_until < ?) ORDER BY created_at LIMIT 1"
  ).bind(now).first();
  if (!candidate) return new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } });

  const leaseToken = crypto.randomUUID();
  const updated = await env.DB.prepare(
    "UPDATE notes SET status = 'leased', lease_token = ?, lease_until = ? WHERE id = ? AND (status = 'pending' OR (status = 'leased' AND lease_until < ?))"
  ).bind(leaseToken, now + LEASE_DURATION_MS, candidate.id, now).run();
  if (!updated.meta.changes) return new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } });
  return json({ id: candidate.id, note: candidate.note, leaseToken, leaseSeconds: LEASE_DURATION_MS / 1000 });
}

async function acknowledge(request, env) {
  if (!piAuthorized(request, env)) return json({ error: 'Unauthorized.' }, 401);
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Expected JSON.' }, 400); }
  if (typeof body.id !== 'string' || typeof body.leaseToken !== 'string') {
    return json({ error: 'Missing receipt identifiers.' }, 400);
  }
  const updated = await env.DB.prepare(
    "UPDATE notes SET status = 'printed', printed_at = ?, lease_token = NULL, lease_until = NULL WHERE id = ? AND status = 'leased' AND lease_token = ?"
  ).bind(Date.now(), body.id, body.leaseToken).run();
  return updated.meta.changes ? json({ acknowledged: true }) : json({ error: 'Lease is invalid or expired.' }, 409);
}

export default {
  async fetch(request, env) {
    const origin = allowedOrigin(request, env);
    if (request.method === 'OPTIONS' && origin) {
      return new Response(null, { status: 204, headers: {
        'access-control-allow-origin': origin,
        'access-control-allow-methods': 'POST, OPTIONS',
        'access-control-allow-headers': 'content-type',
        'access-control-max-age': '86400'
      }});
    }
    const path = new URL(request.url).pathname;
    if (request.method === 'POST' && path === '/submit') return submit(request, env, origin);
    if (request.method === 'GET' && path === '/next') return next(request, env);
    if (request.method === 'POST' && path === '/ack') return acknowledge(request, env);
    return json({ error: 'Not found.' }, 404, origin);
  }
};
