# Documentação Técnica — Plataforma de Recrutamento

## Arquitetura atual

- **Runtime:** Node.js 18+
- **HTTP:** Express
- **Banco:** SQLite por meio de `sqlite3`
- **Autenticação:** JWT com expiração, emissor e audiência
- **Senhas:** hash com `bcryptjs`
- **Frontend:** HTML, CSS e JavaScript, com token da sessão mantido em memória
- **Testes:** `node:test`, executados com `npm test`

O backend e o frontend compartilham o mesmo servidor Express. A aplicação ainda é um projeto de portfólio e requer validação adicional antes de exposição pública ou uso em produção.

## Configuração

Copie `.env.example` para `.env` e defina:

- `PORT`: porta HTTP (padrão `3001`).
- `JWT_SECRET`: segredo aleatório com pelo menos 32 caracteres; a aplicação não inicia sem esse valor.
- `CORS_ORIGIN`: lista separada por vírgulas de origens confiáveis que podem acessar a API via navegador.
- `DATABASE_DIR` ou `DATABASE_PATH` (opcionais): diretório ou caminho do banco SQLite. Por padrão, o banco fica em `~/.plataforma-de-recrutamento/database.sqlite`, fora da pasta servida pelo Express.

Nunca versione o arquivo `.env` real. Se uma chave for exposta, substitua-a imediatamente.

## Inicialização

```bash
npm install
npm start
```

Desenvolvimento com reinicialização automática:

```bash
npm run dev
```

## Endpoints

### `GET /api/health`

Verificação simples da disponibilidade da API.

### `POST /api/register`

Exemplo de corpo:

```json
{
  "name": "Maria Silva",
  "email": "maria@example.com",
  "password": "uma-senha-com-8-ou-mais-caracteres",
  "role": "candidate"
}
```

O cadastro público cria exclusivamente contas `candidate`. Se o campo `role` for enviado, seu único valor aceito é `candidate`; tentativas de criar contas `company` ou `recruiter` são rejeitadas com HTTP 400. O endpoint não aceita nem define `companyName`. Contas empresariais são provisionadas pelo operador no servidor com `node server.js --provision-company email@empresa.com "Empresa"`; consulte `docs/PROVISIONAMENTO.md`. Faça login novamente após a promoção. A senha deve ter de 8 a 128 caracteres. Retorna token e dados públicos do usuário.

### `POST /api/login`

Recebe `email` e `password`; retorna um JWT e os dados públicos do usuário. Tokens expiram em duas horas.

### `GET /api/jobs`

Lista as vagas disponíveis. Aceita `q` para busca em título, empresa e local e `type` para filtrar pelo tipo de contrato.

### `POST /api/jobs`

Requer `Authorization: Bearer <token>` de uma conta `company` ou `recruiter`. Recebe `title`, `location`, `type`, `description` e, opcionalmente, `typeLabel` e `short`. O nome da empresa vem da conta autenticada, não do corpo enviado pelo cliente.

Tipos de vaga aceitos: `fulltime`, `parttime`, `contract`, `internship` e `temporary`.

O cadastro público não concede privilégios. O operador deve provisionar uma conta existente pelo comando administrativo documentado em `docs/PROVISIONAMENTO.md`.

### `POST /api/applications`

Requer token de `candidate`. O corpo deve conter `jobId`; o servidor obtém nome, e-mail e detalhes da vaga a partir dos dados autenticados e do banco.

### `GET /api/applications`

Requer token de `candidate` e retorna apenas as candidaturas do próprio usuário.

### Vagas salvas

As três rotas exigem token de `candidate` e usam a identidade autenticada:

- `GET /api/saved-jobs` retorna somente as vagas salvas pela conta.
- `PUT /api/saved-jobs/{jobId}` salva uma vaga existente; repetir a chamada não cria duplicata.
- `DELETE /api/saved-jobs/{jobId}` remove a associação da própria conta; repetir a remoção retorna 204.

IDs inválidos retornam 400 e salvar uma vaga inexistente retorna 404. A tabela
`saved_jobs` é criada na inicialização para bancos existentes e suas chaves
estrangeiras removem associações quando a conta ou a vaga é excluída.

Rotas inexistentes sob `/api` retornam JSON 404.

Para endpoints protegidos, envie `Authorization: Bearer <token>`.

## Testes

```bash
npm test
node --check server.js
```

A suíte cobre health check, validação de cadastro, bloqueio de acesso sem autenticação, restrição de papéis, integridade referencial, identidade e dados de candidaturas, prevenção de duplicidade, login e rotas inexistentes. O workflow do GitHub Actions executa verificações em pushes e pull requests.

## Controles implementados

- Segredo JWT obrigatório com comprimento mínimo.
- Expiração de token e validação de emissor/audiência, com algoritmo HS256 explicitamente permitido.
- Hash de senhas e validação básica de entrada.
- Limite de 1 MB para corpos HTTP.
- CORS configurável por lista de origens.
- Cabeçalhos HTTP básicos: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer` e `Cache-Control: no-store` em respostas `/api/*`. CSP e TLS exigem definição apropriada à implantação e ao frontend.
- Limitador em memória de 20 tentativas por IP em uma janela de 15 minutos nos endpoints públicos de cadastro e login.
- Verificação de papel para operações protegidas. A cada requisição protegida, o backend consulta a conta no SQLite e usa seu papel atual, rejeitando tokens de contas excluídas; mudar o papel não deixa permissões antigas ativas até a expiração do JWT.
- Candidaturas associadas à identidade autenticada e a vagas existentes.
- Chave estrangeira SQLite habilitada na conexão e índice único para impedir candidatura duplicada à mesma vaga.
- Banco SQLite armazenado fora do diretório servido pelo Express por padrão.

O limitador em memória não compartilha estado entre instâncias e não substitui uma solução distribuída (por exemplo, Redis) em implantação com múltiplas instâncias. A configuração de proxy também deve ser revisada antes de confiar no IP encaminhado por um balanceador.

## Limitações e próximos passos

- Evoluir a sessão do navegador para autenticação com cookie HttpOnly e proteção adequada contra CSRF.
- Evoluir o provisionamento administrativo por CLI para gestão auditável de empresas, mantendo papéis privilegiados fora do cadastro público.
- Adicionar recuperação de senha e verificação de e-mail.
- Documentar schemas formais com OpenAPI/Swagger.
- Criar migrações versionadas para o banco de dados.
- Adicionar painel para recrutadores com isolamento por empresa.
- Revisar autenticação, autorização, logs, backups e configuração de produção antes de publicar o serviço.

