function normalizeArray(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.content)) {
    return data.content;
  }

  return [];
}

function normalizeText(text) {
  return (text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function filterTasks(tasks, search) {
  if (!search) {
    return tasks;
  }

  const normalizedSearch = normalizeText(search);

  return tasks.filter((task) =>
    normalizeText(task.titulo).includes(normalizedSearch)
  );
}

function paginate(items, page, pageSize = 6) {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages - 1);
  const start = currentPage * pageSize;
  const content = items.slice(start, start + pageSize);

  return {
    content,
    number: currentPage,
    totalPages,
    first: currentPage === 0,
    last: currentPage >= totalPages - 1,
  };
}

function getTaskStatus(task) {
  const prazo = new Date(`${task.dataPrazo}T${task.horaPrazo || '23:59:00'}`);
  const now = new Date();

  if (prazo < now) {
    return { text: 'Atrasada', className: 'is-danger' };
  }

  return { text: 'Pendente', className: 'is-warning' };
}

function formatDate(dateString) {
  if (!dateString) {
    return '-';
  }

  return new Date(`${dateString}T00:00:00`).toLocaleDateString('pt-BR', {
    timeZone: 'UTC',
  });
}

function formatTime(timeString) {
  return (timeString || '').slice(0, 5) || '-';
}

function getCategoryLabel(category) {
  const labels = {
    remedios: 'Remedios',
    atividades: 'Atividades',
    trabalhos: 'Trabalhos',
    eventos: 'Eventos',
    trabalho: 'Trabalho',
    estudo: 'Estudo',
    pessoal: 'Pessoal',
    saude: 'Saude',
    lazer: 'Lazer',
    outros: 'Outros',
  };

  return labels[category] || 'Outros';
}

function buildGameProfile(usuario, pendingTasks, completedTasks, achievements) {
  const xpTotal = Number(usuario.xpTotal || 0);
  const levelSize = 500;
  const level = Math.floor(xpTotal / levelSize) + 1;
  const xpInLevel = xpTotal % levelSize;
  const xpToNextLevel = levelSize - xpInLevel;
  const unlockedCount = achievements.filter((achievement) => achievement.unlocked).length;
  const completionRate = Math.min(
    100,
    Math.round((completedTasks.length / Math.max(1, completedTasks.length + pendingTasks.length)) * 100)
  );
  const playerTitles = [
    'Explorador Iniciante',
    'Aventureiro de Rotina',
    'Guardiao das Metas',
    'Mestre das Quests',
    'Lenda da Produtividade',
  ];

  return {
    level,
    xpTotal,
    xpInLevel,
    xpToNextLevel,
    pendingCount: pendingTasks.length,
    completedCount: completedTasks.length,
    unlockedCount,
    totalAchievements: achievements.length || 1,
    completionRate,
    dailyFocus: pendingTasks[0]?.title || 'Criar uma nova quest',
    playerTitle: playerTitles[Math.min(playerTitles.length - 1, Math.floor((level - 1) / 2))],
  };
}

function mapTask(task, completed = false) {
  return {
    id: task.id,
    title: task.titulo,
    titleUpper: (task.titulo || '').toUpperCase(),
    dateLabel: formatDate(task.dataPrazo),
    timeLabel: formatTime(task.horaPrazo),
    category: task.categoria || 'outros',
    categoryLabel: getCategoryLabel(task.categoria),
    rewardXp: task.recompensaXp || 0,
    status: completed ? null : getTaskStatus(task),
  };
}

function buildDashboardViewModel({
  usuario,
  tarefasPendentesRaw,
  tarefasConcluidasRaw,
  conquistas,
  search,
  pendingPage,
  completedPage,
}) {
  const tarefasPendentes = filterTasks(normalizeArray(tarefasPendentesRaw), search).map(
    (task) => mapTask(task, false)
  );
  const tarefasConcluidas = filterTasks(normalizeArray(tarefasConcluidasRaw), search).map(
    (task) => mapTask(task, true)
  );
  const pendingPageData = paginate(tarefasPendentes, pendingPage);
  const completedPageData = paginate(tarefasConcluidas, completedPage);
  const unlockedIds = new Set((usuario.conquistas || []).map((item) => item.id));
  const achievementCards = normalizeArray(conquistas).map((achievement) => ({
    ...achievement,
    unlocked: unlockedIds.has(achievement.id),
  }));
  const gameProfile = buildGameProfile(
    usuario,
    tarefasPendentes,
    tarefasConcluidas,
    achievementCards
  );

  return {
    usuario,
    search,
    gameProfile,
    pendingPage: pendingPageData,
    completedPage: completedPageData,
    tarefasPendentes: pendingPageData,
    tarefasConcluidas: completedPageData,
    todasAsConquistas: achievementCards,
  };
}

function buildAdminDashboardViewModel({ admin, usuarios }) {
  return {
    admin,
    usuarios: normalizeArray(usuarios),
  };
}

module.exports = {
  buildDashboardViewModel,
  buildAdminDashboardViewModel,
};
