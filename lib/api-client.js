const axios = require('axios');
const {
  hashPassword,
  isPasswordHash,
  isStrongPassword,
  isValidEmail,
  verifyPassword,
} = require('./security');

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

function getIsoDate(daysOffset = 0) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().slice(0, 10);
}

function getIsoDateTime(daysOffset = 0, hour = 9, minute = 0) {
  const date = new Date();
  date.setSeconds(0, 0);
  date.setHours(hour, minute, 0, 0);
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString();
}

const mockState = {
  nextUserId: 3,
  nextTaskId: 7,
  nextWarningId: 3,
  achievements: [
    {
      id: 1,
      nome: 'Primeira Quest',
      descricao: 'Conclua sua primeira missao.',
      icone: 'fas fa-star',
      recompensa: 'Pacote de iniciante com moldura de perfil.',
    },
    {
      id: 2,
      nome: 'Ritmo de Jogo',
      descricao: 'Conclua 3 missoes em dias proximos.',
      icone: 'fas fa-fire',
      recompensa: 'Tema especial para o seu inventario.',
    },
    {
      id: 3,
      nome: 'Heroi da Rotina',
      descricao: 'Alcance 500 XP totais.',
      icone: 'fas fa-crown',
      recompensa: 'Titulo premium para o ranking.',
    },
    {
      id: 4,
      nome: 'Guardiao do Prazo',
      descricao: 'Conclua uma missao antes do prazo final.',
      icone: 'fas fa-hourglass-half',
      recompensa: 'Boost visual de organizacao por tempo.',
    },
  ],
  users: [
    {
      id: 1,
      nome: 'Admin Flow',
      email: 'admin@flowquests.local',
      senha: hashPassword('123456'),
      xpTotal: 640,
      perfil: 'ADMIN',
      statusConta: 'ATIVO',
      criadoEm: getIsoDateTime(-21, 9, 0),
      conquistas: [{ id: 1 }, { id: 2 }, { id: 3 }],
    },
    {
      id: 2,
      nome: 'Jogador Demo',
      email: 'demo@flowquests.local',
      senha: hashPassword('123456'),
      xpTotal: 180,
      perfil: 'USER',
      statusConta: 'ATIVO',
      criadoEm: getIsoDateTime(-20, 10, 30),
      conquistas: [{ id: 1 }],
    },
  ],
  tasks: [
    {
      id: 1,
      usuarioId: 2,
      titulo: 'Ajustar layout mobile',
      dataPrazo: getIsoDate(1),
      horaPrazo: '09:00:00',
      categoria: 'trabalhos',
      recompensaXp: 120,
      estado: 'pendente',
      criadoEm: getIsoDateTime(-2, 8, 40),
    },
    {
      id: 2,
      usuarioId: 2,
      titulo: 'Revisar backlog das quests',
      dataPrazo: getIsoDate(0),
      horaPrazo: '14:30:00',
      categoria: 'atividades',
      recompensaXp: 80,
      estado: 'pendente',
      criadoEm: getIsoDateTime(-1, 11, 0),
    },
    {
      id: 3,
      usuarioId: 2,
      titulo: 'Validar tela de cadastro',
      dataPrazo: getIsoDate(-3),
      horaPrazo: '11:00:00',
      categoria: 'trabalhos',
      recompensaXp: 60,
      estado: 'concluida',
      criadoEm: getIsoDateTime(-5, 10, 0),
      concluidaEm: getIsoDateTime(-3, 11, 15),
    },
    {
      id: 4,
      usuarioId: 2,
      titulo: 'Documentar fluxo de resgate',
      dataPrazo: getIsoDate(-2),
      horaPrazo: '16:00:00',
      categoria: 'eventos',
      recompensaXp: 70,
      estado: 'concluida',
      criadoEm: getIsoDateTime(-4, 14, 20),
      concluidaEm: getIsoDateTime(-2, 15, 45),
    },
    {
      id: 5,
      usuarioId: 1,
      titulo: 'Organizar moderacao semanal',
      dataPrazo: getIsoDate(-1),
      horaPrazo: '12:00:00',
      categoria: 'trabalhos',
      recompensaXp: 90,
      estado: 'concluida',
      criadoEm: getIsoDateTime(-3, 9, 5),
      concluidaEm: getIsoDateTime(-1, 12, 5),
    },
    {
      id: 6,
      usuarioId: 1,
      titulo: 'Planejar recompensas do ranking',
      dataPrazo: getIsoDate(2),
      horaPrazo: '18:00:00',
      categoria: 'eventos',
      recompensaXp: 110,
      estado: 'pendente',
      criadoEm: getIsoDateTime(-1, 17, 0),
    },
  ],
  warnings: [
    {
      id: 1,
      usuarioId: 2,
      motivo: 'Spam de tarefas duplicadas',
      detalhamento: 'Foram identificadas varias quests repetidas em sequencia.',
      criadoEm: getIsoDateTime(-12, 15, 10),
    },
    {
      id: 2,
      usuarioId: 2,
      motivo: 'Uso inadequado de titulo',
      detalhamento: 'Padronize melhor o titulo das missoes para manter o painel legivel.',
      criadoEm: getIsoDateTime(-10, 11, 25),
    },
  ],
  rewardClaims: [
    {
      userId: 1,
      achievementId: 1,
      status: 'resgatada',
      requestedAt: getIsoDateTime(-14, 10, 15),
      redeemedAt: getIsoDateTime(-13, 9, 30),
    },
    {
      userId: 1,
      achievementId: 3,
      status: 'pendente',
      requestedAt: getIsoDateTime(-1, 19, 0),
      redeemedAt: null,
    },
  ],
};

