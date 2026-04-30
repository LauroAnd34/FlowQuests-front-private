const express = require('express');
const path = require('path');
const session = require('express-session');

const {
  getUserProfile,
  getUserTasksByState,
  getAchievements,
  loginUser,
  registerUser,
  createTask,
  completeTask,
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

const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/js', express.static(path.join(__dirname, 'js')));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'flowquests-front-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 8,
    },
  })
);

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

app.get('/', (req, res) => {
  res.render('index', { message: req.query.message || '' });
});

app.get('/cadastrar', (req, res) => {
  res.render('cadastrar', { message: req.query.message || '' });
});

app.post('/cadastrar', async (req, res) => {
  const { nome, email, senha, confirmarSenha } = req.body;

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
    res.redirect('/cadastrar?message=register_failed');
  }
});

app.get('/esqueci-senha', (req, res) => {
  res.render('esqueci-senha', { message: req.query.message || '' });
});

app.get('/conta-status', (req, res) => {
  const rawStatus = String(req.query.status || 'BLOQUEADO').toUpperCase();
  const status = ['ATIVO', 'BLOQUEADO', 'BANIDO'].includes(rawStatus)
    ? rawStatus
    : 'BLOQUEADO';

  res.render('conta-status', { status });
});

app.post('/esqueci-senha', async (req, res) => {
  // O endpoint de recuperacao nao esta documentado no projeto.
  // Mantemos um fluxo de UX consistente no front-end ate o back-end ser confirmado.
  res.redirect('/?message=recovery');
});

app.post('/login', async (req, res) => {
  try {
    const user = await loginUser(req.body);
    req.session.userId = user.id;
    res.redirect('/dashboard');
  } catch (error) {
    res.redirect('/?message=login_failed');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

app.get('/dashboard', requireSession, async (req, res) => {
  const userId = req.session.userId;
  const search = (req.query.search || '').trim();
  const pendingPage = getPageNumber(req.query.pending_page);
  const completedPage = getPageNumber(req.query.completed_page);

  try {
    const [usuario, tarefasPendentesRaw, tarefasConcluidasRaw, conquistas] =
      await Promise.all([
        getUserProfile(userId),
        getUserTasksByState(userId, 'pendente'),
        getUserTasksByState(userId, 'concluida'),
        getAchievements(userId),
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
      search,
      pendingPage,
      completedPage,
    });

    res.render('dashboard', viewModel);
  } catch (error) {
    res.redirect('/?message=error');
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

app.get('/admin/painel', requireSession, async (req, res) => {
  const adminId = req.session.userId;

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
      buildAdminDashboardViewModel({ admin, usuarios })
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
    res.redirect('/admin/painel');
  } catch (error) {
    res.status(500).send('Erro ao promover usuario.');
  }
});

app.post('/admin/editar/:id', requireSession, async (req, res) => {
  try {
    await updateUserAsAdmin(req.session.userId, req.params.id, req.body);
    res.redirect('/admin/painel');
  } catch (error) {
    res.status(500).send('Erro ao editar usuario.');
  }
});

app.post('/admin/deletar/:id', requireSession, async (req, res) => {
  try {
    await deleteUserAsAdmin(req.session.userId, req.params.id);
    res.redirect('/admin/painel');
  } catch (error) {
    res.status(500).send('Erro ao deletar usuario.');
  }
});

app.post('/admin/advertir/:id', requireSession, async (req, res) => {
  try {
    await warnUserAsAdmin(req.session.userId, req.params.id, {
      motivo: req.body.motivo,
      detalhamento: req.body.detalhamento,
    });
    res.redirect('/admin/painel');
  } catch (error) {
    res.status(500).send('Erro ao advertir usuario.');
  }
});

app.post('/admin/bloquear/:id', requireSession, async (req, res) => {
  try {
    await blockUserAsAdmin(req.session.userId, req.params.id);
    res.redirect('/admin/painel');
  } catch (error) {
    res.status(500).send('Erro ao bloquear usuario.');
  }
});

app.post('/admin/banir/:id', requireSession, async (req, res) => {
  try {
    await banUserAsAdmin(req.session.userId, req.params.id);
    res.redirect('/admin/painel');
  } catch (error) {
    res.status(500).send('Erro ao banir usuario.');
  }
});

app.listen(port, () => {
  console.log(`Servidor Node.js rodando em http://localhost:${port}`);
});
