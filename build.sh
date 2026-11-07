#!/usr/bin/env bash
# Сборка всех площадок одной командой:
#   dist/vk/        — VK и Одноклассники (одна сборка), архив dist/find-differences-vk.zip
#   dist/playgama/  — Playgama Bridge SDK, EN+RU, архив dist/find-differences-playgama.zip
# Перед сборкой — автотест 100 уровней (нужен Playwright с Chromium).
set -euo pipefail
cd "$(dirname "$0")"
node tools/test-levels.js | tail -1
rm -rf dist && mkdir -p dist
STAMP=$(date -u +%Y%m%d%H%M)
COMMON="src/js/i18n.js src/js/art.js src/js/bounds.js src/js/scenes.js src/js/levels.js src/js/audio.js src/js/game.js"

build() { # $1 — папка, $2 — блок скриптов платформы, $3 — js платформы (минифицируется отдельно)
  local out=dist/$1
  mkdir -p $out/js $out/css
  cp -r src/assets $out/
  npx esbuild --minify --log-level=warning src/css/style.css --outfile=$out/css/style.css
  cat $COMMON > dist/.game.js
  npx esbuild --minify --log-level=warning dist/.game.js --outfile=$out/js/game.min.js
  if [ -n "$3" ]; then npx esbuild --minify --log-level=warning "$3" --outfile=$out/js/platform.min.js; fi
  python3 - "$out" "$2" "$STAMP" <<'PY'
import re, sys
out, block, stamp = sys.argv[1], sys.argv[2], sys.argv[3]
h = open('src/index.html', encoding='utf-8').read()
h = re.sub(r'<!--PLATFORM-->.*?<!--/PLATFORM-->', block, h, flags=re.S)
h = re.sub(r'<script src="js/i18n\.js"></script>.*?<script src="js/game\.js"></script>', '<script src="js/game.min.js?v=' + stamp + '"></script>', h, flags=re.S)
h = h.replace('css/style.css', 'css/style.css?v=' + stamp)
open(out + '/index.html', 'w', encoding='utf-8').write(h)
PY
  rm -f dist/.game.js
}

# VK + OK: VK Bridge первым скриптом
cp src/js/vk-bridge.min.js /tmp/vkb.js
build vk '<script src="js/vk-bridge.min.js"></script>
<script src="js/platform.min.js"></script>' src/js/platform.js
cp src/js/vk-bridge.min.js dist/vk/js/
mkdir -p dist/vk/share && cp vk-assets/story-1080x1920.png dist/vk/share/story.png 2>/dev/null || true
touch dist/vk/.nojekyll

# Playgama: SDK первым скриптом в <head>, конфиг рядом с index.html, без упоминаний других площадок
build playgama '<script src="https://bridge.playgama.com/v2/stable/playgama-bridge.js"></script>
<script src="js/platform.min.js"></script>' src/js/platform-playgama.js
cp playgama/playgama-bridge-config.json dist/playgama/
sed -i 's/<html lang="ru">/<html lang="en">/; s#<title>Найди отличия: Новый год</title>#<title>Spot the Difference: New Year</title>#' dist/playgama/index.html
if grep -rniIE '\bvk\b|vkontakte|vkBridge|вконтакте|одноклассник|ok\.ru|vk\.com' dist/playgama >/dev/null; then
  echo "ОШИБКА: в сборке Playgama есть упоминания VK/OK"; grep -rnoiIE '\bvk\b|vkontakte|vkBridge|вконтакте|одноклассник|ok\.ru|vk\.com' dist/playgama | head; exit 1
fi

(cd dist/vk && zip -qr ../find-differences-vk.zip . -x '.nojekyll')
(cd dist/playgama && zip -qr ../find-differences-playgama.zip .)
du -sh dist/vk dist/playgama dist/*.zip
