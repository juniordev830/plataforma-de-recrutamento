const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');

const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf8');
const script = html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];

function createPage() {
  const elements = new Map();
  const requests = [];
  function element(id) {
    if (!elements.has(id)) {
      const classes = new Set(['saved-jobs-section', 'applications-section', 'profile-panel', 'name-field'].includes(id) ? ['hidden'] : []);
      const item = {
        value: '', textContent: '', innerHTML: '', handlers: {}, buttons: {},
        classList: {
          add(name) { classes.add(name); },
          remove(name) { classes.delete(name); },
          contains(name) { return classes.has(name); },
          toggle(name, force) {
            if (force === undefined ? !classes.has(name) : force) classes.add(name);
            else classes.delete(name);
          }
        },
        addEventListener(name, handler) { this.handlers[name] = handler; },
        querySelectorAll(selector) {
          const wanted = selector.slice(1);
          const buttons = [];
          for (const match of this.innerHTML.matchAll(/<button\b([^>]*)>/g)) {
            const names = match[1].match(/\bclass="([^"]+)"/)?.[1]?.split(/\s+/) || [];
            const jobId = match[1].match(/\bdata-job-id="(\d+)"/)?.[1];
            if (names.includes(wanted) && jobId) {
              buttons.push({ dataset: { jobId }, handlers: {},
                addEventListener(name, handler) { this.handlers[name] = handler; } });
            }
          }
          this.buttons[selector] = buttons;
          return buttons;
        },
        scrollIntoView() {}
      };
      elements.set(id, item);
    }
    return elements.get(id);
  }
  element('job-filter-form').reset = () => {
    element('job-search-text').value = '';
    element('job-type').value = '';
  };
  const fetch = (url, options = {}) => new Promise(resolve => requests.push({ url, options, resolve }));
  vm.runInNewContext(script, {
    document: { getElementById: element }, fetch, URLSearchParams, Date
  });
  return {
    element,
    requests,
    reply(index, payload, ok = true) {
      requests[index].resolve({ ok, json: async () => payload });
    }
  };
}

const flush = () => new Promise(resolve => setImmediate(resolve));

