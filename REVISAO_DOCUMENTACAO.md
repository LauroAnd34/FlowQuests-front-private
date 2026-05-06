# Revisao da Documentacao do FlowQuests

Arquivo analisado: `C:\Users\fakef\Downloads\OFICIAL - Documentação do Sistema - FlowQuests.docx.pdf`

Este arquivo lista os principais pontos que devem ser atualizados na documentacao para ela ficar coerente com o sistema atual.

## 1. Correcos urgentes

### 1.1 Requisitos de hardware e software estao desatualizados e incoerentes

A secao de requisitos tecnicos do PDF nao conversa com o projeto atual. Hoje o sistema usa:

- Front-end: `Node.js`, `Express`, `EJS`
- Back-end: `Java 17`, `Spring Boot`
- Banco: `MySQL`

No PDF aparecem itens que parecem de outro sistema ou de uma documentacao antiga, como:

- `Windows XP` e `Windows 7`
- `SQL Server 2005/2008 Express`
- `JRE 6` e `JRE 7`
- `Leitor optico`
- `Impressora fiscal`

Esses itens devem ser removidos.

### 1.2 Sugestao de substituicao para requisitos minimos

Sugestao de texto mais aderente ao projeto:

- Sistema operacional: `Windows 10 ou superior`, `Linux` ou `macOS`
- Node.js: `18+`
- npm: `9+`
- Java: `17+`
- Maven: versao compativel com Spring Boot 3
- Banco de dados: `MySQL 8+`
- Navegador: `Chrome`, `Edge` ou `Firefox` atualizados
- Memoria RAM recomendada para desenvolvimento local: `4 GB` ou mais

## 2. Funcionalidades que precisam ser reescritas para refletir o sistema atual

### 2.1 RF001 - regra fixa de XP por categoria provavelmente nao representa a versao atual

O PDF diz que o sistema calcula XP com valores fixos:

- 70 XP para Remedios
- 40 XP para Atividades
- 50 XP para Trabalhos
- 30 XP para Eventos

Isso nao esta claro como regra fechada no codigo atual do front. No projeto atual, o valor de recompensa pode variar, e no modo local existe valor padrao de criacao. O ideal e reescrever esse requisito para algo como:

"Cada tarefa possui uma recompensa em XP definida pela regra de negocio vigente da aplicacao."

Se a regra fixa existir no back-end, ela precisa ser documentada la com a fonte oficial.

### 2.2 RF004 - Ranking de usuarios nao bate com o que aparece hoje no dashboard

O documento descreve um ranking de usuarios por XP. No front atual, a area chamada `Ranking` no dashboard nao funciona como leaderboard completo de usuarios; ela esta mais proxima de uma area de historico/missoes concluidas.  

Se o back-end realmente tiver um ranking global de usuarios, a documentacao precisa separar:

- `Ranking de usuarios por XP`
- `Historico de missoes concluidas`

Hoje isso esta confuso.

### 2.3 Resgatar recompensas nao esta implementado como fluxo completo

O PDF descreve:

- resgate de recompensa
- inventario com itens
- codigo promocional
- recompensa pendente/resgatada

No sistema atual, o que existe no front e uma visualizacao de conquistas/inventario de forma visual. Nao ha um fluxo completo de resgate operacional com estoque, codigo ou entrega real.

Sugestao:

- ou remover esse caso de uso da versao atual
- ou marcar como `funcionalidade futura`

### 2.4 Recuperacao de senha precisa ser descrita com mais cuidado

O PDF diz que o sistema envia instrucoes por e-mail. No projeto atual, o front/Node possui um fluxo de recuperacao e redefinicao de senha, mas no modo local o link pode ser apenas gerado/localizado sem servico real de e-mail.

Sugestao:

"O sistema possui fluxo de solicitacao e redefinicao de senha. O envio real por e-mail depende da integracao configurada no ambiente/back-end."

### 2.5 Graficos, relatorios e notificacoes nao aparecem como entregues nesta base

Na introducao, o PDF fala em:

