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
  const diffMs = prazo.getTime() - now.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));

  if (prazo < now) {
    return { text: 'Atrasada', className: 'is-danger', tone: 'danger' };
  }

  if (diffHours <= 24) {
    return { text: 'Hoje', className: 'is-warning', tone: 'warning' };
  }

  if (diffHours <= 72) {
    return { text: 'Proxima', className: 'is-info', tone: 'info' };
  }

  return { text: 'Pendente', className: 'is-success', tone: 'success' };
}

function formatDate(dateString) {
  if (!dateString) {
    return '-';
  }

  return new Date(`${dateString}T00:00:00`).toLocaleDateString('pt-BR', {
    timeZone: 'UTC',
  });
}

function formatDateTime(dateString) {
  if (!dateString) {
    return '-';
  }

  return new Date(dateString).toLocaleString('pt-BR');
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

function getCategoryTone(category) {
  const tones = {
    remedios: 'tone-remedios',
    atividades: 'tone-atividades',
    trabalhos: 'tone-trabalhos',
    eventos: 'tone-eventos',
    trabalho: 'tone-trabalhos',
    estudo: 'tone-atividades',
    pessoal: 'tone-eventos',
    saude: 'tone-remedios',
    lazer: 'tone-eventos',
    outros: 'tone-outros',
  };

  return tones[category] || 'tone-outros';
}

function toDayKey(dateLike) {
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setHours(0, 0, 0, 0);
  return date.toISOString().slice(0, 10);
}

function calculateStreak(completedTasks) {
  const completionDays = new Set(
    completedTasks
      .map((task) => toDayKey(task.completedAt || `${task.dataPrazo}T${task.horaPrazo || '23:59:00'}`))
      .filter(Boolean)
  );

  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  while (completionDays.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
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
    streak: calculateStreak(completedTasks),
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
    categoryTone: getCategoryTone(task.categoria),
    rewardXp: Number(task.recompensaXp || 0),
    status: completed ? null : getTaskStatus(task),
    completedAt: task.concluidaEm || null,
    completedAtLabel: completed ? formatDateTime(task.concluidaEm) : null,
    dueDateKey: task.dataPrazo || null,
  };
}

function buildLeaderboard(users, currentUserId) {
  return normalizeArray(users)
    .map((user) => ({
      id: user.id,
      nome: user.nome,
      xpTotal: Number(user.xpTotal || 0),
      perfil: user.perfil || 'USER',
      level: Math.floor(Number(user.xpTotal || 0) / 500) + 1,
      isCurrentUser: Number(user.id) === Number(currentUserId),
    }))
    .sort((left, right) => {
      if (right.xpTotal !== left.xpTotal) {
        return right.xpTotal - left.xpTotal;
      }

      return left.nome.localeCompare(right.nome);
    })
    .map((user, index) => ({
      ...user,
      position: index + 1,
    }));
}

function buildProductivityHistory(completedTasks, pendingTasks) {
  const lastSevenDays = [];
  const completedByDay = new Map();
  const xpByDay = new Map();
  const byCategory = new Map();

  completedTasks.forEach((task) => {
    const dayKey = toDayKey(task.completedAt || `${task.dueDateKey}T${task.timeLabel || '23:59'}`);
    if (dayKey) {
      completedByDay.set(dayKey, (completedByDay.get(dayKey) || 0) + 1);
      xpByDay.set(dayKey, (xpByDay.get(dayKey) || 0) + Number(task.rewardXp || 0));
    }

    byCategory.set(task.categoryLabel, (byCategory.get(task.categoryLabel) || 0) + 1);
  });

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - offset);
    const key = date.toISOString().slice(0, 10);
    lastSevenDays.push({
      key,
      label: date.toLocaleDateString('pt-BR', { weekday: 'short' }),
      completed: completedByDay.get(key) || 0,
      xp: xpByDay.get(key) || 0,
    });
  }

  const maxCompleted = Math.max(1, ...lastSevenDays.map((item) => item.completed));
  const overdueCount = pendingTasks.filter((task) => task.status?.tone === 'danger').length;
  const upcomingCount = pendingTasks.filter((task) => task.status?.tone === 'warning' || task.status?.tone === 'info').length;

  return {
    lastSevenDays: lastSevenDays.map((item) => ({
      ...item,
      heightPercent: Math.max(12, Math.round((item.completed / maxCompleted) * 100)),
    })),
    totalCompleted: completedTasks.length,
    totalXpEarned: completedTasks.reduce((sum, task) => sum + Number(task.rewardXp || 0), 0),
    overdueCount,
    upcomingCount,
    categoryBreakdown: Array.from(byCategory.entries()).map(([label, total]) => ({
      label,
      total,
    })),
  };
}

