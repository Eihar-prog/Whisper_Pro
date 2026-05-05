"""
Вспомогательные функции для работы с файлами
Сохранение, чтение, форматирование
"""

import json
from pathlib import Path
import subprocess
import webview

# Путь к ffprobe
ffprobe_path = Path(__file__).parents[2] / "ffmpeg" / "bin" / "ffprobe.exe"

#  Путь к json файлу поддерживаемых форматов
supported_formats_path = Path(__file__).parents[2] / "supported_formats.json"


def save_text_file(text, file_path, encoding="utf-8"):
    """Сохранить текст в файл"""
    pass


def save_subtitle_file(text, file_path):
    """Создать и сохранить файл субтитров в формате SRT"""
    pass


def validate_audio_file(file_path):
    """Проверить, является ли файл допустимым аудиоформатом"""
    pass


# Загрузка поддерживаемых форматов
def load_supported_formats(json_path: str = "supported_formats.json") -> dict:
    """Загрузить поддерживаемые форматы из JSON файла"""
    with open(json_path, "r", encoding="utf-8") as f:
        return json.load(f)


# Диалог выбора файла
def open_file_dialog(
    window: webview.Window, formats_json_path=supported_formats_path
) -> str | None:
    """Открыть диалог выбора файла с фильтрацией из JSON"""
    formats = load_supported_formats(formats_json_path)

    # Создаем маски
    audio_extensions = formats["audio"]["extensions"]
    video_extensions = formats["video"]["extensions"]

    audio_mask = ";".join(f"*{ext}" for ext in audio_extensions)
    video_mask = ";".join(f"*{ext}" for ext in video_extensions)

    audio_filter_name = formats["audio"]["filter"]
    video_filter_name = formats["video"]["filter"]

    # ПРАВИЛЬНЫЙ ФОРМАТ: описание и маска вместе в одной строке
    file_types = [
        f"{audio_filter_name} ({audio_mask})",
        f"{video_filter_name} ({video_mask})",
        "All files (*.*)",
    ]

    file_path_tuple = window.create_file_dialog(
        webview.FileDialog.OPEN,
        allow_multiple=False,
        file_types=file_types,
    )
    return file_path_tuple[0] if file_path_tuple else None


#  Получение метаданных аудио или видео файла
def get_file_metadata(file_path: str) -> tuple[int, int]:
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


# Форматирование duration в удобном виде
def format_duration(seconds: int) -> str:
    """Превращает секунды в 00:00 или 00:00:00"""
    mins, secs = divmod(seconds, 60)
    hrs, mins = divmod(mins, 60)

    if hrs > 0:
        return f"{hrs:02}:{mins:02}:{secs:02}"
    return f"{mins:02}:{secs:02}"


# Форматирует размер файла в удобном виде
def format_size(size_bytes: int) -> str:
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
