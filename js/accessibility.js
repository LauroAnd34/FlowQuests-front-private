document.addEventListener('DOMContentLoaded', () => {
  const storageKey = 'flowquests-accessibility';
  const body = document.body;
  const toggleButton = document.getElementById('accessibility-toggle');
  const panel = document.getElementById('accessibility-panel');
  const closeButton = document.getElementById('accessibility-close');
  const actionButtons = document.querySelectorAll('[data-accessibility-action]');
  const root = document.documentElement;

  if (!toggleButton || !panel) {
    return;
  }

  const feedback = document.createElement('div');
  feedback.className = 'accessibility-feedback';
  feedback.setAttribute('aria-live', 'polite');
  document.body.appendChild(feedback);

  const defaultState = {
    fontScale: 1,
    highContrast: false,
    readableFont: false,
    reducedMotion: false,
  };

  function readState() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      return { ...defaultState, ...(saved || {}) };
    } catch (error) {
      return { ...defaultState };
    }
  }

  function writeState(state) {
    localStorage.setItem(storageKey, JSON.stringify(state));
  }

  function showFeedback(message) {
    feedback.textContent = message;
    feedback.classList.add('is-visible');

    window.clearTimeout(showFeedback.timeoutId);
    showFeedback.timeoutId = window.setTimeout(() => {
      feedback.classList.remove('is-visible');
    }, 1400);
  }

  function syncActionButtons(state) {
    actionButtons.forEach((button) => {
      const action = button.dataset.accessibilityAction;
      let active = false;

      if (action === 'toggle-contrast') {
        active = state.highContrast;
      }

      if (action === 'toggle-readable-font') {
        active = state.readableFont;
      }

      if (action === 'toggle-motion') {
        active = state.reducedMotion;
      }

      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function applyState(state) {
    root.style.setProperty('--fq-font-scale', String(state.fontScale));
    root.style.fontSize = `${16 * state.fontScale}px`;
    body.style.setProperty('--fq-font-scale', String(state.fontScale));
    body.classList.toggle('accessibility-high-contrast', state.highContrast);
    body.classList.toggle('accessibility-readable-font', state.readableFont);
    body.classList.toggle('accessibility-reduced-motion', state.reducedMotion);
    root.classList.toggle('accessibility-reduced-motion', state.reducedMotion);
    syncActionButtons(state);
  }

  function openPanel() {
    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
    toggleButton.setAttribute('aria-expanded', 'true');
  }

  function closePanel() {
    panel.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
    toggleButton.setAttribute('aria-expanded', 'false');
  }

  let state = readState();
  applyState(state);

  toggleButton.addEventListener('click', () => {
    if (panel.classList.contains('is-open')) {
      closePanel();
      return;
    }

    openPanel();
  });

  closeButton?.addEventListener('click', closePanel);

  document.addEventListener('click', (event) => {
    if (
      panel.classList.contains('is-open') &&
      !panel.contains(event.target) &&
      !toggleButton.contains(event.target)
    ) {
      closePanel();
    }
  });

  actionButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset.accessibilityAction;
      let feedbackMessage = 'Configuração atualizada.';

      if (action === 'increase-font') {
        state.fontScale = Math.min(state.fontScale + 0.1, 1.4);
        feedbackMessage = 'Texto aumentado.';
      }

      if (action === 'decrease-font') {
        state.fontScale = Math.max(state.fontScale - 0.1, 0.9);
        feedbackMessage = 'Texto reduzido.';
      }

      if (action === 'toggle-contrast') {
        state.highContrast = !state.highContrast;
        feedbackMessage = state.highContrast ? 'Alto contraste ativado.' : 'Alto contraste desativado.';
      }

      if (action === 'toggle-readable-font') {
        state.readableFont = !state.readableFont;
        feedbackMessage = state.readableFont ? 'Fonte legível ativada.' : 'Fonte legível desativada.';
      }

      if (action === 'toggle-motion') {
        state.reducedMotion = !state.reducedMotion;
        feedbackMessage = state.reducedMotion ? 'Redução de animações ativada.' : 'Redução de animações desativada.';
      }

      if (action === 'reset') {
        state = { ...defaultState };
        feedbackMessage = 'Acessibilidade restaurada para o padrão.';
      }

      writeState(state);
      applyState(state);
      showFeedback(feedbackMessage);
    });
  });
});
