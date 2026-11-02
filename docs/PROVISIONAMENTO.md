# Provisionamento de empresas

O cadastro público continua criando somente candidatos. Um operador com acesso ao servidor pode promover uma conta já cadastrada:

```bash
node server.js --provision-company contato@empresa.com "Nome da Empresa"
```

Use o mesmo JWT_SECRET e DATABASE_PATH da aplicação. O comando altera somente papel e empresa da conta existente e não expõe endpoint administrativo público. Depois, faça login novamente para obter um token com o novo papel.
