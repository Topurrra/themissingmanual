<script>
  // Free-recall checkpoint (the testing effect): before the quiz, ask the reader
  // to produce the phase's core idea from memory, then let them check against the
  // phase summary. Production beats recognition (Adesope et al. 2017) - this is
  // the production step the multiple-choice quiz can't provide. Self-graded, no
  // tracking: the retrieval attempt itself is the mechanism.
  export let summary = '';
  let revealed = false;
</script>

{#if summary}
  <div class="recall">
    <p class="recall-ask">
      <i class="ti ti-bulb" aria-hidden="true"></i>
      Before the quiz: without looking back, say (or jot down) the core idea of this
      phase in your own words.
    </p>
    {#if !revealed}
      <button type="button" class="recall-btn" on:click={() => (revealed = true)}>
        Done - show me the summary
      </button>
    {:else}
      <p class="recall-answer">{summary}</p>
      <p class="recall-hint">Close? Carry on. Way off? Skim the phase once more before the quiz.</p>
    {/if}
  </div>
{/if}

<style>
  .recall {
    margin: 2.2rem 0 0;
    padding: 1rem 1.2rem;
    border: 1px dashed var(--line);
    border-radius: 12px;
    background: var(--accent-tint-2);
  }
  .recall-ask {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    margin: 0;
    font-size: 0.92rem;
    color: var(--body);
    line-height: 1.5;
  }
  .recall-ask .ti { color: var(--accent); font-size: 18px; flex: none; margin-top: 1px; }
  .recall-btn {
    margin-top: 0.7rem;
    cursor: pointer;
    font: inherit;
    font-size: 0.84rem;
    color: var(--accent);
    background: none;
    border: 1px solid var(--accent);
    border-radius: 8px;
    padding: 0.4rem 0.8rem;
    transition: background 0.15s var(--ease);
  }
  .recall-btn:hover { background: var(--accent-tint); }
  .recall-answer {
    margin: 0.7rem 0 0;
    font-size: 0.92rem;
    line-height: 1.55;
    color: var(--ink);
  }
  .recall-hint { margin: 0.4rem 0 0; font-size: 0.8rem; color: var(--muted); }
</style>
