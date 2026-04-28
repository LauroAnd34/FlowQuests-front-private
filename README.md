# FlowQuests 🚀

Bem-vindo ao FlowQuests\! Este é um sistema de gerenciamento de tarefas gamificado, projetado para ajudar os usuários a organizar suas atividades diárias de forma divertida e recompensadora. Ao completar tarefas, os usuários ganham pontos de experiência (XP) e desbloqueiam conquistas.

O projeto utiliza uma arquitetura moderna com um back-end robusto em **Spring Boot** para gerenciar a lógica de negócio e uma interface de usuário dinâmica construída com **Node.js** e **EJS**.

![Dashboard do FlowQuests](https://imgur.com/a/nYSApx2)

## Funcionalidades Principais ✨

  * **Autenticação de Usuários:** Sistema seguro de login e cadastro.
  * **Gerenciamento de Tarefas (CRUD):** Crie, visualize e complete suas tarefas diárias.
  * **Sistema de Gamificação:** Ganhe XP ao completar tarefas e suba de nível.
  * **Conquistas:** Desbloqueie recompensas ao atingir marcos específicos (ex: primeira tarefa, 10 tarefas concluídas).
  * **Filtro e Paginação:** Pesquise facilmente por suas tarefas e navegue por elas com um sistema de paginação.
  * **Histórico de Tarefas:** Visualize todas as tarefas que você já concluiu.

## Tecnologias Utilizadas 🛠️

  * **Back-end:**
      * Java 17
      * Spring Boot 3
      * Spring Data JPA (Hibernate)
      * Maven
  * **Front-end:**
      * Node.js
      * Express.js
      * EJS (Embedded JavaScript templates)
      * Bulma (Framework CSS)
  * **Banco de Dados:**
      * MySQL

## Como Executar o Projeto 🏃‍♂️

Para rodar este projeto em sua máquina local, você precisará ter o **Java (JDK 17 ou superior)**, **Maven**, **Node.js** e **MySQL** instalados.

Siga os passos abaixo na ordem correta:

### 1\. Configuração do Banco de Dados

Primeiro, precisamos criar o banco de dados e suas tabelas. O processo é simples:

1.  Abra o seu cliente MySQL de preferência (MySQL Workbench, DBeaver, etc.).
2.  Localize a pasta **"Banco de Dados"** no repositório do projeto. Dentro dela, você encontrará o arquivo `CriandoBDFlowQuests.sql`.
3.  **Execute o conteúdo completo** desse script. Ele irá criar o banco de dados `flowquests_db`, todas as tabelas necessárias e inserir os dados iniciais (como as conquistas).

### 2\. Configuração do Back-end (API Spring Boot)

Agora, vamos iniciar o servidor da API.

1.  Localize a pasta **"Projeto Spring"** e descompacte o arquivo `.zip` que está dentro dela.
2.  Abra a pasta descompactada em sua IDE de preferência (IntelliJ, Eclipse, VS Code).
3.  Aguarde a IDE carregar e baixar todas as dependências do Maven.
4.  **Verifique a configuração do banco de dados:**
      * Abra o arquivo `src/main/resources/application.properties`.
      * Confirme se as credenciais (`spring.datasource.username` e `spring.datasource.password`) correspondem às do seu ambiente MySQL local.
5.  Execute a aplicação. Na maioria das IDEs, basta abrir a classe principal `FlowTasksApiRestApplication.java` e clicar no botão "Run" (▶).
6.  O console deverá exibir a mensagem de que o servidor iniciou na porta **8080**.

### 3\. Configuração do Front-end (Aplicação Node.js)

Finalmente, vamos iniciar a interface do usuário.

1.  Abra um terminal ou prompt de comando.
2.  Navegue até a pasta raiz do projeto front-end (a pasta que contém o arquivo `app.js`).
3.  Execute o seguinte comando para instalar todas as dependências necessárias (Express, Axios, EJS, etc.):
    ```bash
    npm install
    ```
4.  Após a instalação ser concluída, inicie o servidor com o comando:
    ```bash
    node app.js
    ```
5.  O console deverá exibir a mensagem: `Servidor Node.js a rodar em http://localhost:3000`.

## Acessando a Aplicação 🎉

Com os dois servidores (Spring e Node.js) rodando, abra seu navegador e acesse:

**[http://localhost:3000](https://www.google.com/search?q=http://localhost:3000)**

Você será direcionado para a tela de login, de onde poderá criar uma nova conta e começar a usar o FlowQuests\!

-----

*Projeto desenvolvido Por © 2025 Jorge Lucas, como parte de estudos em desenvolvimento web full-stack. Sinta-se à vontade para contribuir\!*

**[link da apresentação em slides](https://www.canva.com/design/DAGwDd8GwwY/7HSiNtfQI70FiVd71kjhNw/view?utm_content=DAGwDd8GwwY&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=h640152bea3)**