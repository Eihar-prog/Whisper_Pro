/**
 * Модуль управления прогресс-баром
 * Отвечает за плавную анимацию и обновление временных меток
 */

let targetProgress = 0; // Куда должен дойти бар
let currentProgress = 0; // Где бар находится сейчас
let animationFrameId = null;

/**
 * Цикл анимации (60 FPS)
 */
function animateProgressBar() {
  // Плавное приближение к цели
  currentProgress += (targetProgress - currentProgress) * 0.1;

  const progressBar = getElement('progress-bar');
  const progressPercent = getElement('progress-percent');

  if (progressBar) {
    progressBar.style.width = currentProgress + '%';
  }
  if (progressPercent) {
    setText(progressPercent, Math.round(currentProgress) + '%');
  }

  animationFrameId = requestAnimationFrame(animateProgressBar);
}

// Запускаем цикл анимации при загрузке страницы
animationFrameId = requestAnimationFrame(animateProgressBar);

/**
 * Обновление данных прогресса (вызывается из Python/JS)
 */
function updateProgress(percent, filePos, fileTotal, elapsedReal) {
  // Устанавливаем новую цель
  targetProgress = percent;

  // Обновляем текст
  const timeDisplay = getElement('time-display');
  if (timeDisplay) {
    setText(
      timeDisplay,
      `${filePos} / ${fileTotal} (Реальное: ${elapsedReal})`,
    );
  }
}

/**
 * Показать/скрыть контейнер
 */
function showProgressContainer(show) {
  const container = getElement('progress-container');
  if (!container) return;

  if (show) {
    removeClass(container, 'hidden');
    addClass(container, 'visible');
  } else {
    addClass(container, 'hidden');
    removeClass(container, 'visible');
  }
}
