"""
Управление настройками приложения
Хранение и загрузка пользовательских настроек
"""

import json


class ConfigManager:
    def __init__(self, config_file_path="config.json"):
        """Инициализация менеджера настроек"""
        self.config_file_path = config_file_path
        self.config = self.load_config()
        self.is_modified = False

    def load_config(self) -> dict:
        """Загрузить настройки из файла"""
        config = json.load(self.config_file_path)
        return config

    def save_config(self):
        """Сохранить настройки в файл"""

        # Сохранить файл, если он был изменен
        if self.is_modified:
            with open(self.config_file_path, "w", encoding="utf-8") as f:
                f.write(json.dumps(self.config, ensure_ascii=False))

    def get_setting(self, key, default=None):
        """Получить значение настройки"""
        return self.config.get(key, default)

    def set_setting(self, key, value):
        """Установить значение настройки"""
        self.config[key] = value
        self.is_modified = True
