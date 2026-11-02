# Auditoria inicial e plano de melhorias

Este documento separa achados confirmados pela leitura do código de itens que ainda precisam ser executados e verificados. A auditoria inicial foi feita por inspeção estática. Em 1º de novembro de 2026, o GitHub Actions executou a instalação de dependências, `node --check server.js` e `npm test` na revisão do PR #5: os 10 testes passaram, sem falhas. A instalação reportou 12 vulnerabilidades (2 baixas, 5 moderadas, 4 altas e 1 crítica). Os pacotes e os principais avisos foram extraídos do relatório do GitHub Actions; não atualizar dependências às cegas.

## Resultado detalhado do npm audit

A execução do GitHub Actions em 1º de novembro de 2026 confirmou 12 vulnerabilidades: 2 baixas, 5 moderadas, 4 altas e 1 crítica. A auditoria identificou estes pacotes:

| Pacote | Tipo | Gravidade reportada | Observação |
|---|---|---|---|
| `sqlite3` | Dependência direta | Alta | O npm sugere `sqlite3@6.0.1`, uma atualização major; exige avaliar compatibilidade e mudanças de API. |
| `nodemon` | Dependência direta de desenvolvimento | Moderada | O npm sugere `nodemon@1.0.2` como caminho de correção, também major em relação à versão instalada; verificar a sugestão com cuidado. |
| `tar` | Transitiva | Crítica | Foram listados vários avisos relacionados a extração de arquivos e caminhos; entra como prioridade de investigação. |
| `cacache`, `make-fetch-happen`, `node-gyp` | Transitivas | Alta | Associadas à árvore de dependências de instalação/build. |
| `@npmcli/move-file`, `glob`, `minimatch`, `rimraf` | Transitivas | Moderada | Pacotes antigos ou com avisos de segurança; corrigir via dependências-pai quando possível. |
| `@tootallnate/once`, `http-proxy-agent` | Transitivas | Baixa | Revisar atualização pela árvore de dependências. |

**Limitação importante:** os avisos do relatório apontam caminhos de correção que podem envolver atualização major de `sqlite3` e `nodemon`; não significa que essas versões possam ser trocadas com segurança sem testes. O relatório também não prova, por si só, que a aplicação esteja explorável em produção. A etapa seguinte é revisar a árvore de dependências e preparar mudanças compatíveis, em branch separada.

## Achados confirmados

### P1 — Não existe fluxo normal para provisionar contas de empresa/recrutador
- O endpoint público `POST /api/register` rejeita qualquer papel diferente de `candidate`.
- O endpoint `POST /api/jobs` exige papel `company` ou `recruiter` e uma propriedade `companyName` não vazia no token.
- No estado atual, a documentação não descreve uma ferramenta administrativa segura para criar essas contas.
- Impacto: um usuário comum não consegue concluir sozinho o fluxo de publicação de vagas, apesar de a rota existir.
- Próximo passo: desenhar um mecanismo administrativo seguro de provisionamento; não liberar papéis privilegiados no cadastro público.

### P1 — Parte dos fluxos do frontend ainda usa localStorage
- O README e a documentação técnica identificam fluxos simulados em `localStorage`.
- Impacto: os dados da interface podem não refletir a persistência real da API, enfraquecendo a demonstração ponta a ponta.
- Próximo passo: mapear cada formulário e ligar cadastro, login, consulta de vagas e candidatura aos endpoints; remover simulações duplicadas após testes.

### P2 — Proteção contra abuso de autenticação ainda é incompleta
- Não foi identificado middleware de limitação de tentativas (rate limiting) no `server.js`.
- Impacto: endpoints de login e cadastro ficam mais expostos a tentativas repetidas quando publicados.
- Estado atual: o `server.js` já aplica um limitador em memória de 20 tentativas por IP a cada 15 minutos nos endpoints públicos de cadastro e login. A estrutura não é compartilhada entre instâncias e deve ser substituída por armazenamento compartilhado em implantação distribuída. Os testes automatizados para o limite ainda precisam ser adicionados.

### P2 — Integridade relacional do SQLite precisa ser verificada
- A tabela `applications` declara uma chave estrangeira para `users`, mas o código lido não ativa explicitamente `PRAGMA foreign_keys = ON`.
- Impacto: no SQLite, a declaração de chave estrangeira não garante enforcement se a opção não estiver habilitada na conexão.
- Próximo passo: ativar a opção ao abrir a conexão e adicionar testes de integridade. Confirmar o comportamento no ambiente de execução.

### P2 — A cobertura dos testes deve ser mais precisa
- O teste de candidatura duplicada verificava apenas que a resposta não era `201`, sem garantir o contrato esperado `409 Conflict`.
- Melhoria feita nesta branch: o teste agora exige status `409` e a mensagem esperada.
- Próximo passo: executar `npm test` e ampliar casos para token expirado, vaga inexistente, payloads inválidos e autorização.

## Verificações ainda pendentes

- Repetir uma instalação reproduzível com lockfile versionado; atualmente o repositório não contém `package-lock.json` na branch auditada.
- Gerar relatório completo de `npm audit` para identificar pacote, dependência transitiva e advisory associados às 12 vulnerabilidades; avaliar atualizações compatíveis e reexecutar os testes.
- Validar manualmente os fluxos no navegador e confirmar quais telas ainda usam `localStorage`.
- Verificar configuração de implantação, logs, cabeçalhos de segurança, backup e estratégia de migração do banco.
- Fazer revisão de acessibilidade e responsividade da interface.

## Critério de conclusão para portfólio

Considerar o projeto pronto para demonstração somente quando instalação limpa, testes, fluxo candidato ponta a ponta, provisionamento seguro de contas empresariais e documentação tiverem sido verificados. Este relatório não afirma que a aplicação está pronta para produção.
