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
      elements.set(id, {
        value: '', textContent: '', innerHTML: '', handlers: {},
        classList: { toggle() {}, add() {}, remove() {} },
        addEventListener(name, handler) { this.handlers[name] = handler; },
        querySelectorAll() { return []; },
        scrollIntoView() {}
      });
    }
    return elements.get(id);
  }
  element('job-filter-form').reset = () => {
    element('job-search-text').value = '';
    element('job-type').value = '';
  };
  const fetch = (url) => new Promise(resolve => requests.push({ url, resolve }));
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
