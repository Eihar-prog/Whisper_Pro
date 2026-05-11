/**
 * Вспомогательные функции для работы с DOM
 * Содержит общие утилиты для поиска элементов, управления классами,
 * установки значений и других операций с DOM
 */

/**
 * Получение элемента по ID
 * @param {string} id - ID элемента
 * @returns {HTMLElement} - Найденный элемент
 */
export function getElement(id) {
  return document.getElementById(id);
}

/**
 * Установка текстового содержимого элемента
 * @param {HTMLElement} element - Целевой элемент
 * @param {string} text - Текст для установки
 */
export function setText(element, text) {
  element.textContent = text;
}

/**
 * Установка HTML содержимого элемента
 * @param {HTMLElement} element - Целевой элемент
 * @param {string} html - HTML для установки
 */
export function setHtml(element, html) {
  element.innerHTML = html;
}

/**
 * Добавление класса к элементу
 * @param {HTMLElement} element - Целевой элемент
 * @param {string} className - Имя класса для добавления
 */
export function addClass(element, className) {
  element.classList.add(className);
}

/**
 * Удаление класса из элемента
 * @param {HTMLElement} element - Целевой элемент
 * @param {string} className - Имя класса для удаления
 */
export function removeClass(element, className) {
  element.classList.remove(className);
}

/**
 * Переключение класса у элемента
 * @param {HTMLElement} element - Целевой элемент
 * @param {string} className - Имя класса для переключения
 * @param {boolean} condition - Условие для переключения
 */
export function toggleClass(element, className, condition) {
  element.classList.toggle(className, condition);
}
