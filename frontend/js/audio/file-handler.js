/**
 * Модуль обработки файлов
 * Обрабатывает выбор файлов пользователем, получение метаданных
 * (длительность, размер) и подготовку к транскрибации
 */

import { openFileData } from '../state.js';
import { showProgressContainer, updateProgress } from '../ui/progress-bar.js';
import { getElement } from '../utils/dom-utils.js';
import { formatTime } from '../utils/helper.js';

/**
 * Выбираем файл для транскрибации
 */
export async function selectFileClick() {
  // 1. Вызываем Python-метод
  const response = await pywebview.api.get_file_data();

  // 2. Обновляем элементы на форме
  const fileName = getElement('filename');
  if (response.status === 'success') {
    const fileInfo = getElement('fileinfo');

    fileName.textContent = response.file_name;
    fileInfo.textContent = `Длительность: ${response.duration_label} | Размер: ${response.size_label}`;

    // Сохраняем данные файла
    openFileData.fileName = response.file_name;
    openFileData.filePath = response.file_path;
    openFileData.duration = response.duration_seconds;

    // Показываем контейнер прогрессбара
    showProgressContainer(true);
    // Сбрасываем прогрессбар на 0, показывая общую длину
    updateProgress(0, '00:00', formatTime(openFileData.duration), '00:00');

    console.log('Путь к файлу сохранен:', response.file_path);
  } else if (response.status === 'error') {
    fileName.textContent = response.message;
    console.log('Ошибка при выборе файла:', response.message);
  }
}
