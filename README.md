# Plataforma de Recrutamento

## Visão geral

A Plataforma de Recrutamento é um protótipo de sistema para conectar empresas, recrutadores e candidatos em um ambiente digital para publicação de vagas, gestão de processos seletivos e acompanhamento de candidaturas.

O sistema simula:
- cadastro de usuários com papéis distintos;
- login simples;
- dashboard por perfil;
- busca e filtro de vagas;
- candidaturas realizadas por candidatos;
- apresentação de empresas em destaque.

## Estrutura do projeto

```text
plataforma-de-recrutamento/
├── index.html
├── vagas.html
├── empresas.html
├── candidatos.html
├── login.html
├── register.html
├── dashboard.html
├── painel-empresa.html
├── styles.css
├── script.js
├── jobs.json
├── server.js
├── package.json
├── .env.example
├── .gitignore
├── README.md
└── docs/
    ├── arquitetura.md
    ├── guia-de-uso.md
    └── TECNICO.md
```

## Situação atual

- Frontend: protótipo em HTML/CSS/JS (branch `feature/site-basico`).
- Backend: API em Node.js + Express + SQLite (adicionada e consolidada na branch `main`).
- Documentação: README e documentos em `docs/`.

## Como executar localmente (frontend + backend)

1. Clone o repositório e mude para a branch `main`:

```bash
git clone https://github.com/juniordev830/plataforma-de-recrutamento.git
cd plataforma-de-recrutamento
git checkout main
```

2. Copie o arquivo de ambiente e defina a chave JWT:

```bash
cp .env.example .env
# Edite .env e defina JWT_SECRET
```

3. Instale dependências e rode o servidor:

```bash
npm install
npm run dev    # ou npm start
```

4. Acesse no navegador:

- http://localhost:3001 — o servidor serve frontend estático e fornece a API.

## API (resumo)

Veja `docs/TECNICO.md` para detalhes sobre endpoints, variáveis de ambiente e arquitetura.

---

# Código-fonte principal (arquivos importantes incorporados)

Abaixo estão os arquivos principais do projeto incorporados diretamente no README para referência rápida. Use-os como referência; os arquivos originais continuam no repositório.

---

## server.js

