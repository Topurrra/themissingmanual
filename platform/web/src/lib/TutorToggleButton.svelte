<script>
  import { page } from '$app/stores';
  import { tutorOpen } from '$lib/tutor-store.js';

  $: show = !!$page.data?.tutorEnabled && /^\/guides\/[^/]+\/\d+/.test($page.url.pathname);
</script>

{#if show}
  <button class="icon-btn" on:click={() => tutorOpen.update((v) => !v)} aria-label="Ask the AI tutor" aria-expanded={$tutorOpen} title="Ask the AI tutor">
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M12 4L21 7.5L12 9L3 7.5Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
      <path d="M21 7.5C21.8 8.5 21.8 10 21 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
      <circle cx="21" cy="11.4" r="0.9" fill="currentColor" />
      <rect x="6" y="9" width="12" height="9" rx="3" stroke="currentColor" stroke-width="1.6" />
      <rect x="4" y="11.5" width="2" height="3" rx="0.6" stroke="currentColor" stroke-width="1.4" />
      <rect x="18" y="11.5" width="2" height="3" rx="0.6" stroke="currentColor" stroke-width="1.4" />
      <circle cx="9.5" cy="13.7" r="1" fill="currentColor" />
      <circle cx="14.5" cy="13.7" r="1" fill="currentColor" />
    </svg>
  </button>
{/if}
