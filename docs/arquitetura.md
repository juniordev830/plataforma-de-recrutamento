# Arquitetura do Projeto

## 1. Visão geral arquitetônica

A Plataforma de Recrutamento foi estruturada como uma aplicação web front-end estática, com foco em demonstrar o fluxo operacional de recrutamento e seleção. A arquitetura atual prioriza simplicidade, clareza de código e possibilidade de evolução para um ambiente mais robusto no futuro.

A solução é composta por:

- páginas HTML para navegação;
- arquivos CSS para apresentação visual;
- arquivo JavaScript para lógica de interação e filtros;
- arquivo JSON para dados mockados de vagas;
- armazenamento local do navegador para persistir perfil, usuários e candidaturas.

## 2. Objetivo da arquitetura

A arquitetura foi pensada para:

- reduzir dependências externas;
- acelerar a execução local;
- facilitar manutenção e entendimento do código;
- servir como base para evolução em React, componentes reutilizáveis e backend real.

## 3. Camadas da aplicação

### Camada de apresentação

Responsável pela visualização e navegação das páginas:

- `index.html`
- `vagas.html`
- `empresas.html`
- `candidatos.html`
- `login.html`
- `register.html`
- `dashboard.html`

Cada página representa uma visão do sistema e está conectada ao mesmo conjunto de estilos e scripts.

### Camada de estilo

Arquivo principal:

- `styles.css`

Esse arquivo centraliza a identidade visual, espaçamento, grid responsiva, botões, cards e estrutura visual da interface.

### Camada de interação

Arquivo principal:

- `script.js`

A lógica de interação inclui:

- renderização de vagas;
- filtros dinâmicos por texto, tipo e localização;
- autenticação simulada e cadastro por perfil;
- função de candidatura simulada;
- persistência de usuários, perfil e candidaturas em `localStorage`;
- carregamento de dados mockados.

### Camada de dados

Arquivo principal:

- `jobs.json`

Esse arquivo contém as vagas de exemplo, simulando um banco de dados inicial para o protótipo.

## 4. Fluxos do sistema

### Fluxo candidato

1. Usuário acessa a página inicial;
2. Navega até a seção de vagas;
3. Aplica filtros para encontrar oportunidades relevantes;
4. Clica em "Candidatar-se";
5. O sistema valida a autenticação;
6. A candidatura é salva localmente no navegador.

### Fluxo cadastro e login

1. Usuário acessa `register.html`;
2. Cria conta com papel definido;
3. O sistema salva o usuário em `localStorage`;
4. Usuário entra em `login.html`;
5. O sistema autentica e redireciona para `dashboard.html`.

### Fluxo dashboard

1. Usuário autenticado acessa o painel;
2. O conteúdo muda conforme papel:
   - candidato: perfil e candidaturas;
   - empresa: dados da empresa e ação simulada de publicar vaga;
   - recrutador: painel equivalente com foco em processos e vagas.

## 5. Persistência atual

No estado atual do protótipo, a persistência é feita por `localStorage`, o que permite:

- manter perfil do usuário;
- manter usuários cadastrados;
- manter histórico de candidaturas.

Essa solução é adequada para protótipos, porém não deve ser usada como armazenamento definitivo em produção por falta de segurança e escalabilidade.

## 6. Pontos de melhoria arquitetural

### Futuras evoluções recomendadas

- migração para React ou Vue;
- estrutura modular por componentes;
- uso de API REST ou GraphQL;
- banco de dados relacional ou NoSQL;
- autenticação e autorização;
- painel administrativo para empresas;
- upload de currículos e documentos;
- processamento assíncrono de eventos e notificações.

## 7. Princípios adotados

- Simplicidade na execução local;
- separação de responsabilidades;
- fácil entendimento por desenvolvedores iniciantes;
- escalabilidade incremental;
- base sólida para evolução para arquitetura profissional de produção.

## 8. Considerações finais

A arquitetura implementada hoje atende ao objetivo de demonstrar uma plataforma de recrutamento funcional em nível de interface, com foco em experiência do usuário e velocidade de desenvolvimento. Ela serve como base tecnológica para o próximo estágio, que deve incluir backend, autenticação, dados persistentes e melhores mecanismos de segurança.
