const express = require('express');
const path = require('path');
const session = require('express-session');

const {
  getUserProfile,
  getUserTasksByState,
  getAchievements,
  listUsersRanking,
  loginUser,
  registerUser,
  resetUserPassword,
  updateOwnProfile,
  createTask,
  completeTask,
  requestRewardRedemption,
  confirmRewardRedemption,
  listUsersForAdmin,
  promoteUserToAdmin,
  updateUserAsAdmin,
  deleteUserAsAdmin,
  warnUserAsAdmin,
  blockUserAsAdmin,
  banUserAsAdmin,
} = require('./lib/api-client');
const {
  buildDashboardViewModel,
  buildAdminDashboardViewModel,
} = require('./lib/view-models');
const {
  PASSWORD_MIN_LENGTH,
  buildHttpsServers,
  createOpaqueToken,
  isStrongPassword,
  isValidEmail,
} = require('./lib/security');
const { sendRecoveryEmail } = require('./lib/recovery-mail');

const app = express();
const port = Number.parseInt(process.env.PORT || '3000', 10);
const httpsPort = Number.parseInt(process.env.HTTPS_PORT || '3443', 10);
const httpRedirectPort = Number.parseInt(process.env.HTTP_REDIRECT_PORT || '3000', 10);
const isProduction = process.env.NODE_ENV === 'production';
const sessionSecret = process.env.SESSION_SECRET;
const sessionName = process.env.SESSION_COOKIE_NAME || 'flowquests.sid';
const loginAttempts = new Map();
const recoveryTokens = new Map();
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_BLOCK_MS = 15 * 60 * 1000;
const RECOVERY_TOKEN_TTL_MS = 30 * 60 * 1000;
const dashboardTabs = new Set(['dashboard', 'tarefas', 'concluidas', 'recompensas', 'configuracoes']);

if (isProduction && !sessionSecret) {
  throw new Error('SESSION_SECRET obrigatorio em producao.');
}

app.disable('x-powered-by');

if (isProduction) {
  app.set('trust proxy', 1);
}

app.use(express.urlencoded({ extended: false, limit: '20kb' }));
app.use(express.json({ limit: '20kb' }));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/js', express.static(path.join(__dirname, 'js')));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(
  session({
    name: sessionName,
    secret: sessionSecret || 'flowquests-front-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: isProduction ? 'strict' : 'lax',
      secure: isProduction,
      maxAge: 1000 * 60 * 60 * 8,
    },
  })
);

function createCsrfToken() {
  return createOpaqueToken();
}

function ensureCsrfToken(req) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = createCsrfToken();
  }

  return req.session.csrfToken;
}

function requireSession(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/?message=login_required');
  }

  next();
}

function getPageNumber(value, fallback = 0) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

function getDashboardTab(value, fallback = 'dashboard') {
  return dashboardTabs.has(value) ? value : fallback;
}

function isBlank(value) {
  return !String(value || '').trim();
}

function extractApiMessage(error) {
  const data = error.response?.data;

  if (typeof data === 'string') {
    return data.toLowerCase();
  }

  if (typeof data?.message === 'string') {
    return data.message.toLowerCase();
  }

  return String(error.message || '').toLowerCase();
}

function resolveLoginFailure(error) {
  const apiMessage = extractApiMessage(error);
  const status = String(error.response?.data?.statusConta || '').toUpperCase();

  if (status === 'BANIDO' || apiMessage.includes('banid')) {
    return 'account_banned';
  }

  if (status === 'BLOQUEADO' || apiMessage.includes('bloque')) {
    return 'account_blocked';
  }

  if (apiMessage.includes('inativ') || apiMessage.includes('suspens')) {
    return 'account_blocked';
  }

  if (apiMessage.includes('muitas tentativas') || apiMessage.includes('rate limit')) {
    return 'login_rate_limited';
  }

  return 'login_failed';
}

function resolveRegisterFailure(error) {
  const apiMessage = extractApiMessage(error);
  const status = error.response?.status;

  if (status === 409 || apiMessage.includes('ja cadastrad') || apiMessage.includes('already')) {
    return 'email_in_use';
  }

  if (apiMessage.includes('email inval') || apiMessage.includes('invalid email')) {
    return 'register_invalid_email';
  }

  if (apiMessage.includes('obrigat')) {
    return 'register_missing_fields';
  }

  if (apiMessage.includes('8 caracteres') || apiMessage.includes('forte') || apiMessage.includes('uppercase')) {
    return 'register_password_weak';
  }

  if (apiMessage.includes('senha deve')) {
    return 'register_password_short';
  }

  return 'register_failed';
}