test('busca combina filtros, atualiza e permite limpar', async () => {
  for (const id of ['job-filter-form', 'job-search-text', 'job-type', 'clear-job-filters']) {
    assert.ok(html.includes('id="' + id + '"'), 'form element should exist: ' + id);
  }
  const page = createPage();
  assert.equal(page.requests[0].url, '/api/jobs');
  page.reply(0, []);
  await flush();
  assert.match(page.element('jobs').innerHTML, /Nenhuma vaga disponível/);

  page.element('job-search-text').value = '  Java & remoto  ';
  page.element('job-type').value = 'internship';
  let prevented = false;
  page.element('job-filter-form').handlers.submit({ preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  const search = new URL(page.requests[1].url, 'http://localhost');
  assert.equal(search.searchParams.get('q'), 'Java & remoto');
  assert.equal(search.searchParams.get('type'), 'internship');
  page.reply(1, [{ id: 1, title: '<script>alert(1)</script>', company: 'Exemplo', location: 'Remoto', type: 'internship' }]);
  await flush();
  assert.match(page.element('jobs').innerHTML, /&lt;script&gt;/);
  assert.doesNotMatch(page.element('jobs').innerHTML, /<script>/);

  page.element('refresh-jobs').handlers.click();
  assert.equal(page.requests[2].url, page.requests[1].url);
  page.reply(2, []);
  await flush();
  assert.match(page.element('jobs').innerHTML, /Nenhuma vaga encontrada para esses filtros/);

  page.element('clear-job-filters').handlers.click();
  assert.equal(page.requests[3].url, '/api/jobs');
  assert.equal(page.element('job-search-text').value, '');
  assert.equal(page.element('job-type').value, '');
  page.reply(3, []);
  await flush();
  assert.match(page.element('jobs').innerHTML, /Nenhuma vaga disponível/);
});

test('erro na busca permite tentar novamente com os mesmos filtros', async () => {
  const page = createPage();
  page.reply(0, []);
  await flush();
  page.element('job-search-text').value = 'remoto';
  page.element('job-filter-form').handlers.submit({ preventDefault() {} });
  page.reply(1, { message: '<erro> temporário' }, false);
  await flush();
  assert.match(page.element('jobs').innerHTML, /&lt;erro&gt; temporário/);
  page.element('retry-jobs').handlers.click();
  assert.equal(page.requests[2].url, page.requests[1].url);
  page.reply(2, []);
  await flush();
  assert.match(page.element('jobs').innerHTML, /Nenhuma vaga encontrada/);
});

test('uma resposta antiga não substitui o resultado da busca mais recente', async () => {
  const page = createPage();
  page.element('job-search-text').value = 'java';
  page.element('job-filter-form').handlers.submit({ preventDefault() {} });
  page.reply(1, [{ id: 2, title: 'Nova vaga', company: 'Exemplo', location: 'Natal', type: 'fulltime' }]);
  await flush();
  assert.match(page.element('jobs').innerHTML, /Nova vaga/);
  page.reply(0, [{ id: 3, title: 'Resultado antigo', company: 'Exemplo', location: 'Natal', type: 'fulltime' }]);
  await flush();
  assert.match(page.element('jobs').innerHTML, /Nova vaga/);
  assert.doesNotMatch(page.element('jobs').innerHTML, /Resultado antigo/);
});

async function loginCandidate(page, job) {
  page.reply(0, [job]);
  await flush();
  page.element('email').value = 'ana@example.com';
  page.element('password').value = 'password123';
  const login = page.element('auth-form').handlers.submit({ preventDefault() {} });
  assert.equal(page.requests[1].url, '/api/login');
  page.reply(1, { token: 'test-token', user: { id: 1, name: 'Ana', email: 'ana@example.com', role: 'candidate' } });
  await flush();
  const applications = page.requests.findIndex(x => x.url === '/api/applications');
  const saved = page.requests.findIndex(x => x.url === '/api/saved-jobs');
  assert.ok(applications > 0 && saved > 0);
  page.reply(applications, []);
  page.reply(saved, []);
  await flush();
  const jobs = page.requests.findLastIndex(x => x.url === '/api/jobs');
  assert.ok(jobs > saved);
  page.reply(jobs, [job]);
  await login;
}

test('candidato pode salvar e remover vaga na própria conta', async () => {
  for (const id of ['saved-jobs-section', 'saved-jobs', 'nav-saved-jobs', 'jobs-status']) {
    assert.ok(html.includes('id="' + id + '"'), 'element should exist: ' + id);
  }
  const job = { id: 3, title: 'Dev Java', company: 'Exemplo', location: 'Remoto', type: 'fulltime' };
  const page = createPage();
  await loginCandidate(page, job);

  const save = page.element('jobs').buttons['.save-job'][0].handlers.click();
  const putIndex = page.requests.findIndex(x => x.url === '/api/saved-jobs/3');
  assert.equal(page.requests[putIndex].options.method, 'PUT');
  assert.equal(page.requests[putIndex].options.headers.Authorization, 'Bearer test-token');
  page.reply(putIndex, { jobId: 3, saved: true });
  await flush();
  const reloadIndex = page.requests.findLastIndex(x => x.url === '/api/saved-jobs');
  page.reply(reloadIndex, [job]);
  await save;
  assert.match(page.element('saved-jobs').innerHTML, /Dev Java/);
  assert.match(page.element('jobs').innerHTML, /Remover dos salvos/);
  assert.equal(page.element('saved-jobs-section').classList.contains('hidden'), false);

  const remove = page.element('saved-jobs').buttons['.save-job'][0].handlers.click();
  const deleteIndex = page.requests.findLastIndex(x => x.url === '/api/saved-jobs/3');
  assert.equal(page.requests[deleteIndex].options.method, 'DELETE');
  page.reply(deleteIndex, {});
  await flush();
  const finalReload = page.requests.findLastIndex(x => x.url === '/api/saved-jobs');
  page.reply(finalReload, []);
  await remove;
  assert.match(page.element('saved-jobs').innerHTML, /ainda não salvou/);
  assert.match(page.element('jobs').innerHTML, /Salvar vaga/);
});

test('resposta de salvar atrasada não reaparece após sair da conta', async () => {
  const job = { id: 3, title: 'Dev Java', company: 'Exemplo', location: 'Remoto', type: 'fulltime' };
  const page = createPage();
  await loginCandidate(page, job);
  const save = page.element('jobs').buttons['.save-job'][0].handlers.click();
  const putIndex = page.requests.findLastIndex(x => x.url === '/api/saved-jobs/3');
  page.element('logout').handlers.click();
  const countAfterLogout = page.requests.length;
  page.reply(putIndex, { jobId: 3, saved: true });
  await save;
  assert.equal(page.requests.length, countAfterLogout);
  assert.equal(page.element('saved-jobs-section').classList.contains('hidden'), true);
  assert.equal(page.element('saved-jobs').textContent, '');
  const jobs = page.requests.findLastIndex(x => x.url === '/api/jobs');
  page.reply(jobs, [job]);
  await flush();
});

test('visitante é orientado a entrar antes de salvar uma vaga', async () => {
  const page = createPage();
  page.reply(0, [{ id: 4, title: 'Vaga', company: 'Exemplo', location: 'Natal', type: 'fulltime' }]);
  await flush();
  await page.element('jobs').buttons['.save-job'][0].handlers.click();
  assert.equal(page.requests.length, 1);
  assert.match(page.element('jobs-status').textContent, /Entre ou crie sua conta/);
});
