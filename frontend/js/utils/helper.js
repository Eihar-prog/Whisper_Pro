/**
 * Вспомогательная функция для форматирования секунд в MM:SS
 */
export function formatTime(seconds) {
  const s = Math.floor(seconds);
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * Форматирование секунд для файла субтитров
 */
export function formatSRTTime(seconds) {
  const date = new Date(0);
  date.setMilliseconds(seconds * 1000);
  // Формат: HH:MM:SS,mmm
  return date.toISOString().substr(11, 12).replace('.', ',');
}
