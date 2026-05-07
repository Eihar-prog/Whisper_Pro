"""
API точки для взаимодействия с веб-интерфейсом
Обрабатывает вызовы из JavaScript через pywebview
"""

import os
from pathlib import Path
import webview
import subprocess
import json

import py_src.utils.file_operations as file_op
from py_src.utils.config import ConfigManager


class AppAPI:
    def __init__(self):
        """Инициализация API сервисов"""
        self._window = None
        self.config_manager = ConfigManager()

    def set_window(self, window: webview.Window):
        """Привязка окна pywebview к API"""
        if not self._window:
            self._window = window

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

        file_op.save_text_file(text, file_path)
        directory = str(Path(file_path).parent)
        if output_dir != directory:  # Если папка не совпадает с предыдущей
            self.config_manager.set("text_output_dir", directory)
            self.config_manager.save()

        return file_path

    # Загрузка прошлых настроек
    def load_config(self) -> dict:
        """Загрузка настроек приложения"""
        return self.config_manager.load()

    # Установка настройки
    def set_setting(self, key, value) -> dict:
        """Установка настройки"""
        self.config_manager.set(key, value)

    # Сохраняем настройки в файл
    def save_config(self):
        """Сохранение настроек в файл"""
        self.config_manager.save()

    def get_status(self):
        """Получение текущего статуса приложения"""
        pass

    def load_model(self, model_name):
        """Загрузка указанной модели Whisper"""
        pass

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
