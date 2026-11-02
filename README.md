# Plataforma de Recrutamento

API e interface demonstrativa para conectar candidatos, empresas e recrutadores. O repositório combina um frontend HTML/CSS/JavaScript com uma API Node.js/Express e persistência SQLite.

> **Status:** projeto de portfólio em desenvolvimento. A interface usa a API para contas, candidaturas, busca e vagas salvas; ainda requer revisão e testes adicionais antes de uso público.

## Funcionalidades da API

- Cadastro e autenticação de usuários com JWT.
- Hash de senhas com bcrypt.
- Consulta de vagas.
- Publicação de vagas por contas de empresa/recrutador.
- Candidaturas vinculadas ao usuário autenticado e a vagas existentes.
- Vagas salvas por candidato, com acesso restrito à própria conta.
- Endpoint de health check.
- Testes automatizados de comportamento e segurança básica.

## Tecnologias

- Node.js e Express
- SQLite (`sqlite3`)
- JSON Web Tokens (`jsonwebtoken`)
- `bcryptjs`
- Node.js Test Runner (`node:test`)
- HTML, CSS e JavaScript no frontend

## Requisitos

- Node.js 18 ou superior
- npm

## Instalação local

```bash
git clone https://github.com/juniordev830/plataforma-de-recrutamento.git
cd plataforma-de-recrutamento
npm install
```

Crie seu arquivo `.env` a partir do exemplo:

```bash
cp .env.example .env
```

No Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Defina `JWT_SECRET` como um valor aleatório com pelo menos 32 caracteres. Não publique o `.env` nem reutilize uma chave de produção em testes.

Inicie o servidor:

```bash
npm start
```

A API e a interface servida pelo Express ficam, por padrão, em `http://localhost:3001`.

## Testes e validação

```bash
npm test
node --check server.js
```

Os testes usam um banco SQLite temporário e não devem alterar seu banco local.

## Endpoints

| Método | Rota | Acesso | Finalidade |
|---|---|---|---|
| GET | `/api/health` | Público | Verificar se a API está ativa |
| POST | `/api/register` | Público | Criar conta |
| POST | `/api/login` | Público | Autenticar usuário |
| GET | `/api/jobs` | Público | Listar vagas |
| POST | `/api/jobs` | Empresa/recrutador | Publicar vaga |
| GET | `/api/saved-jobs` | Candidato | Listar suas vagas salvas |
| PUT | `/api/saved-jobs/{jobId}` | Candidato | Salvar uma vaga |
| DELETE | `/api/saved-jobs/{jobId}` | Candidato | Remover uma vaga salva |
| POST | `/api/applications` | Candidato | Candidatar-se usando `jobId` |
| GET | `/api/applications` | Candidato | Listar suas candidaturas |

Para os endpoints protegidos, envie `Authorization: Bearer <token>`. Os formatos completos estão em [`docs/TECNICO.md`](docs/TECNICO.md).

Para buscar vagas, use os filtros opcionais `q` e `type` em `GET /api/jobs`. Por exemplo, `/api/jobs?q=remoto&type=fulltime` combina o texto com o tipo de contrato. A busca verifica título, empresa e localização. Os tipos aceitos são `fulltime`, `parttime`, `contract`, `internship` e `temporary`.

A página inicial também oferece busca por cargo, empresa ou local e filtro por
tipo de contrato. Use **Limpar** para voltar à lista completa. A busca consulta
as vagas cadastradas neste projeto; ela não reúne vagas de outras plataformas.

Após entrar como candidato, use **Salvar vaga** e acesse **Vagas salvas**.
As vagas ficam vinculadas à conta no banco SQLite da aplicação; sair do
navegador não as apaga. Para acessá-las em outro dispositivo, é preciso
conectar-se à mesma instalação da aplicação e entrar na mesma conta.

## Segurança implementada na API

- A aplicação exige `JWT_SECRET` configurado com pelo menos 32 caracteres.
- Tokens têm expiração e validação de emissor/audiência.
- Senhas têm comprimento validado e são armazenadas com hash bcrypt.
- Tipos de conta e entradas de vagas são validados no servidor.
- A empresa da vaga e os dados de candidatura são derivados da identidade autenticada, não confiados ao corpo enviado pelo cliente.
- Candidaturas repetidas para a mesma vaga são impedidas por índice único.
- Corpo de requisição limitado e origens CORS configuráveis.

Estas medidas melhoram a segurança básica, mas não representam uma auditoria completa nem tornam o sistema automaticamente pronto para produção.

## Estrutura

```text
server.js              # API Express e acesso SQLite
package.json           # Dependências e comandos
.env.example           # Modelo de configuração
script.js              # Interações do frontend
styles.css             # Estilos
 docs/                 # Documentação de arquitetura, uso e API
tests/api.test.js      # Testes da API
.github/workflows/ci.yml # Verificações automáticas
```

## Auditoria técnica

Consulte [`docs/AUDITORIA_E_PLANO_DE_MELHORIAS.md`](docs/AUDITORIA_E_PLANO_DE_MELHORIAS.md) para os achados iniciais, prioridades e verificações pendentes. A auditoria é estática; não considere os testes como aprovados até executá-los.

## Próximas melhorias

- Evoluir autenticação do navegador e política de recuperação de senha.
- Usar rate limiting compartilhado quando houver múltiplas instâncias.
- Criar testes de integração para todos os endpoints e cenários de erro.
- Documentar OpenAPI/Swagger e adicionar migrações de banco.
- Implementar um painel de recrutador para acompanhar candidaturas às vagas da própria empresa.
- Separar configuração e persistência em módulos e avaliar PostgreSQL para implantação.

## Autor

João Junior — estudante de Engenharia de Software, construindo projetos práticos de backend e aplicações web.

GitHub: https://github.com/juniordev830
