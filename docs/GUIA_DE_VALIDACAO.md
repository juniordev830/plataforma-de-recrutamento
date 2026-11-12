# Checklist de verificação — recrutamento

O projeto combina interface HTML/JavaScript (`index.html`), API Node.js (`server.js`) e testes em `tests/`. A documentação de arquitetura, provisionamento e guia de uso está em `docs/`.

## Rotina de revisão

- Instalar dependências conforme `package.json` e preparar variáveis locais usando `.env.example`.
- Executar o script de testes configurado no projeto e corrigir falhas antes de trabalhar na interface.
- Abrir o frontend e conferir, com dados fictícios, o fluxo candidato → vaga → candidatura.
- Testar login inválido, token ausente e tentativa de acessar dados de outro candidato; o backend deve impedir acesso não autorizado.
- Verificar publicação de vagas apenas para o perfil autorizado e os limites de tamanho dos dados recebidos.
- Testar PDF/currículo apenas com arquivos de demonstração e validar tipo, tamanho e armazenamento antes de disponibilizar upload público.

## Critérios antes de publicar

Não confundir interface ilustrativa com fluxo produtivo. Documentar separadamente o que a API realmente expõe, dependências externas necessárias, migrações e fluxo de recuperação de dados. Verificar segredos fora do Git, política de armazenamento de currículos, tratamento de dados pessoais e eventual base legal LGPD. O ambiente atual é demonstrativo e exige revisão de segurança antes de receber candidatos reais.
