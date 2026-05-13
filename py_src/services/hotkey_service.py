"""
Служба обработки горячих клавиш
Обработка глобальных комбинаций клавиш для запуска/останова записи
"""

import queue
import threading
import time
from typing import Callable, Optional

import keyboard


class HotKeyService:
    def __init__(self, callback_function: Callable[[str], None]):
        """
        Инициализация службы горячих клавиш
        :param callback_function: Функция, которая будет вызвана при нажатии горячей клавиши
        """
        self.callback_function = callback_function
        self.current_hotkey: Optional[str] = None
        self.is_registered = False
        self.last_error: Optional[str] = None
        self._capture_thread: Optional[threading.Thread] = None
        self._capture_cancel = threading.Event()
        self._capture_hook = None
        self._capture_callback: Optional[Callable[[Optional[str]], None]] = None
        self._captured_hotkey: Optional[str] = None
        self._previous_hotkey: Optional[str] = None
        self._lock = threading.Lock()

    def register_hotkey(self, hotkey_combination: str) -> bool:
        """
        Зарегистрировать горячую клавишу
        :param hotkey_combination: Строка комбинации клавиш (например, "ctrl+shift+r")
        :return: Успешность регистрации
        """
        try:
            self.last_error = None
            hotkey_combination = self.normalize_hotkey(hotkey_combination)
            if not hotkey_combination:
                self.last_error = "Hotkey is empty"
                return False

            if self.is_registered and self.current_hotkey:
                self.unregister_hotkey()

            keyboard.parse_hotkey(hotkey_combination)

            # Регистрируем комбинацию с подавлением передачи дальше
            keyboard.add_hotkey(
                hotkey_combination,
                self._on_hotkey_pressed,
                suppress=True,  # Это предотвратит передачу клавиш дальше в приложения
            )
            self.current_hotkey = hotkey_combination
            self.is_registered = True

            print(f"Горячая клавиша зарегистрирована: {hotkey_combination}")
            return True
        except Exception as e:
            self.last_error = str(e)
            print(f"Ошибка регистрации горячей клавиши: {self.last_error}")
            return False

    def unregister_hotkey(self) -> bool:
        """
        Отменить регистрацию горячей клавиши
        :return: Успешность отмены регистрации
        """
        try:
            self.last_error = None
            if self.current_hotkey and self.is_registered:
                keyboard.remove_hotkey(self.current_hotkey)
                self.current_hotkey = None
                self.is_registered = False
                print("Регистрация горячей клавиши отменена")
            return True
        except Exception as e:
            self.last_error = str(e)
            print(f"Ошибка отмены регистрации горячей клавиши: {self.last_error}")
            return False

    def normalize_hotkey(self, hotkey_combination: str) -> str:
        """Привести hotkey к стабильному QWERTY-формату библиотеки keyboard."""
        hotkey = hotkey_combination.strip().lower()

        # keyboard может вернуть букву активной раскладки. Для hotkey нам нужна
        # физическая QWERTY-клавиша, чтобы Ctrl+Shift+Z не превращался в Ctrl+Shift+Я.
        ru_to_en = str.maketrans(
            {
                "й": "q",
                "ц": "w",
                "у": "e",
                "к": "r",
                "е": "t",
                "н": "y",
                "г": "u",
                "ш": "i",
                "щ": "o",
                "з": "p",
                "ф": "a",
                "ы": "s",
                "в": "d",
                "а": "f",
                "п": "g",
                "р": "h",
                "о": "j",
                "л": "k",
                "д": "l",
                "я": "z",
                "ч": "x",
                "с": "c",
                "м": "v",
                "и": "b",
                "т": "n",
                "ь": "m",
                "і": "s",
                "ґ": "\\",
            }
        )
        hotkey = hotkey.translate(ru_to_en)

        replacements = {
            "numpad 0": "num 0",
            "numpad 1": "num 1",
            "numpad 2": "num 2",
            "numpad 3": "num 3",
            "numpad 4": "num 4",
            "numpad 5": "num 5",
            "numpad 6": "num 6",
            "numpad 7": "num 7",
            "numpad 8": "num 8",
            "numpad 9": "num 9",
            "numpad +": "num plus",
            "numpad -": "num -",
            "numpad *": "num *",
            "numpad /": "num /",
            "numpad .": "decimal",
            "numpad enter": "num enter",
        }

        for old, new in replacements.items():
            hotkey = hotkey.replace(old, new)

        return hotkey

    def start_capture(self, capture_callback: Callable[[Optional[str]], None]) -> bool:
        """
        Начать нативный захват новой комбинации клавиш.
        :param capture_callback: Функция, которая получит строку горячей клавиши
        :return: Успешность запуска режима захвата
        """
        with self._lock:
            if self._capture_thread and self._capture_thread.is_alive():
                self.last_error = "Hotkey capture already started"
                return False

            self.last_error = None
            self._captured_hotkey = None
            self._capture_callback = capture_callback
            self._capture_cancel.clear()
            self._previous_hotkey = self.current_hotkey if self.is_registered else None

            if self.is_registered:
                self.unregister_hotkey()

            with keyboard._pressed_events_lock:
                keyboard._pressed_events.clear()

            self._capture_thread = threading.Thread(
                target=self._capture_hotkey,
                daemon=True,
            )
            self._capture_thread.start()
            return True

    def cancel_capture(self) -> bool:
        """Отменить активный захват горячей клавиши."""
        self._capture_cancel.set()
        self._captured_hotkey = None
        if self._capture_hook:
            try:
                keyboard.unhook(self._capture_hook)
            except Exception:
                pass
            self._capture_hook = None

        if self._previous_hotkey:
            self.register_hotkey(self._previous_hotkey)
        return True

    def save_captured_hotkey(self) -> Optional[str]:
        """
        Зарегистрировать последнюю захваченную комбинацию.
        :return: Строка hotkey или None, если сохранять нечего
        """
        if not self._captured_hotkey:
            self.last_error = "No captured hotkey to save"
            return None

        hotkey = self._captured_hotkey
        if self.register_hotkey(hotkey):
            self._captured_hotkey = None
            self._previous_hotkey = hotkey
            return hotkey

        return None

    def get_current_hotkey(self) -> Optional[str]:
        """Получить текущую зарегистрированную комбинацию."""
        return self.current_hotkey

    def format_hotkey_for_display(self, hotkey_combination: Optional[str]) -> str:
        """Отформатировать комбинацию для отображения в интерфейсе."""
        if not hotkey_combination:
            return "Не назначена"

        replacements = {
            "ctrl": "Ctrl",
            "shift": "Shift",
            "alt": "Alt",
            "windows": "Win",
            "left": "Left",
            "right": "Right",
            "space": "Space",
            "esc": "Esc",
            "enter": "Enter",
            "tab": "Tab",
            "backspace": "Backspace",
            "delete": "Del",
            "insert": "Ins",
            "home": "Home",
            "end": "End",
            "page up": "PgUp",
            "page down": "PgDn",
            "up": "Up",
            "down": "Down",
        }

        parts = []
        for part in hotkey_combination.split("+"):
            key = part.strip().lower()
            parts.append(replacements.get(key, key.upper() if len(key) == 1 else key.title()))

        return " + ".join(parts)

    def _capture_hotkey(self) -> None:
        events_queue = queue.Queue()
        timeout_seconds = 10
        deadline = time.monotonic() + timeout_seconds

        def capture_handler(event):
            events_queue.put(event)
            return False

        try:
            self._capture_hook = keyboard.hook(capture_handler, suppress=False)

            while not self._capture_cancel.is_set():
                if time.monotonic() >= deadline:
                    self.last_error = "Hotkey capture timed out"
                    if self._capture_hook:
                        keyboard.unhook(self._capture_hook)
                        self._capture_hook = None
                    if self._previous_hotkey:
                        self.register_hotkey(self._previous_hotkey)
                    if self._capture_callback:
                        self._capture_callback(None)
                    return

                try:
                    event = events_queue.get(timeout=0.1)
                except queue.Empty:
                    continue

                if self._capture_cancel.is_set():
                    continue

                if event.event_type != keyboard.KEY_UP:
                    continue

                keyboard.unhook(self._capture_hook)
                self._capture_hook = None

                with keyboard._pressed_events_lock:
                    names = [
                        e.name for e in keyboard._pressed_events.values() if e.name
                    ]
                    keyboard._pressed_events.clear()

                if event.name:
                    names.append(event.name)

                hotkey = keyboard.get_hotkey_name(names)
                hotkey = self.normalize_hotkey(hotkey)
                keyboard.parse_hotkey(hotkey)

                self._captured_hotkey = hotkey
                print(f"Горячая клавиша захвачена: {hotkey}")

                if self._capture_callback:
                    self._capture_callback(hotkey)
                return

            with keyboard._pressed_events_lock:
                keyboard._pressed_events.clear()

            if self._previous_hotkey:
                self.register_hotkey(self._previous_hotkey)
        except Exception as e:
            self.last_error = str(e)
            print(f"Ошибка захвата горячей клавиши: {self.last_error}")
            if self._previous_hotkey:
                self.register_hotkey(self._previous_hotkey)
        finally:
            with keyboard._pressed_events_lock:
                keyboard._pressed_events.clear()
            self._capture_hook = None

    def _on_hotkey_pressed(self) -> None:
        """
        Внутренний метод вызова коллбэка при нажатии горячей клавиши
        """
        if self.callback_function:
            # Вызываем переданную функцию с сообщением
            self.callback_function("hotkey_pressed")


# Пример использования:
if __name__ == "__main__":

    def on_hotkey_pressed(action: str):
        print(f"Горячая клавиша нажата: {action}")

    service = HotKeyService(on_hotkey_pressed)
    service.register_hotkey("ctrl+shift+r")

    # Ждем нажатия клавиш...
    input("Нажмите Enter для выхода...")
    service.unregister_hotkey()
