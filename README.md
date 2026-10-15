# Plataforma de Recrutamento

## Visão geral

A Plataforma de Recrutamento é um protótipo de site para conectar empresas e candidatos em um ambiente moderno, intuitivo e eficiente. O projeto foi pensado para demonstrar um fluxo básico de recrutamento e seleção, incluindo: publicação de vagas, busca por oportunidades, cadastro de candidatos, gerenciamento de candidaturas e apresentação de empresas parceiras.

Este projeto foi desenvolvido como uma solução frontend estática, com foco em apresentação, usabilidade e experiência de navegação, sem depender de backend em produção. A persistência de dados para candidaturas e perfil do candidato é simulada por meio do armazenamento local do navegador (`localStorage`).

## Objetivos do projeto

- Facilitar a busca por vagas por parte dos candidatos;
- Permitir a visualização de oportunidades de emprego em um layout limpo;
- Apoiar empresas na divulgação de vagas em um ambiente profissional;
- Simular o cadastro e gerenciamento de candidaturas;
- Servir como base para evolução em arquitetura frontend, autenticação e integração real com API.

## Funcionalidades implementadas

- Página inicial institucional;
- Lista de vagas com filtros por texto, local e tipo;
- Página de empresas em destaque;
- Área do candidato com cadastro de perfil;
- Simulação de candidatura por botão de ação;
- Persistência local de perfil e candidaturas no navegador;
- Layout responsivo para desktop e dispositivos móveis.

## Stack tecnológica

- HTML5
- CSS3
- JavaScript Vanilla
- JSON para mock de dados de vagas
- LocalStorage para persistência local no navegador

## Estrutura do projeto

```text
plataforma-de-recrutamento/
├── index.html
├── vagas.html
├── empresas.html
├── candidatos.html
├── styles.css
├── script.js
├── jobs.json
├── README.md
├── docs/
│   ├── arquitetura.md
│   └── guia-de-uso.md
└── .gitignore
```

## Requisitos

- Navegador moderno (Chrome, Edge, Firefox ou Safari);
- Servidor local opcional para facilitar o carregamento dos arquivos HTML;
- Node.js opcional, apenas se desejar usar um servidor estático.

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

Com Node.js:

```bash
cd plataforma-de-recrutamento
npx serve .
```

## Navegação do sistema

### Página inicial
Apresenta a proposta da plataforma, com destaque para os principais benefícios e ações para usuários.

### Vagas
Lista oportunidades disponíveis, com filtros por:
- cargo;
- empresa;
- local;
- tipo de contratação.

### Empresas
Mostra empresas parceiras em destaque, com breve descrição e volume de vagas abertas.

### Candidatos
Permite:
- salvar perfil do candidato;
- registrar dados pessoais e resumo profissional;
- visualizar candidaturas realizadas.

## Modelagem de dados

A base de dados de vagas está em `jobs.json`, com estrutura semelhante a:

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

As candidaturas são armazenadas no navegador em `localStorage`, em uma estrutura simples do tipo:

```json
[
  {
    "company": "NovaTech",
    "title": "Desenvolvedor Front-end",
    "date": "2026-10-15T00:00:00.000Z",
    "name": "João Silva",
    "email": "joao@email.com"
  }
]
```

## Regras de negócio simuladas

- Candidatos podem enviar uma candidatura por vaga;
- O sistema valida nome e e-mail antes de confirmar a inscrição;
- Vagas podem ser filtradas dinamicamente pela interface;
- Perfil do candidato pode ser salvo localmente;
- Candidaturas e perfil não são compartilhados em backend em versões atuais.

## Padrões de interface

- Layout limpo com foco em legibilidade;
- Paleta em tons azuis e neutros;
- Cards para organização de conteúdo;
- Botões com foco em ações principais;
- Design responsivo para mobile e desktop;
- Hierarquia visual clara para navegação e conversão.

## Limitações atuais

Como projeto protótipo, o sistema apresenta algumas limitações:

- Não há autenticação real;
- Não há banco de dados persistente;
- Não há painel administrativo para empresas;
- Não há backend de integração;
- Não há upload de currículo em PDF/DOC real;
- Não há validação de dados no servidor.

## Roadmap de evolução

### Fase 1: refinamento da interface
- Melhorar microinterações;
- Ajustar acessibilidade;
- Componente de filtro mais avançado.

### Fase 2: frontend modernizado
- Migração para React ou Vue;
- Componentização por módulos;
- Organização por páginas e componentes reutilizáveis;
- Uso de bibliotecas de UI.

### Fase 3: backend e dados reais
- Backend em Node.js ou Python;
- Banco de dados relacional ou NoSQL;
- CRUD de vagas, candidatos e empresas;
- Autenticação e autorização.

### Fase 4: funcionalidade completa
- Sistema de login para empresas e candidatos;
- Upload de currículos;
- Painel administrativo;
- Matching por competências;
- Comunicação com candidatos por e-mail;
- Dashboard de métricas de recrutamento.

## Boas práticas aplicadas

- Estrutura clara de arquivos e pastas;
- Separação entre apresentação, estilo e lógica;
- Dados mockados em JSON para facilitar a manutenção;
- Código em JavaScript reutilizável;
- Navegação simples e intuitiva;
- Projeto pronto para extensão.

## Contribuição

Contribuições são bem-vindas. Para colaborar:

1. Faça um fork do repositório;
2. Crie uma branch para sua funcionalidade;
3. Faça o commit das alterações;
4. Abra um pull request com descrição clara do problema ou melhoria.

## Licença

Este projeto foi desenvolvido como protótipo educacional e de demonstração. O uso e a adaptação devem seguir as regras do repositório e do proprietário do projeto.

## Contato

Para dúvidas ou sugestões de evolução, encaminhe a solicitação por meio do repositório ou do canal de contato do responsável pelo projeto.

## Status do projeto

Status atual: protótipo funcional de frontend com fluxo básico de recrutamento e seleção.

---

Documentação criada para apoiar a apresentação e evolução do projeto em ambiente profissional.
