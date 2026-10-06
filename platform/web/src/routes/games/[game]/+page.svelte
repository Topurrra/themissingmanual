<script>
  import GameFrame from '$lib/board-games/GameFrame.svelte';
  import Seo from '$lib/Seo.svelte';
  import { getGame } from '$lib/board-games/registry.js';
  export let data;
</script>
<Seo title={getGame(data.game).name + ' - Play and learn'} description="Play at your own pace. Choose Focus or Coach, practice against the computer, and resume your game." />
{#key data.game}
  <GameFrame game={data.game} guides={data.guides} />
{/key}
