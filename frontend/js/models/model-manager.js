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

/**
 * Модуль управления реальной загрузкой моделей Whisper
 */

let modelStatusInterval = null;

/**
 * Основная функция, которая запускает процесс смены модели.
 * Вызывается из ui-manager.js
 */
async function loadWhisperModel() {
  const mainBtn = getElement('main-action-btn');
  const modelSelect = getElement('model-select'); // Получаем наш селект

  // Блокируем и кнопку, и сам выбор модели
  mainBtn.disabled = true;
  modelSelect.disabled = true;
  setText(mainBtn, 'Загрузка модели...');
  setStatusLoadingModel(); // Используем функцию из status-indicator.js

  try {
    // 2. Даем команду Python начать загрузку
    // Метод load_whisper_model в Python запустит поток и сразу вернет ответ
    await pywebview.api.load_whisper_model();

    // 3. Запускаем "пинг-понг" (polling) для отслеживания прогресса
    startStatusPolling();
  } catch (error) {
    console.error('Ошибка при инициализации загрузки:', error);
    setStatusReady('Ошибка');
    mainBtn.disabled = false;
  }
}

/**
 * Запуск циклического опроса статуса
 */
function startStatusPolling() {
  // Если интервал уже запущен, не создаем новый
  if (modelStatusInterval) return;

  modelStatusInterval = setInterval(async () => {
    try {
      // Запрашиваем состояние у ModelManager через AppAPI
      const status = await pywebview.api.get_model_status();

      // Если загрузка завершена и модель готова
      if (!status.is_loading && status.is_ready) {
        stopStatusPolling();
        handleLoadingSuccess(status.model_name);
      }

      // Здесь в будущем можно обновлять промежуточный прогрессбар загрузки,
      // если мы добавим проценты скачивания в Python
    } catch (err) {
      console.error('Ошибка опроса статуса:', err);
      stopStatusPolling();
    }
  }, 500); // 500мс — оптимально для прототипа
}

function stopStatusPolling() {
  if (modelStatusInterval) {
    clearInterval(modelStatusInterval);
    modelStatusInterval = null;
  }
}

/**
 * Финализация интерфейса после успешной загрузки
 */
function handleLoadingSuccess(modelName) {
  const mainBtn = getElement('main-action-btn');
  const modelSelect = getElement('model-select');

  // Разблокируем кнопку
  mainBtn.disabled = false;
  modelSelect.disabled = false;
  setText(mainBtn, 'Начать транскрибацию');

  // Обновляем визуальный индикатор в статус-баре
  setStatusReady(modelName); // [3]
}
