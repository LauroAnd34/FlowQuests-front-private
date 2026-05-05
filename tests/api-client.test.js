const test = require('node:test');
const assert = require('node:assert/strict');

const {
  loginUser,
  registerUser,
  resetUserPassword,
} = require('../lib/api-client');

test('registerUser cria conta nova e loginUser autentica com senha informada', async () => {
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

test('resetUserPassword troca a senha no modo demo', async () => {
  const email = `reset-${Date.now()}@flowquests.local`;
  const oldPassword = 'SenhaVelha123';
  const newPassword = 'SenhaNova456';

  await registerUser({
    nome: 'Reset Demo',
    email,
    senha: oldPassword,
  });

  await resetUserPassword(email, newPassword);

  await assert.rejects(
    () => loginUser({ email, senha: oldPassword }),
    /Credenciais invalidas/
  );

  const authenticatedUser = await loginUser({
    email,
    senha: newPassword,
  });

  assert.equal(authenticatedUser.email, email);
});
