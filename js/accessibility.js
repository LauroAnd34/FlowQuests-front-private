document.addEventListener('DOMContentLoaded', () => {
  const storageKey = 'flowquests-accessibility';
  const positionKey = 'flowquests-accessibility-position';
  const body = document.body;
  const root = document.documentElement;
  const toggleButton = document.getElementById('accessibility-toggle');
  const panel = document.getElementById('accessibility-panel');
  const closeButton = document.getElementById('accessibility-close');
  const actionButtons = document.querySelectorAll('[data-accessibility-action]');
  const fabMargin = 16;
  const panelMargin = 12;
  const panelGap = 14;

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

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

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

  function readCornerPosition() {
    try {
      const saved = JSON.parse(localStorage.getItem(positionKey));
      if (
        saved &&
        (saved.horizontal === 'left' || saved.horizontal === 'right') &&
        (saved.vertical === 'top' || saved.vertical === 'bottom')
      ) {
        return saved;
      }
    } catch (error) {
      return null;
    }

    return null;
  }

  function writeCornerPosition(position) {
    localStorage.setItem(positionKey, JSON.stringify(position));
  }

  function clearCornerPosition() {
    localStorage.removeItem(positionKey);
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

  function applyCornerPosition(position) {
    toggleButton.style.left = '';
    toggleButton.style.right = '';
    toggleButton.style.top = '';
    toggleButton.style.bottom = '';

    if (!position) {
      return;
    }

    toggleButton.style[position.horizontal] = `${fabMargin}px`;
    toggleButton.style[position.vertical] = `${fabMargin}px`;
  }

  function positionPanel() {
    if (!panel.classList.contains('is-open')) {
      return;
    }

    const buttonRect = toggleButton.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const alignLeft = buttonRect.left < window.innerWidth / 2;
    const openBelow = buttonRect.top < window.innerHeight / 2;

    let left = alignLeft ? buttonRect.left : buttonRect.right - panelRect.width;
    let top = openBelow ? buttonRect.bottom + panelGap : buttonRect.top - panelRect.height - panelGap;

    left = clamp(left, panelMargin, window.innerWidth - panelRect.width - panelMargin);
    top = clamp(top, panelMargin, window.innerHeight - panelRect.height - panelMargin);

    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
    panel.style.right = 'auto';
    panel.style.bottom = 'auto';
  }

  function openPanel() {
    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
    toggleButton.setAttribute('aria-expanded', 'true');
    positionPanel();
  }

  function closePanel() {
    panel.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
    toggleButton.setAttribute('aria-expanded', 'false');
  }

  const savedCorner = readCornerPosition();
  let activeCorner = savedCorner;

  applyState(readState());
  applyCornerPosition(savedCorner);

  let isDragging = false;
  let hasDragged = false;
  let dragPointerId = null;

  function handlePointerMove(event) {
    if (!isDragging || event.pointerId !== dragPointerId) {
      return;
    }

    const buttonRect = toggleButton.getBoundingClientRect();
    const previewLeft = clamp(
      event.clientX - buttonRect.width / 2,
      panelMargin,
      window.innerWidth - buttonRect.width - panelMargin
    );
    const previewTop = clamp(
      event.clientY - buttonRect.height / 2,
      panelMargin,
      window.innerHeight - buttonRect.height - panelMargin
    );

    if (
      !hasDragged &&
      (Math.abs(event.movementX) > 0 || Math.abs(event.movementY) > 0)
    ) {
      hasDragged = true;
      body.classList.add('is-dragging-accessibility-fab');
      closePanel();
    }

    toggleButton.style.left = `${previewLeft}px`;
    toggleButton.style.top = `${previewTop}px`;
    toggleButton.style.right = 'auto';
    toggleButton.style.bottom = 'auto';
  }

  function finishDrag(event) {
    if (!isDragging || (event && event.pointerId !== dragPointerId)) {
      return;
    }

    isDragging = false;
    dragPointerId = null;
    toggleButton.releasePointerCapture?.(event.pointerId);
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', finishDrag);
    window.removeEventListener('pointercancel', finishDrag);
    body.classList.remove('is-dragging-accessibility-fab');

    if (hasDragged) {
      const rect = toggleButton.getBoundingClientRect();
      const nextCorner = {
        horizontal: rect.left + rect.width / 2 < window.innerWidth / 2 ? 'left' : 'right',
        vertical: rect.top + rect.height / 2 < window.innerHeight / 2 ? 'top' : 'bottom',
      };

      activeCorner = nextCorner;
      writeCornerPosition(nextCorner);
      applyCornerPosition(nextCorner);

      window.setTimeout(() => {
        hasDragged = false;
      }, 0);
    }
  }

  toggleButton.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 && event.pointerType !== 'touch') {
      return;
    }

    isDragging = true;
    hasDragged = false;
    dragPointerId = event.pointerId;
    toggleButton.setPointerCapture?.(event.pointerId);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', finishDrag);
    window.addEventListener('pointercancel', finishDrag);
  });

  toggleButton.addEventListener('click', () => {
    if (hasDragged) {
      return;
    }

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

  window.addEventListener('flowquests:open-accessibility', () => {
    openPanel();
  });

  window.addEventListener('resize', () => {
    applyCornerPosition(activeCorner);
    positionPanel();
  });

  actionButtons.forEach((button) => {
    button.addEventListener('click', () => {
      let state = readState();
      const action = button.dataset.accessibilityAction;
      let feedbackMessage = 'Configuracao atualizada.';

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
        feedbackMessage = state.readableFont ? 'Fonte legivel ativada.' : 'Fonte legivel desativada.';
      }

      if (action === 'toggle-motion') {
        state.reducedMotion = !state.reducedMotion;
        feedbackMessage = state.reducedMotion ? 'Reducao de animacoes ativada.' : 'Reducao de animacoes desativada.';
      }

      if (action === 'reset') {
        state = { ...defaultState };
        activeCorner = null;
        clearCornerPosition();
        applyCornerPosition(null);
        feedbackMessage = 'Acessibilidade restaurada para o padrao.';
      }

      writeState(state);
      applyState(state);
      positionPanel();
      showFeedback(feedbackMessage);
    });
  });
});
