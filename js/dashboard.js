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
  const logoutButton = document.getElementById('logout-button');
  const confirmLogoutModal = document.getElementById('confirm-logout-modal');
  const cancelLogoutButton = document.getElementById('cancel-logout-button');
  const toast = document.getElementById('dashboard-toast');
  const toastCard = document.getElementById('dashboard-toast-card');
  const toastIcon = document.getElementById('dashboard-toast-icon');
  const toastTitle = document.getElementById('dashboard-toast-title');
  const toastText = document.getElementById('dashboard-toast-text');
  const progressBar = document.getElementById('xp-progress-bar');
  const progressStartLabel = document.getElementById('progress-start-label');
  const progressEndLabel = document.getElementById('progress-end-label');
  const tabs = document.querySelectorAll('#tabs-nav li');
  const tabContents = document.querySelectorAll('.tab-content');
  const sidebarNavLinks = document.querySelectorAll('.sidebar-nav-link');

  let taskIdToComplete = null;
  let currentUserXP = Number(body.dataset.userXp || 0);

  function showToast(type, title, message) {
    if (!toast || !toastCard || !toastIcon || !toastTitle || !toastText) {
      return;
    }

    toastCard.classList.remove('is-success', 'is-error', 'is-warning');
    toastCard.classList.add(type);

    let iconClass = 'fa-circle-info';

    if (type === 'is-success') {
      iconClass = 'fa-circle-check';
    }

    if (type === 'is-error') {
      iconClass = 'fa-circle-xmark';
    }

    if (type === 'is-warning') {
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
    }, 3200);
  }

  function updateProgressBar() {
    if (!progressBar) {
      return;
    }

    const levelSize = 500;
    const currentLevel = Math.floor(currentUserXP / levelSize);
    const startXP = currentLevel * levelSize;
    const endXP = startXP + levelSize;
    const progressInLevel = currentUserXP - startXP;

    if (progressBar.tagName.toLowerCase() === 'progress') {
      progressBar.value = progressInLevel;
      progressBar.max = levelSize;
    } else {
      progressBar.style.width = `${Math.max(8, Math.round((progressInLevel / levelSize) * 100))}%`;
    }

    if (progressStartLabel) {
      progressStartLabel.textContent = startXP;
    }

    if (progressEndLabel) {
      progressEndLabel.textContent = endXP;
    }
  }

  function activateTab(tabName) {
    tabs.forEach((tab) => {
      tab.classList.toggle('is-active', tab.dataset.tab === tabName);
    });

    tabContents.forEach((content) => {
      content.classList.toggle('is-active', content.id === `${tabName}-content`);
    });

    sidebarNavLinks.forEach((button) => {
      button.classList.toggle('is-active', button.dataset.targetTab === tabName);
    });
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

  updateProgressBar();

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

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => activateTab(tab.dataset.tab));
  });

  sidebarNavLinks.forEach((button) => {
    button.addEventListener('click', () => activateTab(button.dataset.targetTab));
  });

  addTaskButton?.addEventListener('click', () => openModal(addTaskModal));

  addTaskModal?.addEventListener('click', (event) => {
    if (event.target === addTaskModal || event.target.classList.contains('modal-close-button')) {
      closeModal(addTaskModal);
    }
  });

  logoutButton?.addEventListener('click', () => openModal(confirmLogoutModal));

  cancelLogoutButton?.addEventListener('click', () => closeModal(confirmLogoutModal));

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
      const response = await fetch(`/api/tarefas/${taskIdToComplete}/completar`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Falha ao concluir tarefa.');
      }

      window.location.reload();
    } catch (error) {
      showToast('is-error', 'Falha ao concluir', 'Nao foi possivel concluir a missao agora.');
    } finally {
      taskIdToComplete = null;
      closeModal(confirmTaskModal);
    }
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
        },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        throw new Error('Falha ao criar tarefa.');
      }

      window.location.reload();
    } catch (error) {
      showToast('is-error', 'Falha ao salvar', 'Nao foi possivel criar a missao agora.');
    }
  });
});
