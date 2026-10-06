import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolveGamePage } from './route-data.js';

test('available game routes work without published guide metadata', () => {
  for (const game of ['chess','checkers','sudoku']) {
    assert.deepEqual(resolveGamePage(game,[]), {game,guides:[]});
  }
  assert.throws(() => resolveGamePage('go',[]), /not found/i);
  assert.throws(() => resolveGamePage('poker',[]), /not found/i);
});
test('a game page links its own Games guide first, then the shared one, nothing else', () => {
  const guides = [{slug:'sudoku-from-zero'},{slug:'how-computers-play-games'},{slug:'chess-from-zero'},{slug:'go-the-board-game'}];
  const page = resolveGamePage('chess',[{slug:'games',guides},{slug:'programming-languages',guides:[{slug:'go-from-zero'}]}]);
  assert.deepEqual(page.guides.map(g => g.slug),['chess-from-zero','how-computers-play-games']);
  assert.deepEqual(resolveGamePage('checkers',[{slug:'games',guides}]).guides.map(g => g.slug),['how-computers-play-games']);
});
test('game pages are in centered shell and discoverable from Train and footer', async () => {
  const layout = await readFile(new URL('../../routes/+layout.svelte',import.meta.url),'utf8');
  const train = await readFile(new URL('../../routes/train/+page.svelte',import.meta.url),'utf8');
  assert.match(layout,/path === "\/games"/);
  assert.match(layout,/href="\/games"/);
  const tabs = await readFile(new URL('../TrainTabs.svelte',import.meta.url),'utf8');
  assert.match(train,/<TrainTabs /);
  assert.match(tabs,/href: '\/games'/);
});

test('optional backend failures do not block games but retain other route behavior', async () => {
  const source = await readFile(new URL('../../routes/+layout.server.js',import.meta.url),'utf8');
  const stubbed = source.replace(/^import .*;\r?$/gm,'')
    .replace('export async function load','async function load');
  const load = new Function('listCategories','listGuides','getGuide','API_BASE','isAskEnabled','isTutorEnabled','splitLocale', stubbed + '\nreturn load;')(
    async () => { throw new Error('API offline'); },
    async () => { throw new Error('API offline'); },
    async () => null, 'http://offline', () => false, () => false, path => ({path})
  );
  const fetch = async () => { throw new Error('offline'); };
  assert.deepEqual((await load({fetch,url:new URL('https://example.org/games/go'),locals:{}})).nav,[]);
  await assert.rejects(load({fetch,url:new URL('https://example.org/guides/chess'),locals:{}}),/API offline/);
});
