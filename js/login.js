document.addEventListener('DOMContentLoaded', () => {
  const notification = document.getElementById('feedback-notification');

  if (!notification) {
    return;
  }

  const notificationBox = document.getElementById('notification-box');
  const notificationText = document.getElementById('notification-text');
  const notificationIcon = document.getElementById('notification-icon');
  const message = document.body.dataset.message || '';

  const messageMap = {
    success: {
      text: 'Conta criada com sucesso! Faça login para continuar.',
      colorClass: 'is-success',
      iconClass: 'fa-check-circle',
    },
    recovery: {
      text: 'Se o e-mail estiver cadastrado, você receberá as próximas instruções.',
      colorClass: 'is-success',
      iconClass: 'fa-check-circle',
    },
    login_failed: {
      text: 'Email ou senha incorretos. Tente novamente.',
      colorClass: 'is-danger',
      iconClass: 'fa-times-circle',
    },
    login_required: {
      text: 'Faça login para acessar o dashboard.',
      colorClass: 'is-warning',
      iconClass: 'fa-circle-exclamation',
    },
    register_failed: {
      text: 'Não foi possível concluir o cadastro. Revise os dados e tente de novo.',
      colorClass: 'is-danger',
      iconClass: 'fa-times-circle',
    },
    password_mismatch: {
      text: 'As senhas não coincidem.',
      colorClass: 'is-danger',
      iconClass: 'fa-times-circle',
    },
    error: {
      text: 'Ocorreu um problema ao carregar a aplicação.',
      colorClass: 'is-danger',
      iconClass: 'fa-times-circle',
    },
  };

  const feedback = messageMap[message];

  if (!feedback) {
    return;
  }

  notificationBox.classList.add(feedback.colorClass);
  notificationIcon.classList.add(feedback.iconClass);
  notificationText.textContent = feedback.text;
  notification.classList.add('is-visible');

  window.setTimeout(() => {
    notification.classList.remove('is-visible');
  }, 5000);
});
