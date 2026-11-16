# find-differences — правила для работы

- Игра в VK/OK: ID 54882213. В «Размещении» VK стоит GitHub Pages:
  https://romangerasimov71-spec.github.io/find-differences/ (ветка `gh-pages`).
- **После любого изменения игры обязательно обнови gh-pages свежей VK-сборкой:** `./tools/deploy-pages.sh`
  (собирает с автотестом и выкладывает `dist/vk`). Без этого игроки VK/OK получат старую версию.
- Хостинг VK (`@vkontakte/vk-miniapps-deploy`) не используем: боевой деплой требует пуш-подтверждения, которое не приходит.
- Playgama: игра `cmw6bhwjx0ebxno0hb68dkkzf`. После новой сборки — загрузка через коннектор и повторная сертификация в QA Tool;
  публикация в песочницу и обновление каталога — только с согласия пользователя.
- Тесты: см. README («Сборка и проверка»).

## Android / RuStore
- Android-приложение — WebView с VK-сборкой `dist/vk` из assets (`android/`, пакет `ru.german71.finddifferences`,
  minSdk 24, targetSdk 35, портрет и альбом, без разрешений — даже без INTERNET). Схема та же, что у «Новогодней
  сортировки» (`ornament-sort/android`). versionName — `GAME_VERSION` в начале `src/js/game.js` (поднимать к каждой новой
  загрузке), versionCode — поле `versionCode` при запуске сборки (для каждой новой загрузки в RuStore +1).
- Признак приложения — `FindDifferencesAndroid/<версия>` в user agent (`ANDROID` в `src/js/platform.js`, площадка `android`):
  мост VK не вызывается, рекламы нет (ни межстраничной, ни её заглушки, ни «за награду»), нет «Друзья», «Поделиться»,
  избранного, строки «Поддержка и новинки: vk.com/…» и ссылок наружу; язык — по телефону (ru/uk/be/kk → русский, иначе
  английский); сохранение — localStorage WebView (ключ `fd_ny_android_v2`); вибрации нет (нет разрешения).
- Бонусы за рекламу в приложении **скрыты** (решение сборщика 16 ноя, как в Сортировке и как на Playgama без рекламы):
  нет «Забрать ×2» у подарка дня и «Продолжить» после проигрыша; подсказки — только бесплатные (3 на старте + подарок дня),
  кончились — на кнопке «0» и сообщение «Подсказки закончились. Новые — в подарке дня». Бесплатными их не делали:
  бесконечные подсказки сильнее ломают головоломку, чем их нехватка.
- «Назад» Android — `FDGame.back()`: закрыть открытое окно (пауза → продолжить, победа/проигрыш → меню), в игре — пауза,
  с карты уровней — в меню; в меню — `false`, приложение закрывается. Свернули — `FDGame.appPause(true)` (пауза и тишина),
  вернулись — звук обратно, пауза до нажатия.
- В ВК/ОК/Playgama и в браузере признака нет — всё как было (`tools/vk-mock-test.js`, `tools/playgama-mock-test.js`).
- Проверка режима приложения: `tools/android-test.js` на `dist/vk` (как запускать — в начале файла).
- **APK собирается не здесь**, а в `romangerasimov71-spec/ornament-sort` (там секреты подписи, ключ один на все игры студии):
  Actions → «Android APK (other games)» → game = `find-differences` (или `gh api -X POST
  repos/romangerasimov71-spec/ornament-sort/actions/workflows/android-other.yml/dispatches -f ref=main -f 'inputs[game]=find-differences'`).
  Он берёт `main` этого репозитория, `npm ci` + `SKIP_LEVEL_TEST=1 ./build.sh`, кладёт `dist/vk` в
  `android/app/src/main/assets/www/` (в git её нет) и собирает. Готовый APK — в ветке `rustore-build` репозитория
  `ornament-sort`: `apk/find-differences-<версия>-release.apk`, `build-info-find-differences.txt`, `apk/SHA256.txt`.
- Иконки: `python3 android/tools/make_icons.py` (из `vk-assets/icon-576.png`). Карточка RuStore — `release/rustore/`
  (тексты `texts.md`, иконка 512, скриншоты 1080×1920 — `tools/capture-rustore.js`).
- gh-pages (ВК/ОК) после этих правок **не обновлялась**: игра на модерации ВК+ОК, Роман 13 ноя — «выложить после одобрения».
  В ВК-сборке признак ничего не меняет; при следующем `./tools/deploy-pages.sh` уйдёт вместе с остальным.
