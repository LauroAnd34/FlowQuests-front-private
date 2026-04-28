const axios = require('axios');

const api = axios.create({
  baseURL: process.env.API_URL || 'http://localhost:8080/api',
  timeout: 10000,
});

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

async function tryRequests(candidates) {
  let lastError;

  for (const candidate of candidates) {
    try {
      const response = await candidate();
      return response.data;
    } catch (error) {
      lastError = error;
      const status = error.response?.status;

      if (status && ![404, 405].includes(status)) {
        throw error;
      }
    }
  }

  throw lastError || new Error('Nenhum endpoint disponivel respondeu.');
}

async function getUserProfile(userId) {
  const response = await api.get('/usuarios/geral/meu-perfil', withUserHeader(userId));
  return response.data;
}

async function getUserTasksByState(userId, state) {
  const stateCandidates = state === 'concluida'
    ? ['concluida', 'concluido', 'concluidas']
    : [state];

  return tryRequests(
    stateCandidates.map((currentState) => () =>
      api.get(`/tarefas/usuario/${userId}?estado=${currentState}`, withUserHeader(userId))
    )
  );
}

async function getAchievements(userId) {
  const response = await api.get('/conquistas', withUserHeader(userId));
  return response.data;
}

async function loginUser(credentials) {
  const response = await api.post('/usuarios/login', credentials);
  return response.data;
}

async function registerUser(payload) {
  return tryRequests([
    () => api.post('/usuarios/registrar', payload),
    () => api.post('/usuarios/cadastro', payload),
    () => api.post('/usuarios/cadastrar', payload),
    () => api.post('/usuarios/register', payload),
  ]);
}

async function createTask(userId, payload) {
  return tryRequests([
    () => api.post('/tarefas', payload, withUserHeader(userId)),
    () => api.post('/tarefas/criar', payload, withUserHeader(userId)),
  ]);
}

async function completeTask(userId, taskId) {
  return tryRequests([
    () => api.post(`/tarefas/${taskId}/completar`, {}, withUserHeader(userId)),
    () => api.put(`/tarefas/${taskId}/completar`, {}, withUserHeader(userId)),
    () => api.put(`/tarefas/concluir/${taskId}`, {}, withUserHeader(userId)),
    () => api.post(`/tarefas/concluir/${taskId}`, {}, withUserHeader(userId)),
  ]);
}

async function listUsersForAdmin(adminId) {
  const response = await api.get('/usuarios/admin/lista-users', withAdminHeader(adminId));
  return response.data;
}

async function promoteUserToAdmin(adminId, userId) {
  return tryRequests([
    () =>
      api.put(
        `/usuarios/admin/promover/${userId}`,
        { perfil: 'ADMIN' },
        withAdminHeader(adminId)
      ),
    () =>
      api.put(
        `/usuarios/admin/adicionar-adm/${userId}`,
        { perfil: 'ADMIN' },
        withAdminHeader(adminId)
      ),
  ]);
}

async function updateUserAsAdmin(adminId, userId, payload) {
  const response = await api.put(
    `/usuarios/admin/atualiza/${userId}`,
    payload,
    withAdminHeader(adminId)
  );
  return response.data;
}

async function deleteUserAsAdmin(adminId, userId) {
  const response = await api.delete(
    `/usuarios/admin/deleta/${userId}`,
    withAdminHeader(adminId)
  );
  return response.data;
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
};
