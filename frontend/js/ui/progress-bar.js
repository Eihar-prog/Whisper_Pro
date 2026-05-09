/**
 * Модуль управления прогресс-баром
 * Обрабатывает отображение процесса обработки аудио,
 * обновление процентов и временных меток
 */

// Глобальная переменная для хранения интервала прогресса
let progressInterval = null;

/**
 * Обновление состояния прогресс-бара
 * @param {number} percent - Процент выполнения
 * @param {string} filePos - Позиция в аудиофайле (MM:SS)
 * @param {string} fileTotal - Общая длительность файла (MM:SS)
 * @param {string} elapsedReal - Реально затраченное время (MM:SS)
 */
function updateProgress(percent, filePos, fileTotal, elapsedReal) {
  const progressBar = getElement('progress-bar');
  const progressPercent = getElement('progress-percent');
  const timeDisplay = getElement('time-display');

  progressBar.style.width = percent + '%';
  setText(progressPercent, Math.round(percent) + '%');

  // Формат: "01:20 / 05:00 (Реальное: 00:15)"
  setText(timeDisplay, `${filePos} / ${fileTotal} (Реальное: ${elapsedReal})`);
}

/**
 * Показать/скрыть контейнер прогресса
 * @param {boolean} show - Показывать (true) или скрывать (false)
 */
function showProgressContainer(show) {
  const container = getElement('progress-container');
  if (show) {
    removeClass(container, 'hidden');
    addClass(container, 'visible');
  } else {
    addClass(container, 'hidden');
    removeClass(container, 'visible');
  }
}

/**
 * Начать анимацию прогресса
 * @param {number} duration - Продолжительность в секундах
 */
function startProgressAnimation(duration) {
  let prog = 0;

  // Очищаем предыдущий интервал, если он был
  if (progressInterval) {
    clearInterval(progressInterval);
  }

  showProgressContainer(true);

  progressInterval = setInterval(() => {
    prog += 1;
    if (prog > 100) {
      clearInterval(progressInterval);
      return;
    }

    // Вычисляем текущее время в формате MM:SS
    const currentSec = Math.floor((prog / 100) * duration);
    const displayTime = `00:${String(currentSec).padStart(2, '0')} / 00:${duration}`;

    updateProgress(
      prog,
      `00:${String(currentSec).padStart(2, '0')}`,
      `00:${duration}`,
    );
  }, 50);
}

/**
 * Остановить анимацию прогресса
 */
function stopProgressAnimation() {
  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
  }

  // Сбрасываем значения прогресса
  updateProgress(0, '00:00', '00:00');
  showProgressContainer(false);
}