function findUserById(userId) {
  const user = mockState.users.find((item) => Number(item.id) === Number(userId));
  if (!user) {
    throw new Error('Usuario nao encontrado no modo demo.');
  }
  return user;
}

function listWarningsByUserId(userId) {
  return mockState.warnings.filter((warning) => Number(warning.usuarioId) === Number(userId));
}

function listRewardClaimsByUserId(userId) {
  return mockState.rewardClaims.filter((claim) => Number(claim.userId) === Number(userId));
}

function getRewardClaim(userId, achievementId) {
  return mockState.rewardClaims.find(
    (claim) =>
      Number(claim.userId) === Number(userId) &&
      Number(claim.achievementId) === Number(achievementId)
  );
}

function unlockAchievement(user, achievementId) {
  const unlockedIds = new Set((user.conquistas || []).map((item) => item.id));
  if (!unlockedIds.has(achievementId)) {
    user.conquistas = [...(user.conquistas || []), { id: achievementId }];
  }
}

function refreshUserAchievements(user) {
  const completedTasks = mockState.tasks.filter(
    (task) => Number(task.usuarioId) === Number(user.id) && task.estado === 'concluida'
  );

  if (completedTasks.length >= 1) {
    unlockAchievement(user, 1);
  }

  if (completedTasks.length >= 3) {
    unlockAchievement(user, 2);
  }

  if (Number(user.xpTotal || 0) >= 500) {
    unlockAchievement(user, 3);
  }

  if (
    completedTasks.some((task) => {
      const due = new Date(`${task.dataPrazo}T${task.horaPrazo || '23:59:00'}`);
      const completedAt = new Date(task.concluidaEm || task.criadoEm || due);
      return completedAt <= due;
    })
  ) {
    unlockAchievement(user, 4);
  }
}

function syncUserWarnings(user) {
  user.advertencias = listWarningsByUserId(user.id).map((warning) => ({
    id: warning.id,
    motivo: warning.motivo,
    detalhamento: warning.detalhamento,
    criadoEm: warning.criadoEm,
  }));
}

function buildRewardInventoryForUser(user) {
  refreshUserAchievements(user);
  const unlockedIds = new Set((user.conquistas || []).map((item) => item.id));

  return mockState.achievements.map((achievement) => {
    const claim = getRewardClaim(user.id, achievement.id);
    let status = 'locked';

    if (claim?.status === 'resgatada') {
      status = 'resgatada';
    } else if (claim?.status === 'pendente') {
      status = 'pendente';
    } else if (unlockedIds.has(achievement.id)) {
      status = 'disponivel';
    }

    return {
      ...achievement,
      unlocked: unlockedIds.has(achievement.id),
      rewardStatus: status,
      requestedAt: claim?.requestedAt || null,
      redeemedAt: claim?.redeemedAt || null,
    };
  });
}

