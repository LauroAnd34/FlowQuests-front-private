const http = require('node:http');
const https = require('node:https');

function postJson(targetUrl, payload) {
  return new Promise((resolve, reject) => {
    const url = new URL(targetUrl);
    const data = JSON.stringify(payload);
    const client = url.protocol === 'https:' ? https : http;

    const request = client.request(
      {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: `${url.pathname}${url.search}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      },
      (response) => {
        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => {
          if (response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
            resolve({
              statusCode: response.statusCode,
              body: Buffer.concat(chunks).toString('utf8'),
            });
            return;
          }

          reject(new Error(`Falha ao enviar email. Status ${response.statusCode || 0}.`));
        });
      }
    );

    request.on('error', reject);
    request.write(data);
    request.end();
  });
}

async function sendRecoveryEmail({ email, resetLink }) {
  const webhookUrl = process.env.RECOVERY_MAIL_WEBHOOK_URL;
  const payload = {
    type: 'password-recovery',
    to: email,
    subject: 'FlowQuests | Redefinicao de senha',
    message:
      'Recebemos um pedido de redefinicao de senha. Use o link enviado para concluir a atualizacao com seguranca.',
    resetLink,
  };

  if (webhookUrl) {
    await postJson(webhookUrl, payload);
    return { mode: 'webhook' };
  }

  console.log(`Email de recuperacao (modo local) para ${email}: ${resetLink}`);
  return { mode: 'local-preview' };
}

module.exports = {
  sendRecoveryEmail,
};
