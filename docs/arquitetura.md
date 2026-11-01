# Arquitetura da Plataforma de Recrutamento

## Visão geral

O repositório contém duas partes que estão em diferentes estágios de integração:

1. **Frontend estático:** páginas HTML, estilos CSS e interações JavaScript. Alguns fluxos de autenticação, perfil e candidatura ainda usam `localStorage` e são demonstrativos.
2. **API backend:** serviço Node.js/Express com SQLite, cadastro/login via JWT, publicação de vagas e candidaturas persistidas no banco.

Não presuma que todos os formulários da interface já consomem a API. A integração completa do frontend com o backend é uma das próximas etapas prioritárias.

## Componentes

### Frontend

- Páginas HTML: início, vagas, empresas, candidato, login, cadastro e dashboard.
- `styles.css`: layout, responsividade e componentes visuais.
- `script.js`: filtros, renderização e fluxos de demonstração no navegador.

### Backend

- `server.js`: rotas Express, autenticação JWT, validação das entradas e operações de banco.
- `database.sqlite`: banco local criado na inicialização (ignorado pelo Git).
- `package.json`: dependências e comandos de execução/teste.
- `.env.example`: exemplo das variáveis de ambiente necessárias.

### Testes e automação

- `tests/api.test.js`: testes de integração da API usando um diretório temporário.
- `.github/workflows/ci.yml`: verifica sintaxe JavaScript e executa a suíte automatizada em pushes e pull requests.

## Modelo de dados

- **users:** identidade, e-mail único, hash de senha, papel e nome de empresa.
- **jobs:** vagas publicadas, empresa, localização, tipo e descrição.
- **applications:** candidatura associada ao usuário e à vaga, com cópia dos dados de exibição no momento da candidatura.

A API usa consultas SQL parametrizadas. O nome da empresa vem da conta autenticada e a candidatura usa a identidade do token e a vaga consultada no banco, evitando confiar em campos de identidade enviados pelo cliente.

## Fluxo de autenticação

1. O usuário envia os dados para `POST /api/register` ou `POST /api/login`.
2. A senha é armazenada como hash bcrypt; a senha original não é retornada.
3. A API emite JWT com expiração.
4. O cliente envia o token no cabeçalho `Authorization: Bearer <token>` para rotas protegidas.
5. A API valida o token e aplica a regra de papel para a operação solicitada.

## Persistência

SQLite é utilizado para desenvolvimento local e demonstração. Antes de uma implantação com múltiplos processos ou alta disponibilidade, devem ser avaliados um banco gerenciado, migrações, backups e uma estratégia explícita de concorrência.

## Limitações atuais

- A integração frontend/API não está completa.
- Não há fluxo de recuperação ou verificação de e-mail.
- Ainda faltam rate limiting, observabilidade estruturada e documentação OpenAPI.
- A aplicação necessita de revisão de segurança e testes de implantação antes de uso em produção.

## Comandos de desenvolvimento

```bash
npm install
npm start
npm test
node --check server.js
```
