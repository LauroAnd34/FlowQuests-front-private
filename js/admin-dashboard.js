document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const editModal = document.getElementById('modalEditar');
  const warningModal = document.getElementById('modalAdvertir');
  const warningHistoryModal = document.getElementById('modalHistoricoAdvertencias');
  const confirmModal = document.getElementById('modalConfirmarAcao');
  const editButtons = document.querySelectorAll('.edit-user-button');
  const warnButtons = document.querySelectorAll('.warn-user-button');
  const warningHistoryButtons = document.querySelectorAll('.warning-history-button');
  const moderationButtons = document.querySelectorAll('.moderation-confirm-button');
  const closeEditButtons = document.querySelectorAll('[data-close-modal="true"]');
  const closeWarningButtons = document.querySelectorAll('[data-close-warning-modal="true"]');
  const closeHistoryButtons = document.querySelectorAll('[data-close-history-modal="true"]');
  const closeConfirmButtons = document.querySelectorAll('[data-close-confirm-modal="true"]');
  const nameInput = document.getElementById('editNome');
  const emailInput = document.getElementById('editEmail');
  const profileInput = document.getElementById('editPerfil');
  const editForm = document.getElementById('formEditar');
  const warningForm = document.getElementById('formAdvertir');
  const warningMotivo = document.getElementById('warningMotivo');
  const warningCountHint = document.getElementById('warning-count-hint');
  const warningModalCopy = document.getElementById('warning-modal-copy');
  const warningHistoryCopy = document.getElementById('warning-history-copy');
  const warningHistorySummary = document.getElementById('warning-history-summary');
  const warningHistoryList = document.getElementById('warning-history-list');
  const confirmActionButton = document.getElementById('confirm-action-button');
  const confirmActionTitle = document.getElementById('confirm-action-title');
  const confirmActionText = document.getElementById('confirm-action-text');
  const adminLogoutButton = document.getElementById('admin-logout-button');
  const adminLogoutForm = document.getElementById('admin-logout-form');
  const toast = document.getElementById('admin-toast');
  const toastCard = document.getElementById('admin-toast-card');
  const toastIcon = document.getElementById('admin-toast-icon');
  const toastTitle = document.getElementById('admin-toast-title');
  const toastText = document.getElementById('admin-toast-text');
  const pageMessage = body.dataset.message || '';

  const messageMap = {
    admin_user_promoted: ['is-success', 'Perfil promovido', 'O usuario agora tambem tem acesso administrativo.'],
    admin_user_updated: ['is-success', 'Conta atualizada', 'Os dados do usuario foram atualizados com sucesso.'],
    admin_user_deleted: ['is-success', 'Conta excluida', 'O usuario foi removido do sistema e seus dados vinculados foram limpos no modo local.'],
    admin_warning_created: ['is-warning', 'Advertencia registrada', 'A moderacao foi aplicada e o historico do usuario foi atualizado.'],
    admin_user_blocked: ['is-warning', 'Conta bloqueada', 'O acesso do usuario foi interrompido ate revisao administrativa.'],
    admin_user_banned: ['is-error', 'Conta banida', 'A conta foi marcada como banida no sistema.'],
    admin_action_failed: ['is-error', 'Falha na moderacao', 'Nao foi possivel concluir a acao administrativa agora.'],
  };

  let pendingAction = null;

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

  showPageMessageIfNeeded();

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

  warningHistoryButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const warningCount = Number(button.dataset.userWarningCount || 0);
      const status = button.dataset.userStatus || 'ATIVO';
      let warnings = [];

      try {
        warnings = JSON.parse(decodeURIComponent(button.dataset.warnings || '[]'));
      } catch (error) {
        warnings = [];
      }

      warningHistoryCopy.textContent = `Resumo das advertencias aplicadas a ${button.dataset.userName}.`;
      warningHistorySummary.innerHTML = `
        <span class="warning-history-chip"><i class="fas fa-user"></i> ${button.dataset.userName}</span>
        <span class="warning-history-chip"><i class="fas fa-triangle-exclamation"></i> ${warningCount} advertencia(s)</span>
        <span class="warning-history-chip"><i class="fas fa-shield-halved"></i> Status ${status}</span>
      `;

      if (!warnings.length) {
        warningHistoryList.innerHTML = '<div class="warning-history-empty">Nenhuma advertencia registrada para este usuario.</div>';
      } else {
        warningHistoryList.innerHTML = warnings
          .map((warning) => {
            const formattedDate = warning.criadoEm
              ? new Date(warning.criadoEm).toLocaleString('pt-BR')
              : 'Data indisponivel';

            return `
              <article class="warning-history-card">
                <div class="warning-history-card-header">
                  <h4>${warning.motivo || 'Advertencia sem motivo'}</h4>
                  <time>${formattedDate}</time>
                </div>
                <p>${warning.detalhamento || 'Sem detalhamento informado.'}</p>
              </article>
            `;
          })
          .join('');
      }

      openModal(warningHistoryModal);
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

  closeHistoryButtons.forEach((button) => {
    button.addEventListener('click', () => closeModal(warningHistoryModal));
  });

  closeConfirmButtons.forEach((button) => {
    button.addEventListener('click', closeConfirmModal);
  });

  adminLogoutButton?.addEventListener('click', () => {
    pendingAction = () => {
      adminLogoutForm?.submit();
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

  warningHistoryModal?.addEventListener('click', (event) => {
    if (event.target === warningHistoryModal) {
      closeModal(warningHistoryModal);
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
