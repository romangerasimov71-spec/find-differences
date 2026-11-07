#!/usr/bin/env bash
# Сборка VK-версии: dist/vk/ (папка для хостинга, index.html в корне) и dist/find-differences-vk.zip
set -euo pipefail
cd "$(dirname "$0")"
node tools/check-levels.js
rm -rf dist && mkdir -p dist/vk
cp -r src/index.html src/css src/js dist/vk/
touch dist/vk/.nojekyll
# версия сборки — в комментарий index.html (для проверки кэша)
sed -i "s|<title>|<!-- build $(date -u +%Y-%m-%dT%H:%MZ) -->\n<title>|" dist/vk/index.html
(cd dist/vk && zip -qr ../find-differences-vk.zip . -x '.nojekyll')
du -sh dist/vk dist/find-differences-vk.zip
