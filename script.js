const yearNode = document.getElementById('year');
if (yearNode) {
  yearNode.textContent = new Date().getFullYear();
}

const JOBS = [
  {
    id: 1,
    title: 'Desenvolvedor Front-end',
    company: 'NovaTech',
    location: 'Remoto',
    type: 'fulltime',
    typeLabel: 'Tempo integral',
    description: 'Responsável por desenvolver interfaces modernas, acessíveis e responsivas para produtos digitais.',
    short: 'React, CSS, UX e boas práticas de front-end.'
  },
  {
    id: 2,
    title: 'Analista de Dados',
    company: 'DataCore',
    location: 'São Paulo',
    type: 'fulltime',
    typeLabel: 'Tempo integral',
    description: 'Atuação com análise de indicadores, dashboards e desenvolvimento de relatórios para tomada de decisão.',
    short: 'SQL, Power BI e storytelling com dados.'
  },
  {
    id: 3,
    title: 'Especialista em Recrutamento',
    company: 'GreenFlow',
    location: 'Belo Horizonte',
    type: 'contract',
    typeLabel: 'Contrato',
    description: 'Acompanhamento de vagas, triagem de candidatos, entrevistas e gestão de processo seletivo.',
    short: 'Relacionamento, triagem e processo seletivo.'
  },
  {
    id: 4,
    title: 'Designer UX/UI',
    company: 'NovaTech',
    location: 'Rio de Janeiro',
    type: 'parttime',
    typeLabel: 'Meio período',
    description: 'Criação de fluxos, protótipos e componentes visuais seguindo conceitos de usabilidade e experiência.',
    short: 'Prototipação, Figma e design system.'
  }
];

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

function applyToJob(job) {
  const name = prompt('Informe seu nome completo:', '');
  if (name === null || !name.trim()) {
    alert('Nome obrigatório para enviar a candidatura.');
    return;
  }

  const email = prompt('Informe seu e-mail:', '');
  if (email === null || !email.trim()) {
    alert('E-mail obrigatório para enviar a candidatura.');
    return;
  }

  const applications = JSON.parse(localStorage.getItem('applications') || '[]');
  applications.push({
    company: job.company,
    title: job.title,
    date: new Date().toISOString(),
    name,
    email
  });

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

  const applications = JSON.parse(localStorage.getItem('applications') || '[]');

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

function saveCandidateProfile(event) {
  event.preventDefault();

  const profile = {
    name: document.getElementById('name')?.value || '',
    email: document.getElementById('email')?.value || '',
    bio: document.getElementById('bio')?.value || ''
  };

  localStorage.setItem('candidateProfile', JSON.stringify(profile));
  alert('Perfil salvo com sucesso!');
}

function initCandidatesPage() {
  const form = document.getElementById('candidateForm');
  if (!form) return;

  form.addEventListener('submit', saveCandidateProfile);

  const savedProfile = JSON.parse(localStorage.getItem('candidateProfile') || '{}');
  if (savedProfile.name) document.getElementById('name').value = savedProfile.name;
  if (savedProfile.email) document.getElementById('email').value = savedProfile.email;
  if (savedProfile.bio) document.getElementById('bio').value = savedProfile.bio;

  renderApplications();
}

function initJobsPage() {
  const jobsList = document.getElementById('jobsList');
  if (!jobsList) return;

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

document.addEventListener('DOMContentLoaded', () => {
  const currentPage = window.location.pathname.split('/').pop();

  if (currentPage === 'vagas.html') {
    initJobsPage();
  }

  if (currentPage === 'candidatos.html') {
    initCandidatesPage();
  }
});
