/**
 * Модуль управления процессом транскрибации.
 * Принимает данные от Python и обновляет текстовое поле и прогрессбар.
 */

let transcriptionStartTime = 0; // Для отслеживания реального времени

import { openFileData } from '../state.js';
import { showProgressContainer, updateProgress } from '../ui/progress-bar.js';
import { setStatusProcessing, setStatusReady } from '../ui/status-indicator.js';
import { setInterfaceLocked } from '../ui/ui-manager.js';
import { getElement, setText } from '../utils/dom-utils.js';
import { formatSRTTime, formatTime } from '../utils/helper.js';

/**
 * Запуск транскрибации файла
 */
export async function startTranscription() {
  const outputArea = getElement('output-text');
  const mainBtn = getElement('main-action-btn');

  // 1. Получаем путь к файлу, который мы выбрали ранее
  // file_path хранится в file-handler.js
  if (!openFileData.filePath) {
    alert('Пожалуйста, выберите файл!');
    return;
  }

  // 2. Подготовка UI
  setText(mainBtn, 'Обработка...');
  mainBtn.disabled = true;
  setInterfaceLocked(true);
  setStatusProcessing(); // Синий индикатор из status-indicator.js

  // Очищаем поле вывода перед новой работой (опционально)
  outputArea.value = '';

  // Показываем контейнер прогрессбара
  showProgressContainer(true);
  // Сбрасываем прогрессбар на 0, показывая общую длину
  updateProgress(0, '00:00', formatTime(openFileData.duration), '00:00');

  // Фиксируем время начала (реальное время на часах)
  transcriptionStartTime = Date.now();

  try {
    // 3. Вызываем метод в Python API
    // Напомню: в Python это запустит фоновый поток и сразу вернет {status: "started"}
    const response = await pywebview.api.start_transcription(
      openFileData.filePath,
    );

    if (response.status === 'error') {
      throw new Error(response.message);
    }
  } catch (error) {
    console.error('Ошибка при старте транскрибации:', error);
    handleTranscriptionEnd();
  }
}

/**
 * Эту функцию вызывает Python через evaluate_js для каждого нового сегмента.
 * @param {Object} segment - Объект с полями {text, start, end, progress}
 */
window.handleNewSegment = function (segment) {
  const outputArea = getElement('output-text');
  const isSubtitleMode = getElement('subtitle-toggle').checked;

  let textToAdd = '';

  if (isSubtitleMode) {
    // Форматируем время в SRT-стиль: 00:00:01,234
    const start = formatSRTTime(segment.start);
    const end = formatSRTTime(segment.end);
    textToAdd = `${start} --> ${end}\n${segment.text.trim()}\n\n`;
  } else {
    textToAdd = segment.text;
  }

  // Автоматическая прокрутка вниз, чтобы видеть свежий текст
  outputArea.value += textToAdd;
  outputArea.scrollTop = outputArea.scrollHeight;

  // Считаем прошедшее РЕАЛЬНОЕ время
  // Берем общую длительность из нашей "памяти"
  const totalDuration = openFileData.duration || 0;

  const filePos = formatTime(segment.end);
  const fileTotal = formatTime(totalDuration);
  const realElapsed = formatTime((Date.now() - transcriptionStartTime) / 1000);

  // Обновляем прогрессбар (используем вашу функцию из progress-bar.js)
  // Whisper дает прогресс на основе времени сегмента
  updateProgress(segment.progress, filePos, fileTotal, realElapsed);
};

/**
 * Эту функцию вызывает Python, когда генератор сегментов завершил работу.
 */
window.handleTranscriptionEnd = function () {
  const mainBtn = getElement('main-action-btn');

  // При завершении фиксируем финальное затраченное время
  const finalRealTime = formatTime(
    (Date.now() - transcriptionStartTime) / 1000,
  );
  const totalFileTime = formatTime(openFileData.duration || 0);
  console.log(openFileData.duration);

  updateProgress(100, totalFileTime, totalFileTime, finalRealTime);

  // Возвращаем кнопку в исходное состояние
  mainBtn.disabled = false;
  setText(mainBtn, 'Начать транскрибацию');

  // Возвращаем индикатор в состояние "Готов"
  const currentModel = getElement('model-select').value;
  setStatusReady(currentModel);

  console.log('Транскрибация успешно завершена');
  setInterfaceLocked(false);
};
