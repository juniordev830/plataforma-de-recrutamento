const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const repoRoot = path.resolve(__dirname, '..');
const tempDir = fs.mkdtempSync(path.join(repoRoot, '.test-tmp-'));
fs.copyFileSync(path.join(repoRoot, 'server.js'), path.join(tempDir, 'server.js'));
fs.symlinkSync(path.join(repoRoot, 'node_modules'), path.join(tempDir, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
process.env.JWT_SECRET = 'test-only-secret-key-with-at-least-32-characters';

// Load a temporary copy so SQLite files are created only inside the disposable test directory.
const { app, db, initializeDatabase } = require(path.join(tempDir, 'server.js'));

let server;
let baseUrl;

before(async () => {
  await initializeDatabase();
  server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  await new Promise((resolve, reject) => db.close((error) => error ? reject(error) : resolve()));
  fs.rmSync(tempDir, { recursive: true, force: true });
});

async function request(route, options = {}) {
  return fetch(`${baseUrl}${route}`, {
    ...options,
    headers: { 'content-type': 'application/json', ...(options.headers || {}) }
  });
}

async function registerCandidate() {
  const email = `candidate-${randomUUID()}@example.com`;
  const response = await request('/api/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'Test Candidate', email, password: 'strong-password-123', role: 'candidate' })
  });
  assert.equal(response.status, 201);
  return response.json();
}

test('health endpoint reports that the API is running', async () => {
  const response = await request('/api/health');
  assert.equal(response.status, 200);
  assert.equal((await response.json()).ok, true);
});

test('registration rejects weak passwords and unsupported roles', async () => {
  const weakPassword = await request('/api/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'Test', email: 'weak@example.com', password: '123', role: 'candidate' })
  });
  assert.equal(weakPassword.status, 400);

  const invalidRole = await request('/api/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'Test', email: 'role@example.com', password: 'strong-password-123', role: 'admin' })
  });
  assert.equal(invalidRole.status, 400);
});

test('public registration cannot grant privileged company or recruiter roles', async () => {
  for (const role of ['company', 'recruiter']) {
    const response = await request('/api/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Untrusted User',
        email: `privileged-${role}-${randomUUID()}@example.com`,
        password: 'strong-password-123',
        role,
        companyName: 'Attacker Company'
      })
    });
    assert.equal(response.status, 400);
  }

  const candidate = await registerCandidate();
  assert.equal(candidate.user.role, 'candidate');
  assert.equal(candidate.user.companyName, '');
});

test('protected endpoints reject missing authentication', async () => {
  const response = await request('/api/applications');
  assert.equal(response.status, 401);
});

test('candidate cannot publish a job', async () => {
  const candidate = await registerCandidate();
  const response = await request('/api/jobs', {
    method: 'POST',
    headers: { authorization: `Bearer ${candidate.token}` },
    body: JSON.stringify({
      title: 'Unauthorized job',
      company: 'Spoofed company',
      location: 'Remote',
      type: 'fulltime',
      description: 'Should not be accepted'
    })
  });
  assert.equal(response.status, 403);
});

test('applications use the authenticated identity and actual job data; duplicate applications are rejected', async () => {
  const candidate = await registerCandidate();
  const jobsResponse = await request('/api/jobs');
  assert.equal(jobsResponse.status, 200);
  const jobs = await jobsResponse.json();
  assert.ok(jobs.length > 0);

  const job = jobs[0];
  const response = await request('/api/applications', {
    method: 'POST',
    headers: { authorization: `Bearer ${candidate.token}` },
    body: JSON.stringify({
      jobId: job.id,
      jobTitle: 'Forged title',
      company: 'Forged company',
      name: 'Forged name',
      email: 'forged@example.com'
    })
  });
  assert.equal(response.status, 201);
  const application = await response.json();
  assert.equal(application.jobTitle, job.title);
  assert.equal(application.company, job.company);
  assert.equal(application.name, candidate.user.name);
  assert.equal(application.email, candidate.user.email);

  const duplicate = await request('/api/applications', {
    method: 'POST',
    headers: { authorization: `Bearer ${candidate.token}` },
    body: JSON.stringify({ jobId: job.id })
  });
  assert.notEqual(duplicate.status, 201, 'a duplicate application must not be accepted');
  const listed = await request('/api/applications', {
    headers: { authorization: `Bearer ${candidate.token}` }
  });
  assert.equal((await listed.json()).length, 1, 'the unique database constraint must preserve a single application');
});

test('unknown API routes return JSON 404', async () => {
  const response = await request('/api/does-not-exist');
  assert.equal(response.status, 404);
  assert.equal(response.headers.get('content-type')?.includes('application/json'), true);
});


test('login accepts a valid registered email and password', async () => {
  const candidate = await registerCandidate();
  const response = await request('/api/login', {
    method: 'POST',
    body: JSON.stringify({ email: candidate.user.email, password: 'strong-password-123' })
  });

  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.user.email, candidate.user.email);
  assert.equal(typeof payload.token, 'string');
});

test('login rejects malformed email addresses before authentication', async () => {
  const response = await request('/api/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'not-an-email', password: 'any-password' })
  });

  assert.equal(response.status, 400);
});



test('company accounts cannot submit job applications', async () => {
  const token = jwt.sign(
    { id: 999, email: 'company@example.com', role: 'company', name: 'Company' },
    process.env.JWT_SECRET,
    { expiresIn: '1h', issuer: 'plataforma-de-recrutamento', audience: 'recruitment-api' }
  );

  const response = await request('/api/applications', {
    method: 'POST',
    headers: { authorization: `Bearer ${token}` },
    body: JSON.stringify({ jobId: 1 })
  });

  assert.equal(response.status, 403);
});
