# Auditoria inicial e plano de melhorias

Este documento separa achados confirmados pela leitura do código de itens que ainda precisam ser executados e verificados. A auditoria foi feita por inspeção estática; os testes ainda precisam ser executados em ambiente Node.js.

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
- Próximo passo: adicionar limitação de requisições, mensagens seguras e testes de comportamento.

### P2 — Integridade relacional do SQLite precisa ser verificada
- A tabela `applications` declara uma chave estrangeira para `users`, mas o código lido não ativa explicitamente `PRAGMA foreign_keys = ON`.
- Impacto: no SQLite, a declaração de chave estrangeira não garante enforcement se a opção não estiver habilitada na conexão.
- Próximo passo: ativar a opção ao abrir a conexão e adicionar testes de integridade. Confirmar o comportamento no ambiente de execução.

### P2 — A cobertura dos testes deve ser mais precisa
- O teste de candidatura duplicada verificava apenas que a resposta não era `201`, sem garantir o contrato esperado `409 Conflict`.
- Melhoria feita nesta branch: o teste agora exige status `409` e a mensagem esperada.
- Próximo passo: executar `npm test` e ampliar casos para token expirado, vaga inexistente, payloads inválidos e autorização.

## Verificações ainda pendentes

- Executar `npm ci`/instalação limpa, `npm test` e `node --check server.js`.
- Validar manualmente os fluxos no navegador e confirmar quais telas ainda usam `localStorage`.
- Verificar configuração de implantação, logs, cabeçalhos de segurança, backup e estratégia de migração do banco.
- Fazer revisão de acessibilidade e responsividade da interface.

## Critério de conclusão para portfólio

Considerar o projeto pronto para demonstração somente quando instalação limpa, testes, fluxo candidato ponta a ponta, provisionamento seguro de contas empresariais e documentação tiverem sido verificados. Este relatório não afirma que a aplicação está pronta para produção.
