const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { once } = require('node:events');

const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'registration-test-'));
Object.assign(process.env, {
  REGISTRATION_MODE: 'verified',
  REGISTRATION_SMTP_URL: 'smtps://mail.example.invalid',
  REGISTRATION_FROM: 'registration@example.invalid',
  JWT_SECRET: 'verified-registration-tests-only-secret',
  DATABASE_DIR: scratch,
  DATABASE_PATH: path.join(scratch, 'test.sqlite')
});
const { app, db, initializeDatabase, registration } = require('../server');

let server;
let base;
before(async () => {
  await initializeDatabase();
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  base = 'http://127.0.0.1:' + server.address().port;
});
after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  await new Promise((resolve, reject) => db.close(error => error ? reject(error) : resolve()));
  fs.rmSync(scratch, { recursive: true, force: true });
});

async function post(route, body) {
  return fetch(base + route, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body)
  });
}

test('production-style registration responds uniformly and needs proof of the email', async () => {
  const input = { name: 'Test Candidate', email: 'candidate@example.invalid', password: 'first-password-123' };
  const requested = await post('/api/register', input);
  assert.equal(requested.status, 202);
  const publicResponse = await requested.json();
  assert.equal(publicResponse.confirmationRequired, true);
  assert.equal(publicResponse.token, undefined);
  assert.equal((await post('/api/login', input)).status, 401);

  const delivered = [];
  const send = async (email, code) => { delivered.push({ email, code }); };
  assert.equal(await registration.deliverOne(send), true);
  assert.equal(delivered.length, 1);
  assert.equal(delivered[0].email, input.email);
  assert.equal((await post('/api/register', { ...input, code: 'x'.repeat(43) })).status, 400);
  const code = delivered[0].code;
  const created = await post('/api/register', { ...input, code });
  assert.equal(created.status, 201);
  assert.equal((await created.json()).user.email, input.email);
  assert.equal((await post('/api/register', { ...input, code })).status, 400);

  const existing = await post('/api/register', input);
  assert.equal(existing.status, requested.status);
  assert.deepEqual(await existing.json(), publicResponse);
  assert.equal(await registration.deliverOne(send), true);
  assert.equal(delivered.length, 1);
  assert.equal((await post('/api/login', input)).status, 200);
});
