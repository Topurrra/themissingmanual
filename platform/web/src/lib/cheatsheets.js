// Cheat-sheet data: one entry per technology, each a list of {cmd, desc, example}.
// Examples are REAL and runnable as written — no <placeholders>. Rendered by
// /cheat-sheet and (later) folded into global search with command-query boosting.

export const CHEATSHEETS = [
  {
    id: 'git', name: 'Git', icon: 'ti-git-branch',
    blurb: 'Everyday version control — stage, commit, branch, sync, and undo.',
    commands: [
      { cmd: 'git init', desc: 'Start a new repository in the current folder.', example: 'git init' },
      { cmd: 'git clone', desc: 'Copy a remote repository to your machine.', example: 'git clone https://github.com/torvalds/linux.git' },
      { cmd: 'git status', desc: 'Show what is staged, changed, and untracked.', example: 'git status' },
      { cmd: 'git add', desc: 'Stage changes for the next commit.', example: 'git add src/app.js' },
      { cmd: 'git commit', desc: 'Save the staged changes with a message.', example: 'git commit -m "Add login form"' },
      { cmd: 'git commit -am', desc: 'Stage all tracked files and commit in one step.', example: 'git commit -am "Fix header spacing"' },
      { cmd: 'git log', desc: 'Show commit history, compact and graphed.', example: 'git log --oneline --graph --all' },
      { cmd: 'git diff', desc: 'Show line-by-line unstaged changes.', example: 'git diff src/app.js' },
      { cmd: 'git branch', desc: 'List branches, or create a new one.', example: 'git branch feature-search' },
      { cmd: 'git switch', desc: 'Move to another branch.', example: 'git switch main' },
      { cmd: 'git switch -c', desc: 'Create a branch and switch to it.', example: 'git switch -c feature-search' },
      { cmd: 'git merge', desc: 'Merge another branch into the current one.', example: 'git merge feature-search' },
      { cmd: 'git rebase', desc: 'Replay your commits on top of another branch.', example: 'git rebase main' },
      { cmd: 'git pull', desc: 'Fetch and integrate changes from the remote.', example: 'git pull origin main' },
      { cmd: 'git push', desc: 'Send your commits to the remote.', example: 'git push origin main' },
      { cmd: 'git stash', desc: 'Shelve uncommitted changes to come back to.', example: 'git stash' },
      { cmd: 'git stash pop', desc: 'Reapply the most recently stashed changes.', example: 'git stash pop' },
      { cmd: 'git reset --soft', desc: 'Undo the last commit, keep changes staged.', example: 'git reset --soft HEAD~1' },
      { cmd: 'git restore', desc: 'Discard changes to a file in the working tree.', example: 'git restore src/app.js' },
      { cmd: 'git revert', desc: 'Make a new commit that undoes an old one.', example: 'git revert 1a2b3c4' },
      { cmd: 'git remote -v', desc: 'List the remotes and their URLs.', example: 'git remote -v' },
      { cmd: 'git tag', desc: 'Mark a commit with a version tag.', example: 'git tag -a v1.2.0 -m "Release 1.2.0"' }
    ]
  },
  {
    id: 'bash', name: 'Bash / Linux', icon: 'ti-terminal-2',
    blurb: 'The shell commands you reach for every day on any Unix box.',
    commands: [
      { cmd: 'ls', desc: 'List directory contents, with detail and hidden files.', example: 'ls -lah' },
      { cmd: 'cd', desc: 'Change the current directory.', example: 'cd /var/log' },
      { cmd: 'pwd', desc: 'Print the directory you are in.', example: 'pwd' },
      { cmd: 'cp', desc: 'Copy files or folders.', example: 'cp -r src/ backup/' },
      { cmd: 'mv', desc: 'Move or rename a file.', example: 'mv draft.md final.md' },
      { cmd: 'rm', desc: 'Delete files or folders (careful with -rf).', example: 'rm -rf build/' },
      { cmd: 'mkdir', desc: 'Create directories, including parents.', example: 'mkdir -p src/components' },
      { cmd: 'cat', desc: 'Print a file to the screen.', example: 'cat README.md' },
      { cmd: 'less', desc: 'Page through a long file (q to quit).', example: 'less app.log' },
      { cmd: 'tail -f', desc: 'Follow the end of a file as it grows.', example: 'tail -f /var/log/nginx/access.log' },
      { cmd: 'grep', desc: 'Search file contents, recursively and case-insensitively.', example: 'grep -rin "timeout" .' },
      { cmd: 'find', desc: 'Find files by name or type.', example: 'find . -name "*.test.js"' },
      { cmd: 'sed', desc: 'Find and replace text in a file in place.', example: "sed -i 's/localhost/127.0.0.1/g' config.yml" },
      { cmd: 'awk', desc: 'Pull out columns from text/logs.', example: "awk '{print $1, $7}' access.log" },
      { cmd: 'chmod', desc: 'Change file permissions.', example: 'chmod +x deploy.sh' },
      { cmd: 'tar', desc: 'Create a compressed archive of a folder.', example: 'tar -czf site.tar.gz public/' },
      { cmd: 'ps', desc: 'List processes; pair with grep to find one.', example: 'ps aux | grep node' },
      { cmd: 'kill', desc: 'Send a signal to a process by PID.', example: 'kill -9 48213' },
      { cmd: 'df / du', desc: 'Check disk space and folder sizes.', example: 'df -h && du -sh *' },
      { cmd: 'xargs', desc: 'Turn a list of items into command arguments.', example: 'find . -name "*.tmp" | xargs rm' },
      { cmd: 'ln -s', desc: 'Create a symbolic link.', example: 'ln -s /opt/app/bin/app /usr/local/bin/app' },
      { cmd: 'curl', desc: 'Make an HTTP request from the terminal.', example: 'curl -s https://api.github.com/zen' }
    ]
  },
  {
    id: 'docker', name: 'Docker', icon: 'ti-brand-docker',
    blurb: 'Build, run, and manage containers and images.',
    commands: [
      { cmd: 'docker run', desc: 'Start a container from an image.', example: 'docker run -d -p 8080:80 nginx' },
      { cmd: 'docker ps', desc: 'List containers (add -a for stopped ones).', example: 'docker ps -a' },
      { cmd: 'docker images', desc: 'List the images on your machine.', example: 'docker images' },
      { cmd: 'docker build', desc: 'Build an image from a Dockerfile.', example: 'docker build -t myapp:1.0 .' },
      { cmd: 'docker exec', desc: 'Run a command inside a running container.', example: 'docker exec -it web bash' },
      { cmd: 'docker logs', desc: 'View (and follow) a container’s logs.', example: 'docker logs -f web' },
      { cmd: 'docker stop', desc: 'Stop a running container.', example: 'docker stop web' },
      { cmd: 'docker rm', desc: 'Remove a stopped container.', example: 'docker rm web' },
      { cmd: 'docker rmi', desc: 'Remove an image.', example: 'docker rmi myapp:1.0' },
      { cmd: 'docker pull', desc: 'Download an image from a registry.', example: 'docker pull postgres:16' },
      { cmd: 'docker compose up', desc: 'Start the services defined in a compose file.', example: 'docker compose up -d' },
      { cmd: 'docker compose down', desc: 'Stop and remove those services.', example: 'docker compose down' },
      { cmd: 'docker exec env', desc: 'Open a shell to debug a container.', example: 'docker exec -it postgres psql -U postgres' },
      { cmd: 'docker cp', desc: 'Copy a file out of (or into) a container.', example: 'docker cp web:/app/error.log ./error.log' },
      { cmd: 'docker inspect', desc: 'Show low-level details of a container.', example: 'docker inspect web' },
      { cmd: 'docker system prune', desc: 'Reclaim space by removing unused data.', example: 'docker system prune -af' }
    ]
  },
  {
    id: 'sql', name: 'SQL', icon: 'ti-database',
    blurb: 'The core queries for reading and changing relational data.',
    commands: [
      { cmd: 'SELECT', desc: 'Read columns from a table.', example: 'SELECT id, name FROM users;' },
      { cmd: 'WHERE', desc: 'Filter rows by a condition.', example: 'SELECT * FROM users WHERE age >= 18;' },
      { cmd: 'ORDER BY', desc: 'Sort the results.', example: 'SELECT * FROM users ORDER BY created_at DESC;' },
      { cmd: 'LIMIT', desc: 'Return at most N rows.', example: 'SELECT * FROM users LIMIT 10;' },
      { cmd: 'INSERT', desc: 'Add a new row.', example: "INSERT INTO users (name, email) VALUES ('Ana', 'ana@example.com');" },
      { cmd: 'UPDATE', desc: 'Change existing rows (always with WHERE).', example: 'UPDATE users SET active = true WHERE id = 5;' },
      { cmd: 'DELETE', desc: 'Remove rows (always with WHERE).', example: 'DELETE FROM users WHERE id = 5;' },
      { cmd: 'INNER JOIN', desc: 'Combine rows that match in both tables.', example: 'SELECT * FROM orders o JOIN users u ON u.id = o.user_id;' },
      { cmd: 'LEFT JOIN', desc: 'Keep all left rows, match where possible.', example: 'SELECT u.name, o.id FROM users u LEFT JOIN orders o ON o.user_id = u.id;' },
      { cmd: 'GROUP BY', desc: 'Collapse rows into groups for aggregates.', example: 'SELECT user_id, COUNT(*) FROM orders GROUP BY user_id;' },
      { cmd: 'HAVING', desc: 'Filter groups after aggregation.', example: 'SELECT user_id, COUNT(*) FROM orders GROUP BY user_id HAVING COUNT(*) > 3;' },
      { cmd: 'COUNT / AVG', desc: 'Aggregate over rows.', example: 'SELECT AVG(total) FROM orders;' },
      { cmd: 'DISTINCT', desc: 'Return only unique values.', example: 'SELECT DISTINCT country FROM users;' },
      { cmd: 'LIKE', desc: 'Match a text pattern (% = any run).', example: "SELECT * FROM users WHERE email LIKE '%@gmail.com';" },
      { cmd: 'CREATE TABLE', desc: 'Define a new table.', example: 'CREATE TABLE tags (id SERIAL PRIMARY KEY, name TEXT NOT NULL);' },
      { cmd: 'ALTER TABLE', desc: 'Add or change a column.', example: 'ALTER TABLE users ADD COLUMN phone TEXT;' },
      { cmd: 'CREATE INDEX', desc: 'Speed up lookups on a column.', example: 'CREATE INDEX idx_users_email ON users (email);' }
    ]
  },
  {
    id: 'regex', name: 'Regex', icon: 'ti-regex',
    blurb: 'The building blocks of regular expressions, with a concrete match each.',
    commands: [
      { cmd: '.', desc: 'Any single character (except newline).', example: 'a.c  matches "abc", "a-c"' },
      { cmd: '\\d', desc: 'Any digit 0-9.', example: '\\d+  matches "42" in "order 42"' },
      { cmd: '\\w', desc: 'A word character: letter, digit, or underscore.', example: '\\w+  matches "user_1"' },
      { cmd: '\\s', desc: 'Any whitespace character.', example: '\\s+  matches the gap in "a   b"' },
      { cmd: '^', desc: 'Anchor to the start of the line.', example: '^Error  matches lines starting with "Error"' },
      { cmd: '$', desc: 'Anchor to the end of the line.', example: '\\.js$  matches "app.js"' },
      { cmd: '*', desc: 'Zero or more of the previous token.', example: 'ab*  matches "a", "ab", "abbb"' },
      { cmd: '+', desc: 'One or more of the previous token.', example: '\\d+  matches "2024"' },
      { cmd: '?', desc: 'Zero or one (makes it optional).', example: 'colou?r  matches "color" and "colour"' },
      { cmd: '{n,m}', desc: 'Between n and m repetitions.', example: '\\d{2,4}  matches "12" and "2024"' },
      { cmd: '[...]', desc: 'Any one character from the set.', example: '[aeiou]  matches a single vowel' },
      { cmd: '[^...]', desc: 'Any one character NOT in the set.', example: '[^0-9]  matches a non-digit' },
      { cmd: '(...)', desc: 'Group and capture for reuse.', example: '(\\d{4})-(\\d{2})  captures "2024" and "06"' },
      { cmd: '(?:...)', desc: 'Group without capturing.', example: '(?:ab)+  matches "abab"' },
      { cmd: '|', desc: 'Alternation: match either side.', example: 'cat|dog  matches "cat" or "dog"' },
      { cmd: '\\b', desc: 'A word boundary.', example: '\\bcat\\b  matches "cat" but not "category"' },
      { cmd: '\\.', desc: 'A literal dot (escaped).', example: '\\.com  matches ".com"' }
    ]
  },
  {
    id: 'kubectl', name: 'kubectl', icon: 'ti-ship',
    blurb: 'Day-to-day commands for inspecting and steering a Kubernetes cluster.',
    commands: [
      { cmd: 'kubectl get pods', desc: 'List pods in the current namespace.', example: 'kubectl get pods' },
      { cmd: 'kubectl get all', desc: 'List the main resources in a namespace.', example: 'kubectl get all -n default' },
      { cmd: 'kubectl get -o wide', desc: 'Show extra columns like node and IP.', example: 'kubectl get pods -o wide' },
      { cmd: 'kubectl describe', desc: 'Show details and recent events for a resource.', example: 'kubectl describe pod web-7d9f' },
      { cmd: 'kubectl logs', desc: 'Print (and follow) a pod’s logs.', example: 'kubectl logs -f web-7d9f' },
      { cmd: 'kubectl exec', desc: 'Open a shell inside a pod.', example: 'kubectl exec -it web-7d9f -- sh' },
      { cmd: 'kubectl apply', desc: 'Create or update resources from a manifest.', example: 'kubectl apply -f deployment.yaml' },
      { cmd: 'kubectl delete', desc: 'Delete a resource.', example: 'kubectl delete pod web-7d9f' },
      { cmd: 'kubectl scale', desc: 'Change the number of replicas.', example: 'kubectl scale deploy/web --replicas=3' },
      { cmd: 'kubectl rollout status', desc: 'Watch a deployment roll out.', example: 'kubectl rollout status deploy/web' },
      { cmd: 'kubectl rollout undo', desc: 'Roll back to the previous version.', example: 'kubectl rollout undo deploy/web' },
      { cmd: 'kubectl port-forward', desc: 'Forward a local port to a service.', example: 'kubectl port-forward svc/web 8080:80' },
      { cmd: 'kubectl top', desc: 'Show CPU/memory usage.', example: 'kubectl top pods' },
      { cmd: 'kubectl get ns', desc: 'List namespaces.', example: 'kubectl get namespaces' },
      { cmd: 'kubectl config use-context', desc: 'Switch the cluster you are talking to.', example: 'kubectl config use-context prod' },
      { cmd: 'kubectl edit', desc: 'Edit a live resource in your editor.', example: 'kubectl edit deploy/web' }
    ]
  },
  {
    id: 'npm', name: 'npm / pnpm / yarn', icon: 'ti-brand-npm',
    blurb: 'Install, run, and publish Node packages — npm, with pnpm and yarn equivalents.',
    commands: [
      { cmd: 'npm init', desc: 'Create a package.json.', example: `npm init -y` },
      { cmd: 'npm install', desc: 'Install everything listed in package.json.', example: `npm install` },
      { cmd: 'npm install <pkg>', desc: 'Add a runtime dependency.', example: `npm install express` },
      { cmd: 'npm install -D', desc: 'Add a dev-only dependency.', example: `npm install -D vitest` },
      { cmd: 'npm install -g', desc: 'Install a package globally.', example: `npm install -g pnpm` },
      { cmd: 'npm uninstall', desc: 'Remove a dependency.', example: `npm uninstall lodash` },
      { cmd: 'npm run', desc: 'Run a script defined in package.json.', example: `npm run build` },
      { cmd: 'npm test', desc: 'Run the test script.', example: `npm test` },
      { cmd: 'npx', desc: 'Run a package without installing it first.', example: `npx create-vite@latest myapp` },
      { cmd: 'npm ci', desc: 'Clean, reproducible install from the lockfile.', example: `npm ci` },
      { cmd: 'npm update', desc: 'Update dependencies within their version ranges.', example: `npm update` },
      { cmd: 'npm outdated', desc: 'List dependencies that have newer versions.', example: `npm outdated` },
      { cmd: 'npm ls', desc: 'Show the installed dependency tree.', example: `npm ls --depth=0` },
      { cmd: 'npm version', desc: 'Bump the version and create a git tag.', example: `npm version patch` },
      { cmd: 'npm publish', desc: 'Publish the package to the registry.', example: `npm publish --access public` },
      { cmd: 'pnpm', desc: 'Faster, disk-efficient npm alternative.', example: `pnpm add express` },
      { cmd: 'yarn', desc: 'Another popular package manager.', example: `yarn add express` }
    ]
  },
  {
    id: 'python', name: 'Python (pip & venv)', icon: 'ti-brand-python',
    blurb: 'Virtual environments and package management for Python projects.',
    commands: [
      { cmd: 'python -m venv', desc: 'Create a virtual environment.', example: `python -m venv .venv` },
      { cmd: 'activate (mac/Linux)', desc: 'Enter the virtual environment.', example: `source .venv/bin/activate` },
      { cmd: 'activate (Windows)', desc: 'Enter the venv on Windows.', example: `.venv\\Scripts\\activate` },
      { cmd: 'deactivate', desc: 'Leave the virtual environment.', example: `deactivate` },
      { cmd: 'pip install', desc: 'Install a package.', example: `pip install requests` },
      { cmd: 'pip install (pinned)', desc: 'Install an exact version.', example: `pip install "django==5.0"` },
      { cmd: 'pip install -r', desc: 'Install everything in a requirements file.', example: `pip install -r requirements.txt` },
      { cmd: 'pip freeze', desc: 'Write exact installed versions to a file.', example: `pip freeze > requirements.txt` },
      { cmd: 'pip list', desc: 'List installed packages.', example: `pip list` },
      { cmd: 'pip uninstall', desc: 'Remove a package.', example: `pip uninstall requests` },
      { cmd: 'pip show', desc: 'Show details about an installed package.', example: `pip show requests` },
      { cmd: 'pip install -U', desc: 'Upgrade a package to the latest.', example: `pip install -U pip` },
      { cmd: 'python -m', desc: 'Run a module as a script.', example: `python -m http.server 8000` },
      { cmd: 'pipx', desc: 'Install a CLI tool in its own isolated env.', example: `pipx install black` },
      { cmd: 'uv', desc: 'A fast, modern venv + pip replacement.', example: `uv pip install requests` }
    ]
  },
  {
    id: 'ssh', name: 'SSH & scp', icon: 'ti-lock',
    blurb: 'Connect to remote machines, copy files, and manage keys.',
    commands: [
      { cmd: 'ssh', desc: 'Connect to a remote host.', example: `ssh ana@server.com` },
      { cmd: 'ssh -p', desc: 'Connect on a non-default port.', example: `ssh -p 2222 ana@server.com` },
      { cmd: 'ssh -i', desc: 'Use a specific private key.', example: `ssh -i ~/.ssh/id_ed25519 ana@server.com` },
      { cmd: 'ssh-keygen', desc: 'Generate a new key pair.', example: `ssh-keygen -t ed25519 -C "ana@example.com"` },
      { cmd: 'ssh-copy-id', desc: 'Install your public key on a server.', example: `ssh-copy-id ana@server.com` },
      { cmd: 'ssh (run a command)', desc: 'Run one command remotely and exit.', example: `ssh ana@server.com "df -h"` },
      { cmd: 'scp (upload)', desc: 'Copy a local file to a remote host.', example: `scp app.tar.gz ana@server.com:/home/ana/` },
      { cmd: 'scp (download)', desc: 'Copy a remote file to your machine.', example: `scp ana@server.com:/var/log/app.log .` },
      { cmd: 'scp -r', desc: 'Copy a whole folder.', example: `scp -r ./site ana@server.com:/var/www/` },
      { cmd: 'ssh -L', desc: 'Tunnel a remote port to your machine.', example: `ssh -L 8080:localhost:80 ana@server.com` },
      { cmd: 'ssh (config alias)', desc: 'Connect using a ~/.ssh/config Host alias.', example: `ssh prod` },
      { cmd: 'ssh-add', desc: 'Add a key to the running ssh-agent.', example: `ssh-add ~/.ssh/id_ed25519` },
      { cmd: 'ssh-keygen -R', desc: 'Remove a stale host key after a rebuild.', example: `ssh-keygen -R server.com` }
    ]
  },
  {
    id: 'curl', name: 'curl', icon: 'ti-world-www',
    blurb: 'Make HTTP requests from the terminal — test APIs, download files, debug.',
    commands: [
      { cmd: 'curl <url>', desc: 'GET a URL and print the response.', example: `curl https://api.github.com/zen` },
      { cmd: 'curl -s', desc: 'Silent: hide the progress meter.', example: `curl -s https://api.github.com` },
      { cmd: 'curl -o', desc: 'Save the response to a named file.', example: `curl -o page.html https://example.com` },
      { cmd: 'curl -O', desc: 'Save using the remote file name.', example: `curl -O https://example.com/app.zip` },
      { cmd: 'curl -L', desc: 'Follow redirects.', example: `curl -L https://github.com` },
      { cmd: 'curl -I', desc: 'Fetch only the response headers.', example: `curl -I https://example.com` },
      { cmd: 'curl -X POST -d', desc: 'POST a JSON body.', example: `curl -X POST -H "Content-Type: application/json" -d '{"name":"Ana"}' https://api.example.com/users` },
      { cmd: 'curl -d (form)', desc: 'POST form-encoded data.', example: `curl -d "user=ana&pw=s3cret" https://api.example.com/login` },
      { cmd: 'curl -H (header)', desc: 'Send a custom header, e.g. auth.', example: `curl -H "Authorization: Bearer ghp_abc123" https://api.github.com/user` },
      { cmd: 'curl -u', desc: 'Use HTTP basic auth.', example: `curl -u ana:s3cret https://api.example.com` },
      { cmd: 'curl -X PUT', desc: 'Send a PUT request.', example: `curl -X PUT -H "Content-Type: application/json" -d '{"active":true}' https://api.example.com/users/5` },
      { cmd: 'curl -X DELETE', desc: 'Send a DELETE request.', example: `curl -X DELETE https://api.example.com/users/5` },
      { cmd: 'curl -v', desc: 'Verbose: see the full request and response.', example: `curl -v https://example.com` },
      { cmd: 'curl --max-time', desc: 'Give up after N seconds.', example: `curl --max-time 10 https://example.com` }
    ]
  },
  {
    id: 'vim', name: 'Vim', icon: 'ti-edit',
    blurb: 'Survive and thrive in the editor that opens when you least expect it. Esc returns to normal mode.',
    commands: [
      { cmd: ':w', desc: 'Save (write) the file.', example: `:w` },
      { cmd: ':q', desc: 'Quit.', example: `:q` },
      { cmd: ':wq  or  ZZ', desc: 'Save and quit.', example: `:wq` },
      { cmd: ':q!', desc: 'Quit and throw away changes.', example: `:q!` },
      { cmd: 'i / a', desc: 'Insert before / after the cursor.', example: `i` },
      { cmd: 'Esc', desc: 'Leave insert mode, back to normal mode.', example: `Esc` },
      { cmd: 'dd', desc: 'Delete (cut) the current line.', example: `dd` },
      { cmd: 'yy / p', desc: 'Copy the line / paste it below.', example: `yy` },
      { cmd: 'u / Ctrl-r', desc: 'Undo / redo.', example: `u` },
      { cmd: '/pattern', desc: 'Search forward; press n for the next match.', example: `/error` },
      { cmd: ':%s/old/new/g', desc: 'Find and replace across the whole file.', example: `:%s/foo/bar/g` },
      { cmd: 'gg / G', desc: 'Jump to the top / bottom of the file.', example: `G` },
      { cmd: '0 / $', desc: 'Jump to the start / end of the line.', example: `$` },
      { cmd: ':N', desc: 'Go to line number N.', example: `:42` },
      { cmd: 'v / V', desc: 'Start a character / whole-line selection.', example: `V` },
      { cmd: ':set number', desc: 'Show line numbers.', example: `:set number` }
    ]
  },
  {
    id: 'tmux', name: 'tmux', icon: 'ti-layout-columns',
    blurb: 'Keep terminal sessions alive and split your screen. The prefix key is Ctrl-b by default.',
    commands: [
      { cmd: 'tmux', desc: 'Start a new session.', example: `tmux` },
      { cmd: 'tmux new -s', desc: 'Start a named session.', example: `tmux new -s work` },
      { cmd: 'tmux ls', desc: 'List running sessions.', example: `tmux ls` },
      { cmd: 'tmux attach', desc: 'Reattach to a session.', example: `tmux attach -t work` },
      { cmd: 'Ctrl-b d', desc: 'Detach, leaving everything running.', example: `Ctrl-b d` },
      { cmd: 'Ctrl-b c', desc: 'Create a new window.', example: `Ctrl-b c` },
      { cmd: 'Ctrl-b n / p', desc: 'Next / previous window.', example: `Ctrl-b n` },
      { cmd: 'Ctrl-b %', desc: 'Split the current pane vertically.', example: `Ctrl-b %` },
      { cmd: 'Ctrl-b "', desc: 'Split the current pane horizontally.', example: `Ctrl-b "` },
      { cmd: 'Ctrl-b arrow', desc: 'Move between panes.', example: `Ctrl-b right` },
      { cmd: 'Ctrl-b x', desc: 'Close the current pane.', example: `Ctrl-b x` },
      { cmd: 'Ctrl-b ,', desc: 'Rename the current window.', example: `Ctrl-b ,` },
      { cmd: 'Ctrl-b [', desc: 'Enter scroll / copy mode (q to exit).', example: `Ctrl-b [` },
      { cmd: 'tmux kill-session', desc: 'Kill a session by name.', example: `tmux kill-session -t work` }
    ]
  },
  {
    id: 'jq', name: 'jq', icon: 'ti-braces',
    blurb: 'Slice, filter, and reshape JSON on the command line.',
    commands: [
      { cmd: 'jq .', desc: 'Pretty-print JSON.', example: `echo '{"a":1}' | jq .` },
      { cmd: '.key', desc: 'Get a field.', example: `jq '.name' user.json` },
      { cmd: '.a.b', desc: 'Get a nested field.', example: `jq '.user.email' data.json` },
      { cmd: '.[]', desc: 'Iterate over an array.', example: `jq '.[]' items.json` },
      { cmd: '.[0]', desc: 'Index into an array.', example: `jq '.[0]' items.json` },
      { cmd: '.items[].name', desc: 'Pull a field from each element.', example: `jq '.items[].name' data.json` },
      { cmd: 'select()', desc: 'Keep only matching elements.', example: `jq '.[] | select(.age > 30)' people.json` },
      { cmd: 'map()', desc: 'Transform every element.', example: `jq 'map(.price)' cart.json` },
      { cmd: 'keys', desc: 'List an object’s keys.', example: `jq 'keys' config.json` },
      { cmd: 'length', desc: 'Count items / string length.', example: `jq '.items | length' data.json` },
      { cmd: '-r', desc: 'Raw output (no surrounding quotes).', example: `jq -r '.name' user.json` },
      { cmd: '{a, b}', desc: 'Build a new object from fields.', example: `jq '{name, id}' user.json` },
      { cmd: 'group_by()', desc: 'Group array elements.', example: `jq 'group_by(.type)' items.json` },
      { cmd: '@csv', desc: 'Emit CSV rows.', example: `jq -r '.[] | [.id, .name] | @csv' rows.json` }
    ]
  },
  {
    id: 'http-status', name: 'HTTP Status Codes', icon: 'ti-arrows-exchange',
    blurb: 'What each response code means, and when you’ll actually see it.',
    commands: [
      { cmd: '200 OK', desc: 'Request succeeded.', example: `GET /users → 200` },
      { cmd: '201 Created', desc: 'A new resource was created.', example: `POST /users → 201` },
      { cmd: '204 No Content', desc: 'Success, with an empty body.', example: `DELETE /users/5 → 204` },
      { cmd: '301 Moved Permanently', desc: 'Permanent redirect; update your link.', example: `http → https → 301` },
      { cmd: '302 Found', desc: 'Temporary redirect.', example: `/login → 302 to /home` },
      { cmd: '304 Not Modified', desc: 'Your cached copy is still fresh.', example: `If-None-Match match → 304` },
      { cmd: '400 Bad Request', desc: 'The request itself is malformed.', example: `invalid JSON body → 400` },
      { cmd: '401 Unauthorized', desc: 'Not authenticated — you need to log in.', example: `missing/invalid token → 401` },
      { cmd: '403 Forbidden', desc: 'Authenticated, but not allowed.', example: `normal user hits /admin → 403` },
      { cmd: '404 Not Found', desc: 'No such resource.', example: `GET /users/9999 → 404` },
      { cmd: '409 Conflict', desc: 'Conflicts with current state.', example: `duplicate email on signup → 409` },
      { cmd: '422 Unprocessable Entity', desc: 'Well-formed, but validation failed.', example: `age = -5 → 422` },
      { cmd: '429 Too Many Requests', desc: 'You hit a rate limit.', example: `too many calls → 429` },
      { cmd: '500 Internal Server Error', desc: 'The server threw an unhandled error.', example: `crash in a handler → 500` },
      { cmd: '502 Bad Gateway', desc: 'An upstream server returned junk.', example: `proxy can’t reach the app → 502` },
      { cmd: '503 Service Unavailable', desc: 'Down or overloaded; try later.', example: `maintenance window → 503` },
      { cmd: '504 Gateway Timeout', desc: 'An upstream server was too slow.', example: `backend didn’t respond → 504` }
    ]
  },
  {
    id: 'chmod', name: 'chmod & Permissions', icon: 'ti-file-settings',
    blurb: 'Read and set Unix file permissions, in octal and symbolic form.',
    commands: [
      { cmd: 'octal digits', desc: 'Add them: 4=read, 2=write, 1=execute.', example: `7 = rwx · 6 = rw- · 5 = r-x` },
      { cmd: 'chmod 755', desc: 'Owner rwx; group and others r-x.', example: `chmod 755 script.sh` },
      { cmd: 'chmod 644', desc: 'Owner rw-; group and others r--.', example: `chmod 644 notes.txt` },
      { cmd: 'chmod 600', desc: 'Owner rw- only — private file.', example: `chmod 600 ~/.ssh/id_ed25519` },
      { cmd: 'chmod +x', desc: 'Make a file executable.', example: `chmod +x deploy.sh` },
      { cmd: 'chmod -R', desc: 'Apply recursively to a folder.', example: `chmod -R 755 public/` },
      { cmd: 'chmod g-w', desc: 'Symbolic: remove write for the group.', example: `chmod g-w shared.txt` },
      { cmd: 'chmod o-r', desc: 'Symbolic: remove read for others.', example: `chmod o-r secret.txt` },
      { cmd: 'reading ls -l', desc: 'The 10-char column shows the bits.', example: `-rwxr-xr-- = 754` },
      { cmd: 'chown', desc: 'Change a file’s owner and group.', example: `chown ana:devs file.txt` },
      { cmd: 'chown -R', desc: 'Change ownership recursively.', example: `chown -R www-data:www-data /var/www` },
      { cmd: 'umask', desc: 'Default permissions for new files.', example: `umask 022` }
    ]
  },
  {
    id: 'tar', name: 'tar & Compression', icon: 'ti-file-zip',
    blurb: 'Create and extract archives, and zip / unzip files.',
    commands: [
      { cmd: 'mnemonic', desc: 'c=create, x=extract, t=list, z=gzip, f=file.', example: `czf = Create Zip File` },
      { cmd: 'tar -czf', desc: 'Create a gzip-compressed archive.', example: `tar -czf site.tar.gz public/` },
      { cmd: 'tar -xzf', desc: 'Extract a gzip archive.', example: `tar -xzf site.tar.gz` },
      { cmd: 'tar -xzf -C', desc: 'Extract into a target folder.', example: `tar -xzf site.tar.gz -C /var/www` },
      { cmd: 'tar -tzf', desc: 'List an archive’s contents.', example: `tar -tzf site.tar.gz` },
      { cmd: 'tar --exclude', desc: 'Skip paths while archiving.', example: `tar -czf app.tar.gz app/ --exclude='*.log'` },
      { cmd: 'gzip', desc: 'Compress a single file in place.', example: `gzip big.log` },
      { cmd: 'gunzip', desc: 'Decompress a .gz file.', example: `gunzip big.log.gz` },
      { cmd: 'zip -r', desc: 'Make a cross-platform .zip.', example: `zip -r site.zip public/` },
      { cmd: 'unzip', desc: 'Extract a .zip.', example: `unzip site.zip` },
      { cmd: 'unzip -d', desc: 'Extract a .zip into a folder.', example: `unzip site.zip -d ./out` }
    ]
  },
  {
    id: 'cron', name: 'cron (Scheduling)', icon: 'ti-clock',
    blurb: 'Schedule recurring jobs. Five fields: minute hour day-of-month month day-of-week.',
    commands: [
      { cmd: 'the fields', desc: 'min(0-59) hour(0-23) dom(1-31) mon(1-12) dow(0-6, 0=Sun).', example: `* * * * * command` },
      { cmd: '* * * * *', desc: 'Every minute.', example: `* * * * * /usr/bin/health.sh` },
      { cmd: '*/5 * * * *', desc: 'Every 5 minutes.', example: `*/5 * * * * sync.sh` },
      { cmd: '0 * * * *', desc: 'Every hour, on the hour.', example: `0 * * * * rotate-logs.sh` },
      { cmd: '0 9 * * *', desc: 'Every day at 09:00.', example: `0 9 * * * report.sh` },
      { cmd: '30 2 * * *', desc: 'Every day at 02:30.', example: `30 2 * * * db-backup.sh` },
      { cmd: '0 9 * * 1', desc: 'Every Monday at 09:00.', example: `0 9 * * 1 weekly.sh` },
      { cmd: '0 0 1 * *', desc: 'First day of every month.', example: `0 0 1 * * invoice.sh` },
      { cmd: '@reboot', desc: 'Once, at system startup.', example: `@reboot /home/ana/start.sh` },
      { cmd: '@daily', desc: 'Shorthand for once a day at midnight.', example: `@daily backup.sh` },
      { cmd: 'crontab -e', desc: 'Edit your crontab.', example: `crontab -e` },
      { cmd: 'crontab -l', desc: 'List your scheduled jobs.', example: `crontab -l` }
    ]
  },
  {
    id: 'gh', name: 'GitHub CLI (gh)', icon: 'ti-brand-github',
    blurb: 'Do GitHub from the terminal — PRs, issues, repos, releases, CI.',
    commands: [
      { cmd: 'gh auth login', desc: 'Sign in to GitHub.', example: `gh auth login` },
      { cmd: 'gh repo clone', desc: 'Clone a repository.', example: `gh repo clone cli/cli` },
      { cmd: 'gh repo create', desc: 'Create a new repository.', example: `gh repo create myapp --public` },
      { cmd: 'gh repo view', desc: 'View a repo (--web opens the browser).', example: `gh repo view --web` },
      { cmd: 'gh pr create', desc: 'Open a pull request.', example: `gh pr create --fill` },
      { cmd: 'gh pr list', desc: 'List open pull requests.', example: `gh pr list` },
      { cmd: 'gh pr checkout', desc: 'Check out a PR branch locally.', example: `gh pr checkout 42` },
      { cmd: 'gh pr merge', desc: 'Merge a pull request.', example: `gh pr merge 42 --squash` },
      { cmd: 'gh issue create', desc: 'Open an issue.', example: `gh issue create --title "Login bug"` },
      { cmd: 'gh issue list', desc: 'List issues, filtered.', example: `gh issue list --label bug` },
      { cmd: 'gh release create', desc: 'Cut a release with notes.', example: `gh release create v1.2.0 --generate-notes` },
      { cmd: 'gh run list', desc: 'List recent CI runs.', example: `gh run list` },
      { cmd: 'gh run watch', desc: 'Watch a CI run live.', example: `gh run watch` }
    ]
  },
  {
    id: 'net', name: 'Network Diagnostics', icon: 'ti-network',
    blurb: 'Diagnose connectivity, DNS, ports, and routes from the terminal.',
    commands: [
      { cmd: 'ping', desc: 'Is the host reachable?', example: `ping -c 4 google.com` },
      { cmd: 'dig', desc: 'DNS lookup.', example: `dig example.com` },
      { cmd: 'dig +short', desc: 'DNS lookup, answer only.', example: `dig +short example.com` },
      { cmd: 'dig MX', desc: 'Look up mail records.', example: `dig MX example.com` },
      { cmd: 'nslookup', desc: 'DNS lookup (the classic).', example: `nslookup example.com` },
      { cmd: 'traceroute', desc: 'Show the network path to a host.', example: `traceroute google.com` },
      { cmd: 'curl -I', desc: 'Check an HTTP endpoint’s headers.', example: `curl -I https://example.com` },
      { cmd: 'ss -tulpn', desc: 'Listening ports and the PIDs behind them.', example: `ss -tulpn` },
      { cmd: 'lsof -i :PORT', desc: 'What process is using a port.', example: `lsof -i :3000` },
      { cmd: 'nc -zv', desc: 'Test whether a remote port is open.', example: `nc -zv example.com 443` },
      { cmd: 'ip a', desc: 'Show your network interfaces / IPs.', example: `ip a` },
      { cmd: 'ip route', desc: 'Show the routing table.', example: `ip route` },
      { cmd: 'whois', desc: 'Domain registration details.', example: `whois example.com` }
    ]
  },
  {
    id: 'powershell', name: 'PowerShell', icon: 'ti-terminal',
    blurb: 'The Windows shell — files, processes, and the object pipeline (Unix aliases in parens).',
    commands: [
      { cmd: 'Get-ChildItem (ls)', desc: 'List a directory.', example: `Get-ChildItem -Force` },
      { cmd: 'Set-Location (cd)', desc: 'Change directory.', example: `Set-Location C:\\Projects` },
      { cmd: 'Get-Content (cat)', desc: 'Read a file; -Tail for the end.', example: `Get-Content app.log -Tail 20` },
      { cmd: 'Copy-Item (cp)', desc: 'Copy a file or folder.', example: `Copy-Item file.txt backup.txt` },
      { cmd: 'Move-Item (mv)', desc: 'Move or rename.', example: `Move-Item old.txt new.txt` },
      { cmd: 'Remove-Item (rm)', desc: 'Delete; -Recurse -Force for folders.', example: `Remove-Item -Recurse -Force build` },
      { cmd: 'New-Item', desc: 'Create a file or directory.', example: `New-Item -ItemType Directory src` },
      { cmd: 'Select-String (grep)', desc: 'Search text in files.', example: `Select-String "error" app.log` },
      { cmd: 'Get-Process (ps)', desc: 'List running processes.', example: `Get-Process | Sort-Object CPU -Descending` },
      { cmd: 'Stop-Process', desc: 'Kill a process.', example: `Stop-Process -Name node -Force` },
      { cmd: 'Where-Object', desc: 'Filter objects in the pipeline.', example: `Get-Process | Where-Object CPU -gt 100` },
      { cmd: 'ForEach-Object', desc: 'Loop over pipeline items ($_ is each).', example: `1..3 | ForEach-Object { $_ * 2 }` },
      { cmd: '$env:', desc: 'Read an environment variable.', example: `$env:PATH` },
      { cmd: 'Get-Command (which)', desc: 'Find where a command lives.', example: `(Get-Command node).Source` },
      { cmd: 'Invoke-WebRequest', desc: 'Make an HTTP request.', example: `Invoke-WebRequest https://api.github.com` }
    ]
  },
  {
    id: 'psql', name: 'psql (Postgres)', icon: 'ti-database',
    blurb: 'The PostgreSQL command-line client — connect, inspect, and run SQL.',
    commands: [
      { cmd: 'psql connect', desc: 'Connect to a database.', example: `psql -h localhost -U postgres -d mydb` },
      { cmd: 'psql (URL)', desc: 'Connect with a connection string.', example: `psql postgresql://ana:secret@localhost:5432/mydb` },
      { cmd: '\\l', desc: 'List databases.', example: `\\l` },
      { cmd: '\\c', desc: 'Switch to another database.', example: `\\c mydb` },
      { cmd: '\\dt', desc: 'List tables.', example: `\\dt` },
      { cmd: '\\d', desc: 'Describe a table (columns, indexes).', example: `\\d users` },
      { cmd: '\\dn', desc: 'List schemas.', example: `\\dn` },
      { cmd: '\\du', desc: 'List roles / users.', example: `\\du` },
      { cmd: '\\x', desc: 'Toggle expanded (row-per-column) output.', example: `\\x` },
      { cmd: '\\timing', desc: 'Show how long each query takes.', example: `\\timing` },
      { cmd: '\\i', desc: 'Run SQL from a file.', example: `\\i seed.sql` },
      { cmd: '\\copy', desc: 'Import/export a table as CSV.', example: `\\copy users TO 'users.csv' CSV HEADER` },
      { cmd: '\\e', desc: 'Edit the current query in your $EDITOR.', example: `\\e` },
      { cmd: '\\q', desc: 'Quit psql.', example: `\\q` }
    ]
  },
  {
    id: 'redis', name: 'redis-cli', icon: 'ti-brand-redis',
    blurb: 'Talk to a Redis server — keys, strings, hashes, lists, and expiry.',
    commands: [
      { cmd: 'connect', desc: 'Connect to a Redis server.', example: `redis-cli -h localhost -p 6379` },
      { cmd: 'SET / GET', desc: 'Store and read a string value.', example: `SET user:1 "Ana"` },
      { cmd: 'SET … EX', desc: 'Set a value with a TTL in seconds.', example: `SET session:ab1 active EX 3600` },
      { cmd: 'DEL', desc: 'Delete a key.', example: `DEL user:1` },
      { cmd: 'EXPIRE / TTL', desc: 'Set / check a key’s time-to-live.', example: `EXPIRE user:1 60` },
      { cmd: 'INCR', desc: 'Atomically increment a counter.', example: `INCR page:views` },
      { cmd: 'SCAN', desc: 'Iterate keys safely (prefer over KEYS in prod).', example: `SCAN 0 MATCH user:* COUNT 100` },
      { cmd: 'HSET / HGETALL', desc: 'Store and read a hash (object).', example: `HSET user:1 name Ana age 30` },
      { cmd: 'LPUSH / LRANGE', desc: 'Push to and read a list.', example: `LPUSH queue job1` },
      { cmd: 'SADD / SMEMBERS', desc: 'Add to and read a set.', example: `SADD tags a b c` },
      { cmd: 'TYPE', desc: 'Show a key’s data type.', example: `TYPE user:1` },
      { cmd: 'PING', desc: 'Check the server is alive.', example: `PING` },
      { cmd: 'FLUSHDB', desc: 'Wipe the current database (careful!).', example: `FLUSHDB` }
    ]
  },
  {
    id: 'aws', name: 'AWS CLI', icon: 'ti-cloud',
    blurb: 'Common AWS CLI commands for S3, EC2, IAM, and logs.',
    commands: [
      { cmd: 'aws configure', desc: 'Set up credentials and default region.', example: `aws configure` },
      { cmd: 's3 ls', desc: 'List buckets or objects.', example: `aws s3 ls s3://my-bucket` },
      { cmd: 's3 cp', desc: 'Copy a file to or from S3.', example: `aws s3 cp build.zip s3://my-bucket/` },
      { cmd: 's3 sync', desc: 'Sync a folder to a bucket.', example: `aws s3 sync ./dist s3://my-bucket` },
      { cmd: 'sts get-caller-identity', desc: 'Show which account/role you are.', example: `aws sts get-caller-identity` },
      { cmd: 'ec2 describe-instances', desc: 'List EC2 instances.', example: `aws ec2 describe-instances` },
      { cmd: 'ec2 start-instances', desc: 'Start a stopped instance.', example: `aws ec2 start-instances --instance-ids i-0abc123` },
      { cmd: 'logs tail', desc: 'Tail a CloudWatch log group live.', example: `aws logs tail /aws/lambda/myfn --follow` },
      { cmd: 'iam list-users', desc: 'List IAM users.', example: `aws iam list-users` },
      { cmd: '--profile', desc: 'Use a named credentials profile.', example: `aws s3 ls --profile prod` },
      { cmd: '--region', desc: 'Override the region for one call.', example: `aws ec2 describe-instances --region eu-west-1` },
      { cmd: '--query / --output', desc: 'Filter and format the output.', example: `aws ec2 describe-instances --query 'Reservations[].Instances[].InstanceId' --output text` },
      { cmd: 'ssm start-session', desc: 'Shell into an instance without SSH.', example: `aws ssm start-session --target i-0abc123` }
    ]
  },
  {
    id: 'sed-awk', name: 'sed & awk', icon: 'ti-replace',
    blurb: 'Stream-edit text (sed) and process columns (awk) on the command line.',
    commands: [
      { cmd: 'sed substitute', desc: 'Replace the first match per line.', example: `sed 's/foo/bar/' file.txt` },
      { cmd: 'sed global', desc: 'Replace every match on each line.', example: `sed 's/foo/bar/g' file.txt` },
      { cmd: 'sed -i', desc: 'Edit the file in place.', example: `sed -i 's/localhost/127.0.0.1/g' config.yml` },
      { cmd: 'sed delete', desc: 'Delete matching lines.', example: `sed '/^#/d' config` },
      { cmd: 'sed -n p', desc: 'Print a line range.', example: `sed -n '10,20p' file.txt` },
      { cmd: 'awk print column', desc: 'Print a field (1-indexed).', example: `awk '{print $2}' data.txt` },
      { cmd: 'awk -F', desc: 'Set the field separator.', example: `awk -F, '{print $1}' data.csv` },
      { cmd: 'awk filter', desc: 'Print rows matching a condition.', example: `awk '$3 > 100' sales.txt` },
      { cmd: 'awk sum', desc: 'Sum a column.', example: `awk '{s += $1} END {print s}' nums.txt` },
      { cmd: 'awk NR', desc: 'Use the line number (NR).', example: `awk 'NR == 1' file.txt` },
      { cmd: 'awk with text', desc: 'Mix fields with literal text.', example: `awk '{print "id:", $1}' users.txt` }
    ]
  },
  {
    id: 'markdown', name: 'Markdown', icon: 'ti-markdown',
    blurb: 'The Markdown syntax you keep half-remembering.',
    commands: [
      { cmd: '# Heading', desc: 'Headings, one to six # for H1–H6.', example: '## Section title' },
      { cmd: '**bold**', desc: 'Bold text.', example: '**important**' },
      { cmd: '*italic*', desc: 'Italic text.', example: '*subtle emphasis*' },
      { cmd: '[text](url)', desc: 'A link.', example: '[the docs](https://example.com)' },
      { cmd: '![alt](url)', desc: 'An image.', example: '![logo](/logo.png)' },
      { cmd: '`code`', desc: 'Inline code.', example: '`npm install`' },
      { cmd: '```lang', desc: 'A fenced code block.', example: '```js\nconsole.log(1)\n```' },
      { cmd: '- item', desc: 'A bullet list.', example: '- first\n- second' },
      { cmd: '1. item', desc: 'A numbered list.', example: '1. first\n2. second' },
      { cmd: '> quote', desc: 'A blockquote.', example: '> remember this' },
      { cmd: '| a | b |', desc: 'A table row (with a --- separator row).', example: '| Name | Age |' },
      { cmd: '- [ ] / - [x]', desc: 'A task list.', example: '- [x] shipped' },
      { cmd: '~~strike~~', desc: 'Strikethrough.', example: '~~deprecated~~' },
      { cmd: '---', desc: 'A horizontal rule.', example: '---' }
    ]
  },
  {
    id: 'git-advanced', name: 'Git (Advanced)', icon: 'ti-git-merge',
    blurb: 'The Git commands you reach for when things get serious.',
    commands: [
      { cmd: 'git rebase -i', desc: 'Reorder, squash, or edit recent commits.', example: `git rebase -i HEAD~3` },
      { cmd: 'git commit --amend', desc: 'Fix up the most recent commit.', example: `git commit --amend` },
      { cmd: 'git cherry-pick', desc: 'Apply a single commit onto your branch.', example: `git cherry-pick 1a2b3c4` },
      { cmd: 'git bisect', desc: 'Binary-search history for the bad commit.', example: `git bisect start && git bisect bad && git bisect good v1.0` },
      { cmd: 'git reflog', desc: 'See every move HEAD made — recover lost work.', example: `git reflog` },
      { cmd: 'git reset (to reflog)', desc: 'Jump back to a remembered state.', example: `git reset --hard HEAD@{2}` },
      { cmd: 'git worktree', desc: 'Check out a second branch in a sibling folder.', example: `git worktree add ../hotfix main` },
      { cmd: 'git stash push -m', desc: 'Stash with a label.', example: `git stash push -m "wip login"` },
      { cmd: 'git revert -m', desc: 'Revert a merge commit.', example: `git revert -m 1 1a2b3c4` },
      { cmd: 'git clean -fd', desc: 'Delete untracked files and folders.', example: `git clean -fd` },
      { cmd: 'git log --grep', desc: 'Find commits by message.', example: `git log --grep="login bug"` },
      { cmd: 'git blame', desc: 'See who last changed each line.', example: `git blame src/app.js` },
      { cmd: 'git diff --staged', desc: 'Review what you are about to commit.', example: `git diff --staged` }
    ]
  }
];