function buildNotifications({ usuario, pendingTasks, completedTasks, rewardInventory, gameProfile }) {
  const notifications = [];
  const overdueTasks = pendingTasks.filter((task) => task.status?.tone === 'danger');
  const dueSoonTasks = pendingTasks.filter((task) => task.status?.tone === 'warning' || task.status?.tone === 'info');
  const pendingRewards = rewardInventory.filter((reward) => reward.rewardStatus === 'pendente');
  const availableRewards = rewardInventory.filter((reward) => reward.rewardStatus === 'disponivel');

  if (dueSoonTasks.length) {
    notifications.push({
      icon: 'fas fa-clock',
      title: 'Prazo proximo',
      text: `${dueSoonTasks.length} missao(oes) precisam de atencao nas proximas horas.`,
      tone: 'info',
    });
  }

  if (overdueTasks.length) {
    notifications.push({
      icon: 'fas fa-triangle-exclamation',
      title: 'Missoes atrasadas',
      text: `${overdueTasks.length} atividade(s) ja passaram do prazo e pedem reorganizacao.`,
      tone: 'danger',
    });
  }

  if (availableRewards.length) {
    notifications.push({
      icon: 'fas fa-gift',
      title: 'Recompensas desbloqueadas',
      text: `${availableRewards.length} recompensa(s) ja podem ser solicitadas no inventario.`,
      tone: 'success',
    });
  }

  if (pendingRewards.length) {
    notifications.push({
      icon: 'fas fa-box-open',
      title: 'Resgates pendentes',
      text: `${pendingRewards.length} recompensa(s) aguardam sua confirmacao de recebimento.`,
      tone: 'warning',
    });
  }

  notifications.push({
    icon: 'fas fa-chart-line',
    title: 'Progresso da campanha',
    text: `${usuario.nome} esta no nivel ${gameProfile.level} com ${gameProfile.completionRate}% das quests concluidas.`,
    tone: 'info',
  });

  return notifications;
}

function buildDashboardViewModel({
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
}) {
  const tarefasPendentes = filterTasks(normalizeArray(tarefasPendentesRaw), search).map(
    (task) => mapTask(task, false)
  );
  const tarefasConcluidas = filterTasks(normalizeArray(tarefasConcluidasRaw), search)
    .map((task) => mapTask(task, true))
    .sort((left, right) => new Date(right.completedAt || 0) - new Date(left.completedAt || 0));
  const pendingPageData = paginate(tarefasPendentes, pendingPage);
  const completedPageData = paginate(tarefasConcluidas, completedPage);
  const unlockedIds = new Set((usuario.conquistas || []).map((item) => item.id));
  const rewardInventory = normalizeArray(conquistas).map((achievement) => ({
    ...achievement,
    unlocked: achievement.unlocked ?? unlockedIds.has(achievement.id),
    rewardStatus:
      achievement.rewardStatus ||
      (achievement.unlocked ?? unlockedIds.has(achievement.id) ? 'disponivel' : 'locked'),
  }));
  const gameProfile = buildGameProfile(
    usuario,
    tarefasPendentes,
    tarefasConcluidas,
    rewardInventory
  );
  const productivityHistory = buildProductivityHistory(tarefasConcluidas, tarefasPendentes);
  const leaderboard = buildLeaderboard(rankingUsuarios, usuario.id);
  const notifications = buildNotifications({
    usuario,
    pendingTasks: tarefasPendentes,
    completedTasks: tarefasConcluidas,
    rewardInventory,
    gameProfile,
  });

  return {
    usuario,
    search,
    message: message || '',
    initialTab: initialTab || 'dashboard',
    gameProfile,
    productivityHistory,
    leaderboard,
    notifications,
    pendingPage: pendingPageData,
    completedPage: completedPageData,
    tarefasPendentes: pendingPageData,
    tarefasConcluidas: completedPageData,
    todasAsConquistas: rewardInventory,
  };
}

function buildAdminDashboardViewModel({ admin, usuarios, message }) {
  return {
    admin,
    usuarios: normalizeArray(usuarios),
    message: message || '',
  };
}

module.exports = {
  buildDashboardViewModel,
  buildAdminDashboardViewModel,
};
