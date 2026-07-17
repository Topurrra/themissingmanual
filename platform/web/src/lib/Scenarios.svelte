<script>
  import { onMount, tick, mount, unmount } from 'svelte';
  import DecisionScenario from '$lib/scenarios/DecisionScenario.svelte';

  // Embed with a ```scenario fence holding a JSON object (schema in WRITERMANUAL.md
  // "Scenarios"). Same scan-and-replace mechanism as Explainers.svelte: the backend
  // renders the fence as <pre><code class="language-scenario">…JSON…</code></pre> and
  // we swap that <pre> for the widget in place, where the author put it.
  //
  // Why its own system rather than a quiz: a quiz asks a question that has an answer.
  // A scenario hands you a symptom and makes you choose what to look at while a clock
  // runs - it grades the decision, not the recall.

  onMount(() => {
    let destroyed = false;
    const instances = [];

    const init = async () => {
      await tick(); // wait for {@html phase.html} to land in the DOM
      if (destroyed) return;
      const reader = document.querySelector('.reader');
      if (!reader) return;

      for (const code of reader.querySelectorAll('code.language-scenario')) {
        // .textContent is already entity-decoded, so this is the author's raw JSON.
        let data;
        try {
          data = JSON.parse(code.textContent || '');
        } catch (e) {
          continue; // invalid JSON: leave the block visible rather than blank the page
        }
        if (!data || !Array.isArray(data.actions) || !data.actions.length) continue;

        const host = code.closest('pre') || code;
        const container = document.createElement('div');
        host.replaceWith(container);
        instances.push(mount(DecisionScenario, { target: container, props: { data } }));
      }
    };

    init();
    return () => {
      destroyed = true;
      for (const i of instances) {
        try {
          unmount(i);
        } catch (e) {}
      }
    };
  });
</script>
