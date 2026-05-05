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
      text: 'Conta criada com sucesso! Faca login para continuar.',
      colorClass: 'is-success',
      iconClass: 'fa-check-circle',
    },
    recovery: {
      text: 'Se o email estiver cadastrado, voce recebera as proximas instrucoes.',
      colorClass: 'is-success',
      iconClass: 'fa-check-circle',
    },
    recovery_missing_email: {
      text: 'Informe o email para iniciar a recuperacao da conta.',
      colorClass: 'is-danger',
      iconClass: 'fa-times-circle',
    },
    recovery_invalid_email: {
      text: 'Digite um email valido para recuperar a conta.',
      colorClass: 'is-danger',
      iconClass: 'fa-times-circle',
    },
    login_missing_fields: {
      text: 'Preencha email e senha para entrar.',
      colorClass: 'is-danger',
      iconClass: 'fa-times-circle',
    },
    login_invalid_email: {
      text: 'Digite um email valido para entrar.',
      colorClass: 'is-danger',
      iconClass: 'fa-times-circle',
    },
    login_failed: {
      text: 'Email ou senha incorretos. Tente novamente.',
      colorClass: 'is-danger',
      iconClass: 'fa-times-circle',
    },
    login_required: {
      text: 'Faca login para acessar o dashboard.',
      colorClass: 'is-warning',
      iconClass: 'fa-circle-exclamation',
    },
    email_in_use: {
      text: 'Esse email ja esta cadastrado. Tente outro ou faca login.',
      colorClass: 'is-warning',
      iconClass: 'fa-circle-exclamation',
    },
    register_missing_fields: {
      text: 'Preencha todos os campos do cadastro.',
      colorClass: 'is-danger',
      iconClass: 'fa-times-circle',
    },
    register_invalid_email: {
      text: 'Digite um email valido para criar a conta.',
      colorClass: 'is-danger',
      iconClass: 'fa-times-circle',
    },
    register_password_short: {
      text: 'A senha precisa ter pelo menos 6 caracteres.',
      colorClass: 'is-danger',
      iconClass: 'fa-times-circle',
    },
    register_failed: {
      text: 'Nao foi possivel concluir o cadastro. Revise os dados e tente de novo.',
      colorClass: 'is-danger',
      iconClass: 'fa-times-circle',
    },
    password_mismatch: {
      text: 'As senhas nao coincidem.',
      colorClass: 'is-danger',
      iconClass: 'fa-times-circle',
    },
    error: {
      text: 'Ocorreu um problema ao carregar a aplicacao.',
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
