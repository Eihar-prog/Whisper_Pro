/**
 * Модуль управления реальной загрузкой моделей Whisper
 */

import {
  setStatusLoadingModel,
  setStatusReady,
} from '../ui/status-indicator.js';
import { updateModeUI } from '../ui/ui-manager.js';
import { getElement, setText } from '../utils/dom-utils.js';

let modelStatusInterval = null;

/**
 * Основная функция, которая запускает процесс смены модели.
 * Вызывается из ui-manager.js
 */
export async function loadWhisperModel() {
  const mainBtn = getElement('main-action-btn');
  const modelSelect = getElement('model-select'); // Получаем наш селект

  // Блокируем и кнопку, и сам выбор модели
  mainBtn.disabled = true;
  mainBtn.setAttribute('data-is-loading', 'true'); // Ставим "флаг"
  modelSelect.disabled = true;
  setText(mainBtn, 'Загрузка модели...');
  setStatusLoadingModel(); // Используем функцию из status-indicator.js

  try {
    // 2. Даем команду Python начать загрузку
    // Метод load_whisper_model в Python запустит поток и сразу вернет ответ
    await pywebview.api.load_whisper_model();

    // 3. Запускаем "пинг-понг" (polling) для отслеживания прогресса
    startStatusPolling();
  } catch (error) {
    console.error('Ошибка при инициализации загрузки:', error);
    setStatusReady('Ошибка');
    mainBtn.disabled = false;
  }
}

/**
 * Запуск циклического опроса статуса
 */
function startStatusPolling() {
  // Если интервал уже запущен, не создаем новый
  if (modelStatusInterval) return;

  modelStatusInterval = setInterval(async () => {
    try {
      // Запрашиваем состояние у ModelManager через AppAPI
      const status = await pywebview.api.get_model_status();

      // Если загрузка завершена и модель готова
      if (!status.is_loading && status.is_ready) {
        stopStatusPolling();
        handleLoadingSuccess(status.model_name);
      }

      // Здесь в будущем можно обновлять промежуточный прогрессбар загрузки,
      // если мы добавим проценты скачивания в Python
    } catch (err) {
      console.error('Ошибка опроса статуса:', err);
      stopStatusPolling();
    }
  }, 500); // 500мс — оптимально для прототипа
}

function stopStatusPolling() {
  if (modelStatusInterval) {
    clearInterval(modelStatusInterval);
    modelStatusInterval = null;
  }
}

/**
 * Финализация интерфейса после успешной загрузки
 */
function handleLoadingSuccess(modelName) {
  const mainBtn = getElement('main-action-btn');
  mainBtn.removeAttribute('data-is-loading'); // Снимаем "флаг"
  const modelSelect = getElement('model-select');

  // Разблокируем кнопку
  mainBtn.disabled = false;
  modelSelect.disabled = false;
  setText(mainBtn, 'Начать транскрибацию');

  // Обновляем визуальный индикатор в статус-баре
  updateModeUI();
  setStatusReady(modelName); // [3]
}
