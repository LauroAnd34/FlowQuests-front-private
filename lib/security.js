const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const https = require('https');

const PASSWORD_PREFIX = 'scrypt';
const PASSWORD_KEY_LENGTH = 64;
const PASSWORD_MIN_LENGTH = 8;

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

function isStrongPassword(password) {
  const normalized = String(password || '');
  return (
    normalized.length >= PASSWORD_MIN_LENGTH &&
    /[a-z]/.test(normalized) &&
    /[A-Z]/.test(normalized) &&
    /\d/.test(normalized)
  );
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(password), salt, PASSWORD_KEY_LENGTH).toString('hex');
  return `${PASSWORD_PREFIX}$${salt}$${hash}`;
}

function isPasswordHash(value) {
  return String(value || '').startsWith(`${PASSWORD_PREFIX}$`);
}

function verifyPassword(password, storedValue) {
  const normalizedStored = String(storedValue || '');

  if (!isPasswordHash(normalizedStored)) {
    return String(password || '') === normalizedStored;
  }

  const [, salt, expectedHash] = normalizedStored.split('$');
  const computedHash = crypto
    .scryptSync(String(password || ''), salt, PASSWORD_KEY_LENGTH)
    .toString('hex');

  const expectedBuffer = Buffer.from(expectedHash, 'hex');
  const computedBuffer = Buffer.from(computedHash, 'hex');

  if (expectedBuffer.length !== computedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, computedBuffer);
}

function createOpaqueToken() {
  return crypto.randomBytes(32).toString('hex');
}

function buildHttpsServers(app, options = {}) {
  const httpsKeyPath = options.httpsKeyPath || process.env.HTTPS_KEY_PATH;
  const httpsCertPath = options.httpsCertPath || process.env.HTTPS_CERT_PATH;
  const forceHttpsRedirect = options.forceHttpsRedirect || process.env.FORCE_HTTPS_REDIRECT === 'true';

  if (!httpsKeyPath || !httpsCertPath) {
    return { protocol: 'http', server: http.createServer(app), redirectServer: null };
  }

  const key = fs.readFileSync(httpsKeyPath);
  const cert = fs.readFileSync(httpsCertPath);
  const httpsServer = https.createServer({ key, cert }, app);
  let redirectServer = null;

  if (forceHttpsRedirect) {
    redirectServer = http.createServer((req, res) => {
      const host = (req.headers.host || '').split(':')[0];
      const httpsPort = options.httpsPort || process.env.HTTPS_PORT || 3443;
      res.writeHead(301, {
        Location: `https://${host}:${httpsPort}${req.url}`,
      });
      res.end();
    });
  }

  return { protocol: 'https', server: httpsServer, redirectServer };
}

module.exports = {
  PASSWORD_MIN_LENGTH,
  createOpaqueToken,
  buildHttpsServers,
  hashPassword,
  isPasswordHash,
  isStrongPassword,
  isValidEmail,
  verifyPassword,
};
