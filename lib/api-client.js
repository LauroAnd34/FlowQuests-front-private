const axios = require('axios');

const baseUrls = Array.from(
  new Set(
    [
      process.env.API_URL,
      'http://127.0.0.1:8080/api',
      'http://localhost:8080/api',
    ].filter(Boolean)
  )
);

function createApi(baseURL) {
  return axios.create({
    baseURL,
    timeout: 10000,
  });
}

const apiClients = baseUrls.map(createApi);

const mockState = {
  nextUserId: 3,
  nextTaskId: 4,
  nextWarningId: 3,
  achievements: [
    { id: 1, nome: 'Primeira Quest', descricao: 'Conclua sua primeira missao.', icone: 'fas fa-star' },
    { id: 2, nome: 'Ritmo de Jogo', descricao: 'Conclua 3 missoes.', icone: 'fas fa-fire' },
    { id: 3, nome: 'Heroi da Rotina', descricao: 'Alcance 500 XP totais.', icone: 'fas fa-crown' },
  ],
  users: [
    {
      id: 1,
      nome: 'Admin Flow',
      email: 'admin@flowquests.local',
      senha: '123456',
      xpTotal: 640,
      perfil: 'ADMIN',
      statusConta: 'ATIVO',
      criadoEm: '2026-04-15T09:00:00',
      conquistas: [{ id: 1 }, { id: 2 }, { id: 3 }],
    },
    {
      id: 2,
      nome: 'Jogador Demo',
      email: 'demo@flowquests.local',
      senha: '123456',
      xpTotal: 180,
      perfil: 'USER',
      statusConta: 'ATIVO',
      criadoEm: '2026-04-16T10:30:00',
      conquistas: [{ id: 1 }],
    },
  ],
  tasks: [
    {
      id: 1,
      usuarioId: 2,
      titulo: 'Ajustar layout mobile',
      dataPrazo: '2026-04-29',
      horaPrazo: '09:00:00',
      categoria: 'trabalho',
      recompensaXp: 120,
      estado: 'pendente',
    },
    {
      id: 2,
      usuarioId: 2,
      titulo: 'Revisar backlog das quests',
      dataPrazo: '2026-04-29',
      horaPrazo: '14:30:00',
      categoria: 'estudo',
      recompensaXp: 80,
      estado: 'pendente',
    },
    {
      id: 3,
      usuarioId: 2,
      titulo: 'Validar tela de cadastro',
      dataPrazo: '2026-04-27',
      horaPrazo: '11:00:00',
      categoria: 'trabalho',
      recompensaXp: 60,
      estado: 'concluida',
    },
  ],
  warnings: [
    {
      id: 1,
      usuarioId: 2,
      motivo: 'Spam de tarefas duplicadas',
      detalhamento: 'Foram identificadas varias quests repetidas em sequencia.',
      criadoEm: '2026-04-23T15:10:00',
    },
    {
      id: 2,
      usuarioId: 2,
      motivo: 'Uso inadequado de titulo',
      detalhamento: 'Padronize melhor o titulo das missoes para manter o painel legivel.',
      criadoEm: '2026-04-25T11:25:00',
    },
  ],
};

function withUserHeader(userId) {
  return {
    headers: {
      'X-Usuario-Id': userId,
    },
  };
}

function withAdminHeader(adminId) {
  return {
    headers: {
      'X-Admin-Id': adminId,
    },
  };
}

function isConnectivityError(error) {
  return ['ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND'].includes(error?.code);
}

async function tryRequests(candidates) {
  let lastError;

  for (const candidate of candidates) {
    try {
      const response = await candidate();
      return response.data;
    } catch (error) {
      lastError = error;
      const status = error.response?.status;
      const code = error.code;

      if (status && ![404, 405].includes(status)) {
        throw error;
      }

      if (!status && code && !isConnectivityError(error)) {
        throw error;
      }
    }
  }

  throw lastError || new Error('Nenhum endpoint disponivel respondeu.');
}

function buildCandidates(requestBuilder) {
  return apiClients.map((client) => () => requestBuilder(client));
}

function clone(data) {
  return JSON.parse(JSON.stringify(data));
}

