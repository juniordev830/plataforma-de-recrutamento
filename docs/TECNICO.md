# Documentação Técnica

Este documento descreve a arquitetura e os detalhes da API implementada no backend (Node.js + Express + SQLite).

## Arquitetura

- Backend: Node.js + Express
- Banco: SQLite (arquivo local `database.sqlite`)
- Autenticação: JWT
- Hash de senhas: bcryptjs
- Rotas servidas em `/api/*`
- O servidor também serve arquivos estáticos do frontend (index.html, páginas do protótipo)

## Variáveis de ambiente

- PORT: porta onde o servidor roda (padrão 3001)
- JWT_SECRET: chave secreta para assinatura dos tokens JWT (substitua a chave de exemplo)

## Endpoints

- GET /api/health
  - Retorno: { ok: true, message, timestamp }

- POST /api/register
  - Body: { name, email, password, role = 'candidate' | 'company' | 'recruiter', companyName? }
  - Retorno: { token, user }

- POST /api/login
  - Body: { email, password }
  - Retorno: { token, user }

- GET /api/jobs
  - Retorno: lista de vagas

- POST /api/jobs
  - Auth: Bearer token (usuário com role 'company' ou 'recruiter')
  - Body: { title, company, location, type, typeLabel, description, short? }
  - Retorno: vaga criada

- POST /api/applications
  - Auth: Bearer token (usuário role 'candidate')
  - Body: { jobId, jobTitle, company, name, email }
  - Retorno: candidatura criada

- GET /api/applications
  - Auth: Bearer token (candidate)
  - Retorno: candidaturas do usuário

## Observações e próximos passos

- Em produção, trocar SQLite por PostgreSQL ou outro banco gerenciado.
- Armazenar `JWT_SECRET` e outras variáveis seguras no provedor (Render, Railway, Vercel env vars).
- Implementar rotas administrativas para empresas verem candidaturas por vaga.
- Validar entradas com bibliotecas como Joi ou express-validator.

