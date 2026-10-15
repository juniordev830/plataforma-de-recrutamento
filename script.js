// script.js - combinações: jobs + autenticação básica baseada em localStorage

const yearNode = document.getElementById('year');
if (yearNode) {
  yearNode.textContent = new Date().getFullYear();
}

/* ---------------------- DADOS DE VAGAS ---------------------- */
const JOBS = [
  { id: 1, title: 'Desenvolvedor Front-end', company: 'NovaTech', location: 'Remoto', type: 'fulltime', typeLabel: 'Tempo integral', description: 'Responsável por desenvolver interfaces modernas, acessíveis e responsivas para produtos digitais.', short: 'React, CSS, UX e boas práticas de front-end.' },
  { id: 2, title: 'Analista de Dados', company: 'DataCore', location: 'São Paulo', type: 'fulltime', typeLabel: 'Tempo integral', description: 'Atuação com análise de indicadores, dashboards e desenvolvimento de relatórios para tomada de decisão.', short: 'SQL, Power BI e storytelling com dados.' },
  { id: 3, title: 'Especialista em Recrutamento', company: 'GreenFlow', location: 'Belo Horizonte', type: 'contract', typeLabel: 'Contrato', description: 'Acompanhamento de vagas, triagem de candidatos, entrevistas e gestão de processo seletivo.', short: 'Relacionamento, triagem e processo seletivo.' },
  { id: 4, title: 'Designer UX/UI', company: 'NovaTech', location: 'Rio de Janeiro', type: 'parttime', typeLabel: 'Meio período', description: 'Criação de fluxos, protótipos e componentes visuais seguindo conceitos de usabilidade e experiência.', short: 'Prototipação, Figma e design system.' }
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
        notice.innerHTML = '<p>É necessário estar logado como <strong>candidato</strong> para editar perfil e ver suas candidaturas. <a href="login.html">Entrar</a> ou <a href="register.html">Registrar</a></p>';
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