function findUserById(userId) {
  const user = mockState.users.find((item) => Number(item.id) === Number(userId));
  if (!user) {
    throw new Error('Usuario nao encontrado no modo demo.');
  }
  return user;
}

function unlockAchievement(user, achievementId) {
  const unlockedIds = new Set((user.conquistas || []).map((item) => item.id));
  if (!unlockedIds.has(achievementId)) {
    user.conquistas = [...(user.conquistas || []), { id: achievementId }];
  }
}

function refreshUserAchievements(user) {
  const completedCount = mockState.tasks.filter(
    (task) => Number(task.usuarioId) === Number(user.id) && task.estado === 'concluida'
  ).length;

  if (completedCount >= 1) {
    unlockAchievement(user, 1);
  }

  if (completedCount >= 3) {
    unlockAchievement(user, 2);
  }

  if (Number(user.xpTotal || 0) >= 500) {
    unlockAchievement(user, 3);
  }
}

function listWarningsByUserId(userId) {
  return mockState.warnings.filter((warning) => Number(warning.usuarioId) === Number(userId));
}

function syncUserWarnings(user) {
  user.advertencias = listWarningsByUserId(user.id).map((warning) => ({
    id: warning.id,
    motivo: warning.motivo,
    detalhamento: warning.detalhamento,
    criadoEm: warning.criadoEm,
  }));
}

function cloneMockUser(user) {
  refreshUserAchievements(user);
  syncUserWarnings(user);
  return clone(user);
}

function buildMockAchievementList(userId) {
  const user = findUserById(userId);
  const unlockedIds = new Set((user.conquistas || []).map((item) => item.id));

  return mockState.achievements.map((achievement) => ({
    ...achievement,
    unlocked: unlockedIds.has(achievement.id),
  }));
}

async function withFallback(remoteAction, mockAction) {
  try {
    return await remoteAction();
  } catch (error) {
    if (error.response || !isConnectivityError(error)) {
      throw error;
    }
    return mockAction();
  }
}

async function getUserProfile(userId) {
  return withFallback(
    () => tryRequests(buildCandidates((client) => client.get('/usuarios/geral/meu-perfil', withUserHeader(userId)))),
    () => cloneMockUser(findUserById(userId))
  );
}

async function getUserTasksByState(userId, state) {
  const stateCandidates = state === 'concluida'
    ? ['concluida', 'concluido', 'concluidas']
    : [state];

  return withFallback(
    () =>
      tryRequests(
        apiClients.flatMap((client) =>
          stateCandidates.map((currentState) => () =>
            client.get(`/tarefas/usuario/${userId}?estado=${currentState}`, withUserHeader(userId))
          )
        )
      ),
    () => {
      const normalizedState = state === 'concluida' ? 'concluida' : 'pendente';
      return clone(
        mockState.tasks.filter(
          (task) => Number(task.usuarioId) === Number(userId) && task.estado === normalizedState
        )
      );
    }
  );
}

async function getAchievements(userId) {
  return withFallback(
    () => tryRequests(buildCandidates((client) => client.get('/conquistas', withUserHeader(userId)))),
    () => clone(buildMockAchievementList(userId))
  );
}

async function loginUser(credentials) {
  return withFallback(
    () => tryRequests(buildCandidates((client) => client.post('/usuarios/login', credentials))),
    () => {
      const user = mockState.users.find(
        (item) => item.email.toLowerCase() === String(credentials.email || '').toLowerCase()
          && item.senha === credentials.senha
          && item.statusConta === 'ATIVO'
      );

      if (!user) {
        const error = new Error('Credenciais invalidas no modo demo.');
        error.response = { status: 401, data: { message: 'Login invalido.' } };
        throw error;
      }
      return cloneMockUser(user);
    }
  );
}