function resolveAccountUpdateFailure(error) {
  const apiMessage = extractApiMessage(error);
  const status = error.response?.status;

  if (status === 409 || apiMessage.includes('ja cadastrad')) {
    return 'account_email_in_use';
  }

  if (status === 401 || apiMessage.includes('senha atual invalida')) {
    return 'account_current_password_invalid';
  }

  if (apiMessage.includes('senha atual obrigatoria')) {
    return 'account_current_password_required';
  }

  if (apiMessage.includes('email inval')) {
    return 'account_invalid_email';
  }

  if (apiMessage.includes('8 caracteres')) {
    return 'account_password_short';
  }

  if (apiMessage.includes('forte') || apiMessage.includes('uppercase')) {
    return 'account_password_weak';
  }

  return 'account_update_failed';
}

function finalizeLogout(req, res) {
  req.session.destroy(() => {
    res.clearCookie(sessionName);
    res.redirect('/');
  });
}

function getLoginAttemptKey(req, email) {
  return `${req.ip}:${String(email || '').trim().toLowerCase()}`;
}

function getLoginAttemptState(key) {
  const state = loginAttempts.get(key);

  if (!state) {
    return null;
  }

  if (state.blockedUntil && state.blockedUntil > Date.now()) {
    return state;
  }

  if (state.windowStartedAt + LOGIN_WINDOW_MS < Date.now()) {
    loginAttempts.delete(key);
    return null;
  }

  if (state.blockedUntil && state.blockedUntil <= Date.now()) {
    loginAttempts.delete(key);
    return null;
  }

  return state;
}

function registerLoginFailure(key) {
  const now = Date.now();
  const current = getLoginAttemptState(key);

  if (!current) {
    loginAttempts.set(key, {
      count: 1,
      windowStartedAt: now,
      blockedUntil: null,
    });
    return;
  }

  current.count += 1;

  if (current.count >= LOGIN_MAX_ATTEMPTS) {
    current.blockedUntil = now + LOGIN_BLOCK_MS;
  }

  loginAttempts.set(key, current);
}

function clearLoginFailures(key) {
  loginAttempts.delete(key);
}

function cleanupRecoveryTokens() {
  const now = Date.now();

  for (const [token, data] of recoveryTokens.entries()) {
    if (data.expiresAt <= now || data.usedAt) {
      recoveryTokens.delete(token);
    }
  }
}

app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  if (
    !req.path.startsWith('/css') &&
    !req.path.startsWith('/js') &&
    !req.path.startsWith('/images')
  ) {
    res.setHeader('Cache-Control', 'no-store');
  }

  if (isProduction && req.secure) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  next();
});

app.use((req, res, next) => {
  const csrfToken = ensureCsrfToken(req);
  res.locals.csrfToken = csrfToken;

  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const requestToken = req.body?._csrf || req.get('x-csrf-token');

  if (!requestToken || requestToken !== csrfToken) {
    if (req.path.startsWith('/api/')) {
      return res.status(403).json({ message: 'Requisicao invalida.' });
    }

    return res.redirect('/?message=error');
  }

  next();
});

app.get('/', (req, res) => {
  res.render('index', { message: req.query.message || '' });
});

app.get('/cadastrar', (req, res) => {
  res.render('cadastrar', { message: req.query.message || '' });
});

app.post('/cadastrar', async (req, res) => {
  const { nome, email, senha, confirmarSenha } = req.body;

  if ([nome, email, senha, confirmarSenha].some(isBlank)) {
    return res.redirect('/cadastrar?message=register_missing_fields');
  }

  if (!isValidEmail(email)) {
    return res.redirect('/cadastrar?message=register_invalid_email');
  }

  if (String(senha).length < PASSWORD_MIN_LENGTH) {
    return res.redirect('/cadastrar?message=register_password_short');
  }

  if (!isStrongPassword(senha)) {
    return res.redirect('/cadastrar?message=register_password_weak');
  }

  if (senha !== confirmarSenha) {
    return res.redirect('/cadastrar?message=password_mismatch');
  }

  try {
    await registerUser({ nome, email, senha });
    res.redirect('/?message=success');
  } catch (error) {
    console.error('Falha no cadastro:', {
      status: error.response?.status,
      data: error.response?.data,
      code: error.code,
      message: error.message,
      cause: error.cause?.message,
      stack: error.stack?.split('\n').slice(0, 3).join(' | '),
      apiUrl: process.env.API_URL || 'http://127.0.0.1:8080/api (fallback localhost)',
    });
    res.redirect(`/cadastrar?message=${resolveRegisterFailure(error)}`);
  }
});

