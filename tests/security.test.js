const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildHttpsServers,
  hashPassword,
  isPasswordHash,
  isStrongPassword,
  isValidEmail,
  verifyPassword,
} = require('../lib/security');

test('hashPassword gera um hash reconhecivel e verificavel', () => {
  const hash = hashPassword('SenhaForte123');

  assert.equal(isPasswordHash(hash), true);
  assert.equal(verifyPassword('SenhaForte123', hash), true);
  assert.equal(verifyPassword('senhaerrada', hash), false);
});

test('isValidEmail valida emails comuns', () => {
  assert.equal(isValidEmail('jogador@flowquests.local'), true);
  assert.equal(isValidEmail('email-invalido'), false);
});

test('isStrongPassword exige regra minima de seguranca', () => {
  assert.equal(isStrongPassword('SenhaForte123'), true);
  assert.equal(isStrongPassword('12345678'), false);
  assert.equal(isStrongPassword('somenteMinuscula1'), false);
});

test('buildHttpsServers cai para http sem certificados configurados', () => {
  const { protocol, server, redirectServer } = buildHttpsServers(() => {});

  assert.equal(protocol, 'http');
  assert.ok(server);
  assert.equal(redirectServer, null);
  server.close();
});
