/**
 * Модуль управления прогресс-баром
 * Отвечает за плавную анимацию и обновление временных меток
 */

import {
  addClass,
  getElement,
  removeClass,
  setText,
} from '../utils/dom-utils.js';

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
 * или можно задать вручную
 * @param {number} percent  - процент прогресса (0-100)
 * @param {string} filePos - время (текущая позиция)
 * @param {string} fileTotal - время (продолжительность файла)
 * @param {string} elapsedReal - время (сколько затрачено на обработку)
 */
export function updateProgress(percent, filePos, fileTotal, elapsedReal) {
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
 * Показать/скрыть контейнер с прогрессбаром
 * @param {boolean} show - true - показать, false - скрыть
 */
export function showProgressContainer(show) {
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
