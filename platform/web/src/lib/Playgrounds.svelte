<script>
  import { onMount, tick, mount, unmount } from 'svelte';
  import Terminal from '$lib/playgrounds/Terminal.svelte';
  import RegexTester from '$lib/playgrounds/RegexTester.svelte';
  import GitSim from '$lib/playgrounds/GitSim.svelte';
  import NetViz from '$lib/playgrounds/NetViz.svelte';
  import Subnet from '$lib/playgrounds/Subnet.svelte';
  import BaseConverter from '$lib/playgrounds/BaseConverter.svelte';
  import Hash from '$lib/playgrounds/Hash.svelte';
  import Chmod from '$lib/playgrounds/Chmod.svelte';
  import BigO from '$lib/playgrounds/BigO.svelte';
  import JsonTool from '$lib/playgrounds/JsonTool.svelte';
  import Cron from '$lib/playgrounds/Cron.svelte';
  import EventLoop from '$lib/playgrounds/EventLoop.svelte';
  import DnsViz from '$lib/playgrounds/DnsViz.svelte';
  import Sorting from '$lib/playgrounds/Sorting.svelte';
  import TcpHandshake from '$lib/playgrounds/TcpHandshake.svelte';
  import Lru from '$lib/playgrounds/Lru.svelte';
  import LoadBalancer from '$lib/playgrounds/LoadBalancer.svelte';
  import Cors from '$lib/playgrounds/Cors.svelte';
  import HttpInspector from '$lib/playgrounds/HttpInspector.svelte';
  import SqlJoin from '$lib/playgrounds/SqlJoin.svelte';
  import DataStructure from '$lib/playgrounds/DataStructure.svelte';
  import GarbageCollect from '$lib/playgrounds/GarbageCollect.svelte';
  import Tokenizer from '$lib/playgrounds/Tokenizer.svelte';
  import Embeddings from '$lib/playgrounds/Embeddings.svelte';
  import UnitTest from '$lib/playgrounds/UnitTest.svelte';

  // Embed with a fenced block whose info string is the type, e.g.
  // ```playground-terminal . The renderer keeps it as
  // <code class="language-playground-…">; we swap each for the widget.
  const REGISTRY = {
    terminal: Terminal, regex: RegexTester, git: GitSim, network: NetViz,
    subnet: Subnet, base: BaseConverter, hash: Hash, chmod: Chmod,
    bigo: BigO, json: JsonTool, cron: Cron,
    eventloop: EventLoop, dns: DnsViz, sorting: Sorting, tcp: TcpHandshake,
    lru: Lru, lb: LoadBalancer, cors: Cors, http: HttpInspector,
    join: SqlJoin, ds: DataStructure, gc: GarbageCollect,
    tokens: Tokenizer, embed: Embeddings, unittest: UnitTest
  };

  onMount(() => {
    let destroyed = false;
    const instances = [];
    const init = async () => {
      await tick();
      if (destroyed) return;
      const reader = document.querySelector('.reader');
      if (!reader) return;
      const codes = reader.querySelectorAll('code[class*="language-playground-"]');
      codes.forEach((code) => {
        const cls = [...code.classList].find((c) => c.startsWith('language-playground-'));
        if (!cls) return;
        const type = cls.slice('language-playground-'.length);
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
