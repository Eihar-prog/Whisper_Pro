"""
API точки для взаимодействия с веб-интерфейсом
Обрабатывает вызовы из JavaScript через pywebview
"""

import os
from pathlib import Path
import webview
import subprocess
import json

# Форматы поддерживаемых расширений
audio_extensions = "*.mp3;*.ogg;*.flac;*.wav;*.m4a;*.opus;*.aac"
video_extensions = "*.mp4;*.mkv;*.avi;*.mov;*.wmv;*.webm;*.flv;*.m4v;*.3gp"


class AppAPI:
    def __init__(self):
        """Инициализация API сервисов"""
        self._window = None

    def set_window(self, window: webview.Window):
        """Привязка окна pywebview к API"""
        if not self._window:
            self._window = window

    # ----------------------------------------------------------------------------
    #       Выбор файла, метаданные, форматирование
    # ----------------------------------------------------------------------------
    # region

    # Диалог выбора файла
    def open_file_dialog(self) -> dict:
        """Выбор аудио/видео файла и возврат данных на фронтенд"""
        file_types = (
            f"Audio files ({audio_extensions})",
            f"Video files ({video_extensions})",  # Добавил скобки для красоты
            "All files (*.*)",
        )

        try:
            # Диалог выбора файла
            file_path_tuple = self._window.create_file_dialog(
                webview.FileDialog.OPEN,
                allow_multiple=False,
                file_types=file_types,
            )

            if not file_path_tuple:
                return {}

            file_path = file_path_tuple[0]
            duration_raw, size_raw = self.get_file_metadata(file_path)

            if duration_raw == 0:
                return {"status": "error", "message": "Invalid file"}

            return {
                "status": "success",
                "file_name": os.path.basename(file_path),
                "file_path": file_path,
                "duration_label": self.format_duration(duration_raw),  # "05:20"
                "size_label": self.format_size(size_raw),  # "12.45 МБ"
                "duration_seconds": duration_raw,  # Оставим для логики
            }
        except Exception as e:
            print(f"Error in open_file_dialog: {e}")
            return {"status": "error", "message": str(e)}

    #  Получение метаданных аудио или видео файла
    def get_file_metadata(self, file_path: str) -> tuple[int, int]:
        """Получить метаданные аудиофайла (длительность, размер)"""
        # parents[2] — это три уровня вверх от файла со скриптом
        ffprobe_path = Path(__file__).parents[2] / "ffmpeg" / "bin" / "ffprobe.exe"

        cmd = [
            str(ffprobe_path),
            "-v",
            "error",
            "-show_entries",
            "format=duration,size",  # Убрали select_streams для универсальности
            "-of",
            "json",
            file_path,
        ]

        # capture_output=True автоматически разделит stdout и stderr
        result = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8")

        if result.returncode != 0:
            raise RuntimeError(f"FFprobe error: {result.stderr}")

        data = json.loads(result.stdout)

        # Используем .get() на случай, если файл странный и какое-то поле отсутствует
        duration_seconds = int(float(data.get("format", {}).get("duration", 0)))
        size_bytes = int(data.get("format", {}).get("size", 0))

        return duration_seconds, size_bytes

    def format_size(self, size_bytes: int) -> str:
        """Превращает байты в МБ или ГБ"""
        if size_bytes == 0:
            return "0 Б"

        # Делим на 1024^2 для МБ
        size_mb = size_bytes / (1024 * 1024)

        if size_mb < 1024:
            return f"{size_mb:.2f} МБ"

        # Если вдруг файл больше гигабайта
        size_gb = size_mb / 1024
        return f"{size_gb:.2f} ГБ"

    def format_duration(self, seconds: int) -> str:
        """Превращает секунды в 00:00 или 00:00:00"""
        mins, secs = divmod(seconds, 60)
        hrs, mins = divmod(mins, 60)

        if hrs > 0:
            return f"{hrs:02}:{mins:02}:{secs:02}"
        return f"{mins:02}:{secs:02}"

    # endregion

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
