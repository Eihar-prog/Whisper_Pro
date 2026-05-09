/**
 * Модуль обработки аудиофайлов
 * Обрабатывает выбор файлов пользователем, получение метаданных файлов
 * (длительность, размер) и подготовку к транскрибации
 */

let file_path = '';
let isValidFile = false;

/**
 * Обработчик кнопки выбора файла
 */
async function selectFileClick() {
  // 1. Вызываем Python-метод
  const response = await pywebview.api.get_file_data();

  // 2. Обновляем элементы на форме
  const fileName = getElement('filename');
  if (response.status === 'success') {
    const fileInfo = getElement('fileinfo');

    // ЗАПОМИНАЕМ длительность для будущего прогрессбара
    // Теперь эта цифра доступна во всем приложении через window
    window.currentFileDuration = response.duration_seconds;

    fileName.textContent = response.file_name;
    fileInfo.textContent = `Длительность: ${response.duration_label} | Размер: ${response.size_label}`;
    file_path = response.file_path;
    isValidFile = true;

    // Показываем контейнер прогрессбара
    showProgressContainer(true);
    // Сбрасываем прогрессбар на 0, показывая общую длину
    updateProgress(0, '00:00', formatTime(currentFileDuration), '00:00');

    console.log('Путь к файлу сохранен:', response.file_path);
  } else if (response.status === 'error') {
    isValidFile = false;
    fileName.textContent = response.message;
    console.log('Ошибка при выборе файла:', response.message);
  }
}
