document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('modalEditar');
  const confirmModal = document.getElementById('modalConfirmarAcao');
  const editButtons = document.querySelectorAll('.edit-user-button');
  const deleteButtons = document.querySelectorAll('.delete-user-button');
  const closeButtons = document.querySelectorAll('[data-close-modal="true"]');
  const closeConfirmButtons = document.querySelectorAll('[data-close-confirm-modal="true"]');
  const nameInput = document.getElementById('editNome');
  const emailInput = document.getElementById('editEmail');
  const form = document.getElementById('formEditar');
  const confirmActionButton = document.getElementById('confirm-action-button');
  const confirmActionText = document.getElementById('confirm-action-text');
  const adminLogoutButton = document.getElementById('admin-logout-button');

  let pendingAction = null;

  function closeModal() {
    modal.classList.remove('is-active');
  }

  function closeConfirmModal() {
    confirmModal.classList.remove('is-active');
    pendingAction = null;
  }

  editButtons.forEach((button) => {
    button.addEventListener('click', () => {
      nameInput.value = button.dataset.userName;
      emailInput.value = button.dataset.userEmail;
      form.action = `/admin/editar/${button.dataset.userId}`;
      modal.classList.add('is-active');
    });
  });

  closeButtons.forEach((button) => {
    button.addEventListener('click', closeModal);
  });

  deleteButtons.forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      pendingAction = () => button.closest('form').submit();
      confirmActionText.textContent = `Deseja realmente excluir o usuário ${button.dataset.userName}?`;
      confirmModal.classList.add('is-active');
    });
  });

  adminLogoutButton?.addEventListener('click', () => {
    pendingAction = () => {
      window.location.href = '/logout';
    };
    confirmActionText.textContent = 'Deseja encerrar sua sessão de administrador agora?';
    confirmModal.classList.add('is-active');
  });

  closeConfirmButtons.forEach((button) => {
    button.addEventListener('click', closeConfirmModal);
  });

  confirmActionButton?.addEventListener('click', () => {
    if (pendingAction) {
      pendingAction();
    }

    closeConfirmModal();
  });
});
