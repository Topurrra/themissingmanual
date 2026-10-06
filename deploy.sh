#!/bin/sh
# Pull, then rebuild only what changed since the LAST DEPLOY (recorded in .last-deploy),
# so it works the same whether or not you ran `git pull` yourself first.
# Guides and translations are bind-mounted into the api container and synced
# automatically, so content-only changes need no image rebuild - just a restart.
#   ./deploy.sh          normal deploy
#   ./deploy.sh --all    rebuild everything (same as the old full command)
set -e

STATE=.last-deploy
git pull --ff-only
new=$(git rev-parse HEAD)

full() {
  echo "Rebuilding everything."
  docker compose --profile prod up -d --build
  echo "$new" > "$STATE"
  echo "Done."
  exit 0
}

[ "$1" = "--all" ] && full
[ -f "$STATE" ] || { echo "No previous deploy recorded."; full; }

old=$(cat "$STATE")
if [ "$old" = "$new" ]; then
  echo "Already deployed $new - nothing to do."
  exit 0
fi
git cat-file -e "$old^{commit}" 2>/dev/null || { echo "Last deployed commit $old not found."; full; }

changed=$(git diff --name-only "$old" "$new")

if echo "$changed" | grep -qE '^(docker-compose\.yml|\.dockerignore|platform/server/Dockerfile|platform/web/Dockerfile)'; then
  echo "Docker setup changed."
  full
fi

services=""
echo "$changed" | grep -qE '^platform/(Cargo\.(toml|lock)|core/|server/|third_party/)' && services="$services api"
echo "$changed" | grep -qE '^platform/web/' && services="$services web"

if [ -n "$services" ]; then
  echo "Rebuilding:$services"
  docker compose --profile prod up -d --build $services
fi

if echo "$changed" | grep -qE '^(guides|translations)/' && ! echo "$services" | grep -q api; then
  echo "Content changed - restarting api to re-ingest now."
  docker compose --profile prod restart api
fi

if [ -z "$services" ] && ! echo "$changed" | grep -qE '^(guides|translations)/'; then
  echo "No app or content changes (docs/config only) - nothing to rebuild."
fi

echo "$new" > "$STATE"
echo "Deployed $new."
