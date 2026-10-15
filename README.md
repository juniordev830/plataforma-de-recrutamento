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
├── styles.css
├── script.js
├── jobs.json
├── README.md
├── docs/
│   ├── arquitetura.md
│   └── guia-de-uso.md
├── server.js
├── package.json
├── .env.example
├── .gitignore
└── LICENSE
```

## Situação atual

- Frontend: protótipo em HTML/CSS/JS (branch `feature/site-basico`).
- Backend: API em Node.js + Express + SQLite (adicionada na branch `feature/site-basico` e agora também disponível em `main`).
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

Se precisar, posso: 1) integrar o frontend com a API (substituir localStorage por chamadas fetch), 2) criar um PR em vez de merge direto, 3) preparar scripts de deploy. Responda o que prefere.