# Guia de uso — Oportuniza (versão atual)

Este guia descreve a aplicação **que existe neste repositório atualmente**: interface em `index.html`, servidor Node.js/Express em `server.js` e persistência SQLite. Ele substitui as instruções antigas que mencionavam páginas independentes como `vagas.html`, `login.html` ou armazenamento de contas no `localStorage`.

> **Status:** projeto de portfólio em desenvolvimento. Não utilizar com dados reais sensíveis nem expor publicamente sem revisão e testes adicionais.

## 1. Preparar o ambiente

Instale **Node.js 18 ou superior** e npm. No terminal, a partir da pasta do projeto:

```bash
npm install
```

Crie `.env` a partir de `.env.example`:

- **Windows PowerShell:** `Copy-Item .env.example .env`
- **Linux/macOS:** `cp .env.example .env`

Edite o arquivo `.env` e substitua `JWT_SECRET` por um segredo aleatório com **pelo menos 32 caracteres**. Nunca envie seu `.env` para o Git.

Inicie a aplicação:

```bash
npm start
```

Abra **http://localhost:3001**. A interface e a API são servidas pelo mesmo processo Express. **Não abra `index.html` diretamente pelo navegador nem use `python -m http.server` como substituto da API**: cadastro, login, vagas e candidaturas dependem do backend.

Para confirmar que o servidor responde, abra **http://localhost:3001/api/health**. A resposta deve incluir `"ok": true`.

## 2. Explorar oportunidades

1. Abra a página inicial.
2. Consulte a seção **Vagas disponíveis**.
3. Use o campo de pesquisa e o filtro **Tipo de contrato**; clique em **Buscar**.
4. Use **Limpar** para restaurar a lista completa.

Essas vagas vêm do banco SQLite da aplicação (inclusive exemplos adicionados à base vazia). **Não são vagas coletadas automaticamente de outras plataformas.**

## 3. Criar conta e fazer login

1. Na seção **Acesse sua conta**, selecione **Ainda não tem conta? Cadastre-se**.
2. Informe nome, e-mail válido e senha entre 8 e 128 caracteres.
3. Depois do cadastro ou login, as opções de candidatura e de vagas salvas estarão disponíveis à conta de candidato.
4. Para encerrar a sessão no navegador, clique em **Sair da conta**.

**Importante:** o cadastro público cria **apenas candidatos**. Contas de empresas/recrutadores não são liberadas pelo formulário; elas exigem provisionamento administrativo documentado em [PROVISIONAMENTO.md](PROVISIONAMENTO.md). A interface atual não oferece painel completo de recrutador.

## 4. Salvar vagas e enviar candidaturas

- Clique em **Salvar vaga** para associar a vaga à sua conta. Acesse **Vagas salvas** para vê-la ou removê-la.
- Clique em **Candidatar-se** após entrar como candidato. O servidor usa o identificador da vaga e os dados da conta autenticada.
- Acesse **Minhas candidaturas** para consultar os registros da sua conta.
- A plataforma evita candidaturas duplicadas para a mesma vaga e candidato.

As vagas salvas e candidaturas ficam no **SQLite do servidor**, não somente no navegador. O token do login fica **apenas em memória**, de modo que atualizar a página exige entrar novamente. Tokens da API expiram em aproximadamente duas horas.

## 5. Erros comuns e como verificar

| Sintoma | Causa provável | Ação recomendada |
| --- | --- | --- |
| `401 Token ausente ou inválido` | Rota protegida acessada sem `Authorization: Bearer <token>` | Entre na conta e envie o token na requisição; no site, faça login novamente |
| `401 Token inválido ou expirado` | Sessão expirada ou token incorreto | Faça login novamente para obter outro token |
| `401 Credenciais inválidas` | E-mail ou senha não conferem | Verifique os dados e cadastre a conta caso necessário |
| `403` em ação restrita | Tipo de conta sem permissão | Use a conta correta; publicar vaga requer conta empresarial provisionada |
| `429 Muitas tentativas` | Limite de autenticações excedido | Aguarde o intervalo indicado antes de tentar novamente |
| Aplicação não inicia | `JWT_SECRET` ausente ou curto | Revise o `.env` e reinicie `npm start` |
| Página não carrega | Servidor desligado ou porta diferente | Confirme `npm start`, `PORT` e `/api/health` |
| Bloqueio CORS em outro frontend | Origem do navegador não autorizada | Configure a origem confiável em `CORS_ORIGIN` no servidor |
| Vagas não aparecem | Erro da API ou banco | Confira `/api/health`, terminal do servidor e conexão com SQLite |

O banco, por padrão, é criado em `~/.plataforma-de-recrutamento/database.sqlite`, **fora da pasta pública**. Se precisar de um caminho diferente, consulte as variáveis `DATABASE_DIR` e `DATABASE_PATH` em [TECNICO.md](TECNICO.md).

## 6. Testes e documentação

```bash
npm test
node --check server.js
```

Os testes usam uma base temporária, separada do banco local de uso normal. Para informações detalhadas sobre rotas, autenticação e configuração, consulte [TECNICO.md](TECNICO.md). Para instalação, consulte também o [README principal](../README.md).

**Limitação:** este documento reflete o código inspecionado na branch principal em 07/11/2026; validar os fluxos no navegador e executar os testes continuam necessários.