async function registerUser(payload) {
  const candidatePayloads = [
    payload,
    { ...payload, confirmarSenha: payload.senha },
    { ...payload, perfil: 'USER' },
    { ...payload, xpTotal: 0 },
    { ...payload, confirmarSenha: payload.senha, perfil: 'USER', xpTotal: 0 },
  ];

  const candidatePaths = [
    '/usuarios/registrar',
    '/usuarios/cadastro',
    '/usuarios/cadastrar',
    '/usuarios/register',
  ];

  return withFallback(
    () =>
      tryRequests(
        apiClients.flatMap((client) =>
          candidatePaths.flatMap((currentPath) =>
            candidatePayloads.map((currentPayload) => () => client.post(currentPath, currentPayload))
          )
        )
      ),
    () => {
      const email = String(payload.email || '').trim().toLowerCase();
      if (mockState.users.some((item) => item.email.toLowerCase() === email)) {
        const error = new Error('Email ja cadastrado no modo demo.');
        error.response = { status: 409, data: { message: 'Email ja cadastrado.' } };
        throw error;
      }

      const user = {
        id: mockState.nextUserId++,
        nome: payload.nome,
        email,
        senha: payload.senha,
        xpTotal: 0,
        perfil: 'USER',
        conquistas: [],
      };

      mockState.users.push(user);
      return cloneMockUser(user);
    }
  );
}

async function createTask(userId, payload) {
  return withFallback(
    () =>
      tryRequests([
        ...buildCandidates((client) => client.post('/tarefas', payload, withUserHeader(userId))),
        ...buildCandidates((client) => client.post('/tarefas/criar', payload, withUserHeader(userId))),
      ]),
    () => {
      const task = {
        id: mockState.nextTaskId++,
        usuarioId: Number(userId),
        titulo: payload.titulo,
        dataPrazo: payload.dataPrazo,
        horaPrazo: payload.horaPrazo,
        categoria: payload.categoria || 'outros',
        recompensaXp: Number(payload.recompensaXp || 90),
        estado: 'pendente',
      };

      mockState.tasks.unshift(task);
      return clone(task);
    }
  );
}

async function completeTask(userId, taskId) {
  return withFallback(
    () =>
      tryRequests([
        ...buildCandidates((client) => client.post(`/tarefas/${taskId}/completar`, {}, withUserHeader(userId))),
        ...buildCandidates((client) => client.put(`/tarefas/${taskId}/completar`, {}, withUserHeader(userId))),
        ...buildCandidates((client) => client.put(`/tarefas/concluir/${taskId}`, {}, withUserHeader(userId))),
        ...buildCandidates((client) => client.post(`/tarefas/concluir/${taskId}`, {}, withUserHeader(userId))),
      ]),
    () => {
      const task = mockState.tasks.find(
        (item) => Number(item.id) === Number(taskId) && Number(item.usuarioId) === Number(userId)
      );

      if (!task) {
        const error = new Error('Tarefa nao encontrada no modo demo.');
        error.response = { status: 404, data: { message: 'Tarefa nao encontrada.' } };
        throw error;
      }

      task.estado = 'concluida';
      const user = findUserById(userId);
      user.xpTotal = Number(user.xpTotal || 0) + Number(task.recompensaXp || 0);
      refreshUserAchievements(user);

      return clone({ success: true, xpTotal: user.xpTotal });
    }
  );
}

async function listUsersForAdmin(adminId) {
  return withFallback(
    () => tryRequests(buildCandidates((client) => client.get('/usuarios/admin/lista-users', withAdminHeader(adminId)))),
    () => mockState.users.map((user) => cloneMockUser(user))
  );
}

async function promoteUserToAdmin(adminId, userId) {
  return withFallback(
    () =>
      tryRequests([
        ...buildCandidates((client) =>
          client.put(`/usuarios/admin/promover/${userId}`, { perfil: 'ADMIN' }, withAdminHeader(adminId))
        ),
        ...buildCandidates((client) =>
          client.put(`/usuarios/admin/adicionar-adm/${userId}`, { perfil: 'ADMIN' }, withAdminHeader(adminId))
        ),
      ]),
    () => {
      const admin = findUserById(adminId);
      if (admin.perfil !== 'ADMIN') {
        const error = new Error('Acesso negado no modo demo.');
        error.response = { status: 403, data: { message: 'Acesso negado.' } };
        throw error;
      }

      const user = findUserById(userId);
      user.perfil = 'ADMIN';
      return clone(user);
    }
  );
}

