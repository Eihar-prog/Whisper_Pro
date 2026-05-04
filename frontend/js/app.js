/**
 * @typedef {import('./utils/dom-utils.js').getElement} getElement
 * @typedef {import('./ui/ui-manager.js').updateModeUI} updateModeUI
 * @typedef {import('./ui/ui-manager.js').toggleTranslateMode} toggleTranslateMode
 * @typedef {import('./models/model-manager.js').simulateModelLoading} simulateModelLoading
 * @typedef {import('./ui/progress-bar.js').startProgressAnimation} startProgressAnimation
 * @typedef {import('./ui/progress-bar.js').stopProgressAnimation} stopProgressAnimation
 */

/**
 * Главный файл приложения Whisper Pro
 * Управляет инициализацией всего приложения, обработкой событий DOMContentLoaded
 * и координацией между различными модулями
 */

// Документ готов к взаимодействию
document.addEventListener('DOMContentLoaded', function () {
  initializeEventListeners();
});

/**
 * Инициализация обработчиков событий
 */
function initializeEventListeners() {
  // Обработчик клика по основной кнопке действия
  getElement('main-action-btn').addEventListener(
    'click',
    handleMainActionClick,
  );

  // Обработчик изменения режима работы (микрофон/файл)
  document.querySelectorAll('input[name="mode"]').forEach((radio) => {
    radio.addEventListener('change', updateModeUI);
  });

  // Обработчик изменения режима перевода
  getElement('translate-toggle').addEventListener(
    'change',
    toggleTranslateMode,
  );

  // Обработчик изменения модели
  getElement('model-select').addEventListener('change', simulateModelLoading);
}

/**
 * Обработчик клика по основной кнопке действия
 * Запускает или останавливает анимацию прогресса
 */
function handleMainActionClick() {
  const container = getElement('progress-container');

  if (container.classList.contains('hidden')) {
    // Запускаем анимацию прогресса
    startProgressAnimation(45); // 45 секунд - примерная длительность
  } else {
    // Останавливаем анимацию прогресса
    stopProgressAnimation();
  }
}

/**
 * Инициализация приложения при полной загрузке
 */
function initializeApp() {
  updateModeUI(); // Устанавливаем начальное состояние UI
}

// Запускаем инициализацию при загрузке окна
window.onload = initializeApp;
