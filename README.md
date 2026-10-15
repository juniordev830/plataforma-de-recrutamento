# Plataforma de Recrutamento

## Visão geral

A Plataforma de Recrutamento é um protótipo de sistema para conectar empresas, recrutadores e candidatos em um ambiente digital para publicação de vagas, gestão de processos seletivos e acompanhamento de candidaturas. O projeto foi pensado como uma base funcional para demonstração, testes de UX e evolução para uma solução real.

O sistema simula:
- cadastro de usuários com papéis distintos;
- login simples;
- dashboard por perfil;
- busca e filtro de vagas;
- candidaturas realizadas por candidatos;
- apresentação de empresas em destaque.

## Objetivos

- Centralizar vagas em uma interface simples e funcional;
- permitir que candidatos busquem oportunidades;
- permitir que empresas e recrutadores tenham visão do processo;
- demonstrar fluxo de autenticação e papel do usuário;
- servir como base para evoluções em frontend e backend.

## Funcionalidades implementadas

- Página inicial institucional;
- listagem de vagas com filtros por palavra-chave, local e tipo de contrato;
- página de empresas em destaque;
- área do candidato para cadastro e acompanhamento de candidaturas;
- páginas de login e cadastro;
- usuários com papéis:
  - candidato
  - empresa
  - recrutador
- dashboard com conteúdo adaptado ao tipo de usuário;
- simulação de publicação de vaga para empresas/recrutadores;
- persistência em localStorage para protótipo.

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
├── .gitignore
└── LICENSE
```

## Estrutura de usuários

O sistema atual trabalha com uma autenticação simulada. Os usuários são armazenados no navegador em `localStorage` e possuem os campos:

- `id`
- `name`
- `email`
- `password`
- `role`
- `companyName` (opcional, para empresa/recrutador)

Papéis:
- `candidate`: candidato em busca de emprego;
- `company`: empresa;
- `recruiter`: recrutador ou consultor de RH.

## Fluxo de autenticação

### Cadastro

- usuário entra em `register.html`;
- preenche nome, e-mail, senha e papel;
- se o papel for empresa/recrutador, pode informar o nome da empresa;
- ao concluir, o sistema salva o usuário e o torna usuário atual logado.

### Login

- usuário entra em `login.html`;
- informa e-mail e senha;
- o sistema valida a combinação no localStorage;
- caso validado, o usuário é redirecionado para o dashboard.

### Dashboard

- candidato visualiza dados pessoais e acesso ao perfil/candidaturas;
- empresa/recrutador visualiza identificação da conta e ação simulada de publicar vaga.

## Fluxo de candidatura

- o usuário acessa `vagas.html`;
- pesquisa ou filtra vagas;
- clica em "Candidatar-se";
- o sistema valida se o usuário está logado como candidato;
- caso esteja autenticado, a candidatura é salva no navegador;
- o perfil e histórico ficam registrados localmente.

## Dados mockados

Os dados das vagas estão em `jobs.json`. Estrutura:

```json
{
  "id": 1,
  "title": "Desenvolvedor Front-end",
  "company": "NovaTech",
  "location": "Remoto",
  "type": "fulltime",
  "typeLabel": "Tempo integral"
}
```

As candidaturas são armazenadas em `localStorage` em formato de lista de objetos.

## Persistência

Como o projeto é protótipo, os dados são armazenados em `localStorage`. Isso inclui:

- usuários cadastrados;
- usuário logado;
- candidaturas;
- perfil do candidato.

Observação:
- `localStorage` não é uma solução segura para produção;
- foi usado apenas para simulação de fluxo em frontend.

## Tecnologias utilizadas

- HTML5
- CSS3
- JavaScript Vanilla
- JSON
- LocalStorage

## Como executar localmente

### Opção 1: abrir diretamente no navegador

1. Acesse a pasta do projeto;
2. Abra `index.html` no navegador.

### Opção 2: usar servidor local

Com Python:

```bash
cd plataforma-de-recrutamento
python -m http.server 8000
```

Depois acesse:

```text
http://localhost:8000
```

## Limitações atuais

- não há backend real;
- senhas ficam salvas em texto puro em `localStorage`;
- não há autenticação segura;
- não há autorização robusta;
- não há painel administrativo completo;
- não há banco de dados real;
- não há upload de currículo;
- não há confirmação por e-mail;
- não há suporte a sessões seguras.

## Roadmap de evolução

### Fase 1 — refinamento do protótipo
- melhorar layout UX/UI;
- adicionar validações mais fortes;
- incluir filtros avançados de vagas.

### Fase 2 — backend
- criar API com Node.js ou Python;
- banco de dados PostgreSQL ou SQLite;
- autenticação com hash de senha;
- autenticação por sessão ou JWT.

### Fase 3 — gestão completa
- painel para empresas publicar vagas;
- painel para recrutadores gerenciar candidatos;
- fluxo de entrevista e status da candidatura.

### Fase 4 — produção
- deploy em Vercel/Netlify + backend em Render/Vercel;
- proteção com HTTPS;
- recuperação de senha;
- logs e auditoria;
- integração com e-mail e upload de documentos.

## Boas práticas aplicadas

- organização por páginas;
- separação entre HTML, CSS e JS;
- dados mockados em arquivo JSON;
- uso de localStorage para protótipo;
- layout responsivo;
- foco em clareza de navegação e usabilidade.

## Conclusão

A Plataforma de Recrutamento está estruturada como um protótipo funcional de recrutamento e seleção, com foco na experiência do usuário e na simulação realista do fluxo de vagas, cadastro, login e gestão de candidaturas. A solução atual é ideal para apresentação, estudos de UX e evolução para uma aplicação comercial completa.

---

Documentação criada para apoiar a apresentação e evolução do protótipo.