app.get('/esqueci-senha', (req, res) => {
  res.render('esqueci-senha', { message: req.query.message || '' });
});

app.get('/redefinir-senha', (req, res) => {
  cleanupRecoveryTokens();
  const token = String(req.query.token || '');
  const tokenData = recoveryTokens.get(token);

  if (!token || !tokenData || tokenData.expiresAt <= Date.now() || tokenData.usedAt) {
    return res.render('redefinir-senha', {
      message: 'reset_invalid_token',
      token: '',
    });
  }

  res.render('redefinir-senha', {
    message: req.query.message || '',
    token,
  });
});

app.get('/conta-status', (req, res) => {
  const rawStatus = String(req.query.status || 'BLOQUEADO').toUpperCase();
  const status = ['ATIVO', 'BLOQUEADO', 'BANIDO'].includes(rawStatus)
    ? rawStatus
    : 'BLOQUEADO';

  res.render('conta-status', { status });
});

app.post('/esqueci-senha', async (req, res) => {
  const { email } = req.body;

  if (isBlank(email)) {
    return res.redirect('/esqueci-senha?message=recovery_missing_email');
  }

  if (!isValidEmail(email)) {
    return res.redirect('/esqueci-senha?message=recovery_invalid_email');
  }

  cleanupRecoveryTokens();

  const recoveryToken = createOpaqueToken();
  const normalizedEmail = String(email).trim().toLowerCase();
  const resetLink = `http://localhost:${port}/redefinir-senha?token=${recoveryToken}`;
  recoveryTokens.set(recoveryToken, {
    email: normalizedEmail,
    expiresAt: Date.now() + RECOVERY_TOKEN_TTL_MS,
    usedAt: null,
  });

  try {
    const delivery = await sendRecoveryEmail({
      email: normalizedEmail,
      resetLink,
    });

    const message = delivery.mode === 'webhook' ? 'recovery_sent' : 'recovery_preview';
    res.redirect(`/?message=${message}`);
  } catch (error) {
    console.error('Falha ao enviar email de recuperacao:', error.message);
    res.redirect('/esqueci-senha?message=recovery_delivery_failed');
  }
});

app.post('/redefinir-senha', async (req, res) => {
  const { token, senha, confirmarSenha } = req.body;

  cleanupRecoveryTokens();

  if ([token, senha, confirmarSenha].some(isBlank)) {
    return res.redirect(`/redefinir-senha?token=${encodeURIComponent(token || '')}&message=reset_missing_fields`);
  }

  if (String(senha).length < PASSWORD_MIN_LENGTH) {
    return res.redirect(`/redefinir-senha?token=${encodeURIComponent(token)}&message=reset_password_short`);
  }

  if (!isStrongPassword(senha)) {
    return res.redirect(`/redefinir-senha?token=${encodeURIComponent(token)}&message=reset_password_weak`);
  }

  if (senha !== confirmarSenha) {
    return res.redirect(`/redefinir-senha?token=${encodeURIComponent(token)}&message=password_mismatch`);
  }

  const tokenData = recoveryTokens.get(String(token));

  if (!tokenData || tokenData.expiresAt <= Date.now() || tokenData.usedAt) {
    return res.redirect('/redefinir-senha?message=reset_invalid_token');
  }

  try {
    await resetUserPassword(tokenData.email, senha);
    tokenData.usedAt = Date.now();
    recoveryTokens.set(String(token), tokenData);
    res.redirect('/?message=reset_success');
  } catch (error) {
    res.redirect(`/redefinir-senha?token=${encodeURIComponent(token)}&message=reset_failed`);
  }
});

