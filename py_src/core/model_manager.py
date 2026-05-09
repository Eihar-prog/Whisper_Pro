"""
Менеджер моделей Whisper
Управление загрузкой, кэшированием и выбором моделей
"""

import time
import threading
from pathlib import Path
from faster_whisper import WhisperModel
import os
import numpy as np

# Отключаем предупреждение о симлинках в Windows (решает вашу проблему в консоли)
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"


class ModelManager:
    def __init__(self):
        """Инициализация менеджера моделей"""
        self.model: WhisperModel = None
        self.is_loading = False
        self.current_progress: float = 0.0
        self.current_model_name: str = "none"

        # Путь к папке моделей ai_models в корне проекта
        self.models_dir = Path(__file__).parents[2] / "ai_models"
        self.models_dir.mkdir(parents=True, exist_ok=True)

    def is_model_downloaded(self, model_size: str) -> bool:
        """Проверяет, существует ли уже папка с конкретной моделью"""
        # Faster-whisper создает папки с определенным шаблоном имен
        # Для простоты проверяем наличие любой папки внутри ai_models
        model_path = self.models_dir / f"models--Systran--faster-whisper-{model_size}"
        return model_path.exists()

    # Загрузка модели
    def load_model(
        self, model_size: str, device: str = "cpu", compute_type: str = "int8"
    ) -> None:
        """
        Загрузка модели в отдельном потоке, чтобы не блокировать UI.
        :param model_size: Размер модели (tiny, base, small, medium, large)
        :param device: Устройство (cpu или cuda)
        :param compute_type: Тип вычислений (int8 оптимален для CPU)
        """
        if self.is_loading:
            return

        # Запускаем загрузку в потоке, чтобы API (pywebview) мог сразу вернуть ответ JS
        thread = threading.Thread(
            target=self._load_model_internal,
            args=(model_size, device, compute_type),
            daemon=True,  # Теперь поток закроется вместе с приложением
        )
        thread.start()

    def _load_model_internal(
        self, model_size: str, device: str, compute_type: str
    ) -> None:
        """Внутренний метод для фактической загрузки модели"""
        self.is_loading = True
        self.current_progress = 0.0
        try:
            print(f"--- Начинается загрузка модели: {model_size} ---")
            # Загружаем модель в указанную папку
            self.model = WhisperModel(
                model_size,
                device=device,
                compute_type=compute_type,
                download_root=str(self.models_dir),
            )

            # Важный шаг: 'прогрев' модели
            # Это предотвращает долгую паузу при самой первой транскрибации
            self._warmup()

            self.current_model_name = model_size
            print(f"--- Модель {model_size} готова к работе ---")
        except Exception as e:
            print(f"Ошибка при загрузке модели: {e}")
        finally:
            self.is_loading = False

    # Прогрев модели коротким аудио тишины
    def _warmup(self) -> None:
        """Прогрев runtime-движка модели коротким пустым сигналом [10]"""
        if self.model:
            # Мы просто просим модель 'увидеть' пустой список данных
            # Это инициализирует внутренние буферы CTranslate2
            try:
                # В качестве warmup можно передать очень короткий массив тишины
                import numpy as np

                dummy_audio = np.zeros(16000, dtype=np.float32)  # 1 сек тишины
                list(self.model.transcribe(dummy_audio, beam_size=1))
            except:
                pass

    # Получение готовности модели
    def get_status(self) -> dict[str, any]:
        """
        Метод для 'пинг-понга' статуса с JavaScript [11].
        Возвращает текущее состояние менеджера.
        """
        return {
            "model_name": self.current_model_name,
            "is_loading": self.is_loading,
            "is_ready": self.model is not None,
            "progress": round(self.current_progress, 1),
        }

    # Получение текущего прогресса выполнения модели
    def set_progress(self, value: float) -> None:
        """Метод для обновления прогресса извне (например, из транскрибатора)"""
        self.current_progress = value