```javascript
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-me';
const DB_PATH = path.join(__dirname, 'database.sqlite');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Erro ao abrir banco SQLite:', err.message);
  } else {
    console.log('Banco SQLite conectado em:', DB_PATH);
  }
});

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

async function initializeDatabase() {
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'candidate',
      companyName TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      company TEXT NOT NULL,
      location TEXT NOT NULL,
      type TEXT NOT NULL,
      typeLabel TEXT NOT NULL,
      description TEXT NOT NULL,
      short TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      jobId INTEGER NOT NULL,
      jobTitle TEXT NOT NULL,
      company TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'em_analise',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `);

  const jobsCount = await get('SELECT COUNT(*) as count FROM jobs');
  if ((jobsCount?.count || 0) === 0) {
    const defaultJobs = [
      {
        title: 'Desenvolvedor Front-end',
        company: 'NovaTech',
        location: 'Remoto',
        type: 'fulltime',
        typeLabel: 'Tempo integral',
        description: 'Responsável por desenvolver interfaces modernas, acessíveis e responsivas para produtos digitais.',
        short: 'React, CSS, UX e boas práticas de front-end.'
      },
      {
        title: 'Analista de Dados',
        company: 'DataCore',
        location: 'São Paulo',
        type: 'fulltime',
        typeLabel: 'Tempo integral',
        description: 'Atuação com análise de indicadores, dashboards e desenvolvimento de relatórios para tomada de decisão.',
        short: 'SQL, Power BI e storytelling com dados.'
      },
      {
        title: 'Especialista em Recrutamento',
        company: 'GreenFlow',
        location: 'Belo Horizonte',
        type: 'contract',
        typeLabel: 'Contrato',
        description: 'Acompanhamento de vagas, triagem de candidatos, entrevistas e gestão de processo seletivo.',
        short: 'Relacionamento, triagem e processo seletivo.'
      },
      {
        title: 'Designer UX/UI',
        company: 'NovaTech',
        location: 'Rio de Janeiro',
        type: 'parttime',
        typeLabel: 'Meio período',
        description: 'Criação de fluxos, protótipos e componentes visuais seguindo conceitos de usabilidade e experiência.',
        short: 'Prototipação, Figma e design system.'
      }
    ];

    for (const job of defaultJobs) {
      await run(
        `INSERT INTO jobs (title, company, location, type, typeLabel, description, short)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [job.title, job.company, job.location, job.type, job.typeLabel, job.description, job.short]
      );
    }
  }
}

function createToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      companyName: user.companyName || ''
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token ausente ou inválido.' });
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido ou expirado.' });
  }
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'API funcionando', timestamp: new Date().toISOString() });
});

app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password, role = 'candidate', companyName = '' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Nome, e-mail e senha são obrigatórios.' });
    }

    const existingUser = await get('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (existingUser) {
      return res.status(409).json({ message: 'E-mail já cadastrado.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userInsert = await run(
      `INSERT INTO users (name, email, password, role, companyName)
       VALUES (?, ?, ?, ?, ?)`,
      [name.trim(), email.trim().toLowerCase(), hashedPassword, role, companyName.trim()]
    );

    const user = await get('SELECT id, name, email, role, companyName FROM users WHERE id = ?', [userInsert.id]);
    const token = createToken(user);

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyName: user.companyName || ''
      }
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    return res.status(500).json({ message: 'Erro interno ao registrar usuário.' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'E-mail e senha são obrigatórios.' });
    }

    const user = await get('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (!user) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    const token = createToken(user);

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyName: user.companyName || ''
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({ message: 'Erro interno ao autenticar usuário.' });
  }
});

app.get('/api/jobs', async (req, res) => {
  try {
    const jobs = await all('SELECT * FROM jobs ORDER BY id DESC');
    return res.json(jobs);
  } catch (error) {
    console.error('Erro ao listar vagas:', error);
    return res.status(500).json({ message: 'Erro ao listar vagas.' });
  }
});

app.post('/api/jobs', authMiddleware, async (req, res) => {
  try {
    const { title, company, location, type, typeLabel, description, short } = req.body;
    const user = req.user;

    if (!['company', 'recruiter'].includes(user.role)) {
      return res.status(403).json({ message: 'Apenas empresas e recrutadores podem criar vagas.' });
    }

    if (!title || !company || !location || !type || !description) {
      return res.status(400).json({ message: 'Preencha todos os campos da vaga.' });
    }

    const result = await run(
      `INSERT INTO jobs (title, company, location, type, typeLabel, description, short)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title, company, location, type, typeLabel || type, description, short || description.slice(0, 120)]
    );

    const created = await get('SELECT * FROM jobs WHERE id = ?', [result.id]);
    return res.status(201).json(created);
  } catch (error) {
    console.error('Erro ao criar vaga:', error);
    return res.status(500).json({ message: 'Erro ao criar vaga.' });
  }
});