app.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  const loginAttemptKey = getLoginAttemptKey(req, email);
  const loginAttemptState = getLoginAttemptState(loginAttemptKey);

  if ([email, senha].some(isBlank)) {
    return res.redirect('/?message=login_missing_fields');
  }

  if (!isValidEmail(email)) {
    return res.redirect('/?message=login_invalid_email');
  }

  if (loginAttemptState?.blockedUntil && loginAttemptState.blockedUntil > Date.now()) {
    return res.redirect('/?message=login_rate_limited');
  }

  try {
    const user = await loginUser(req.body);
    req.session.regenerate((sessionError) => {
      if (sessionError) {
        return res.redirect('/?message=error');
      }

      req.session.userId = user.id;
      req.session.csrfToken = createCsrfToken();
      clearLoginFailures(loginAttemptKey);
      res.redirect('/dashboard');
    });
  } catch (error) {
    const failureMessage = resolveLoginFailure(error);
    registerLoginFailure(loginAttemptKey);

    if (failureMessage === 'account_banned') {
      return res.redirect('/conta-status?status=BANIDO');
    }

    if (failureMessage === 'account_blocked') {
      return res.redirect('/conta-status?status=BLOQUEADO');
    }

    res.redirect(`/?message=${failureMessage}`);
  }
});

app.get('/logout', (req, res) => {
  res.redirect(req.session.userId ? '/dashboard' : '/');
});

app.post('/logout', (req, res) => {
  finalizeLogout(req, res);
});

app.get('/dashboard', requireSession, async (req, res) => {
  const userId = req.session.userId;
  const search = (req.query.search || '').trim();
  const pendingPage = getPageNumber(req.query.pending_page);
  const completedPage = getPageNumber(req.query.completed_page);
  const initialTab = getDashboardTab(req.query.tab, 'dashboard');
  const message = String(req.query.message || '');

  try {
    const [usuario, tarefasPendentesRaw, tarefasConcluidasRaw, conquistas, rankingUsuarios] =
      await Promise.all([
        getUserProfile(userId),
        getUserTasksByState(userId, 'pendente'),
        getUserTasksByState(userId, 'concluida'),
        getAchievements(userId),
        listUsersRanking(userId),
      ]);

    if (usuario.statusConta && usuario.statusConta !== 'ATIVO') {
      req.session.destroy(() => {
        res.redirect(`/conta-status?status=${encodeURIComponent(usuario.statusConta)}`);
      });
      return;
    }

    const viewModel = buildDashboardViewModel({
      usuario,
      tarefasPendentesRaw,
      tarefasConcluidasRaw,
      conquistas,
      rankingUsuarios,
      search,
      pendingPage,
      completedPage,
      initialTab,
      message,
    });

    res.render('dashboard', viewModel);
  } catch (error) {
    res.redirect('/?message=error');
  }
});

app.post('/conta/atualizar', requireSession, async (req, res) => {
  const { nome, email, senhaAtual, novaSenha, confirmarNovaSenha } = req.body;

  if ([nome, email].some(isBlank)) {
    return res.redirect('/dashboard?tab=configuracoes&message=account_missing_fields');
  }

  if (!isValidEmail(email)) {
    return res.redirect('/dashboard?tab=configuracoes&message=account_invalid_email');
  }

  if (novaSenha || confirmarNovaSenha) {
    if (isBlank(senhaAtual)) {
      return res.redirect('/dashboard?tab=configuracoes&message=account_current_password_required');
    }

    if (String(novaSenha).length < PASSWORD_MIN_LENGTH) {
      return res.redirect('/dashboard?tab=configuracoes&message=account_password_short');
    }

    if (!isStrongPassword(novaSenha)) {
      return res.redirect('/dashboard?tab=configuracoes&message=account_password_weak');
    }

    if (novaSenha !== confirmarNovaSenha) {
      return res.redirect('/dashboard?tab=configuracoes&message=password_mismatch');
    }
  }

  try {
    await updateOwnProfile(req.session.userId, {
      nome,
      email,
      senhaAtual,
      novaSenha,
    });
    res.redirect('/dashboard?tab=configuracoes&message=account_updated');
  } catch (error) {
    res.redirect(`/dashboard?tab=configuracoes&message=${resolveAccountUpdateFailure(error)}`);
  }
});

app.post('/api/tarefas', requireSession, async (req, res) => {
  try {
    const createdTask = await createTask(req.session.userId, req.body);
    res.status(201).json(createdTask);
  } catch (error) {
    const status = error.response?.status || 500;
    res.status(status).json({
      message: 'Nao foi possivel criar a tarefa.',
    });
  }
});