- graficos
- relatorios
- notificacoes
- lembretes

Essas entregas nao aparecem como modulo fechado neste repositorio front atual. Se isso ainda nao existe no produto, o ideal e:

- remover da introducao como se ja estivesse pronto
- ou marcar como objetivo futuro

## 3. Pontos que a documentacao deveria adicionar e hoje nao destaca bem

### 3.1 Acessibilidade

O sistema atual ganhou recursos de acessibilidade no front, entao a documentacao deveria citar isso explicitamente, por exemplo:

- ajuste de contraste
- modo monocromatico
- reducao de animacoes
- ajuste de tamanho de fonte
- painel flutuante de acessibilidade

### 3.2 Responsividade

O front foi adaptado para diferentes tamanhos de tela. Vale registrar:

- desktop
- notebook
- tablet
- celular

### 3.3 Moderacao administrativa

Essa parte esta mais presente no sistema atual do que no texto geral da documentacao. Vale destacar melhor:

- promover usuario a admin
- editar usuario
- advertir
- bloquear
- banir
- excluir conta

## 4. Ajustes de seguranca que precisam aparecer de forma correta na documentacao

### 4.1 Trocar "criptografia de senha" por "hash seguro de senha"

No PDF aparece a ideia de "criptografar senha". O termo tecnicamente mais adequado para armazenamento de senha e:

- `hash seguro`

Sugestao de texto:

"As senhas nao devem ser armazenadas em texto puro. O sistema deve utilizar hash seguro de senha, com algoritmos apropriados como BCrypt, SCrypt ou Argon2."

### 4.2 Atualizar a descricao de seguranca com o que existe no sistema

No front/Node atual, ja existem mecanismos importantes que a documentacao pode citar:

- sessao de usuario
- protecao CSRF
- validacoes de login/cadastro
- limitacao de tentativas de login
- logout por `POST`
- fluxo de redefinicao de senha

### 4.3 Fazer uma observacao sobre dependencias do back-end

Se a documentacao for apresentar o sistema completo como produto final, ela deve deixar claro que a seguranca total depende tambem do back-end, especialmente em:

- autenticacao real
- autorizacao por perfil
- politica de CORS
- envio de e-mail real
- HTTPS em producao

## 5. Ajustes de consistencia textual

### 5.1 Padronizar nomes

Escolher um padrao e manter em todo o documento:

- `FlowQuests`
- `dashboard`
- `missoes`
- `conquistas`
- `inventario`
- `administrador`

Hoje a documentacao mistura descricoes mais academicas com termos de fluxos que nao estao totalmente alinhados ao nome das telas atuais.

### 5.2 Separar claramente o que esta pronto do que e proposta

Boa parte do PDF esta escrita como se tudo ja estivesse concluido. Para evitar problema na entrega, o ideal e dividir em:

- funcionalidades implementadas
- funcionalidades parcialmente implementadas
- funcionalidades futuras

## 6. Resumo do que eu mudaria primeiro

Se for fazer uma revisao curta e objetiva da documentacao, eu priorizaria:

1. Corrigir os requisitos tecnicos antigos (`Windows XP`, `SQL Server`, `JRE 6`, `leitor optico`, `impressora fiscal`).
2. Corrigir o trecho de seguranca para falar em `hash de senha`, nao "criptografia".
3. Ajustar o fluxo de `ranking`, porque hoje ele esta descrito de um jeito que nao bate perfeitamente com a interface atual.
4. Marcar `resgate de recompensas`, `graficos`, `relatorios`, `notificacoes` e `lembretes` como futuros, se ainda nao estiverem implementados no sistema real.
5. Adicionar acessibilidade e responsividade como caracteristicas do front atual.

## 7. Conclusao

A documentacao tem uma boa base academica, mas hoje mistura:

- requisitos antigos
- funcionalidades planejadas
- funcionalidades realmente implementadas

Com uma revisao nesses pontos, ela fica muito mais fiel ao sistema atual e evita prometer coisa que ainda nao esta pronta.
