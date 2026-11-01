const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET é obrigatório e deve ter pelo menos 32 caracteres. Configure-o no arquivo .env.');
}
const DB_PATH = path.join(__dirname, 'database.sqlite');

app.disable('x-powered-by');
app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    const allowed = (process.env.CORS_ORIGIN || 'http://localhost:3001,http://127.0.0.1:3001,http://localhost:5173,http://127.0.0.1:5173')
      .split(',').map((value) => value.trim()).filter(Boolean);
    return callback(null, allowed.includes(origin));
  }
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

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

  await run('CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(userId)');
  await run('CREATE UNIQUE INDEX IF NOT EXISTS idx_applications_user_job ON applications(userId, jobId)');

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
    { id: user.id, email: user.email, role: user.role, name: user.name, companyName: user.companyName || '' },
    JWT_SECRET,
    { expiresIn: '2h', issuer: 'plataforma-de-recrutamento', audience: 'recruitment-api' }
  );
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token ausente ou inválido.' });
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const decoded = jwt.verify(token, JWT_SECRET, { issuer: 'plataforma-de-recrutamento', audience: 'recruitment-api' });
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
    const { name, email, password } = req.body;
    // Public registration must never grant privileged roles. Provision company/recruiter accounts out of band.
    if (req.body?.role !== undefined && req.body.role !== 'candidate') {
      return res.status(400).json({ message: 'Tipo de conta não permitido no cadastro público.' });
    }
    const role = 'candidate';

    const normalizedName = typeof name === 'string' ? name.trim() : '';
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) && normalizedEmail.length <= 254;
    if (!normalizedName || normalizedName.length > 120 || !validEmail || typeof password !== 'string' || password.length < 8 || password.length > 128) {
      return res.status(400).json({ message: 'Informe nome (até 120 caracteres), e-mail válido e senha entre 8 e 128 caracteres.' });
    }
    if (!['candidate', 'company', 'recruiter'].includes(role)) {
      return res.status(400).json({ message: 'Tipo de conta inválido.' });
    }
    const normalizedCompanyName = '';

    const existingUser = await get('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
    if (existingUser) {
      return res.status(409).json({ message: 'E-mail já cadastrado.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const userInsert = await run(
      `INSERT INTO users (name, email, password, role, companyName)
       VALUES (?, ?, ?, ?, ?)`,
      [normalizedName, normalizedEmail, hashedPassword, role, normalizedCompanyName]
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
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = req.body?.password;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof password !== 'string' || !password) {
      return res.status(400).json({ message: 'Informe um e-mail válido e a senha.' });
    }

    const user = await get('SELECT * FROM users WHERE email = ?', [email]);
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
    const user = req.user;
    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
    const location = typeof req.body?.location === 'string' ? req.body.location.trim() : '';
    const type = typeof req.body?.type === 'string' ? req.body.type.trim() : '';
    const typeLabel = typeof req.body?.typeLabel === 'string' ? req.body.typeLabel.trim() : type;
    const description = typeof req.body?.description === 'string' ? req.body.description.trim() : '';
    const short = typeof req.body?.short === 'string' && req.body.short.trim() ? req.body.short.trim() : description.slice(0, 120);
    const company = typeof user.companyName === 'string' ? user.companyName.trim() : '';

    if (!['company', 'recruiter'].includes(user.role)) {
      return res.status(403).json({ message: 'Apenas empresas e recrutadores podem publicar vagas.' });
    }
    if (!company) return res.status(400).json({ message: 'O cadastro da empresa precisa ser atualizado antes de publicar vagas.' });
    if (!title || title.length > 160 || !location || location.length > 160 ||
        !['fulltime', 'parttime', 'contract', 'internship', 'temporary'].includes(type) ||
        !description || description.length > 10000 || typeLabel.length > 80 || short.length > 300) {
      return res.status(400).json({ message: 'Dados da vaga inválidos ou incompletos.' });
    }

    const result = await run(
      `INSERT INTO jobs (title, company, location, type, typeLabel, description, short)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title, company, location, type, typeLabel || type, description, short]
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
    const jobId = Number(req.body?.jobId);
    if (!Number.isSafeInteger(jobId) || jobId <= 0) {
      return res.status(400).json({ message: 'Informe uma vaga válida.' });
    }
    const job = await get('SELECT id, title, company FROM jobs WHERE id = ?', [jobId]);
    if (!job) return res.status(404).json({ message: 'Vaga não encontrada.' });

    const result = await run(
      `INSERT INTO applications (userId, jobId, jobTitle, company, name, email)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.id, job.id, job.title, job.company, req.user.name, req.user.email]
    );

    const created = await get('SELECT * FROM applications WHERE id = ?', [result.id]);
    return res.status(201).json(created);
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT' && /UNIQUE constraint failed/.test(error.message)) {
      return res.status(409).json({ message: 'Você já se candidatou a esta vaga.' });
    }
    console.error('Erro ao salvar candidatura:', error.message);
    return res.status(500).json({ message: 'Não foi possível registrar a candidatura.' });
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

app.use('/api', (req, res) => res.status(404).json({ message: 'Endpoint da API não encontrado.' }));

app.use(express.static(path.join(__dirname, '.')));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, 'index.html'));
});

function start() {
  return initializeDatabase().then(() => app.listen(PORT, () => {
    console.log(`Servidor iniciado em http://localhost:${PORT}`);
  }));
}

if (require.main === module) {
  start().catch((error) => {
    console.error('Erro na inicialização do banco:', error.message);
    process.exitCode = 1;
  });
}

module.exports = { app, db, initializeDatabase, start };