app.post('/api/tarefas/:id/completar', requireSession, async (req, res) => {
  try {
    const response = await completeTask(req.session.userId, req.params.id);
    res.json(response);
  } catch (error) {
    const status = error.response?.status || 500;
    res.status(status).json({
      message: 'Nao foi possivel completar a tarefa.',
    });
  }
});

app.post('/api/recompensas/:id/solicitar', requireSession, async (req, res) => {
  try {
    const claim = await requestRewardRedemption(req.session.userId, req.params.id);
    res.json(claim);
  } catch (error) {
    const status = error.response?.status || 500;
    res.status(status).json({
      message: error.response?.data?.message || 'Nao foi possivel solicitar o resgate.',
    });
  }
});

app.post('/api/recompensas/:id/confirmar', requireSession, async (req, res) => {
  try {
    const claim = await confirmRewardRedemption(req.session.userId, req.params.id);
    res.json(claim);
  } catch (error) {
    const status = error.response?.status || 500;
    res.status(status).json({
      message: error.response?.data?.message || 'Nao foi possivel confirmar o resgate.',
    });
  }
});

app.get('/admin/painel', requireSession, async (req, res) => {
  const adminId = req.session.userId;
  const message = String(req.query.message || '');

  try {
    const [admin, usuarios] = await Promise.all([
      getUserProfile(adminId),
      listUsersForAdmin(adminId),
    ]);

    if (admin.perfil !== 'ADMIN') {
      return res.status(403).send('Acesso negado.');
    }

    res.render(
      'admin/admin-dashboard',
      buildAdminDashboardViewModel({ admin, usuarios, message })
    );
  } catch (error) {
    res.redirect('/dashboard');
  }
});

app.get('/admin/admin-dashboard', (req, res) => {
  res.redirect('/admin/painel');
});

app.post('/admin/promover/:id', requireSession, async (req, res) => {
  try {
    await promoteUserToAdmin(req.session.userId, req.params.id);
    res.redirect('/admin/painel?message=admin_user_promoted');
  } catch (error) {
    res.redirect('/admin/painel?message=admin_action_failed');
  }
});

app.post('/admin/editar/:id', requireSession, async (req, res) => {
  try {
    await updateUserAsAdmin(req.session.userId, req.params.id, req.body);
    res.redirect('/admin/painel?message=admin_user_updated');
  } catch (error) {
    res.redirect('/admin/painel?message=admin_action_failed');
  }
});

app.post('/admin/deletar/:id', requireSession, async (req, res) => {
  try {
    await deleteUserAsAdmin(req.session.userId, req.params.id);
    res.redirect('/admin/painel?message=admin_user_deleted');
  } catch (error) {
    res.redirect('/admin/painel?message=admin_action_failed');
  }
});

app.post('/admin/advertir/:id', requireSession, async (req, res) => {
  try {
    await warnUserAsAdmin(req.session.userId, req.params.id, {
      motivo: req.body.motivo,
      detalhamento: req.body.detalhamento,
    });
    res.redirect('/admin/painel?message=admin_warning_created');
  } catch (error) {
    res.redirect('/admin/painel?message=admin_action_failed');
  }
});

app.post('/admin/bloquear/:id', requireSession, async (req, res) => {
  try {
    await blockUserAsAdmin(req.session.userId, req.params.id);
    res.redirect('/admin/painel?message=admin_user_blocked');
  } catch (error) {
    res.redirect('/admin/painel?message=admin_action_failed');
  }
});

app.post('/admin/banir/:id', requireSession, async (req, res) => {
  try {
    await banUserAsAdmin(req.session.userId, req.params.id);
    res.redirect('/admin/painel?message=admin_user_banned');
  } catch (error) {
    res.redirect('/admin/painel?message=admin_action_failed');
  }
});

const { protocol, server, redirectServer } = buildHttpsServers(app, {
  httpsPort,
});

server.listen(protocol === 'https' ? httpsPort : port, () => {
  const activePort = protocol === 'https' ? httpsPort : port;
  console.log(`Servidor Node.js rodando em ${protocol}://localhost:${activePort}`);
});

if (redirectServer) {
  redirectServer.listen(httpRedirectPort, () => {
    console.log(`Servidor de redirecionamento HTTP rodando em http://localhost:${httpRedirectPort}`);
  });
}
