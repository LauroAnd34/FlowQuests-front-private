# Merge Notes

Data da analise: 28 de abril de 2026

## Contexto

Este projeto local comeca de um `.zip` e recebeu uma refatoracao forte de frontend:

- autenticacao redesenhada
- dashboard redesenhado
- painel admin redesenhado
- acessibilidade
- responsividade
- separacao de scripts e partials
- camada `lib/api-client.js`
- camada `lib/view-models.js`

O repositorio `waniitatsuo/FlowQuests` avancou em paralelo principalmente no `app.js` e em versoes mais simples de `dashboard` e `admin-dashboard`.

## Commits recentes do upstream

- `5a41464` refatorando o `app.js`, e consertando paginas do admin e dashboard
- `7160d97` atualizando rotas da api no `app.js` e atualizando `admin-dashboard`
- `edfb49e` atualizando projeto, feito dashboard do admin

## O que foi adicionado no repositorio dele

### `app.js`

- uso direto de `axios` no arquivo principal
- uso de `body-parser`
- sessao com `express-session`
- protecao do dashboard via `req.session.userId`
- integracao direta com a API Spring em `http://localhost:8080/api`
- rota de admin em `/admin/admin-dashboard`
- chamadas do admin para:
  - listar usuarios
  - editar usuario
  - deletar usuario
  - promover usuario

### `views/admin/admin-dashboard.ejs`

- versao funcional do painel admin usando Bulma
- tabela com:
  - id
  - nome
  - email
  - xp
  - perfil
- acoes de editar, deletar e promover
- modal inline para editar usuario

### `views/dashboard.ejs`

- poucos ajustes funcionais
- link do painel admin apontando para `/admin/admin-dashboard`
- validacao simples de tarefa com `alert()`

## O que NAO vale trazer do upstream

- substituir o `app.js` atual inteiro pelo dele
- substituir o dashboard atual pelo dashboard dele
- substituir o admin atual pelo admin dele
- voltar a colocar JavaScript inline dentro dos templates
- voltar a usar `alert()` nativo
- remover a modularizacao `lib/api-client.js` e `lib/view-models.js`

Motivo:

O frontend local esta mais organizado, mais bonito e mais preparado para evolucao.

## O que vale trazer do upstream

### Ja incorporado neste projeto local

- compatibilidade com rota de cadastro `/usuarios/registrar` em `lib/api-client.js`
- compatibilidade com rota de promover admin `/usuarios/admin/promover/:id` em `lib/api-client.js`
- alias de rota `/admin/admin-dashboard` redirecionando para `/admin/painel` em `app.js`

### Vale observar depois

- confirmar quais rotas finais do backend dele realmente ficaram estaveis
- confirmar formato real do payload de usuario e tarefas
- confirmar se o backend usa mesmo:
  - `X-Usuario-Id`
  - `X-Admin-Id`
- alinhar nomes de status e categorias

## Estrategia recomendada de merge

### Manter da sua base local

- `views/`
- `css/`
- `js/`
- `lib/`
- organizacao atual do `app.js`

### Reaproveitar do backend dele apenas como compatibilidade

- nomes alternativos de endpoints
- pequenas diferencas de rotas admin
- qualquer ajuste de payload necessario para login, cadastro e tarefas

## Proximo passo recomendado

1. manter este projeto como a base principal do frontend
2. usar o repositorio dele apenas como `upstream`
3. quando ele mudar rotas do backend, adaptar `lib/api-client.js`
4. evitar copiar templates dele por cima dos seus

## Estado atual salvo

- repositorio Git local inicializado
- commit local criado:

`57070e1 Salva base local com melhorias de frontend e compatibilidade com backend`
