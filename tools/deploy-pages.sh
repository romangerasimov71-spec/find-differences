#!/usr/bin/env bash
# Выкладка VK/OK-сборки на GitHub Pages (ветка gh-pages): https://romangerasimov71-spec.github.io/find-differences/
# Этот адрес стоит в «Размещении» VK (игра 54882213) — запускать после ЛЮБОГО изменения игры.
#   ./tools/deploy-pages.sh            — сборка (с автотестом) и выкладка
#   ./tools/deploy-pages.sh --no-build — выложить уже собранную dist/vk
set -euo pipefail
cd "$(dirname "$0")/.."
[ "${1:-}" = "--no-build" ] || ./build.sh
[ -f dist/vk/index.html ] || { echo "нет dist/vk — сначала ./build.sh"; exit 1; }
SRC=$(git rev-parse --short HEAD)
W=$(mktemp -d)
trap 'git worktree remove --force "$W" >/dev/null 2>&1 || true' EXIT
git fetch -q origin gh-pages
git worktree add -q "$W" origin/gh-pages
cd "$W"
git checkout -q -B gh-pages origin/gh-pages
git rm -rq --ignore-unmatch .
cp -r "$OLDPWD/dist/vk/." .
git add -A
if git diff --cached --quiet; then echo "gh-pages уже актуальна"; exit 0; fi
git commit -q -m "VK-сборка $(date -u +%Y-%m-%d) из $SRC"
git push -q origin gh-pages
echo "gh-pages обновлена (сборка из $SRC). Сайт обновится через ~1 мин."
