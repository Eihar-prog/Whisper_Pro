"""
Точка входа в приложение Whisper Pro
Инициализирует pywebview и запускает веб-интерфейс с локальным сервером или безсерверный режим
"""

import sys
import webview
from pathlib import Path

from py_src.api.app_api import AppAPI

# Установка UTF-8 для корректного вывода кириллицы в консоль Windows.
sys.stdout.reconfigure(encoding="utf-8")

# Путь к html файлу
html_file_path = str(Path(__file__).parent / "index.html")


def setup_webview() -> webview.Window:
    """Настройка параметров окна pywebview"""
    window = webview.create_window(
        title="Whisper Pro",
        url=html_file_path,
        width=1200,
        height=825,
        min_size=(950, 825),
        background_color="#0F172A",
    )

    return window


def main():
    """Основная функция запуска приложения"""
    api = AppAPI()
    window = setup_webview()
    window._js_api = api
    api.set_window(window)
    webview.start(debug=False)


if __name__ == "__main__":
    main()
