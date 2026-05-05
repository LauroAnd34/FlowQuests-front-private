const assert = require('node:assert/strict');

const {
  buildHttpsServers,
  hashPassword,
  isPasswordHash,
  isStrongPassword,
  isValidEmail,
  verifyPassword,
} = require('../lib/security');
const {
  loginUser,
  registerUser,
  resetUserPassword,
} = require('../lib/api-client');

async function run(name, fn) {
  try {
    await fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    console.error(error);
    process.exitCode = 1;
  }
}

async function main() {
  await run('hashPassword gera hash verificavel', async () => {
    const hash = hashPassword('SenhaForte123');

    assert.equal(isPasswordHash(hash), true);
    assert.equal(verifyPassword('SenhaForte123', hash), true);
    assert.equal(verifyPassword('senhaerrada', hash), false);
  });

  await run('validacao de email e senha forte', async () => {
    assert.equal(isValidEmail('jogador@flowquests.local'), true);
    assert.equal(isValidEmail('email-invalido'), false);
    assert.equal(isStrongPassword('SenhaForte123'), true);
    assert.equal(isStrongPassword('12345678'), false);
  });

  await run('fallback para http sem certificados', async () => {
    const { protocol, server, redirectServer } = buildHttpsServers(() => {});

    assert.equal(protocol, 'http');
    assert.ok(server);
    assert.equal(redirectServer, null);
    server.close();
  });

  await run('cadastro e login funcionam no modo demo', async () => {
    const email = `teste-${Date.now()}@flowquests.local`;
    const password = 'SenhaNova123';

    const user = await registerUser({
      nome: 'Teste Flow',
      email,
      senha: password,
    });

    assert.equal(user.email, email);

    const authenticatedUser = await loginUser({
      email,
      senha: password,
    });

    assert.equal(authenticatedUser.email, email);
  });

  await run('redefinicao de senha troca o acesso no modo demo', async () => {
    const email = `reset-${Date.now()}@flowquests.local`;
    const oldPassword = 'SenhaVelha123';
    const newPassword = 'SenhaNova456';

    await registerUser({
      nome: 'Reset Demo',
      email,
      senha: oldPassword,
    });

    await resetUserPassword(email, newPassword);

    let oldPasswordFailed = false;
    try {
      await loginUser({ email, senha: oldPassword });
    } catch (error) {
      oldPasswordFailed = true;
    }

    assert.equal(oldPasswordFailed, true);

    const authenticatedUser = await loginUser({
      email,
      senha: newPassword,
    });

    assert.equal(authenticatedUser.email, email);
  });

  if (process.exitCode) {
    process.exit(process.exitCode);
  }
}

main();
