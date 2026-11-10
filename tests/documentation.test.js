const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

test('caminhos citados na seção Estrutura do README existem', () => {
  const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  const match = readme.match(/## Estrutura\s+```text\n([\s\S]*?)\n```/);
  assert.ok(match, 'README deve conter bloco de estrutura do projeto');

  const files = match[1].split(/\r?\n/)
    .map(line => line.trim().split(/\s+/)[0])
    .filter(Boolean);
  assert.ok(files.length >= 5, 'README deve documentar os principais arquivos');

  for (const file of files) {
    assert.ok(
      fs.existsSync(path.join(root, file)),
      `Caminho citado no README não encontrado: ${file}`
    );
  }
});