app.post('/api/applications', authMiddleware, async (req, res) => {
  try {
    const { jobId, jobTitle, company, name, email } = req.body;
    const user = req.user;

    if (user.role !== 'candidate') {
      return res.status(403).json({ message: 'Apenas candidatos podem se candidatar.' });
    }

    if (!jobId || !jobTitle || !company || !name || !email) {
      return res.status(400).json({ message: 'Dados da candidatura incompletos.' });
    }

    const result = await run(
      `INSERT INTO applications (userId, jobId, jobTitle, company, name, email)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [user.id, jobId, jobTitle, company, name, email]
    );

    const created = await get('SELECT * FROM applications WHERE id = ?', [result.id]);
    return res.status(201).json(created);
  } catch (error) {
    console.error('Erro ao salvar candidatura:', error);
    return res.status(500).json({ message: 'Erro ao salvar candidatura.' });
  }
});

app.get('/api/applications', authMiddleware, async (req, res) => {
  try {
    const user = req.user;

    if (user.role !== 'candidate') {
      return res.status(403).json({ message: 'Acesso permitido apenas para candidatos.' });
    }

    const rows = await all('SELECT * FROM applications WHERE userId = ? ORDER BY id DESC', [user.id]);
    return res.json(rows);
  } catch (error) {
    console.error('Erro ao listar candidaturas:', error);
    return res.status(500).json({ message: 'Erro ao listar candidaturas.' });
  }
});

app.use(express.static(path.join(__dirname, '.')));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, 'index.html'));
});

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor iniciado em http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Erro na inicialização do banco:', error);
    process.exit(1);
  });
```

---

## package.json

```json
{
  "name": "plataforma-de-recrutamento-api",
  "version": "1.0.0",
  "description": "Backend da plataforma de recrutamento com Express e SQLite",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "keywords": ["recruitment", "express", "sqlite"],
  "author": "juniordev830",
  "license": "MIT",
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "jsonwebtoken": "^9.0.2",
    "sqlite3": "^5.1.7"
  },
  "devDependencies": {
    "nodemon": "^3.1.16"
  }
}
```

---

## .env.example

```text
PORT=3001
JWT_SECRET=troque-esta-chave-por-uma-segura
```

---

## .gitignore

```text
node_modules/
database.sqlite
.env
npm-debug.log*
.DS_Store
```

---

## script.js (frontend)

```javascript
// script.js - combinações: jobs + autenticação básica baseada em localStorage

const yearNode = document.getElementById('year');
if (yearNode) {
  yearNode.textContent = new Date().getFullYear();
}

/* ---------------------- DADOS DE VAGAS ---------------------- */
const JOBS = [
  { id: 1, title: 'Desenvolvedor Front-end', company: 'NovaTech', location: 'Remoto', type: 'fulltime', typeLabel: 'Tempo integral', description: 'Responsável por desenvolver interfaces modernas,[...]
  { id: 2, title: 'Analista de Dados', company: 'DataCore', location: 'São Paulo', type: 'fulltime', typeLabel: 'Tempo integral', description: 'Atuação com análise de indicadores, dashboards e[...]
  { id: 3, title: 'Especialista em Recrutamento', company: 'GreenFlow', location: 'Belo Horizonte', type: 'contract', typeLabel: 'Contrato', description: 'Acompanhamento de vagas, triagem de candi[...]
  { id: 4, title: 'Designer UX/UI', company: 'NovaTech', location: 'Rio de Janeiro', type: 'parttime', typeLabel: 'Meio período', description: 'Criação de fluxos, protótipos e componentes visu[...]
];

/* ---------------------- RENDERIZAÇÃO DE VAGAS ---------------------- */
function renderJobs(jobs) {
  const jobsList = document.getElementById('jobsList');
  if (!jobsList) return;

  jobsList.innerHTML = '';

  if (!jobs.length) {
    jobsList.innerHTML = '<div class="job"><p>Nenhuma vaga encontrada para os filtros informados.</p></div>';
    return;
  }

  jobs.forEach((job) => {
    const card = document.createElement('article');
    card.className = 'job';
    card.innerHTML = `
      <div class="job-head">
        <h3>${job.title}</h3>
        <span class="tag">${job.typeLabel}</span>
      </div>
      <div class="meta">${job.company} • ${job.location}</div>
      <p>${job.short}</p>
      <div class="meta">${job.description}</div>
      <button class="btn btn-primary" data-job-id="${job.id}">Candidatar-se</button>
    `;

    const button = card.querySelector('button');
    button.addEventListener('click', () => applyToJob(job));

    jobsList.appendChild(card);
  });
}

function getFilteredJobs() {
  const search = document.getElementById('searchInput')?.value.trim().toLowerCase() || '';
  const location = document.getElementById('locationInput')?.value.trim().toLowerCase() || '';
  const type = document.getElementById('typeFilter')?.value || '';

  return JOBS.filter((job) => {
    const matchesSearch = !search || job.title.toLowerCase().includes(search) || job.company.toLowerCase().includes(search);
    const matchesLocation = !location || job.location.toLowerCase().includes(location);
    const matchesType = !type || job.type === type;
    return matchesSearch && matchesLocation && matchesType;
  });
}

/* ---------------------- APLICAÇÃO / CANDIDATURA (SIMULADO) ---------------------- */
function applyToJob(job) {
  const current = getCurrentUser();
  if (!current || current.role !== 'candidate') {
    if (confirm('Você precisa estar logado como candidato para se candidatar. Deseja entrar agora?')) {
      location.href = 'login.html';
    }
    return;
  }

  const name = current.name || prompt('Informe seu nome completo:', '');
  const email = current.email || prompt('Informe seu e-mail:', '');
  if (!name || !email) {
    alert('Nome e e-mail são obrigatórios para enviar a candidatura.');
    return;
  }

  const applications = JSON.parse(localStorage.getItem('applications') || '[]');
  applications.push({ company: job.company, title: job.title, date: new Date().toISOString(), name, email, userId: current.id });
  localStorage.setItem('applications', JSON.stringify(applications));
  alert(`Candidatura enviada para ${job.title}!`);

  const currentPage = window.location.pathname.split('/').pop();
  if (currentPage === 'candidatos.html') {
    renderApplications();
  }
}

function renderApplications() {
  const applicationsList = document.getElementById('applicationsList');
  if (!applicationsList) return;

  const current = getCurrentUser();
  let applications = JSON.parse(localStorage.getItem('applications') || '[]');
  if (current && current.role === 'candidate') {
    applications = applications.filter(a => a.userId === current.id);
  }

  if (!applications.length) {
    applicationsList.innerHTML = '<div class="applications-item"><p>Nenhuma candidatura registrada.</p></div>';
    return;
  }

  applicationsList.innerHTML = '';

  applications.slice().reverse().forEach((item) => {
    const card = document.createElement('div');
    card.className = 'applications-item';
    card.innerHTML = `
      <strong>${item.title}</strong>
      <p>${item.company}</p>
      <p>${new Date(item.date).toLocaleDateString('pt-BR')}</p>
      <p>${item.name} • ${item.email}</p>
    `;
    applicationsList.appendChild(card);
  });
}

/* ---------------------- AUTENTICAÇÃO SIMPLES (localStorage) ---------------------- */
function getUsers() {
  return JSON.parse(localStorage.getItem('users') || '[]');
}

function saveUsers(users) {
  localStorage.setItem('users', JSON.stringify(users));
}

function generateId() {
  return 'u_' + Math.random().toString(36).slice(2, 9);
}

function registerUser({ name, email, password, role, companyName }) {
  const users = getUsers();
  if (users.find(u => u.email === email)) {
    throw new Error('E-mail já cadastrado');
  }
  const user = { id: generateId(), name, email, password, role, companyName: companyName || '' };
  users.push(user);
  saveUsers(users);
  localStorage.setItem('currentUser', JSON.stringify({ id: user.id, name: user.name, email: user.email, role: user.role, companyName: user.companyName }));
  return user;
}

function loginUser({ email, password }) {
  const users = getUsers();
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) throw new Error('Credenciais inválidas');
  localStorage.setItem('currentUser', JSON.stringify({ id: user.id, name: user.name, email: user.email, role: user.role, companyName: user.companyName }));
  return user;
}

function logout() {
  localStorage.removeItem('currentUser');
  renderAuthLinks();
  location.href = 'index.html';
}

function getCurrentUser() {
  return JSON.parse(localStorage.getItem('currentUser') || 'null');
}

function renderAuthLinks() {
  const container = document.getElementById('authLinks');
  if (!container) return;
  const user = getCurrentUser();
  if (user) {
    container.innerHTML = `
      <a href="dashboard.html">Dashboard</a>
      <a href="#" id="logoutLink">Sair</a>
    `;
    document.getElementById('logoutLink').addEventListener('click', (e) => { e.preventDefault(); logout(); });
  } else {
    container.innerHTML = `
      <a href="login.html">Entrar</a>
      <a href="register.html">Registrar</a>
    `;
  }
}

function initAuthForms() {
  // Register form
  const regForm = document.getElementById('registerForm');
  if (regForm) {
    const roleSelect = document.getElementById('regRole');
    const companyLabel = document.getElementById('companyNameLabel');
    roleSelect.addEventListener('change', () => {
      companyLabel.style.display = (roleSelect.value === 'company' || roleSelect.value === 'recruiter') ? 'block' : 'none';
    });

    regForm.addEventListener('submit', (e) => {
      e.preventDefault();
      try {
        const name = document.getElementById('regName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPassword').value;
        const role = document.getElementById('regRole').value;
        const companyName = document.getElementById('regCompanyName').value.trim();
        registerUser({ name, email, password, role, companyName });
        alert('Conta criada com sucesso! Você foi logado automaticamente.');
        renderAuthLinks();
        location.href = 'dashboard.html';
      } catch (err) {
        alert(err.message || 'Erro ao criar conta');
      }
    });
  }

  // Login form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      try {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        loginUser({ email, password });
        renderAuthLinks();
        alert('Login realizado com sucesso');
        location.href = 'dashboard.html';
      } catch (err) {
        alert(err.message || 'Erro ao autenticar');
      }
    });
  }
}

function renderDashboard() {
  const el = document.getElementById('dashboardContent');
  if (!el) return;
  const user = getCurrentUser();
  if (!user) {
    el.innerHTML = '<div class="card"><p>Você precisa estar logado para ver o dashboard. <a href="login.html">Entrar</a></p></div>';
    return;
  }

  if (user.role === 'candidate') {
    el.innerHTML = `
      <div class="card">
        <h2>Bem-vindo, ${user.name}</h2>
        <p>Perfil de candidato</p>
        <p><strong>E-mail:</strong> ${user.email}</p>
        <p><a href="candidatos.html">Ir para meu perfil e candidaturas</a></p>
      </div>
    `;
  } else if (user.role === 'company' || user.role === 'recruiter') {
    el.innerHTML = `
      <div class="card">
        <h2>Bem-vindo, ${user.name}</h2>
        <p>Conta: ${user.role === 'company' ? 'Empresa' : 'Recrutador'}</p>
        <p><strong>Empresa:</strong> ${user.companyName || '—'}</p>
        <p><a href="vagas.html">Ver vagas</a> • <a href="#" id="postJobLink">Publicar vaga (simulado)</a></p>
      </div>
    `;

    const postLink = document.getElementById('postJobLink');
    postLink?.addEventListener('click', (e) => { e.preventDefault(); alert('Funcionalidade de publicar vaga é simulada neste protótipo.'); });
  }
}

/* ---------------------- INICIALIZAÇÃO DE PÁGINAS ---------------------- */
document.addEventListener('DOMContentLoaded', () => {
  renderAuthLinks();
  initAuthForms();

  const currentPage = window.location.pathname.split('/').pop();

  if (currentPage === 'vagas.html') {
    renderJobs(JOBS);

    const filterBtn = document.getElementById('filterBtn');
    filterBtn?.addEventListener('click', () => {
      renderJobs(getFilteredJobs());
    });

    const searchInput = document.getElementById('searchInput');
    const locationInput = document.getElementById('locationInput');
    const typeFilter = document.getElementById('typeFilter');

    [searchInput, locationInput, typeFilter].forEach((el) => {
      el?.addEventListener('input', () => renderJobs(getFilteredJobs()));
      el?.addEventListener('change', () => renderJobs(getFilteredJobs()));
    });
  }

  if (currentPage === 'candidatos.html') {
    const current = getCurrentUser();
    const notice = document.getElementById('authNotice');
    const panel = document.getElementById('candidatePanel');
    if (!current || current.role !== 'candidate') {
      if (notice) {
        notice.style.display = 'block';
        notice.innerHTML = '<p>É necessário estar logado como <strong>candidato</strong> para editar perfil e ver suas candidaturas. <a href="login.html">Entrar</a> ou <a href="register.html">R[...]
      }
      if (panel) panel.style.display = 'none';
    } else {
      if (notice) notice.style.display = 'none';
      if (panel) panel.style.display = 'grid';

      const form = document.getElementById('candidateForm');
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const profile = { name: document.getElementById('name').value, email: document.getElementById('email').value, bio: document.getElementById('bio').value };
        localStorage.setItem('candidateProfile', JSON.stringify(profile));
        alert('Perfil salvo localmente.');
      });

      // Preencher campos com dados do usuário
      const savedProfile = JSON.parse(localStorage.getItem('candidateProfile') || '{}');
      if (savedProfile.name) document.getElementById('name').value = savedProfile.name;
      if (savedProfile.email) document.getElementById('email').value = savedProfile.email;
      if (savedProfile.bio) document.getElementById('bio').value = savedProfile.bio;

      renderApplications();
    }
  }

  if (currentPage === 'dashboard.html') {
    renderDashboard();
  }

  if (currentPage === '' || currentPage === 'index.html') {
    // nothing specific
  }
});
```

---

## styles.css (resumo)

```css
:root {
  --bg: #f4f7fb;
  --card: #ffffff;
  --card-alt: #eef4ff;
  --text: #1f2937;
  --muted: #64748b;
  --primary: #2563eb;
  --primary-dark: #1d4ed8;
  --border: #dbe4f0;
  --success: #16a34a;
  --shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
}

* { box-sizing: border-box; }
html, body { margin:0; padding:0; font-family: Arial, Helvetica, sans-serif; background: var(--bg); color: var(--text); }
.container { width: min(1100px, calc(100% - 32px)); margin: 0 auto; }

.site-header { background: #fff; border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 10; }
.nav-wrap { display:flex; align-items:center; justify-content:space-between; padding:18px 0; }
.brand { font-size:1.3rem; font-weight:700; }

.job { display: grid; gap:12px; background: var(--card); border:1px solid var(--border); border-radius:16px; padding:22px; box-shadow: var(--shadow); }
.btn { padding:12px 18px; border-radius:10px; cursor:pointer; }
.btn-primary { background: var(--primary); color:#fff; }

@media (max-width:820px) { .hero, .features, .company-grid { grid-template-columns: 1fr; } }
```

---

## Arquivos HTML (exemplo parcial)

### register.html (trecho)

```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Registrar | Plataforma de Recrutamento</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <header class="site-header">
      <div class="container nav-wrap">
        <div class="brand">Plataforma de Recrutamento</div>
        <nav class="main-nav" aria-label="Menu principal">
          <a href="index.html">Início</a>
          <a href="vagas.html">Vagas</a>
          <a href="empresas.html">Empresas</a>
          <a href="candidatos.html">Candidatos</a>
          <span id="authLinks" class="auth-links"></span>
        </nav>
      </div>
    </header>

    <main class="container page-content">
      <div class="section-header">
        <div>
          <span class="eyebrow">Cadastro</span>
          <h1>Criar conta</h1>
        </div>
      </div>

      <form id="registerForm" class="card" style="max-width:520px">
        <label>
          Nome completo
          <input type="text" id="regName" required />
        </label>
        <label>
          E-mail
          <input type="email" id="regEmail" required />
        </label>
        <label>
          Senha
          <input type="password" id="regPassword" required />
        </label>
        <label>
          Tipo de conta
          <select id="regRole" required>
            <option value="candidate">Candidato</option>
            <option value="company">Empresa</option>
            <option value="recruiter">Recrutador</option>
          </select>
        </label>
        <label id="companyNameLabel" style="display:none">
          Nome da empresa
          <input type="text" id="regCompanyName" />
        </label>

        <div style="margin-top:12px">
          <button class="btn btn-primary" type="submit">Criar conta</button>
          <a href="login.html" style="margin-left:12px">Já tenho conta</a>
        </div>
      </form>

    </main>

    <footer class="site-footer">
      <div class="container">© <span id="year"></span> Plataforma de Recrutamento</div>
    </footer>

    <script src="script.js"></script>
  </body>
</html>
```

---

## Observações finais

- Os arquivos completos estão no repositório na branch `main` — este README inclui trechos para referência rápida. Se desejar que eu insira arquivos completos adicionais dentro do README (por exemplo, todo o conteúdo de `index.html`, `vagas.html` e outros), eu posso fazê-lo — confirme e eu adiciono.

