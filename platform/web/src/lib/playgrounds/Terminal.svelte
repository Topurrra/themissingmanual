<script>
  import { tick } from 'svelte';

  const HOME = '/home/you';
  function freshFs() {
    return { '/': { type: 'dir', children: {
      home: { type: 'dir', children: { you: { type: 'dir', children: {
        'readme.txt': { type: 'file', content: 'Welcome to the sandbox shell.\nTry: ls, cat readme.txt, grep shell *, cd projects\nPipes and redirection work: cat readme.txt | grep shell\n' },
        'notes.md': { type: 'file', content: '# Notes\nshell practice\nlearn pipes\n' },
        projects: { type: 'dir', children: {
          'hello.sh': { type: 'file', content: 'echo "hello world"\n' },
          'todo.txt': { type: 'file', content: 'buy milk\nwrite guide\nship it\n' }
        } }
      } } } },
      etc: { type: 'dir', children: { hostname: { type: 'file', content: 'sandbox\n' } } }
    } } };
  }

  let fs = freshFs();
  let cwd = HOME.split('/').filter(Boolean);
  let lines = [{ t: 'out', v: "Sandbox shell - type 'help'. Pipes (|) and redirection (> >>) work." }];
  let input = '';
  let history = [];
  let hi = -1;
  let scroller;

  const prompt = () => `you@sandbox:${'/' + cwd.join('/')}$`;
  function nodeAt(parts) { let n = fs['/']; for (const p of parts) { if (!n || n.type !== 'dir' || !n.children[p]) return null; n = n.children[p]; } return n; }
  function resolve(path) {
    let parts = path.startsWith('/') ? [] : [...cwd];
    for (const seg of path.split('/')) { if (seg === '' || seg === '.') continue; if (seg === '..') parts.pop(); else parts.push(seg); }
    return parts;
  }
  function readFileAt(path) { const n = nodeAt(resolve(path)); if (!n) return { err: `${path}: No such file or directory` }; if (n.type !== 'file') return { err: `${path}: Is a directory` }; return { content: n.content }; }
  function writeFile(path, content, append) {
    const parts = resolve(path); const parent = nodeAt(parts.slice(0, -1));
    if (!parent || parent.type !== 'dir') return { err: `${path}: No such directory` };
    const name = parts.at(-1); const existing = parent.children[name];
    const body = (append && existing && existing.type === 'file' ? existing.content : '') + content + (content.endsWith('\n') ? '' : '\n');
    parent.children[name] = { type: 'file', content: body }; fs = fs; return {};
  }
  const ok = (out) => ({ out });
  const err = (e) => ({ err: e });
  const linesOf = (s) => (s == null ? [] : String(s).replace(/\n$/, '').split('\n'));

  function globToRe(g) { return new RegExp('^' + g.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$'); }

  const COMMANDS = {
    help: () => ok('Commands: ls cd pwd cat echo mkdir touch rm cp mv grep find head tail wc sort tree date whoami env clear. Pipes (|) and > >> redirection supported.'),
    pwd: () => ok('/' + cwd.join('/')),
    whoami: () => ok('you'),
    date: () => ok(new Date().toString()),
    env: () => ok(`HOME=${HOME}\nUSER=you\nSHELL=/bin/sh\nPWD=/${cwd.join('/')}`),
    clear: () => { lines = []; return ok(''); },
    ls: (args) => {
      const long = args.includes('-l'); const all = args.includes('-a');
      const target = args.find((a) => !a.startsWith('-')) || '.';
      const n = nodeAt(resolve(target));
      if (!n) return err(`ls: ${target}: No such file or directory`);
      if (n.type === 'file') return ok(target);
      let names = Object.keys(n.children).sort();
      if (all) names = ['.', '..', ...names];
      if (long) return ok(names.map((nm) => { const c = n.children[nm]; const dir = c && c.type === 'dir'; return `${dir ? 'drwxr-xr-x' : '-rw-r--r--'}  you  ${dir ? '-' : (c ? c.content.length : 0)}  ${nm}${dir ? '/' : ''}`; }).join('\n'));
      return ok(names.map((nm) => (n.children[nm] && n.children[nm].type === 'dir' ? nm + '/' : nm)).join('  '));
    },
    cd: (args) => {
      const target = args[0] || HOME; const parts = resolve(target); const n = nodeAt(parts);
      if (!n) return err(`cd: ${target}: No such file or directory`);
      if (n.type !== 'dir') return err(`cd: ${target}: Not a directory`);
      cwd = parts; return ok('');
    },
    cat: (args, stdin) => {
      const files = args.filter((a) => !a.startsWith('-'));
      if (!files.length) return ok(stdin || '');
      const parts = [];
      for (const f of files) { const r = readFileAt(f); if (r.err) return err('cat: ' + r.err); parts.push(r.content.replace(/\n$/, '')); }
      return ok(parts.join('\n'));
    },
    echo: (args) => ok(args.join(' ').replace(/^["']|["']$/g, '')),
    mkdir: (args) => { if (!args[0]) return err('mkdir: missing operand'); const p = resolve(args[0]); const par = nodeAt(p.slice(0, -1)); if (!par || par.type !== 'dir') return err(`mkdir: cannot create ${args[0]}`); if (par.children[p.at(-1)]) return err(`mkdir: ${args[0]}: File exists`); par.children[p.at(-1)] = { type: 'dir', children: {} }; fs = fs; return ok(''); },
    touch: (args) => { if (!args[0]) return err('touch: missing operand'); const p = resolve(args[0]); const par = nodeAt(p.slice(0, -1)); if (!par || par.type !== 'dir') return err(`touch: cannot touch ${args[0]}`); if (!par.children[p.at(-1)]) par.children[p.at(-1)] = { type: 'file', content: '' }; fs = fs; return ok(''); },
    rm: (args) => { const rec = args.includes('-r') || args.includes('-rf'); const t = args.find((a) => !a.startsWith('-')); if (!t) return err('rm: missing operand'); const p = resolve(t); const par = nodeAt(p.slice(0, -1)); const node = par && par.children[p.at(-1)]; if (!node) return err(`rm: ${t}: No such file or directory`); if (node.type === 'dir' && !rec) return err(`rm: ${t}: is a directory (use -r)`); delete par.children[p.at(-1)]; fs = fs; return ok(''); },
    cp: (args) => { const [s, d] = args.filter((a) => !a.startsWith('-')); if (!s || !d) return err('cp: usage: cp <src> <dst>'); const src = nodeAt(resolve(s)); if (!src) return err(`cp: ${s}: No such file or directory`); const dp = resolve(d); const par = nodeAt(dp.slice(0, -1)); if (!par || par.type !== 'dir') return err(`cp: ${d}: No such directory`); par.children[dp.at(-1)] = JSON.parse(JSON.stringify(src)); fs = fs; return ok(''); },
    mv: (args) => { const [s, d] = args.filter((a) => !a.startsWith('-')); if (!s || !d) return err('mv: usage: mv <src> <dst>'); const sp = resolve(s); const spar = nodeAt(sp.slice(0, -1)); const src = spar && spar.children[sp.at(-1)]; if (!src) return err(`mv: ${s}: No such file or directory`); const dp = resolve(d); const dpar = nodeAt(dp.slice(0, -1)); if (!dpar || dpar.type !== 'dir') return err(`mv: ${d}: No such directory`); dpar.children[dp.at(-1)] = src; delete spar.children[sp.at(-1)]; fs = fs; return ok(''); },
    grep: (args, stdin) => {
      const flags = args.filter((a) => a.startsWith('-')); const rest = args.filter((a) => !a.startsWith('-'));
      const pat = rest[0]; if (pat == null) return err('grep: usage: grep <pattern> [file]');
      let src;
      if (rest[1]) { const r = readFileAt(rest[1]); if (r.err) return err('grep: ' + r.err); src = r.content; } else src = stdin || '';
      let re; try { re = new RegExp(pat, flags.includes('-i') ? 'i' : ''); } catch (e) { re = null; }
      const hit = (l) => (re ? re.test(l) : l.includes(pat));
      return ok(linesOf(src).filter(hit).join('\n'));
    },
    head: (args, stdin) => { let n = 10; const ni = args.indexOf('-n'); if (ni >= 0) n = +args[ni + 1] || 10; const f = args.find((a, i) => !a.startsWith('-') && args[i - 1] !== '-n'); const src = f ? (readFileAt(f).content ?? '') : (stdin || ''); return ok(linesOf(src).slice(0, n).join('\n')); },
    tail: (args, stdin) => { let n = 10; const ni = args.indexOf('-n'); if (ni >= 0) n = +args[ni + 1] || 10; const f = args.find((a, i) => !a.startsWith('-') && args[i - 1] !== '-n'); const src = f ? (readFileAt(f).content ?? '') : (stdin || ''); return ok(linesOf(src).slice(-n).join('\n')); },
    wc: (args, stdin) => { const f = args.find((a) => !a.startsWith('-')); const src = f ? (readFileAt(f).content ?? '') : (stdin || ''); const ls = linesOf(src); const l = ls.length, w = src.split(/\s+/).filter(Boolean).length, c = src.length; if (args.includes('-l')) return ok(String(l)); if (args.includes('-w')) return ok(String(w)); if (args.includes('-c')) return ok(String(c)); return ok(`${l} ${w} ${c}`); },
    sort: (args, stdin) => { const f = args.find((a) => !a.startsWith('-')); const src = f ? (readFileAt(f).content ?? '') : (stdin || ''); const r = linesOf(src).sort(); if (args.includes('-r')) r.reverse(); return ok(r.join('\n')); },
    find: (args) => {
      const start = (args[0] && !args[0].startsWith('-')) ? args[0] : '.';
      const ni = args.indexOf('-name'); const pat = ni >= 0 ? args[ni + 1] : '*';
      const re = globToRe(pat); const base = nodeAt(resolve(start)); const acc = [];
      if (!base) return err(`find: ${start}: No such file or directory`);
      const walk = (n, path) => { for (const k of Object.keys(n.children)) { const p = path + '/' + k; if (re.test(k)) acc.push(p.replace(/^\/\//, '/')); if (n.children[k].type === 'dir') walk(n.children[k], p); } };
      const startPath = start === '.' ? '/' + cwd.join('/') : start;
      if (base.type === 'dir') walk(base, startPath === '/' ? '' : startPath);
      return ok(acc.join('\n') || '');
    },
    tree: () => { const root = nodeAt(cwd); const acc = []; const walk = (n, pre) => { const keys = Object.keys(n.children).sort(); keys.forEach((k, i) => { const last = i === keys.length - 1; acc.push(pre + (last ? '└─ ' : '├─ ') + k + (n.children[k].type === 'dir' ? '/' : '')); if (n.children[k].type === 'dir') walk(n.children[k], pre + (last ? '   ' : '│  ')); }); }; walk(root, ''); return ok(acc.join('\n') || '(empty)'); }
  };

  function out(v, t = 'out') { if (v !== '') lines = [...lines, { t, v }]; }
  async function scrollDown() { await tick(); if (scroller) scroller.scrollTop = scroller.scrollHeight; }

  function run() {
    out(`${prompt()} ${input}`, 'cmd');
    const raw = input.trim();
    if (raw) history = [...history, raw];
    hi = -1; input = '';
    if (!raw) return scrollDown();
    const stages = raw.split('|').map((s) => s.trim()).filter(Boolean);
    let data = null, redirectedLast = false;
    for (const stageRaw of stages) {
      let stage = stageRaw, redir = null;
      const rm = stage.match(/\s(>>?)\s*(\S+)\s*$/);
      if (rm) { redir = { mode: rm[1], file: rm[2] }; stage = stage.slice(0, rm.index); }
      const tokens = stage.split(/\s+/).filter(Boolean);
      const cmd = tokens[0]; const args = tokens.slice(1);
      const fn = COMMANDS[cmd];
      if (!fn) { out(`${cmd}: command not found`, 'err'); return done(); }
      let res; try { res = fn(args, data) || ok(''); } catch (e) { res = err(String(e)); }
      if (res.err) { out(res.err, 'err'); return done(); }
      if (redir) { const w = writeFile(redir.file, res.out || '', redir.mode === '>>'); if (w.err) { out(w.err, 'err'); return done(); } data = ''; redirectedLast = true; }
      else { data = res.out || ''; redirectedLast = false; }
    }
    if (!redirectedLast && data) out(data);
    done();
  }
  function done() { fs = fs; cwd = cwd; scrollDown(); }
  function onKey(e) {
    if (e.key === 'Enter') { e.preventDefault(); run(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (history.length) { hi = hi < 0 ? history.length - 1 : Math.max(0, hi - 1); input = history[hi]; } }
    else if (e.key === 'ArrowDown') { e.preventDefault(); if (hi >= 0) { hi = hi + 1 >= history.length ? -1 : hi + 1; input = hi < 0 ? '' : history[hi]; } }
  }
  function reset() { fs = freshFs(); cwd = HOME.split('/').filter(Boolean); lines = [{ t: 'out', v: 'Reset.' }]; }
</script>

<figure class="pg pg-term">
  <figcaption class="pg-cap"><i class="ti ti-terminal-2" aria-hidden="true"></i> Shell sandbox <button class="pg-reset" on:click={reset}>Reset</button></figcaption>
  <div class="term" bind:this={scroller} on:click={() => scroller && scroller.querySelector('input') && scroller.querySelector('input').focus()}>
    {#each lines as l}<div class="t-{l.t}">{l.v}</div>{/each}
    <div class="t-row">
      <span class="t-prompt">{prompt()}</span>
      <input bind:value={input} on:keydown={onKey} spellcheck="false" autocapitalize="off" autocomplete="off" aria-label="shell input" />
    </div>
  </div>
</figure>

<style>
  .pg { margin: 1.6rem 0; border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
  .pg-cap { display: flex; align-items: center; gap: 0.45rem; font-family: var(--font-mono); font-size: 0.72rem; letter-spacing: 0.04em; text-transform: uppercase; color: var(--muted); background: var(--surface); padding: 0.5rem 0.8rem; border-bottom: 1px solid var(--line); }
  .pg-cap .ti { color: var(--accent); font-size: 15px; }
  .pg-reset { margin-left: auto; cursor: pointer; font: inherit; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--muted); background: none; border: 1px solid var(--line); border-radius: 6px; padding: 2px 8px; }
  .pg-reset:hover { color: var(--ink); border-color: var(--accent); }
  .term { background: #16161a; color: #e6e6ea; font-family: var(--font-mono); font-size: 0.86rem; line-height: 1.5; padding: 0.8rem 0.9rem; max-height: 340px; overflow-y: auto; cursor: text; }
  .t-cmd { color: #9fe0c0; white-space: pre-wrap; word-break: break-word; }
  .t-out { white-space: pre-wrap; word-break: break-word; }
  .t-err { color: #ff8b73; white-space: pre-wrap; word-break: break-word; }
  .t-row { display: flex; gap: 0.5ch; align-items: baseline; }
  .t-prompt { color: #6fb6bc; white-space: nowrap; }
  .term input { flex: 1; min-width: 0; background: none; border: 0; outline: none; color: #e6e6ea; font: inherit; }
</style>
