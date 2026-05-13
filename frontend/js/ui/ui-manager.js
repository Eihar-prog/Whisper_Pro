/**
 * Модуль управления пользовательским интерфейсом
 * Обрабатывает обновления UI, переключение режимов, показ/скрытие элементов
 * и другие изменения в интерфейсе
 */

import { updateConfig } from '../config/settings.js';
import { loadWhisperModel } from '../models/model-manager.js';
import {
  addClass,
  getElement,
  removeClass,
  setText,
  toggleClass,
} from '../utils/dom-utils.js';

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
export function updateModeUI() {
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

    // Отключаем субтитры в режиме микрофона
    const subtitleCheckbox = getElement('subtitle-toggle');
    subtitleCheckbox.checked = false;

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
const hotkeyDisplay = getElement('hotkey-display');
const changeHotkeyBtn = getElement('change-hotkey-btn');
const subtitleToggle = getElement('subtitle-toggle');

/**
 * Действие при выборе модели whisper
 */
export async function selectModelChange() {
  await updateConfig('model_size', modelSelect.value);
  // загрузка модели whisper и опрос состояния
  loadWhisperModel();
}

/**
 * Действие при выборе языка расшифровки аудио
 */
export async function selectLangChange() {
  await updateConfig('source_language', langSelect.value);
}

/**
 * Включаем или отключаем перевод аудио на английский
 */
export async function toggleTranslateChange() {
  await updateConfig('translate_to_english', translateToggle.checked);

  // Обновляем интерфейс в зависимости от выбранного режима
  toggleTranslateMode();
}

/**
 * Смена горячих клавиш
 */
// export async function hotkeyChange() {
//   await updateConfig('hotkey_record', hotkeyInput.value);
// }

/**
 * Смена режима работы (аудио файл или микрофон)
 */
export async function changeMode(event) {
  const radio = event.target;
  if (radio.checked) {
    await updateConfig('operation_mode', radio.value);

    // Обновляем интерфейс
    updateModeUI();
  }
}

/**
 * Включаем/выключаем субтитры
 */
export async function changeSubtitles(event) {
  const isEnabled = event.target.checked;
  await updateConfig('generate_subtitles', isEnabled);
}

/**
 * Блокирует или разблокирует элементы управления во время транскрибации
 * @param {boolean} locked - true если идет процесс, false если готов
 */
export function setInterfaceLocked(locked) {
  const inputs = [
    modelSelect,
    langSelect,
    translateToggle,
    subtitleToggle,
    hotkeyDisplay,
    changeHotkeyBtn,
    getElement('copy-btn'),
    getElement('save-btn'),
    ...document.querySelectorAll('input[name="mode"]'),
  ];

  // Кнопка выбора файла
  const fileBtn = getElement('select-file-btn');

  inputs.forEach((el) => {
    if (el) el.disabled = locked;
  });

  if (fileBtn) {
    fileBtn.disabled = locked;
  }

  // Управление кнопкой отмены
  const cancelBtn = getElement('cancel-action-btn');
  if (cancelBtn) {
    toggleClass(cancelBtn, 'hidden', !locked);
  }
}

/**
 * Прерываем процесс транскрибации аудио файла
 */
export async function cancelBtnClick() {
  const mainBtn = getElement('main-action-btn');
  const cancelBtn = getElement('cancel-action-btn');

  mainBtn.dataset.transcriptionCancelled = 'true';
  mainBtn.disabled = true;
  setText(mainBtn, 'Отмена...');

  if (cancelBtn) {
    toggleClass(cancelBtn, 'hidden', true);
  }

  try {
    await pywebview.api.cancel_transcription();
  } catch (error) {
    console.error('Ошибка при отмене транскрибации:', error);
  }
}
