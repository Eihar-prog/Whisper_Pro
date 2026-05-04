/**
 * Модуль управления прогресс-баром
 * Обрабатывает отображение процесса обработки аудио,
 * обновление процентов и временных меток
 */

// Глобальная переменная для хранения интервала прогресса
let progressInterval = null;

/**
 * Обновление состояния прогресс-бара
 * @param {number} percent - Процент выполнения (0-100)
 * @param {string} currentTime - Текущее время в формате MM:SS
 * @param {string} totalTime - Общее время в формате MM:SS
 */
function updateProgress(percent, currentTime, totalTime) {
  const progressBar = getElement('progress-bar');
  const progressPercent = getElement('progress-percent');
  const timeDisplay = getElement('time-display');

  // Обновляем ширину прогресс-бара
  progressBar.style.width = percent + '%';

  // Обновляем отображение процента
  setText(progressPercent, percent + '%');

  // Обновляем отображение времени
  setText(timeDisplay, `${currentTime} / ${totalTime}`);
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
