/**
 * Модуль управления процессом транскрибации.
 * Принимает данные от Python и обновляет текстовое поле и прогрессбар.
 */

let transcriptionStartTime = 0; // Для отслеживания реального времени

/**
 * Запуск транскрибации файла
 */
async function startTranscription() {
  const outputArea = getElement('output-text');
  const mainBtn = getElement('main-action-btn');

  // 1. Получаем путь к файлу, который мы выбрали ранее
  // file_path хранится в file-handler.js
  if (!file_path) {
    alert('Пожалуйста, выберите файл!');
    return;
  }

  // 2. Подготовка UI
  setText(mainBtn, 'Обработка...');
  mainBtn.disabled = true;
  setStatusProcessing(); // Синий индикатор из status-indicator.js

  // Очищаем поле вывода перед новой работой (опционально)
  outputArea.value = '';

  // Показываем контейнер прогрессбара
  showProgressContainer(true);
  // Сбрасываем прогрессбар на 0, показывая общую длину
  updateProgress(0, '00:00', formatTime(window.currentFileDuration), '00:00');

  // Фиксируем время начала (реальное время на часах)
  transcriptionStartTime = Date.now();

  try {
    // 3. Вызываем метод в Python API
    // Напомню: в Python это запустит фоновый поток и сразу вернет {status: "started"}
    const response = await pywebview.api.start_transcription(file_path);

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

  // Добавляем текст сегмента в textarea
  // Мы не используем .strip(), чтобы сохранить естественные пробелы от Whisper
  outputArea.value += segment.text;

  // Автоматическая прокрутка вниз, чтобы видеть свежий текст
  outputArea.scrollTop = outputArea.scrollHeight;

  // Считаем прошедшее РЕАЛЬНОЕ время
  // Берем общую длительность из нашей "памяти"
  const totalDuration = window.currentFileDuration || 0;

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
  const totalFileTime = formatTime(window.currentFileDuration || 0);
  console.log(window.currentFileDuration);

  updateProgress(100, totalFileTime, totalFileTime, finalRealTime);

  // Возвращаем кнопку в исходное состояние
  mainBtn.disabled = false;
  setText(mainBtn, 'Начать транскрибацию');

  // Возвращаем индикатор в состояние "Готов"
  const currentModel = getElement('model-select').value;
  setStatusReady(currentModel);

  console.log('Транскрибация успешно завершена');
};

/**
 * Вспомогательная функция для форматирования секунд в MM:SS
 */
function formatTime(seconds) {
  const s = Math.floor(seconds);
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
