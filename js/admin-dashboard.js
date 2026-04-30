document.addEventListener('DOMContentLoaded', () => {
  const editModal = document.getElementById('modalEditar');
  const warningModal = document.getElementById('modalAdvertir');
  const confirmModal = document.getElementById('modalConfirmarAcao');
  const editButtons = document.querySelectorAll('.edit-user-button');
  const warnButtons = document.querySelectorAll('.warn-user-button');
  const moderationButtons = document.querySelectorAll('.moderation-confirm-button');
  const closeEditButtons = document.querySelectorAll('[data-close-modal="true"]');
  const closeWarningButtons = document.querySelectorAll('[data-close-warning-modal="true"]');
  const closeConfirmButtons = document.querySelectorAll('[data-close-confirm-modal="true"]');
  const nameInput = document.getElementById('editNome');
  const emailInput = document.getElementById('editEmail');
  const profileInput = document.getElementById('editPerfil');
  const editForm = document.getElementById('formEditar');
  const warningForm = document.getElementById('formAdvertir');
  const warningMotivo = document.getElementById('warningMotivo');
  const warningCountHint = document.getElementById('warning-count-hint');
  const warningModalCopy = document.getElementById('warning-modal-copy');
  const confirmActionButton = document.getElementById('confirm-action-button');
  const confirmActionTitle = document.getElementById('confirm-action-title');
  const confirmActionText = document.getElementById('confirm-action-text');
  const adminLogoutButton = document.getElementById('admin-logout-button');

  let pendingAction = null;

  function openModal(modal) {
    modal?.classList.add('is-active');
  }

  function closeModal(modal) {
    modal?.classList.remove('is-active');
  }

  function closeWarningModal() {
    closeModal(warningModal);
    warningForm?.reset();
  }

  function closeConfirmModal() {
    closeModal(confirmModal);
    pendingAction = null;
  }

  editButtons.forEach((button) => {
    button.addEventListener('click', () => {
      nameInput.value = button.dataset.userName;
      emailInput.value = button.dataset.userEmail;
      profileInput.value = button.dataset.userProfile || 'USER';
      editForm.action = `/admin/editar/${button.dataset.userId}`;
      openModal(editModal);
    });
  });

  warnButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const warningCount = Number(button.dataset.userWarningCount || 0);
      warningForm.action = `/admin/advertir/${button.dataset.userId}`;
      warningModalCopy.textContent = `Registre o motivo e o detalhamento da advertencia para ${button.dataset.userName}.`;
      warningCountHint.textContent =
        warningCount >= 2
          ? `Este usuario ja tem ${warningCount} advertencia(s). A proxima tambem pode levar ao bloqueio automatico no backend.`
          : `Este usuario tem ${warningCount} advertencia(s) registrada(s).`;
      openModal(warningModal);
      warningMotivo?.focus();
    });
  });

  moderationButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const formId = button.dataset.submitFormId;
      const targetForm = formId ? document.getElementById(formId) : null;
      if (!targetForm) {
        return;
      }

      pendingAction = () => targetForm.submit();
      confirmActionTitle.textContent = button.dataset.confirmTitle || 'Confirmar acao';
      confirmActionText.textContent = button.dataset.confirmText || 'Deseja continuar?';
      confirmActionButton.classList.remove('is-danger', 'is-warning');
      confirmActionButton.classList.add(
        button.dataset.confirmVariant === 'warning' ? 'is-warning' : 'is-danger'
      );
      openModal(confirmModal);
    });
  });

  closeEditButtons.forEach((button) => {
    button.addEventListener('click', () => closeModal(editModal));
  });

  closeWarningButtons.forEach((button) => {
    button.addEventListener('click', closeWarningModal);
  });

  closeConfirmButtons.forEach((button) => {
    button.addEventListener('click', closeConfirmModal);
  });

  adminLogoutButton?.addEventListener('click', () => {
    pendingAction = () => {
      window.location.href = '/logout';
    };
    confirmActionTitle.textContent = 'Encerrar sessao';
    confirmActionText.textContent = 'Deseja encerrar sua sessao de administrador agora?';
    confirmActionButton.classList.remove('is-warning');
    confirmActionButton.classList.add('is-danger');
    openModal(confirmModal);
  });

  editModal?.addEventListener('click', (event) => {
    if (event.target === editModal) {
      closeModal(editModal);
    }
  });

  warningModal?.addEventListener('click', (event) => {
    if (event.target === warningModal) {
      closeWarningModal();
    }
  });

  confirmModal?.addEventListener('click', (event) => {
    if (event.target === confirmModal) {
      closeConfirmModal();
    }
  });

  confirmActionButton?.addEventListener('click', () => {
    if (pendingAction) {
      pendingAction();
    }

    closeConfirmModal();
  });
});
