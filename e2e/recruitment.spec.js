const { test, expect } = require('@playwright/test');
const { once } = require('node:events');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const title = 'Desenvolvedor backend de integração';
const password = 'recruitment-e2e-passphrase';
let dir;
let db;
let server;
let baseUrl;

test.beforeAll(async ({ request }) => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'recruitment-e2e-'));
  process.env.DATABASE_DIR = dir;
  process.env.DATABASE_PATH = path.join(dir, 'test.sqlite');
  process.env.JWT_SECRET = 'local-browser-tests-only-0123456789';
  const { app, db: database, initializeDatabase, provisionCompany } = require('../server.js');
  db = database;
  await initializeDatabase();
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  const credentials = { email: 'empresa@example.test', password };
  const register = await request.post(baseUrl + '/api/register', { data: { ...credentials, name: 'Empresa de Teste', role: 'candidate' } });
  expect(register.status()).toBe(201);
  await provisionCompany(credentials.email, 'Empresa de Teste');
  const login = await request.post(baseUrl + '/api/login', { data: credentials });
  expect(login.status()).toBe(200);
  const { token } = await login.json();
  const posted = await request.post(baseUrl + '/api/jobs', {
    headers: { Authorization: 'Bearer ' + token },
    data: { title, location: 'Natal', type: 'fulltime', description: 'Integração de serviços.' },
  });
  expect(posted.status()).toBe(201);
});

test.afterAll(async () => {
  if (server) await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  if (db) await new Promise((resolve, reject) => db.close(error => error ? reject(error) : resolve()));
  if (dir) fs.rmSync(dir, { recursive: true, force: true });
});

test('candidato encontra, salva e acompanha a candidatura à vaga publicada', async ({ page }) => {
  await page.goto(baseUrl);
  await page.getByRole('button', { name: /cadastre-se/i }).click();
  await page.getByLabel('Nome completo').fill('Candidata Exemplo');
  await page.getByLabel('E-mail').fill('candidata@example.test');
  await page.getByLabel('Senha').fill(password);
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click();
  await expect(page.locator('#profile-name')).toContainText('Candidata Exemplo');

  await page.getByLabel('Cargo, empresa ou local').fill(title);
  await page.locator('#job-filter-form').getByRole('button', { name: 'Buscar' }).click();
  const job = page.locator('#jobs .job').filter({ hasText: title });
  await expect(job).toBeVisible();
  await job.getByRole('button', { name: 'Salvar vaga' }).click();
  await expect(page.locator('#saved-jobs')).toContainText(title);

  await job.getByRole('button', { name: 'Candidatar-se' }).click();
  await page.getByRole('button', { name: 'Minhas candidaturas' }).click();
  await expect(page.locator('#applications')).toContainText(title);
  await page.getByRole('button', { name: 'Sair da conta' }).click();
  await expect(page.locator('#applications-section')).toBeHidden();
});
