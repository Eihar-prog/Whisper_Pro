/**
 * UI-слой для горячих клавиш.
 * Нативный захват, нормализация, сохранение и регистрация живут в Python.
 */

import { getElement } from '../utils/dom-utils.js';

class HotkeyManager {
  constructor() {
    this.state = 'idle';
    this.pendingHotkey = null;
    this.displayElement = null;
    this.changeButton = null;
    this.init();
  }

  init() {
    this.displayElement = getElement('hotkey-display');
    this.changeButton = getElement('change-hotkey-btn');

    this.changeButton.addEventListener('click', () => this.handleButtonClick());

    window.handleHotkeyPress = this.handleHotkeyPress.bind(this);
    window.handleHotkeyCaptured = this.handleHotkeyCaptured.bind(this);
    window.handleHotkeyCaptureCancelled =
      this.handleHotkeyCaptureCancelled.bind(this);
    window.addEventListener('beforeunload', () => this.cancelCapture());

    if (window.pywebview && window.pywebview.ready) {
      this.loadCurrentHotkey();
    } else {
      window.addEventListener('pywebviewready', () => this.loadCurrentHotkey());
    }
  }

  async loadCurrentHotkey() {
    try {
      if (!window.pywebview || !window.pywebview.api) {
        console.warn('pywebview API не доступен при загрузке горячей клавиши');
        return;
      }

      const result = await pywebview.api.get_hotkey_info();
      if (result.success) {
        this.setIdle(result.display);
      } else {
        this.setIdle('Не назначена');
        console.error('Error loading hotkey:', result.error);
      }
    } catch (error) {
      this.setIdle('Не назначена');
      console.error('Error loading hotkey:', error);
    }
  }

  async handleButtonClick() {
    if (this.state === 'idle') {
      await this.startCapture();
      return;
    }

    if (this.state === 'capturing') {
      await this.cancelCapture();
      return;
    }

    if (this.state === 'captured') {
      await this.saveCapturedHotkey();
    }
  }

  async startCapture() {
    try {
      this.state = 'capturing';
      this.pendingHotkey = null;
      this.displayElement.value = 'Нажмите комбинацию...';
      this.changeButton.textContent = 'Отмена';
      this.changeButton.disabled = false;
      this.changeButton.classList.add('saving');

      const result = await pywebview.api.start_hotkey_capture();
      if (!result.success) {
        this.setIdle();
        console.error('Error starting hotkey capture:', result.error);
      }
    } catch (error) {
      this.setIdle();
      console.error('Error starting hotkey capture:', error);
    }
  }

  handleHotkeyCaptured(payload) {
    this.pendingHotkey = payload.hotkey;
    this.state = 'captured';
    this.displayElement.value = payload.display || payload.hotkey;
    this.changeButton.disabled = false;
    this.changeButton.textContent = 'Сохранить';
    this.changeButton.classList.add('saving');
  }

  handleHotkeyCaptureCancelled() {
    this.setIdle();
    this.loadCurrentHotkey();
  }

  async saveCapturedHotkey() {
    try {
      this.changeButton.disabled = true;
      const result = await pywebview.api.save_captured_hotkey();

      if (result.success) {
        this.setIdle(result.display);
      } else {
        this.changeButton.disabled = false;
        console.error('Error saving hotkey:', result.error);
      }
    } catch (error) {
      this.changeButton.disabled = false;
      console.error('Error saving hotkey:', error);
    }
  }

  async cancelCapture() {
    if (this.state !== 'capturing') return;

    try {
      await pywebview.api.cancel_hotkey_capture();
    } catch (error) {
      console.error('Error cancelling hotkey capture:', error);
    } finally {
      this.handleHotkeyCaptureCancelled();
    }
  }

  setIdle(displayText = null) {
    this.state = 'idle';
    this.pendingHotkey = null;
    this.changeButton.disabled = false;
    this.changeButton.textContent = 'Сменить';
    this.changeButton.classList.remove('saving', 'recording');

    if (displayText !== null) {
      this.displayElement.value = displayText;
    }
  }

  handleHotkeyPress() {
    console.log('Hotkey pressed!');

    const currentMode = document.querySelector(
      'input[name="mode"]:checked',
    ).value;

    if (currentMode === 'mic') {
      window.dispatchEvent(
        new CustomEvent('hotkeyPressed', { detail: { mode: 'mic' } }),
      );
    }
  }
}

export const hotkeyManager = new HotkeyManager();
