document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const sidebar = document.getElementById('sidebar');
  const dashboardContainer =
    document.getElementById('dashboard-container') ||
    document.querySelector('.dashboard-shell');
  const sidebarToggleButton = document.getElementById('sidebar-toggle-button');
  const profileButton = document.getElementById('profile-button');
  const profileMenu = document.getElementById('profile-menu');
  const notificationButton = document.getElementById('notification-button');
  const notificationMenu = document.getElementById('notification-menu');
  const notificationBadge = document.getElementById('notification-badge');
  const addTaskButton = document.getElementById('add-task-button');
  const addTaskModal = document.getElementById('add-task-modal');
  const confirmTaskModal = document.getElementById('confirm-task-modal');
  const taskForm = document.getElementById('task-form');
  const taskDateInput = document.getElementById('task-date');
  const tasksContainer = document.getElementById('tasks-container');
  const cancelCompletionButton = document.getElementById('cancel-completion-button');
  const confirmCompletionButton = document.getElementById('confirm-completion-button');
  const confirmLogoutModal = document.getElementById('confirm-logout-modal');
  const cancelLogoutButton = document.getElementById('cancel-logout-button');
  const openAccessibilityFromSettings = document.getElementById('open-accessibility-from-settings');
  const openLogoutFromSettings = document.getElementById('open-logout-from-settings');
  const toast = document.getElementById('dashboard-toast');
  const toastCard = document.getElementById('dashboard-toast-card');
  const toastIcon = document.getElementById('dashboard-toast-icon');
  const toastTitle = document.getElementById('dashboard-toast-title');
  const toastText = document.getElementById('dashboard-toast-text');
  const progressBar = document.getElementById('xp-progress-bar');
  const tabContents = document.querySelectorAll('.tab-content');
  const sidebarNavLinks = document.querySelectorAll('.sidebar-nav-link');
  const shortcutLinks = document.querySelectorAll('[data-dashboard-shortcut]');
  const shortcutButtons = document.querySelectorAll('[data-dashboard-shortcut-button]');
  const greetingHeading = document.getElementById('greeting-heading');
  const createTaskFromSettings = document.getElementById('create-task-from-settings');
  const openRewardsFromSettings = document.getElementById('open-rewards-from-settings');
  const openTasksFromSettings = document.getElementById('open-tasks-from-settings');
  const logoutForm = document.getElementById('logout-form');
  const confirmLogoutSubmitButton = document.getElementById('confirm-logout-submit-button');
  const rewardButtons = document.querySelectorAll('[data-reward-action]');
  const csrfToken = body.dataset.csrfToken || '';
  const initialTab = body.dataset.initialTab || 'dashboard';
  const pageMessage = body.dataset.message || '';

  let taskIdToComplete = null;
  let currentUserXP = Number(body.dataset.userXp || 0);

  const messageMap = {
    account_updated: ['is-success', 'Conta atualizada', 'Seus dados foram salvos com sucesso.'],
    account_missing_fields: ['is-warning', 'Campos pendentes', 'Nome e email sao obrigatorios para salvar sua conta.'],
    account_invalid_email: ['is-error', 'Email invalido', 'Digite um email valido para atualizar sua conta.'],
    account_current_password_required: ['is-warning', 'Confirme sua identidade', 'Informe a senha atual para trocar email ou senha.'],
    account_current_password_invalid: ['is-error', 'Senha atual incorreta', 'A senha atual informada nao confere.'],
    account_email_in_use: ['is-warning', 'Email em uso', 'Esse email ja esta vinculado a outra conta.'],
    account_password_short: ['is-warning', 'Senha curta', 'A nova senha precisa ter pelo menos 8 caracteres.'],
    account_password_weak: ['is-warning', 'Senha fraca', 'Use uma senha com maiuscula, minuscula e numero.'],
    account_update_failed: ['is-error', 'Falha ao salvar', 'Nao foi possivel atualizar sua conta agora.'],
    reward_requested: ['is-success', 'Resgate solicitado', 'A recompensa foi enviada para a fila de processamento do seu inventario.'],
    reward_confirmed: ['is-success', 'Recompensa confirmada', 'Seu inventario marcou o item como resgatado.'],
    reward_failed: ['is-error', 'Falha no resgate', 'Nao foi possivel concluir a acao da recompensa agora.'],
    password_mismatch: ['is-warning', 'Senhas diferentes', 'As senhas informadas nao coincidem.'],
  };

  function showToast(type, title, message) {
    if (!toast || !toastCard || !toastIcon || !toastTitle || !toastText) {
      return;
    }

    toastCard.classList.remove('is-success', 'is-error', 'is-warning');
    toastCard.classList.add(type);

    let iconClass = 'fa-circle-info';

    if (type === 'is-success') {
      iconClass = 'fa-circle-check';
    } else if (type === 'is-error') {
      iconClass = 'fa-circle-xmark';
    } else if (type === 'is-warning') {
      iconClass = 'fa-triangle-exclamation';
    }

    toastIcon.innerHTML = `<i class="fas ${iconClass}"></i>`;
    toastTitle.textContent = title;
    toastText.textContent = message;
    toast.classList.add('is-visible');
    toast.setAttribute('aria-hidden', 'false');

    window.clearTimeout(showToast.timeoutId);
    showToast.timeoutId = window.setTimeout(() => {
      toast.classList.remove('is-visible');
      toast.setAttribute('aria-hidden', 'true');
    }, 3600);
  }

  function showPageMessageIfNeeded() {
    const feedback = messageMap[pageMessage];

    if (!feedback) {
      return;
    }

    showToast(feedback[0], feedback[1], feedback[2]);
  }

  function updateProgressBar() {
    if (!progressBar) {
      return;
    }

    const levelSize = 500;
    const currentLevel = Math.floor(currentUserXP / levelSize);
    const progressInLevel = currentUserXP - currentLevel * levelSize;
    progressBar.style.width = `${Math.max(8, Math.round((progressInLevel / levelSize) * 100))}%`;
  }

  function updateGreeting() {
    if (!greetingHeading) {
      return;
    }

    const userName = greetingHeading.dataset.userName || 'Aventureiro';
    const currentHour = new Date().getHours();
    let prefix = 'Ola';

    if (currentHour >= 5 && currentHour < 12) {
      prefix = 'Bom dia';
    } else if (currentHour >= 12 && currentHour < 18) {
      prefix = 'Boa tarde';
    } else {
      prefix = 'Boa noite';
    }

    greetingHeading.textContent = `${prefix}, ${userName}`;
  }

  function activateTab(tabName) {
    tabContents.forEach((content) => {
      content.classList.toggle('is-active', content.id === `${tabName}-content`);
    });

    sidebarNavLinks.forEach((button) => {
      button.classList.toggle('is-active', button.dataset.navKey === tabName);
    });

    if (window.innerWidth <= 768 && sidebar?.classList.contains('is-active')) {
      sidebar.classList.remove('is-active');
    }
  }

  function openModal(modal) {
    modal?.classList.add('is-active');
  }

  function closeModal(modal) {
    modal?.classList.remove('is-active');
  }

  function closeSidebarOnMobile(eventTarget) {
    if (
      sidebar &&
      sidebarToggleButton &&
      window.innerWidth <= 768 &&
      sidebar.classList.contains('is-active') &&
      !sidebar.contains(eventTarget) &&
      !sidebarToggleButton.contains(eventTarget)
    ) {
      sidebar.classList.remove('is-active');
    }
  }

  function goToTab(tabName) {
    activateTab(tabName);
    profileMenu?.classList.remove('is-active');
  }

  async function sendPost(url) {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-CSRF-Token': csrfToken,
      },
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.message || 'Falha na operacao.');
    }

    return payload;
  }

  updateProgressBar();
  updateGreeting();
  activateTab(initialTab);
  showPageMessageIfNeeded();

  if (taskDateInput) {
    taskDateInput.min = new Date().toISOString().split('T')[0];
  }

  sidebarToggleButton?.addEventListener('click', () => {
    if (!sidebar) {
      return;
    }

    if (window.innerWidth > 768) {
      dashboardContainer?.classList.toggle('sidebar-collapsed');
      return;
    }

    sidebar.classList.toggle('is-active');
  });

  profileButton?.addEventListener('click', (event) => {
    event.stopPropagation();
    profileMenu?.classList.toggle('is-active');
  });

  notificationButton?.addEventListener('click', (event) => {
    event.stopPropagation();
    notificationMenu?.classList.toggle('is-active');

    if (notificationMenu?.classList.contains('is-active') && notificationBadge) {
      notificationBadge.style.opacity = '0';
    }
  });

  document.addEventListener('click', (event) => {
    if (profileMenu && profileButton && !profileMenu.contains(event.target) && !profileButton.contains(event.target)) {
      profileMenu.classList.remove('is-active');
    }

    if (
      notificationMenu &&
      notificationButton &&
      !notificationMenu.contains(event.target) &&
      !notificationButton.contains(event.target)
    ) {
      notificationMenu.classList.remove('is-active');
    }

    closeSidebarOnMobile(event.target);
  });

  sidebarNavLinks.forEach((button) => {
    button.addEventListener('click', () => {
      const targetTab = button.dataset.targetTab;
      if (targetTab) {
        activateTab(targetTab);
      }
    });
  });

  shortcutLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const target = link.dataset.dashboardShortcut;
      if (target) {
        goToTab(target);
      }
    });
  });

  shortcutButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const target = button.dataset.dashboardShortcutButton;
      if (target) {
        goToTab(target);
      }
    });
  });

  openAccessibilityFromSettings?.addEventListener('click', () => {
    window.dispatchEvent(new Event('flowquests:open-accessibility'));
  });

  openLogoutFromSettings?.addEventListener('click', () => {
    openModal(confirmLogoutModal);
  });

  createTaskFromSettings?.addEventListener('click', () => {
    openModal(addTaskModal);
  });

  openRewardsFromSettings?.addEventListener('click', () => {
    goToTab('recompensas');
  });

  openTasksFromSettings?.addEventListener('click', () => {
    goToTab('tarefas');
  });

  addTaskButton?.addEventListener('click', () => openModal(addTaskModal));

  addTaskModal?.addEventListener('click', (event) => {
    if (event.target === addTaskModal || event.target.classList.contains('modal-close-button')) {
      closeModal(addTaskModal);
    }
  });

  cancelLogoutButton?.addEventListener('click', () => closeModal(confirmLogoutModal));

  confirmLogoutSubmitButton?.addEventListener('click', () => {
    logoutForm?.submit();
  });

  confirmLogoutModal?.addEventListener('click', (event) => {
    if (event.target === confirmLogoutModal) {
      closeModal(confirmLogoutModal);
    }
  });

  tasksContainer?.addEventListener('click', (event) => {
    const completeButton = event.target.closest('.complete-task-button');

    if (!completeButton) {
      return;
    }

    taskIdToComplete = completeButton.dataset.id;
    openModal(confirmTaskModal);
  });

  cancelCompletionButton?.addEventListener('click', () => {
    taskIdToComplete = null;
    closeModal(confirmTaskModal);
  });

  confirmTaskModal?.addEventListener('click', (event) => {
    if (event.target === confirmTaskModal) {
      taskIdToComplete = null;
      closeModal(confirmTaskModal);
    }
  });

  confirmCompletionButton?.addEventListener('click', async () => {
    if (!taskIdToComplete) {
      return;
    }

    try {
      await sendPost(`/api/tarefas/${taskIdToComplete}/completar`);
      window.location.reload();
    } catch (error) {
      showToast('is-error', 'Falha ao concluir', error.message || 'Nao foi possivel concluir a missao agora.');
    } finally {
      taskIdToComplete = null;
      closeModal(confirmTaskModal);
    }
  });

  rewardButtons.forEach((button) => {
    button.addEventListener('click', async () => {
      const rewardId = button.dataset.rewardId;
      const rewardAction = button.dataset.rewardAction;
      const endpoint =
        rewardAction === 'confirmar'
          ? `/api/recompensas/${rewardId}/confirmar`
          : `/api/recompensas/${rewardId}/solicitar`;

      try {
        await sendPost(endpoint);
        const message =
          rewardAction === 'confirmar'
            ? 'reward_confirmed'
            : 'reward_requested';
        window.location.href = `/dashboard?tab=recompensas&message=${message}`;
      } catch (error) {
        showToast('is-error', 'Falha no inventario', error.message || 'Nao foi possivel atualizar a recompensa.');
      }
    });
  });

  taskForm?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const taskDateValue = document.getElementById('task-date')?.value;
    const taskTimeValue = document.getElementById('task-time')?.value;
    const selectedDateTime = new Date(`${taskDateValue}T${taskTimeValue}`);

    if (selectedDateTime < new Date()) {
      showToast('is-warning', 'Data invalida', 'A data e a hora da missao nao podem ficar no passado.');
      return;
    }

    const taskData = {
      titulo: document.getElementById('task-name')?.value,
      dataPrazo: taskDateValue,
      horaPrazo: taskTimeValue,
      categoria: document.getElementById('task-category')?.value,
      usuario: { id: body.dataset.userId },
    };

    try {
      const response = await fetch('/api/tarefas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message || 'Falha ao criar tarefa.');
      }

      window.location.href = '/dashboard?tab=tarefas';
    } catch (error) {
      showToast('is-error', 'Falha ao salvar', error.message || 'Nao foi possivel criar a missao agora.');
    }
  });
});
