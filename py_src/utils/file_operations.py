"""
Вспомогательные функции для работы с файлами
Сохранение, чтение, форматирование
"""

import json
import subprocess
from pathlib import Path

import webview

# Путь к ffprobe
ffprobe_path = Path(__file__).parents[2] / "ffmpeg" / "bin" / "ffprobe.exe"

#  Путь к json файлу поддерживаемых форматов
supported_formats_path = Path(__file__).parents[2] / "supported_formats.json"

# Сохраняем путь к открытому файлу (нужно для файла субтитров)
open_file_path = None


# Сохранение текста в файл
def save_text_file(text, file_path, encoding="utf-8"):
    """Сохранить текст в файл"""
    try:
        with open(file_path, "w", encoding=encoding) as f:
            f.write(text)
        print(f"✅ Файл сохранён: {file_path}")
        return True
    except PermissionError:
        print(f"❌ Нет прав на запись: {file_path}")
        return False
    except OSError as e:
        print(f"❌ Ошибка при сохранении: {e}")
        return False


def save_subtitle_file(text, file_path):
    """Создать и сохранить файл субтитров в формате SRT"""
    pass


def validate_audio_file(file_path):
    """Проверить, является ли файл допустимым аудиоформатом"""
    pass


#  Диалог сохранения файла
def save_file_dialog(
    window: webview.Window, output_dir="/", is_subtitle_file=False
) -> str | None:
    """Открыть диалог сохранения файла"""

    file_name_only = Path(open_file_path).stem if open_file_path else "output"

    result = window.create_file_dialog(
        webview.FileDialog.SAVE,
        directory=output_dir,
        save_filename=(
            f"{file_name_only}.srt" if is_subtitle_file else f"{file_name_only}.txt"
        ),
        file_types=(
            ("SubRip Subtitle (*.srt)",) if is_subtitle_file else ("Text file (*.txt)",)
        ),
    )

    if result:
        save_path = result[0]
        print(f"Saved to {save_path}")
        return save_path

    print("User cancelled save dialog")
    return None


# Загрузка поддерживаемых форматов
def load_supported_formats(json_path: str = "supported_formats.json") -> dict:
    """Загрузить поддерживаемые форматы из JSON файла"""
    with open(json_path, "r", encoding="utf-8") as f:
        return json.load(f)


# Диалог выбора файла
def open_file_dialog(
    window: webview.Window,
    input_dir: str,
    formats_json_path=supported_formats_path,
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
        directory=input_dir,
        allow_multiple=False,
        file_types=file_types,
    )
    if file_path_tuple:
        global open_file_path
        open_file_path = file_path_tuple[0]
        return open_file_path
    return None


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


def add_srt_numeration(text: str) -> str:
    """Превращает сырые таймкоды в нумерованные блоки SRT"""
    blocks = text.split("\n\n")
    # Добавим strip для самих блоков, чтобы пустые строки не дублировались
    numbered_blocks = [
        f"{i+1}\n{block.strip()}" for i, block in enumerate(blocks) if block.strip()
    ]
    return "\n\n".join(numbered_blocks)
