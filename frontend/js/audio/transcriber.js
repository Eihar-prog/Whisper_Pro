/**
 * Модуль транскрибации аудио
 * Обрабатывает вызовы к модели Whisper для преобразования аудио в текст,
 * выбор файлов для обработки и результаты транскрибации
 */
let file_path = '';
let isValidFile = false;

/**
 * Обработчик кнопки выбора файла
 */
async function selectFileClick() {
  // 1. Вызываем Python-метод
  const response = await pywebview.api.open_file_dialog();

  // 2. Обновляем элементы на форме
  const fileName = document.getElementById('filename');
  if (response.status === 'success') {
    const fileInfo = document.getElementById('fileinfo');

    fileName.textContent = response.file_name;
    fileInfo.textContent = `Длительность: ${response.duration_label} | Размер: ${response.size_label}`;
    file_path = response.file_path;
    isValidFile = true;

    console.log('Путь к файлу сохранен:', response.file_path);
  } else if (response.status === 'error') {
    isValidFile = false;
    fileName.textContent = response.message;
    console.log('Ошибка при выборе файла:', response.message);
  }
}
