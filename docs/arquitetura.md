# Arquitetura do Projeto

## 1. Visão geral arquitetônica

A Plataforma de Recrutamento foi estruturada como uma aplicação web front-end estática, com foco em demonstrar o fluxo operacional de recrutamento e seleção. A arquitetura atual prioriza simplicidade, clareza de código e possibilidade de evolução para um ambiente mais robusto no futuro.

A solução é composta por:

- páginas HTML para navegação;
- arquivos CSS para apresentação visual;
- arquivo JavaScript para lógica de interação e filtros;
- arquivo JSON para dados mockados de vagas;
- armazenamento local do navegador para persistir perfil e candidaturas.

## 2. Objetivo da arquitetura

A arquitetura foi pensada para:

- reduzir dependencies externas;
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
- função de candidatura simulada;
- persistência de perfil e candidaturas em `localStorage`;
- carregamento de dados mockados.

### Camada de dados

Arquivo principal:

- `jobs.json`

Esse arquivo contém as vagas de exemplo, simulando um banco de dados inicial para o protótipo.

## 4. Fluxo de uso

### Fluxo candidato

1. Usuário acessa a página inicial;
2. Navega até a seção de vagas;
3. Aplica filtros para encontrar oportunidades relevantes;
4. Clica em "Candidatar-se";
5. Insere nome e e-mail;
6. A candidatura é salva localmente no navegador.

### Fluxo perfil

1. Usuário acessa a área do candidato;
2. Preenche nome, e-mail e resumo profissional;
3. O perfil é salvo em `localStorage`;
4. O sistema reutiliza esses dados ao longo da navegação.

## 5. Persistência atual

No estado atual do protótipo, a persistência é feita por `localStorage`, o que permite:

- manter perfil do candidato;
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
- Separação de responsabilidades;
- Fácil entendimento por desenvolvedores iniciantes;
- Escalabilidade incremental;
- Base sólida para evolução para arquitetura profissional de produção.

## 8. Considerações finais

A arquitetura implementada hoje atende ao objetivo de demonstrar uma plataforma de recrutamento funcional em nível de interface, com foco em experiência do usuário e velocidade de desenvolvimento. Ela serve como base tecnológica para o próximo estágio, que deve incluir backend, autenticação, dados persistentes e melhores mecanismos de segurança.
