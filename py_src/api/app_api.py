"""
API точки для взаимодействия с веб-интерфейсом
Обрабатывает вызовы из JavaScript через pywebview
"""

import json
import os
import subprocess
import threading
from pathlib import Path

import webview

import py_src.utils.file_operations as file_op
from py_src.core.model_manager import ModelManager
from py_src.core.transcriber import WhisperTranscriber
from py_src.utils.config import ConfigManager


class AppAPI:
    def __init__(self):
        """Инициализация API сервисов"""
        self._window: webview.Window = None
        self.config_manager = ConfigManager()
        self.model_manager = ModelManager()
        self.transcriber = WhisperTranscriber(self.model_manager)
        self._is_canceled = False  # отмена пользователем

    def set_window(self, window: webview.Window) -> None:
        """Установка ссылки на окно pywebview для диалогов и событий"""
        self._window = window

    # --- Управление транскрибацией ---

    def start_transcription(self, file_path: str) -> dict[str, str]:
        """
        Запуск процесса расшифровки в отдельном потоке.
        """
        # Сбрасываем флаг перед новым запуском
        self._is_cancelled = False

        if not self.model_manager.model:
            return {"status": "error", "message": "Модель не загружена"}

        config = self.config_manager.get_all()
        language = config.get("source_language", "auto")
        translate = config.get(
            "translate_to_english", False
        )  # Читаем состояние чекбокса

        # Запускаем в потоке-демоне, чтобы не блокировать UI и корректно завершать приложение
        thread = threading.Thread(
            target=self._run_transcription_loop,
            args=(file_path, language, translate),
            daemon=True,
        )
        thread.start()

        return {"status": "started"}

    def cancel_transcription(self):
        """Метод вызывается из JS при нажатии кнопки Отмена"""
        self._is_cancelled = True
        return {"status": "cancelled"}

    def _run_transcription_loop(
        self, file_path: str, language: str, translate: bool = False
    ):
        """Внутренний цикл перебора сегментов и отправки их в JS"""
        try:
            # Получаем генератор из транскрибатора
            segments_generator = self.transcriber.transcribe(
                file_path=file_path, language=language, translate=translate
            )

            for segment in segments_generator:
                if self._is_cancelled:
                    print("--- Транскрибация прервана пользователем ---")
                    # Можно отправить в JS событие, что отмена принята
                    if self._window:
                        self._window.evaluate_js("handleTranscriptionEnd()")
                    return

                # Кодируем сегмент в JSON для безопасной передачи в JS
                segment_json = json.dumps(segment, ensure_ascii=False)

                # Вызываем JS-функцию handleNewSegment на фронтенде
                if self._window:
                    self._window.evaluate_js(f"handleNewSegment({segment_json})")

            # Сообщаем JS, что всё закончилось
            if self._window:
                self._window.evaluate_js("handleTranscriptionEnd()")

        except Exception as e:
            print(f"Ошибка в цикле транскрибации: {e}")
            if self._window:
                self._window.evaluate_js(f"console.error('Transcription error: {e}')")

    # --- Методы управления моделью ---

    def load_whisper_model(self) -> dict[str, str]:
        """
        Загружает модель, используя параметры из конфига.
        Вызывается из JS при смене модели или старте.
        """
        config = self.config_manager.get_all()
        model_size = config.get("model_size", "")

        if not model_size:
            return {"status": "error", "message": "Модель не выбрана"}

        # Запускаем загрузку (внутри ModelManager она уйдет в поток)
        self.model_manager.load_model(model_size=model_size)
        return {"status": "started", "model": model_size}

    def get_model_status(self) -> dict[str, any]:
        """
        Метод для 'пинг-понга'. JS вызывает его через setInterval,
        чтобы обновлять индикатор статуса и прогрессбар загрузки.
        """
        return self.model_manager.get_status()

    # Получение метаданных аудиофайла
    def get_file_data(self) -> dict:
        """Выбор аудио/видео файла и возврат данных на фронтенд"""
        try:
            input_dir = self.config_manager.get("audio_input_dir")
            file_path = file_op.open_file_dialog(self._window, input_dir)
            if not file_path:
                return {}

            # Добавляем путь к папке с аудио в config файл
            directory = str(Path(file_path).parent)
            if input_dir != directory:  # Если папка не совпадает с предыдущей
                self.config_manager.set("audio_input_dir", directory)
                self.config_manager.save()

            # Получение метаданных файла
            duration_raw, size_raw = file_op.get_file_metadata(file_path)

            if duration_raw == 0:
                return {"status": "error", "message": "Invalid file"}

            return {
                "status": "success",
                "file_name": os.path.basename(file_path),
                "file_path": file_path,
                "duration_label": file_op.format_duration(duration_raw),  # "05:20"
                "size_label": file_op.format_size(size_raw),  # "12.45 МБ"
                "duration_seconds": duration_raw,  # Оставим для логики
            }
        except Exception as e:
            print(f"Error in open_file_dialog: {e}")
            return {"status": "error", "message": str(e)}

    # Сохранение текста в файл
    def save_text(self, text: str, is_subtitle_file=False) -> str | None:
        """Сохранение текста в файл"""
        output_dir = self.config_manager.get("text_output_dir")
        file_path = file_op.save_file_dialog(self._window, output_dir, is_subtitle_file)
        if not file_path:
            return

        # Если это субтитры, можно добавить нумерацию блоков (1, 2, 3...)
        final_content = text
        if is_subtitle_file:
            final_content = file_op.add_srt_numeration(text)

        file_op.save_text_file(final_content, file_path)
        directory = str(Path(file_path).parent)
        if output_dir != directory:  # Если папка не совпадает с предыдущей
            self.config_manager.set("text_output_dir", directory)
            self.config_manager.save()

        return file_path

    # --- Методы работы с конфигурацией (нужны для ui-manager.js) ---

    def load_config(self) -> dict[str, any]:
        """Возвращает все текущие настройки приложения"""
        return self.config_manager.get_all()

    def set_setting(self, key: str, value: any) -> bool:
        """Устанавливает конкретный параметр в памяти"""
        try:
            self.config_manager.set(key, value)
            return True
        except Exception:
            return False

    def save_config(self) -> bool:
        """Физически записывает настройки из памяти в config.json"""
        return self.config_manager.save()

    # --- Заглушки для будущих этапов ---
    # Альтернативный метод с другой реализацией
    # def get_file_data(self) -> dict[str, any]:
    #     """Выбор файла через диалог (логика будет в file_operations)"""
    #     # Сюда мы позже подключим ваш open_file_dialog
    #     return {"status": "error", "message": "Метод еще не реализован"}

    # region Заглушки на будущее (решил пока не удалять)

    def start_recording(self):
        """Начать запись с микрофона"""
        pass

    def stop_recording(self):
        """Остановить запись с микрофона"""
        pass

    def transcribe_file(self, file_path, language="auto", translate=False):
        """Транскрибировать аудиофайл"""
        pass

    def transcribe_audio_data(self, audio_data, language="auto", translate=False):
        """Транскрибировать аудиоданные из микрофона"""
        pass

    def get_available_models(self):
        """Получить список доступных моделей"""
        pass

    def save_transcription(self, text, file_path, format="txt"):
        """Сохранить транскрибацию в файл"""
        pass

    def create_subtitles(self, text, file_path):
        """Создать файл субтитров (.srt) из текста"""
        pass

    # endregion
