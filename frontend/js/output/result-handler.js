/**
 * Модуль обработки результатов
 * Управляет отображением текста транскрибации, созданием субтитров (.srt),
 * функциями копирования и сохранения текста
 */
import { getElement } from '../utils/dom-utils.js';
/**
 * Копируем текст из textarea в буфер обмена
 */
export async function copyBtnClick() {
  const text = getElement('output-text').value.trim();
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error('Ошибка копирования:', err);
  }
}

/**
 * Сохраняем текст в файл
 */
export async function saveBtnClick() {
  const text = getElement('output-text').value.trim();
  const isSubtileFile = getElement('subtitle-toggle').checked;
  await pywebview.api.save_text(text, isSubtileFile);
}
