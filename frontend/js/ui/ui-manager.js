/**
 * Модуль управления пользовательским интерфейсом
 * Обрабатывает обновления UI, переключение режимов, показ/скрытие элементов
 * и другие изменения в интерфейсе
 */

/**
 * Переключение режима перевода
 * Обновляет интерфейс в зависимости от включенного/выключенного режима перевода
 */
function toggleTranslateMode() {
  const isTranslate = getElement('translate-toggle').checked;
  const panel = getElement('translate-panel');
  const mainBtn = getElement('main-action-btn');

  if (isTranslate) {
    // Режим перевода включен
    addClass(panel, 'active-translate');
    addClass(mainBtn, 'is-translate-mode');
    removeClass(mainBtn, 'is-file-mode');

    if (!mainBtn.disabled) {
      const mode = document.querySelector('input[name="mode"]:checked').value;
      setText(
        mainBtn,
        mode === 'mic' ? 'Запись с переводом' : 'Транскрибация с переводом',
      );
    }
  } else {
    // Режим перевода выключен
    removeClass(panel, 'active-translate');
    removeClass(mainBtn, 'is-translate-mode');
    updateModeUI(); // Обновляем UI в зависимости от текущего режима
  }
}

/**
 * Обновление интерфейса в зависимости от выбранного режима работы
 * (микрофон или файл)
 */
function updateModeUI() {
  const isFileMode =
    document.querySelector('input[name="mode"]:checked').value === 'file';
  const isTranslate = getElement('translate-toggle').checked;
  const fileContext = getElement('file-context');
  const mainBtn = getElement('main-action-btn');
  const modeMicLabel = getElement('mode-mic');
  const modeFileLabel = getElement('mode-file');
  const subtitleContainer = getElement('subtitle-container');

  // Не обновляем, если кнопка заблокирована (идет загрузка модели)
  if (mainBtn.disabled) return;

  if (isFileMode) {
    // Режим файла
    removeClass(fileContext, 'hidden');
    addClass(fileContext, 'visible');
    removeClass(subtitleContainer, 'hidden');

    // Обновляем текст кнопки в зависимости от режима перевода
    setText(
      mainBtn,
      isTranslate ? 'Транскрибация с переводом' : 'Начать транскрибацию',
    );
    toggleClass(mainBtn, 'is-file-mode', !isTranslate);

    // Активируем соответствующий режим
    addClass(modeFileLabel, 'work-mode-active');
    removeClass(modeMicLabel, 'work-mode-active');
  } else {
    // Режим микрофона
    addClass(fileContext, 'hidden');
    removeClass(fileContext, 'visible');
    addClass(subtitleContainer, 'hidden');

    // Обновляем текст кнопки в зависимости от режима перевода
    setText(mainBtn, isTranslate ? 'Запись с переводом' : 'Начать запись (🎤)');
    removeClass(mainBtn, 'is-file-mode');

    // Активируем соответствующий режим
    addClass(modeMicLabel, 'work-mode-active');
    removeClass(modeFileLabel, 'work-mode-active');
  }

  // Обновляем классы кнопки в зависимости от режима перевода
  toggleClass(mainBtn, 'is-translate-mode', isTranslate);
}
