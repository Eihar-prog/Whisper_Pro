"""
Вспомогательные функции для работы с файлами
Сохранение, чтение, форматирование
"""

from pathlib import Path

# Форматы поддерживаемых расширений
audio_extensions = "*.mp3;*.ogg;*.flac;*.wav;*.m4a;*.opus;*.aac"
video_extensions = "*.mp4;*.mkv;*.avi;*.mov;*.wmv;*.webm;*.flv;*.m4v;*.3gp"

# Путь к ffprobe
ffprobe_path = Path(__file__).parents[2] / "ffmpeg" / "bin" / "ffprobe.exe"


def save_text_file(text, file_path, encoding="utf-8"):
    """Сохранить текст в файл"""
    pass


def save_subtitle_file(text, file_path):
    """Создать и сохранить файл субтитров в формате SRT"""
    pass


def validate_audio_file(file_path):
    """Проверить, является ли файл допустимым аудиоформатом"""
    pass


def get_supported_formats():
    """Получить список поддерживаемых аудиоформатов"""
    pass
