# Guia de Uso

## 1. Introdução

Este guia apresenta como explorar e testar o protótipo da Plataforma de Recrutamento. O objetivo é facilitar a navegação e demonstrar o funcionamento principal do sistema de maneira simples e objetiva.

## 2. Requisitos para uso

- navegador atualizado;
- acesso à pasta do projeto localmente;
- servidor local opcional.

## 3. Como executar o projeto

### Método 1: abrir diretamente

1. Abra a pasta do projeto em seu computador;
2. Clique em `index.html`;
3. O navegador abrirá a interface inicial.

### Método 2: executar um servidor local

Com Python:

```bash
cd plataforma-de-recrutamento
python -m http.server 8000
```

Depois acesse:

```text
http://localhost:8000
```

## 4. Navegando pelas páginas

### Página inicial

Apresenta a proposta da plataforma e página principal com destaque para as funcionalidades.

### Página de vagas

A página `vagas.html` mostra oportunidades disponíveis. O usuário pode:

- buscar por palavra-chave;
- filtrar por cidade ou local;
- escolher tipos de contratação;
- visualizar detalhes resumidos da vaga.

### Página de empresas

A página `empresas.html` destaca parceiros da plataforma. Esse conteúdo foi modelado para exemplificar empresas em diferentes segmentos.

### Página do candidato

Na página `candidatos.html`, o usuário pode:

- preencher nome e e-mail;
- escrever um resumo profissional;
- salvar o perfil localmente;
- verificar candidaturas realizadas.

### Login e cadastro

A página `login.html` permite acesso ao sistema. A página `register.html` permite criar conta com papéis distintos: candidato, empresa e recrutador.

### Dashboard

A página `dashboard.html` exibe conteúdo adaptado ao perfil logado.

## 5. Como criar conta

1. Acesse `register.html`;
2. Selecione o tipo de conta;
3. Informe nome, e-mail, senha e empresa se necessário;
4. Confirme o cadastro;
5. O sistema salva o usuário e redireciona para o dashboard.

## 6. Como fazer login

1. Acesse `login.html`;
2. Informe e-mail e senha;
3. O sistema valida os dados;
4. O usuário entra no dashboard.

## 7. Como candidatar-se

1. Abra a página de vagas;
2. Clique em "Candidatar-se" em uma vaga desejada;
3. O sistema verifica se o usuário está autenticado como candidato;
4. Informe os dados solicitados;
5. A candidatura será registrada no navegador.

## 8. Como visualizar as candidaturas

1. Acesse a página de candidatos;
2. Observe a seção "Minhas candidaturas";
3. A lista será exibida com dados do candidato e da vaga.

## 9. Dados locais e uso do navegador

O sistema usa `localStorage` para manter:

- informações do perfil do usuário;
- usuários cadastrados;
- histórico de candidaturas;
- sessão atual autenticada.

Importante:
- esses dados ficam armazenados no navegador usado;
- em ambiente de navegação privada ou limpeza de cache, os dados podem ser perdidos;
- em produção, o ideal é substituir por banco de dados real e backend seguro.

## 10. Dicas de uso

- teste diferentes termos nos filtros para validar a busca;
- preencha um perfil realista para entender o comportamento;
- use o protótipo para validar UX antes de evoluir para um sistema completo;
- combine o fluxo do site com apresentações de stakeholders e testes de usabilidade.

## 11. Observações importantes

Este é um protótipo didático e demonstrativo. A aplicação não substitui um sistema de recrutamento completo, mas oferece uma base funcional para demonstração, validação de layouts e apresentação do fluxo de seleção.

## 12. Próximos passos sugeridos

- integrar um banco de dados real;
- autenticar usuários com segurança;
- criar painel administrativo;
- conectar com APIs de cadastro e vagas;
- permitir upload de currículos;
- automatizar processo de triagem e acompanhamento.

---

Guia de uso criado para facilitar a apresentação e a avaliação do protótipo.
