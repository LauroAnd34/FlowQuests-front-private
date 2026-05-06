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
  confirmRewardRedemption,
  loginUser,
  listUsersRanking,
  requestRewardRedemption,
  registerUser,
  resetUserPassword,
  updateOwnProfile,
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

  await run('autogestao de conta atualiza dados no modo demo', async () => {
    const email = `perfil-${Date.now()}@flowquests.local`;
    const password = 'SenhaPerfil123';

    const user = await registerUser({
      nome: 'Perfil Demo',
      email,
      senha: password,
    });

    const updatedUser = await updateOwnProfile(user.id, {
      nome: 'Perfil Atualizado',
      email: `perfil-atualizado-${Date.now()}@flowquests.local`,
      senhaAtual: password,
      novaSenha: 'SenhaNovaPerfil123',
    });

    assert.equal(updatedUser.nome, 'Perfil Atualizado');
    assert.equal(updatedUser.email.startsWith('perfil-atualizado-'), true);

    const authenticatedUser = await loginUser({
      email: updatedUser.email,
      senha: 'SenhaNovaPerfil123',
    });

    assert.equal(authenticatedUser.id, user.id);
  });

  await run('ranking e inventario de recompensas respondem no modo demo', async () => {
    const ranking = await listUsersRanking(2);
    assert.equal(Array.isArray(ranking), true);
    assert.equal(ranking.length >= 2, true);

    const pendingClaim = await requestRewardRedemption(2, 1);
    assert.equal(pendingClaim.status, 'pendente');

    const redeemedClaim = await confirmRewardRedemption(2, 1);
    assert.equal(redeemedClaim.status, 'resgatada');
  });

  if (process.exitCode) {
    process.exit(process.exitCode);
  }
}

main();