function cloneMockUser(user) {
  refreshUserAchievements(user);
  syncUserWarnings(user);
  user.inventario = buildRewardInventoryForUser(user);
  return clone(user);
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

async function withSoftFallback(remoteAction, mockAction) {
  try {
    return await remoteAction();
  } catch (error) {
    const status = error.response?.status;

    if (status && ![403, 404, 405, 501].includes(status)) {
      throw error;
    }

    if (!status && !isConnectivityError(error)) {
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
    () => clone(buildRewardInventoryForUser(findUserById(userId)))
  );
}

async function listUsersRanking(userId) {
  return withSoftFallback(
    () =>
      tryRequests([
        ...buildCandidates((client) => client.get('/usuarios/ranking', withUserHeader(userId))),
        ...buildCandidates((client) => client.get('/usuarios/rankings', withUserHeader(userId))),
        ...buildCandidates((client) => client.get('/ranking', withUserHeader(userId))),
      ]),
    () =>
      mockState.users
        .map((user) => cloneMockUser(user))
        .sort((left, right) => {
          if (Number(right.xpTotal || 0) !== Number(left.xpTotal || 0)) {
            return Number(right.xpTotal || 0) - Number(left.xpTotal || 0);
          }

          return String(left.nome || '').localeCompare(String(right.nome || ''));
        })
  );
}

async function loginUser(credentials) {
  return withFallback(
    () => tryRequests(buildCandidates((client) => client.post('/usuarios/login', credentials))),
    () => {
      const normalizedEmail = String(credentials.email || '').trim().toLowerCase();
      const userByEmail = mockState.users.find(
        (item) => item.email.toLowerCase() === normalizedEmail
      );

      const passwordMatches = userByEmail
        ? verifyPassword(credentials.senha, userByEmail.senha)
        : false;

      if (userByEmail && passwordMatches && !isPasswordHash(userByEmail.senha)) {
        userByEmail.senha = hashPassword(credentials.senha);
      }

      if (userByEmail && passwordMatches && userByEmail.statusConta !== 'ATIVO') {
        const error = new Error('Conta indisponivel no modo demo.');
        error.response = {
          status: 403,
          data: {
            message: userByEmail.statusConta === 'BANIDO' ? 'Conta banida.' : 'Conta bloqueada.',
            statusConta: userByEmail.statusConta,
          },
        };
        throw error;
      }

      const user = mockState.users.find(
        (item) => item.email.toLowerCase() === normalizedEmail && verifyPassword(credentials.senha, item.senha)
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
      const nome = String(payload.nome || '').trim();
      const senha = String(payload.senha || '');

      if (!nome || !email || !senha) {
        const error = new Error('Campos obrigatorios ausentes no modo demo.');
        error.response = { status: 400, data: { message: 'Campos obrigatorios.' } };
        throw error;
      }

      if (!isValidEmail(email)) {
        const error = new Error('Email invalido no modo demo.');
        error.response = { status: 400, data: { message: 'Email invalido.' } };
        throw error;
      }

      if (senha.length < 8) {
        const error = new Error('Senha curta no modo demo.');
        error.response = { status: 400, data: { message: 'Senha deve ter ao menos 8 caracteres.' } };
        throw error;
      }

      if (!isStrongPassword(senha)) {
        const error = new Error('Senha fraca no modo demo.');
        error.response = { status: 400, data: { message: 'Senha deve ser mais forte.' } };
        throw error;
      }

      if (mockState.users.some((item) => item.email.toLowerCase() === email)) {
        const error = new Error('Email ja cadastrado no modo demo.');
        error.response = { status: 409, data: { message: 'Email ja cadastrado.' } };
        throw error;
      }

      const user = {
        id: mockState.nextUserId++,
        nome,
        email,
        senha: hashPassword(senha),
        xpTotal: 0,
        perfil: 'USER',
        statusConta: 'ATIVO',
        criadoEm: new Date().toISOString(),
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
        categoria: payload.categoria || 'atividades',
        recompensaXp: Number(payload.recompensaXp || 90),
        estado: 'pendente',
        criadoEm: new Date().toISOString(),
      };

      mockState.tasks.unshift(task);
      return clone(task);
    }
  );
}

async function resetUserPassword(email, newPassword) {
  const candidatePayloads = [
    { email, senha: newPassword },
    { email, novaSenha: newPassword },
    { email, senha: newPassword, confirmarSenha: newPassword },
  ];

  const candidatePaths = [
    '/usuarios/redefinir-senha',
    '/usuarios/resetar-senha',
    '/usuarios/reset-password',
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
      const normalizedEmail = String(email || '').trim().toLowerCase();

      if (!isValidEmail(normalizedEmail)) {
        const error = new Error('Email invalido no modo demo.');
        error.response = { status: 400, data: { message: 'Email invalido.' } };
        throw error;
      }

      if (String(newPassword || '').length < 8) {
        const error = new Error('Senha curta no modo demo.');
        error.response = { status: 400, data: { message: 'Senha deve ter ao menos 8 caracteres.' } };
        throw error;
      }

      if (!isStrongPassword(newPassword)) {
        const error = new Error('Senha fraca no modo demo.');
        error.response = { status: 400, data: { message: 'Senha deve ser mais forte.' } };
        throw error;
      }

      const user = mockState.users.find((item) => item.email.toLowerCase() === normalizedEmail);
      if (!user) {
        const error = new Error('Usuario nao encontrado no modo demo.');
        error.response = { status: 404, data: { message: 'Usuario nao encontrado.' } };
        throw error;
      }

      user.senha = hashPassword(newPassword);
      return cloneMockUser(user);
    }
  );
}

async function updateOwnProfile(userId, payload) {
  const sanitizedPayload = {
    nome: String(payload.nome || '').trim(),
    email: String(payload.email || '').trim().toLowerCase(),
    senhaAtual: String(payload.senhaAtual || ''),
    novaSenha: String(payload.novaSenha || ''),
  };

  return withSoftFallback(
    () =>
      tryRequests([
        ...buildCandidates((client) => client.put(`/usuarios/${userId}`, sanitizedPayload, withUserHeader(userId))),
        ...buildCandidates((client) => client.put('/usuarios/meu-perfil', sanitizedPayload, withUserHeader(userId))),
        ...buildCandidates((client) => client.patch(`/usuarios/${userId}`, sanitizedPayload, withUserHeader(userId))),
      ]),
    () => {
      const user = findUserById(userId);
      const emailChanged = sanitizedPayload.email && sanitizedPayload.email !== user.email.toLowerCase();
      const passwordChanged = Boolean(sanitizedPayload.novaSenha);

      if (!sanitizedPayload.nome || !sanitizedPayload.email) {
        const error = new Error('Campos obrigatorios ausentes no modo demo.');
        error.response = { status: 400, data: { message: 'Campos obrigatorios.' } };
        throw error;
      }

      if (!isValidEmail(sanitizedPayload.email)) {
        const error = new Error('Email invalido no modo demo.');
        error.response = { status: 400, data: { message: 'Email invalido.' } };
        throw error;
      }

      if ((emailChanged || passwordChanged) && !sanitizedPayload.senhaAtual) {
        const error = new Error('Senha atual obrigatoria no modo demo.');
        error.response = { status: 400, data: { message: 'Senha atual obrigatoria.' } };
        throw error;
      }

      if (
        (emailChanged || passwordChanged) &&
        !verifyPassword(sanitizedPayload.senhaAtual, user.senha)
      ) {
        const error = new Error('Senha atual invalida no modo demo.');
        error.response = { status: 401, data: { message: 'Senha atual invalida.' } };
        throw error;
      }

      if (
        emailChanged &&
        mockState.users.some(
          (item) =>
            Number(item.id) !== Number(userId) &&
            item.email.toLowerCase() === sanitizedPayload.email
        )
      ) {
        const error = new Error('Email ja cadastrado no modo demo.');
        error.response = { status: 409, data: { message: 'Email ja cadastrado.' } };
        throw error;
      }

      if (passwordChanged && sanitizedPayload.novaSenha.length < 8) {
        const error = new Error('Senha curta no modo demo.');
        error.response = { status: 400, data: { message: 'Senha deve ter ao menos 8 caracteres.' } };
        throw error;
      }

      if (passwordChanged && !isStrongPassword(sanitizedPayload.novaSenha)) {
        const error = new Error('Senha fraca no modo demo.');
        error.response = { status: 400, data: { message: 'Senha deve ser mais forte.' } };
        throw error;
      }

      user.nome = sanitizedPayload.nome;
      user.email = sanitizedPayload.email;

      if (passwordChanged) {
        user.senha = hashPassword(sanitizedPayload.novaSenha);
      }

      return cloneMockUser(user);
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

      if (task.estado === 'concluida') {
        return clone({ success: true, xpTotal: findUserById(userId).xpTotal });
      }

      task.estado = 'concluida';
      task.concluidaEm = new Date().toISOString();
      const user = findUserById(userId);
      user.xpTotal = Number(user.xpTotal || 0) + Number(task.recompensaXp || 0);
      refreshUserAchievements(user);

      return clone({ success: true, xpTotal: user.xpTotal });
    }
  );
}

async function requestRewardRedemption(userId, achievementId) {
  return withSoftFallback(
    () =>
      tryRequests([
        ...buildCandidates((client) =>
          client.post(`/conquistas/${achievementId}/resgatar`, {}, withUserHeader(userId))
        ),
        ...buildCandidates((client) =>
          client.post(`/recompensas/${achievementId}/solicitar`, {}, withUserHeader(userId))
        ),
      ]),
    () => {
      const user = findUserById(userId);
      refreshUserAchievements(user);
      const unlockedIds = new Set((user.conquistas || []).map((item) => item.id));

      if (!unlockedIds.has(Number(achievementId))) {
        const error = new Error('Conquista bloqueada no modo demo.');
        error.response = { status: 403, data: { message: 'Conquista ainda nao liberada.' } };
        throw error;
      }

      const existingClaim = getRewardClaim(userId, achievementId);
      if (existingClaim?.status === 'pendente') {
        return clone(existingClaim);
      }

      if (existingClaim?.status === 'resgatada') {
        const error = new Error('Recompensa ja resgatada no modo demo.');
        error.response = { status: 409, data: { message: 'Recompensa ja resgatada.' } };
        throw error;
      }

      const claim = {
        userId: Number(userId),
        achievementId: Number(achievementId),
        status: 'pendente',
        requestedAt: new Date().toISOString(),
        redeemedAt: null,
      };

      mockState.rewardClaims.push(claim);
      return clone(claim);
    }
  );
}

async function confirmRewardRedemption(userId, achievementId) {
  return withSoftFallback(
    () =>
      tryRequests([
        ...buildCandidates((client) =>
          client.post(`/conquistas/${achievementId}/confirmar-resgate`, {}, withUserHeader(userId))
        ),
        ...buildCandidates((client) =>
          client.post(`/recompensas/${achievementId}/confirmar`, {}, withUserHeader(userId))
        ),
      ]),
    () => {
      const claim = getRewardClaim(userId, achievementId);

      if (!claim || claim.status !== 'pendente') {
        const error = new Error('Resgate pendente nao encontrado no modo demo.');
        error.response = { status: 404, data: { message: 'Resgate pendente nao encontrado.' } };
        throw error;
      }

      claim.status = 'resgatada';
      claim.redeemedAt = new Date().toISOString();
      return clone(claim);
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
      return cloneMockUser(user);
    }
  );
}

async function updateUserAsAdmin(adminId, userId, payload) {
  return withFallback(
    () =>
      tryRequests([
        ...buildCandidates((client) =>
          client.put(`/usuarios/admin/${userId}`, payload, withAdminHeader(adminId))
        ),
        ...buildCandidates((client) =>
          client.put(`/usuarios/admin/atualiza/${userId}`, payload, withAdminHeader(adminId))
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
      user.nome = payload.nome || user.nome;
      user.email = payload.email || user.email;
      if (payload.perfil) {
        user.perfil = payload.perfil;
      }
      if (payload.statusConta) {
        user.statusConta = payload.statusConta;
      }
      if (payload.senha) {
        user.senha = hashPassword(payload.senha);
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
      mockState.rewardClaims = mockState.rewardClaims.filter((item) => Number(item.userId) !== Number(userId));
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
};
