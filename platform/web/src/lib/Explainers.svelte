<script>
  import { onMount, tick, mount, unmount } from 'svelte';
  import ClockSignal from '$lib/explainers/ClockSignal.svelte';
  import LatencyTrace from '$lib/explainers/LatencyTrace.svelte';
  import RebaseAnimated from '$lib/explainers/RebaseAnimated.svelte';

  // Embed with a fenced block whose info string is the type, e.g.
  // ```explainer-clock . Same mechanism as Playgrounds.svelte's REGISTRY, kept as
  // a separate system: playgrounds are try-it sandboxes/tools, explainers are
  // continuously-animated, instrument-styled widgets that teach ONE concept
  // (see WRITERMANUAL.md "Interactive explainers"). Scaling to more is "write one
  // component + add one registry line" - never touching this file's scan logic.
  const REGISTRY = {
    clock: ClockSignal,
    latency: LatencyTrace,
    rebase: RebaseAnimated
  };

  onMount(() => {
    let destroyed = false;
    const instances = [];
    const init = async () => {
      await tick();
      if (destroyed) return;
      const reader = document.querySelector('.reader');
      if (!reader) return;
      const codes = reader.querySelectorAll('code[class*="language-explainer-"]');
      codes.forEach((code) => {
        const cls = [...code.classList].find((c) => c.startsWith('language-explainer-'));
        if (!cls) return;
        const type = cls.slice('language-explainer-'.length);
        const Comp = REGISTRY[type];
        if (!Comp) return;
        const host = code.closest('pre') || code;
        const config = (code.textContent || '').replace(/\n$/, '');
        const container = document.createElement('div');
        host.replaceWith(container);
        instances.push(mount(Comp, { target: container, props: { config } }));
      });
    };
    init();
    return () => { destroyed = true; for (const i of instances) { try { unmount(i); } catch (e) {} } };
  });
</script>
