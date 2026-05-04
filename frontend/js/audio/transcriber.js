/**
 * Модуль транскрибации аудио
 * Обрабатывает вызовы к модели Whisper для преобразования аудио в текст,
 * выбор файлов для обработки и результаты транскрибации
 */

// Обработчик выбора файла  для обработки
// Функция, которая сработает при клике на кнопку в браузере
async function selectFile() {
  // 1. Вызываем наш Python-метод
  const response = await pywebview.api.open_file_dialog();

  if (response.status === 'success') {
    // 2. Обновляем элементы на форме
    document.getElementById('file-name').innerText = response.file_name;
    document.getElementById('file-duration').innerText =
      response.duration_label;
    document.getElementById('file-size').innerText = response.size_label;

    console.log('Путь к файлу сохранен:', response.file_path);
  } else if (response.status === 'error') {
    alert('Ошибка: ' + response.message);
  }
}
