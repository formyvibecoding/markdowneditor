export interface ToastOptions {
  type?: 'info' | 'success' | 'error';
  durationMs?: number;
}

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

const TOAST_CONTAINER_ID = 'app-toast-container';

function ensureToastContainer(): HTMLDivElement {
  let container = document.getElementById(TOAST_CONTAINER_ID) as HTMLDivElement | null;
  if (!container) {
    container = document.createElement('div');
    container.id = TOAST_CONTAINER_ID;
    container.className = 'app-toast-container';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'true');
    document.body.appendChild(container);
  }
  return container;
}

export function showToast(message: string, options: ToastOptions = {}): void {
  const { type = 'info', durationMs = 4400 } = options;
  const container = ensureToastContainer();
  const toast = document.createElement('div');
  toast.className = `app-toast app-toast-${type}`;

  const tone = document.createElement('span');
  tone.className = 'app-toast-tone';
  tone.textContent = type === 'error' ? '注意' : type === 'success' ? '完成' : '提示';

  const text = document.createElement('p');
  text.className = 'app-toast-message';
  text.textContent = message;

  const content = document.createElement('div');
  content.className = 'app-toast-content';
  content.appendChild(tone);
  content.appendChild(text);

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'app-toast-close';
  closeBtn.setAttribute('aria-label', '关闭通知');
  closeBtn.textContent = '×';

  toast.appendChild(content);
  toast.appendChild(closeBtn);
  container.appendChild(toast);

  const removeToast = (): void => {
    toast.classList.add('app-toast-hide');
    window.setTimeout(() => {
      toast.remove();
    }, 180);
  };

  const timer = window.setTimeout(removeToast, durationMs);

  closeBtn.addEventListener('click', () => {
    window.clearTimeout(timer);
    removeToast();
  });
}

export function showErrorToast(message: string): void {
  showToast(message, { type: 'error' });
}

let activeModalCleanup: (() => void) | null = null;

export function showConfirm(options: ConfirmOptions): Promise<boolean> {
  if (activeModalCleanup) {
    activeModalCleanup();
    activeModalCleanup = null;
  }

  return new Promise(resolve => {
    const {
      title = '请确认操作',
      message,
      confirmText = '确定',
      cancelText = '取消',
    } = options;

    const previousActive = document.activeElement as HTMLElement | null;
    const overlay = document.createElement('div');
    overlay.className = 'app-modal-overlay';

    const dialog = document.createElement('section');
    dialog.className = 'app-modal';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'app-confirm-title');

    dialog.innerHTML = `
      <header class="app-modal-header">
        <h2 id="app-confirm-title">${title}</h2>
        <button type="button" class="app-modal-close" aria-label="关闭">×</button>
      </header>
      <p class="app-modal-message"></p>
      <footer class="app-modal-actions">
        <button type="button" class="app-modal-btn app-modal-cancel">${cancelText}</button>
        <button type="button" class="app-modal-btn app-modal-confirm">${confirmText}</button>
      </footer>
    `;

    const messageElement = dialog.querySelector('.app-modal-message');
    if (messageElement) {
      messageElement.textContent = message;
    }

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    document.body.classList.add('modal-open');

    const closeBtn = dialog.querySelector<HTMLButtonElement>('.app-modal-close');
    const cancelBtn = dialog.querySelector<HTMLButtonElement>('.app-modal-cancel');
    const confirmBtn = dialog.querySelector<HTMLButtonElement>('.app-modal-confirm');

    const close = (confirmed: boolean): void => {
      cleanup();
      resolve(confirmed);
    };

    const onKeydown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close(false);
      }
      if (event.key === 'Tab') {
        const focusables = [closeBtn, cancelBtn, confirmBtn].filter(Boolean) as HTMLElement[];
        if (!focusables.length) {
          return;
        }

        const currentIndex = focusables.indexOf(document.activeElement as HTMLElement);
        if (event.shiftKey) {
          if (currentIndex <= 0) {
            event.preventDefault();
            const lastFocusable = focusables[focusables.length - 1];
            if (lastFocusable) {
              lastFocusable.focus();
            }
          }
        } else if (currentIndex === focusables.length - 1) {
          event.preventDefault();
          const firstFocusable = focusables[0];
          if (firstFocusable) {
            firstFocusable.focus();
          }
        }
      }
    };

    const cleanup = (): void => {
      overlay.remove();
      document.body.classList.remove('modal-open');
      document.removeEventListener('keydown', onKeydown);
      previousActive?.focus();
      activeModalCleanup = null;
    };

    activeModalCleanup = cleanup;

    overlay.addEventListener('click', event => {
      if (event.target === overlay) {
        close(false);
      }
    });
    closeBtn?.addEventListener('click', () => close(false));
    cancelBtn?.addEventListener('click', () => close(false));
    confirmBtn?.addEventListener('click', () => close(true));
    document.addEventListener('keydown', onKeydown);

    confirmBtn?.focus();
  });
}
