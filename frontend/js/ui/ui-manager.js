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
  if (mainBtn.getAttribute('data-is-loading') === 'true') return;

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
  console.log(mainBtn.textContent);
}

const modelSelect = getElement('model-select');
const langSelect = getElement('lang-select');
const translateToggle = getElement('translate-toggle');
const hotkeyInput = getElement('hotkey-input');
const subtitleToggle = getElement('subtitle-toggle');

/**
 * Загрузка настроек интерфейса при запуске приложения
 */
async function loadSettingsUI() {
  const config = await pywebview.api.load_config();

  const {
    model_size,
    source_language,
    translate_to_english,
    hotkey_record,
    operation_mode,
    generate_subtitles,
  } = config;

  modelSelect.value = model_size || '';
  langSelect.value = source_language || 'auto';
  translateToggle.checked = translate_to_english || false;
  hotkeyInput.value = hotkey_record || 'Ctrl+Shift+R';
  document.querySelector(
    `input[name="mode"][value="${operation_mode}"]`,
  ).checked = true;
  subtitleToggle.checked = generate_subtitles || false;

  // updateModeUI();

  // ДОБАВЛЯЕМ ЭТО: если модель выбрана в конфиге, загружаем её
  if (model_size) {
    loadWhisperModel();
  }
  updateModeUI();
}

/**
 * Действие при выборе модели whisper
 */
async function selectModelChange() {
  await pywebview.api.set_setting('model_size', modelSelect.value);
  await pywebview.api.save_config();
  // загрузка модели whisper и опрос состояния
  loadWhisperModel();
}

/**
 * Действие при выборе языка расшифровки аудио
 */
async function selectLangChange() {
  await pywebview.api.set_setting('source_language', langSelect.value);
  await pywebview.api.save_config();

  // TODO Изменить настройки языка в модели whisper в python
}

/**
 * Включаем или отключаем перевод аудио на английский
 */
async function toggleTranslateChange() {
  await pywebview.api.set_setting(
    'translate_to_english',
    translateToggle.checked,
  );
  await pywebview.api.save_config();

  // Обновляем интерфейс в зависимости от выбранного режима
  toggleTranslateMode();
}

/**
 * Смена горячих клавиш
 */
async function hotkeyChange() {
  await pywebview.api.set_setting('hotkey_record', hotkeyInput.value);
  await pywebview.api.save_config();
}

/**
 * Смена режима работы (аудио файл или микрофон)
 */
async function changeMode(event) {
  const radio = event.target;
  if (radio.checked) {
    await pywebview.api.set_setting('operation_mode', radio.value);
    await pywebview.api.save_config();

    // Обновляем интерфейс
    updateModeUI();
  }
}

/**
 * Включаем/выключаем субтитры
 */
async function changeSubtitles(event) {
  const isEnabled = event.target.checked;
  await pywebview.api.set_setting('generate_subtitles', isEnabled);
  await pywebview.api.save_config();
}

/**
 * Копируем текст из textarea в буфер обмена
 */
async function copyBtnClick() {
  const text = getElement('output-text').value.trim();
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error('Ошибка копирования:', err);
  }
}

/**
 * Сохраняем текст в файл
 */
async function saveBtnClick() {
  const text = getElement('output-text').value.trim();
  const isSubtileFile = subtitleToggle.checked;
  await pywebview.api.save_text(text, isSubtileFile);
}

/**
 * Блокирует или разблокирует элементы управления во время транскрибации
 * @param {boolean} locked - true если идет процесс, false если готов
 */
function setInterfaceLocked(locked) {
  const inputs = [
    modelSelect,
    langSelect,
    translateToggle,
    subtitleToggle,
    hotkeyInput,
    getElement('copy-btn'),
    getElement('save-btn'),
    ...document.querySelectorAll('input[name="mode"]'),
  ];

  // Кнопка выбора файла
  const fileBtn = getElement('select-file-btn');

  inputs.forEach((el) => (el.disabled = locked));
  fileBtn.disabled = locked;

  // Управление кнопкой отмены
  const cancelBtn = getElement('cancel-action-btn');
  if (cancelBtn) {
    toggleClass(cancelBtn, 'hidden', !locked);
  }
}

/**
 * Прерываем процесс транскрибации аудио файла
 */
async function cancelBtnClick() {
  pywebview.api.cancel_transcription();
  setInterfaceLocked(false);
}
