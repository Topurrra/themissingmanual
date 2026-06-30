# Content Backlog — Cheat Sheets & Projects

Running list so we don't forget what's left to add. Tick as shipped.

## Cheat Sheets
Data lives in `platform/web/src/lib/cheatsheets.js`; the page is `/cheat-sheet`. Each entry is
`{cmd, desc, example}` with a REAL example (no placeholders). Page filter + global-search boosting
are already wired, so new sheets are searchable the moment they're added.

**Shipped (20):** Git · Bash/Linux · Docker · SQL · Regex · kubectl · npm/pnpm/yarn ·
Python (pip & venv) · SSH & scp · curl · Vim · tmux · jq · HTTP Status Codes ·
chmod & Permissions · tar & Compression · cron · gh (GitHub CLI) ·
Network Diagnostics (dig/ping/ss/traceroute) · PowerShell

**Backlog (add later), grouped:**
- Data stores: psql (Postgres) · redis-cli · mongosh · sqlite3 · mysql
- Language toolchains: cargo (Rust) · go · conda · nvm/node · dotnet · rustup
- Cloud & infra CLIs: aws · gcloud · az · terraform · helm · ansible
- Text/data processing (deep): sed · awk · ripgrep (rg) · sort/uniq/cut/tr
- Media: ffmpeg · ImageMagick (convert) · pandoc
- Security: openssl · gpg · sha256sum · nmap
- Package managers: Homebrew (brew) · apt · dnf · winget/choco
- Build/sys: Make / Makefiles · rsync · systemctl / journalctl
- Editors/multiplexers: nano · screen · VS Code shortcuts
- Reference tables (not commands, but high-traffic): Markdown syntax · YAML gotchas ·
  semver · glob patterns · .gitignore patterns · Unix exit codes
- Git advanced: interactive rebase · bisect · worktree · reflog · cherry-pick

## Projects
Each project is a phased build-along guide under `guides/projects/`. Two tiers:
**Run-Along** = `lang runnable` self-contained blocks (Python/JS/SQL, run in browser);
**Build On Your Machine** = plain fences, run locally. Gate must EXECUTE every runnable block.

**Shipped (pilot):** URL Shortener (Py) · CLI To-Do (Py) · Markdown→HTML (JS) · Expense Analytics (SQL)
· REST API with FastAPI (Py) · Dockerize an App

**Adding this round:** Hangman (Py) · Password Strength Checker (Py) · CSV Summary Report (Py)
· JSON Formatter & Validator (JS) · Web Scraper (Py, local) · Real-Time Chat (Node, local)

**Backlog (add later):**
- Run-Along (browser): Roman-numeral converter (JS) · Markdown table generator (Py) · Expression
  calculator (Py) · Text adventure (Py) · Tiny templating engine (JS) · Caesar/Vigenère cipher (Py)
- Build On Your Machine: Discord/Telegram bot (Py) · Static blog generator (Py/Node) · CLI tool in Go
  · Budget tracker (SQL + JS) · URL "link in bio" page · Weather CLI · Simple rate limiter · A tiny
  key-value cache · File-organizer script
- Automation (ties to the No-Code category): Auto-file invoices from email with AI (n8n) · RSS → daily
  digest email (Make) · Form → Airtable → Slack alert (Zapier) · Scheduled report to Google Sheets
