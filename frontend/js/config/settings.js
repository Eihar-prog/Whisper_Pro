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
  const timestampsToggle = getElement('timestamps-toggle');
  const speakersToggle = getElement('speakers-toggle');
  const speakerSettingsPanel = getElement('speaker-settings-panel');
  const pyannoteTokenInput = getElement('pyannote-token-input');
  const pyannoteModelInput = getElement('pyannote-model-input');
  const pyannoteMinSpeakersInput = getElement('pyannote-min-speakers-input');
  const pyannoteMaxSpeakersInput = getElement('pyannote-max-speakers-input');

  const config = await pywebview.api.load_config();

  const {
    model_size,
    source_language,
    translate_to_english,
    operation_mode,
    generate_subtitles,
    include_timestamps,
    enable_speaker_diarization,
    pyannote_token,
    pyannote_model,
    pyannote_min_speakers,
    pyannote_max_speakers,
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
  timestampsToggle.checked = include_timestamps || false;
  speakersToggle.checked = enable_speaker_diarization || false;
  pyannoteTokenInput.value = pyannote_token || '';
  pyannoteModelInput.value =
    pyannote_model || 'pyannote/speaker-diarization-3.1';
  pyannoteMinSpeakersInput.value = pyannote_min_speakers || '';
  pyannoteMaxSpeakersInput.value = pyannote_max_speakers || '';
  speakerSettingsPanel.classList.toggle(
    'hidden',
    !enable_speaker_diarization,
  );

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
