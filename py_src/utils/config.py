"""
Управление настройками приложения
Хранение и загрузка пользовательских настроек
"""

import json
import os
from pathlib import Path


class ConfigManager:
    def __init__(self):
        """Инициализация менеджера настроек"""
        # Определяем путь к файлу конфиг относительно этого скрипта
        self.config_path = Path(__file__).parents[2] / "config.json"

        # Дефолтные настройки (на случай, если файла нет или он битый)
        self.defaults = {
            "model_size": "base",
            "source_language": "auto",
            "translate_to_english": False,
            "hotkey_record": "ctrl+shift+space",
            "operation_mode": "file",
            "audio_input_dir": "",
            "text_output_dir": "",
            "generate_subtitles": True,
        }

        self.data = self.load()

    # Загрузка настроек
    def load(self) -> dict:
        """Загружает конфиг из файла или возвращает дефолт"""
        if not os.path.exists(self.config_path):
            print("⚠️ Config file not found. Creating default...")
            self.save(self.defaults)
            return self.defaults.copy()

        try:
            with open(self.config_path, "r", encoding="utf-8") as f:
                loaded_data = json.load(f)
                # Объединяем с дефолтом, чтобы не потерять новые ключи в будущем
                return {**self.defaults, **loaded_data}
        except (json.JSONDecodeError, Exception) as e:
            print(f"❌ Error loading config: {e}. Using defaults.")
            return self.defaults.copy()

    # Сохранение настроек
    def save(self, data=None):
        """Сохранить настройки в файл"""
        # Сохранить файл, если он был изменен
        if data is None:
            data = self.data

        try:
            with open(self.config_path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=4, ensure_ascii=False)
            print("✅ Config saved successfully.")
        except Exception as e:
            print(f"❌ Error saving config: {e}")

    #  Получение настройки
    def get(self, key, default=None):
        """Получить значение настройки"""
        return self.data.get(key, default)

    #  Получение всех настроек
    def get_all(self) -> dict:
        """Получить все настройки"""
        return self.data

    #  Установка настройки
    def set(self, key, value):
        """Установить значение настройки"""
        self.data[key] = value
