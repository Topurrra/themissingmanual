#!/bin/sh
# Pull, then rebuild only what changed. Guides and translations are bind-mounted
# into the api container and synced automatically, so content-only changes need no
# image rebuild - just a restart so the api re-ingests right away.
#   ./deploy.sh          normal deploy
#   ./deploy.sh --all    rebuild everything (same as the old full command)
set -e

if [ "$1" = "--all" ]; then
  git pull --ff-only
  exec docker compose --profile prod up -d --build
fi

old=$(git rev-parse HEAD)
git pull --ff-only
changed=$(git diff --name-only "$old" HEAD)

if [ -z "$changed" ]; then
  echo "Already up to date - nothing to deploy."
  exit 0
fi

if echo "$changed" | grep -qE '^(docker-compose\.yml|\.dockerignore|platform/server/Dockerfile|platform/web/Dockerfile)'; then
  echo "Docker setup changed - rebuilding everything."
  exec docker compose --profile prod up -d --build
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

[ -z "$services" ] && ! echo "$changed" | grep -qE '^(guides|translations)/' && echo "No app or content changes (docs/config only) - nothing to rebuild."
echo "Done."
