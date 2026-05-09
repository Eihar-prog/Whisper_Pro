"""
Модуль транскрибации с использованием Whisper
Обработка аудио и получение текста
"""

import time
from typing import Generator
from py_src.core.model_manager import ModelManager


class WhisperTranscriber:
    def __init__(self, model_manager: ModelManager):
        """
        Инициализация транскрибатора.
        :param model_manager: Экземпляр менеджера моделей для доступа к загруженной модели.
        """
        self.model_manager = model_manager

    def transcribe(
        self, file_path: str, language: str = None, beam_size: int = 5
    ) -> Generator[dict[str, any], None, None]:
        """
        Основной метод транскрибации файла.
        Работает как генератор, отдавая сегменты по мере готовности.
        """
        # Проверяем, готова ли модель в менеджере
        model = self.model_manager.model
        if not model:
            print("Ошибка: попытка транскрибации без загруженной модели")
            yield {"error": "Модель не загружена"}
            return

        # Запускаем транскрибацию через faster-whisper
        # transcribe возвращает кортеж (генератор сегментов, информация об аудио)
        segments, info = model.transcribe(
            file_path,
            beam_size=beam_size,
            language=(
                language if language != "auto" else None
            ),  # Whisper сам поймет язык, если передать None
            word_timestamps=False,  # Для базовой версии сегментов достаточно
        )

        # Длительность аудио для расчета прогресса [6]
        duration = info.duration

        print(f"--- Начало обработки файла: {file_path} ---")
        print(f"Длительность: {duration:.2f} сек, Язык: {info.language}")

        for segment in segments:
            # Вычисляем прогресс, но ограничиваем его 99.9%,
            # чтобы 100% было только в самом финале
            raw_progress = (segment.end / duration) * 100
            progress = min(raw_progress, 99.9)

            # Обновляем прогресс в ModelManager, чтобы JS-polling видел актуальную цифру
            self.model_manager.set_progress(progress)

            # Возвращаем данные сегмента для API
            yield {
                "text": segment.text,
                "start": round(segment.start, 2),
                "end": round(segment.end, 2),
                "progress": round(progress, 1),
            }

        # По завершении гарантируем 100% прогресс
        self.model_manager.set_progress(100.0)
        print("--- Транскрибация завершена ---")
