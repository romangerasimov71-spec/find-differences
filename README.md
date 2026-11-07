# Найди отличия: Новый год

Уютная головоломка «найди отличия» для VK Игр, Одноклассников и Playgama: две почти одинаковые новогодние
картинки, игрок тапает по различиям. Вся графика — SVG в коде, без внешних картинок.

- 100 уровней (генерируются по номеру), 8 фонов, 48 предметов, от 3 до 7 отличий, каждый 10-й — праздничный.
- 3 сердечка, звёзды за точность, подсказки, зум с 21-го уровня, обучение на 1–3, ежедневный подарок.
- VK/OK: облачные сохранения, реклама (межстраничная, за вознаграждение), приглашение друзей, «поделиться», избранное.
- Playgama: отдельная сборка на Playgama Bridge SDK, EN + RU.

## Структура
```
src/                    игра
  index.html, css/style.css
  js/i18n.js            тексты RU/EN
  js/art.js             библиотека SVG-предметов
  js/bounds.js          замеры предметов (генерирует tools/gen-bounds.js)
  js/scenes.js          фоны и слоты сцен
  js/levels.js          генератор уровней
  js/audio.js           звук из файлов (WebAudio)
  js/game.js            экраны и логика
  js/platform.js        VK и OK (VK Bridge с таймаутами)
  js/platform-playgama.js  Playgama Bridge
  js/vk-bridge.min.js   VK Bridge 3.0.2 (MIT)
  assets/sfx, assets/music, assets/CREDITS.txt
playgama/               playgama-bridge-config.json
vk-assets/              иконка, фавикон, обложка, история, скриншоты, TEXTS.md (тексты карточки)
playgama-assets/        обложки 800×800, 1080×1920, 1920×1080
tools/                  тесты и генераторы
DECISIONS.md            решения и почему
```

## Сборка и проверка
Нужны Node.js и Playwright с Chromium (`npm i` ставит esbuild).
```bash
./build.sh                         # автотест 100 уровней + dist/vk, dist/playgama и два zip-архива
node tools/test-levels.js          # автотест уровней

# тесты в браузере (нужен сервер):
(cd src && python3 -m http.server 8123 &)
node tools/play.js /tmp/out 1 2 3 4 5 21 51   # прохождение уровней 390×844 со скриншотами
node tools/vk-mock-test.js                     # VK и OK на подставном мосте
(cd dist/playgama && python3 -m http.server 8124 &)
node tools/playgama-mock-test.js               # сборка Playgama на подставном SDK

node tools/gen-bounds.js           # после изменений в art.js
node tools/make-assets.js          # пересоздать материалы карточек
```

## Публикация
- VK/OK: содержимое `dist/vk/` лежит в ветке `gh-pages` → GitHub Pages
  `https://romangerasimov71-spec.github.io/find-differences/`. Ссылку указать в настройках игры на dev.vk.ru.
- Playgama: `dist/find-differences-playgama.zip` — загружать после замены звуков на настоящие.
