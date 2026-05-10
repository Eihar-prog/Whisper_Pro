/**
 * @typedef {import('./utils/dom-utils.js').getElement} getElement
 * @typedef {import('./ui/ui-manager.js').updateModeUI}
 * @typedef {import('./ui/ui-manager.js').toggleTranslateMode}
 * @typedef {import('./models/model-manager.js').simulateModelLoading}
 * @typedef {import('./ui/progress-bar.js').startProgressAnimation}
 * @typedef {import('./ui/progress-bar.js').stopProgressAnimation}
 */

/**
 * Главный файл приложения Whisper Pro
 * Управляет инициализацией всего приложения, обработкой событий DOMContentLoaded
 * и координацией между различными модулями
 */

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
