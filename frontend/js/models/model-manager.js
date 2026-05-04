/**
 * Модуль управления моделями Whisper
 * Обрабатывает выбор и загрузку различных моделей (tiny, base, small, medium, large),
 * отслеживание текущей модели и индикацию процесса загрузки
 */

/**
 * Симуляция процесса загрузки модели
 * На самом деле будет взаимодействовать с API Whisper для загрузки модели
 */
function simulateModelLoading() {
  // Получаем элементы, с которыми будем работать
  const select = getElement('model-select');
  const statusInd = getElement('status-indicator');
  const statusText = getElement('status-text');
  const statusSub = getElement('status-subtext');
  const mainBtn = getElement('main-action-btn');

  // Извлекаем имя выбранной модели из текста опции
  const modelName = select.options[select.selectedIndex].text.split(' ')[0];

  // Обновляем статус на "Загрузка модели..."
  statusInd.className = 'status-indicator-dot status-loading';
  statusInd.style.backgroundColor = '#eab308'; // bg-yellow-500
  setText(statusText, 'Загрузка модели...');
  statusText.style.color = '#eab308'; // text-yellow-500
  setText(statusSub, 'Пожалуйста, подождите');

  // Блокируем основную кнопку на время загрузки
  mainBtn.disabled = true;
  const oldText = mainBtn.innerText;
  setText(mainBtn, 'Загрузка модели...');

  // Через 3 секунды восстанавливаем нормальное состояние
  setTimeout(() => {
    statusInd.className = 'status-indicator-dot';
    statusInd.style.backgroundColor = '#22c55e'; // bg-green-500
    setText(statusText, 'Готов к работе');
    statusText.style.color = '#e2e8f0'; // text-slate-200
    setText(statusSub, 'Модель: ' + modelName);

    // Разблокируем кнопку и обновляем UI
    mainBtn.disabled = false;
    updateModeUI();
  }, 3000);
}
