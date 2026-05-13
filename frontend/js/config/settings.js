/**
 * Модуль настроек приложения
 * Хранит и управляет настройками пользователя (язык, горячие клавиши,
 * выбранная модель, параметры интерфейса и т.д.)
 */

import { loadWhisperModel } from '../models/model-manager.js';
import { updateModeUI } from '../ui/ui-manager.js';
import { getElement } from '../utils/dom-utils.js';

/**
 * Загрузка настроек интерфейса при запуске приложения
 */
export async function loadSettingsUI() {
  const modelSelect = getElement('model-select');
  const langSelect = getElement('lang-select');
  const translateToggle = getElement('translate-toggle');
  const hotkeyDisplay = getElement('hotkey-display');
  const subtitleToggle = getElement('subtitle-toggle');

  const config = await pywebview.api.load_config();

  const {
    model_size,
    source_language,
    translate_to_english,
    operation_mode,
    generate_subtitles,
  } = config;

  modelSelect.value = model_size || '';
  langSelect.value = source_language || 'auto';
  translateToggle.checked = translate_to_english || false;

  const hotkeyInfo = await pywebview.api.get_hotkey_info();
  hotkeyDisplay.value = hotkeyInfo.display || 'Не назначена';

  document.querySelector(
    `input[name="mode"][value="${operation_mode}"]`,
  ).checked = true;
  subtitleToggle.checked = generate_subtitles || false;

  // ДОБАВЛЯЕМ ЭТО: если модель выбрана в конфиге, загружаем её
  if (model_size) {
    loadWhisperModel();
  }
  updateModeUI();
}

/**
 * Обновляет настройки конфигурации и сохраняет их в файл
 * @param {string} key - название конфигурации
 * @param {any} value - значение конфигурации
 */
export async function updateConfig(key, value) {
  await pywebview.api.set_setting(key, value);
  await pywebview.api.save_config();
}