async function updateUserAsAdmin(adminId, userId, payload) {
  return withFallback(
    () =>
      tryRequests(
        [
          ...buildCandidates((client) =>
            client.put(`/usuarios/admin/${userId}`, payload, withAdminHeader(adminId))
          ),
          ...buildCandidates((client) =>
            client.put(`/usuarios/admin/atualiza/${userId}`, payload, withAdminHeader(adminId))
          ),
        ]
      ),
    () => {
      const admin = findUserById(adminId);
      if (admin.perfil !== 'ADMIN') {
        const error = new Error('Acesso negado no modo demo.');
        error.response = { status: 403, data: { message: 'Acesso negado.' } };
        throw error;
      }

      const user = findUserById(userId);
      user.nome = payload.nome || user.nome;
      user.email = payload.email || user.email;
      if (payload.perfil) {
        user.perfil = payload.perfil;
      }
      if (payload.statusConta) {
        user.statusConta = payload.statusConta;
      }
      if (payload.senha) {
        user.senha = payload.senha;
      }

      return cloneMockUser(user);
    }
  );
}

async function deleteUserAsAdmin(adminId, userId) {
  return withFallback(
    () =>
      tryRequests([
        ...buildCandidates((client) =>
          client.delete(`/usuarios/admin/${userId}`, withAdminHeader(adminId))
        ),
        ...buildCandidates((client) =>
          client.delete(`/usuarios/admin/deleta/${userId}`, withAdminHeader(adminId))
        ),
      ]),
    () => {
      const admin = findUserById(adminId);
      if (admin.perfil !== 'ADMIN') {
        const error = new Error('Acesso negado no modo demo.');
        error.response = { status: 403, data: { message: 'Acesso negado.' } };
        throw error;
      }

      mockState.users = mockState.users.filter((item) => Number(item.id) !== Number(userId));
      mockState.tasks = mockState.tasks.filter((item) => Number(item.usuarioId) !== Number(userId));
      mockState.warnings = mockState.warnings.filter((item) => Number(item.usuarioId) !== Number(userId));
      return { success: true };
    }
  );
}

async function warnUserAsAdmin(adminId, userId, payload) {
  return withFallback(
    () =>
      tryRequests(
        buildCandidates((client) =>
          client.post(`/advertencias/usuario/${userId}`, payload, withAdminHeader(adminId))
        )
      ),
    () => {
      const admin = findUserById(adminId);
      if (admin.perfil !== 'ADMIN') {
        const error = new Error('Acesso negado no modo demo.');
        error.response = { status: 403, data: { message: 'Acesso negado.' } };
        throw error;
      }

      const user = findUserById(userId);
      const warning = {
        id: mockState.nextWarningId++,
        usuarioId: Number(userId),
        motivo: payload.motivo,
        detalhamento: payload.detalhamento || '',
        criadoEm: new Date().toISOString(),
      };

      mockState.warnings.push(warning);

      if (listWarningsByUserId(userId).length >= 3) {
        user.statusConta = 'BLOQUEADO';
      }

      syncUserWarnings(user);

      return clone({
        id: warning.id,
        motivo: warning.motivo,
        detalhamento: warning.detalhamento,
        criadoEm: warning.criadoEm,
      });
    }
  );
}

async function blockUserAsAdmin(adminId, userId) {
  return withFallback(
    () =>
      tryRequests(
        buildCandidates((client) =>
          client.put(`/usuarios/${userId}/bloquear`, {}, withAdminHeader(adminId))
        )
      ),
    () => {
      const admin = findUserById(adminId);
      if (admin.perfil !== 'ADMIN') {
        const error = new Error('Acesso negado no modo demo.');
        error.response = { status: 403, data: { message: 'Acesso negado.' } };
        throw error;
      }

      const user = findUserById(userId);
      user.statusConta = 'BLOQUEADO';
      return cloneMockUser(user);
    }
  );
}

async function banUserAsAdmin(adminId, userId) {
  return withFallback(
    () =>
      tryRequests(
        buildCandidates((client) =>
          client.put(`/usuarios/${userId}/banir`, {}, withAdminHeader(adminId))
        )
      ),
    () => {
      const admin = findUserById(adminId);
      if (admin.perfil !== 'ADMIN') {
        const error = new Error('Acesso negado no modo demo.');
        error.response = { status: 403, data: { message: 'Acesso negado.' } };
        throw error;
      }

      const user = findUserById(userId);
      user.statusConta = 'BANIDO';
      return cloneMockUser(user);
    }
  );
}

module.exports = {
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
};
