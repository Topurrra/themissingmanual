#!/bin/sh
set -e

# Same fix as the API container's entrypoint: a mounted data volume's on-disk
# ownership predates the non-root `node` user if this container previously ran
# as root against it, which breaks writes to the AI Search / tutor SQLite DBs.
# Cheap metadata-only chown, safe to run on every start.
DATA_DIR="${ASK_DATA_DIR:-./.data}"
mkdir -p "$DATA_DIR"
chown -R node:node "$DATA_DIR"

exec setpriv --reuid=node --regid=node --init-groups "$@"
