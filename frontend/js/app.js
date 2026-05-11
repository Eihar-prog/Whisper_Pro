/**
 * Главный файл приложения Whisper Pro
 * Управляет инициализацией всего приложения, обработкой событий DOMContentLoaded
 * и координацией между различными модулями
 */

import { selectFileClick } from './audio/file-handler.js';
import { startTranscription } from './audio/transcriber.js';
import { loadSettingsUI } from './config/settings.js';
import { copyBtnClick, saveBtnClick } from './output/result-handler.js';
import {
  cancelBtnClick,
  changeMode,
  changeSubtitles,
  hotkeyChange,
  selectLangChange,
  selectModelChange,
  toggleTranslateChange,
} from './ui/ui-manager.js';
import { getElement } from './utils/dom-utils.js';

// Документ готов к взаимодействию
document.addEventListener('DOMContentLoaded', function () {
  window.addEventListener('pywebviewready', () => {
    initializeEventListeners();
    // Загрузка настроек из файла настроек
    loadSettingsUI();
  });
});

/**
 * Инициализация обработчиков событий
 */
function initializeEventListeners() {
  // Обработчик клика по основной кнопке действия
  getElement('main-action-btn').addEventListener('click', startTranscription);

  // Обработчик включения/выключения субтитров
  getElement('subtitle-toggle').addEventListener('change', changeSubtitles);

  // Обработчик клика по кнопке выбора файла
  getElement('select-file-btn').addEventListener('click', selectFileClick);

  // Обработчик изменения режима работы (микрофон/файл)
  document.querySelectorAll('input[name="mode"]').forEach((radio) => {
    radio.addEventListener('change', (event) => changeMode(event));
  });

  // Обработчик изменения режима перевода
  getElement('translate-toggle').addEventListener(
    'change',
    toggleTranslateChange,
  );

  // Обработчик изменения модели
  getElement('model-select').addEventListener('change', selectModelChange);

  // Обработчик выбора языка для модели
  getElement('lang-select').addEventListener('change', selectLangChange);

  // Обработчик смены горячих клавиш
  getElement('hotkey-input').addEventListener('change', hotkeyChange);

  // Обработчик кнопки "Копировать"
  getElement('copy-btn').addEventListener('click', copyBtnClick);

  // Обработчик кнопки "Сохранить"
  getElement('save-btn').addEventListener('click', saveBtnClick);

  // Обработчик кнопки "Отмена" для транскрибации
  getElement('cancel-action-btn').addEventListener('click', cancelBtnClick);
}
