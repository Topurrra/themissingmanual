#!/bin/sh
set -e

# Fix ownership of the SQLite data directory before dropping to the non-root
# `app` user. This runs on every start (cheap - it's a metadata-only chown, not
# a data copy) because a mounted volume's on-disk ownership is set at whatever
# point it was first written, which predates the `app` user if this container
# previously ran as root against the same volume. Without this, SQLite fails
# with "attempt to write a readonly database" and the server never starts.
DB_PATH="${DB_PATH:-./data/manual.db}"
DATA_DIR="$(dirname "$DB_PATH")"
mkdir -p "$DATA_DIR"
chown -R app:app "$DATA_DIR"

exec setpriv --reuid=app --regid=app --init-groups "$@"
