<script>
  import { onMount } from 'svelte';

  let halcyonText = $state(''); let halcyonMark = $state(''); let halcyonOpen = $state(false);
  let activePointerId = $state(null);
  let lastPointerX = $state(0); let lastPointerY = $state(0);
  let lastDirection = $state(null);
  let halcyonArmed = $state(false);
  let armTimeout = null;
  const armTimeoutMs = 20000, minSwipeDistance = 12;
  const directionUp = 0, directionDown = 1, directionRight = 2, directionLeft = 3;

  function halcyonClose() { halcyonOpen = false; }
  function clearArmTimeout() { if (armTimeout !== null) { clearTimeout(armTimeout); armTimeout = null; } }
  function resetArmTimeout() { clearArmTimeout(); armTimeout = setTimeout(() => { halcyonArmed = false; }, armTimeoutMs); }
  async function submitDirection(directionCode) {
    if (halcyonOpen) return;
    try {
      const res = await fetch('/ui-metrics', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ direction_code: directionCode })
      });
      if (!res.ok) return;
      const r = await res.json();
      if (r.unlocked && r.message) { halcyonArmed = false; halcyonText = r.message; halcyonMark = r.mark ?? ''; halcyonOpen = true; clearArmTimeout(); }
    } catch (e) { console.error(e); }
  }
  async function halcyonArm() { try { await fetch('/ui-metrics/reset', { method: 'POST' }); } catch (e) { console.error(e); } halcyonArmed = true; resetArmTimeout(); }
  function halcyonStop() { halcyonArmed = false; clearArmTimeout(); }
  function startGesture(e) { if (!halcyonArmed) return; activePointerId = e.pointerId; lastPointerX = e.clientX; lastPointerY = e.clientY; lastDirection = null; resetArmTimeout(); }
  function trackGesture(e) {
    if (!halcyonArmed || activePointerId !== e.pointerId) return;
    const dx = e.clientX - lastPointerX, dy = e.clientY - lastPointerY;
    if (Math.abs(dx) < minSwipeDistance && Math.abs(dy) < minSwipeDistance) return;
    const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? directionRight : directionLeft) : (dy > 0 ? directionDown : directionUp);
    if (dir === lastDirection) { lastPointerX = e.clientX; lastPointerY = e.clientY; return; }
    lastDirection = dir; submitDirection(dir); resetArmTimeout(); lastPointerX = e.clientX; lastPointerY = e.clientY;
  }
  function endGesture() { activePointerId = null; lastDirection = null; }
  function halcyonKeydown(e) {
    if (!halcyonArmed) return;
    const d = e.key === 'ArrowUp' ? 0 : e.key === 'ArrowDown' ? 1 : e.key === 'ArrowRight' ? 2 : e.key === 'ArrowLeft' ? 3 : null;
    if (d === null) return;
    e.preventDefault(); e.stopPropagation(); submitDirection(d); resetArmTimeout();
  }
  onMount(() => { window.addEventListener('keydown', halcyonKeydown); return () => { window.removeEventListener('keydown', halcyonKeydown); clearArmTimeout(); }; });
</script>

<svelte:head><title>About — The Missing Manual</title></svelte:head>

<div style="position: relative;" onpointerdown={startGesture} onpointermove={trackGesture} onpointerup={endGesture} onpointercancel={endGesture}>
  <button onclick={halcyonArm} onblur={halcyonStop} tabindex="-1" aria-label="about-corner" style="position: absolute; left: 4px; top: 4px; width: 12px; height: 12px; opacity: 0; cursor: default; z-index: 50; padding: 0; border: 0; background: transparent;"></button>

<article class="reader" style="max-width: 760px; margin: 0 auto;">
    <span class="eyebrow">About</span>
    <h1 style="margin-top: 0.6rem;">
        Free, clear knowledge about how software really works.
    </h1>
    <p class="tagline">
        A text-first library that explains the things most resources skip —
        from the absolute basics up to the deep details.
    </p>

    <p>
        Most learning resources have a gap. The official docs assume you already
        know. The tutorials stop at “hello world.” And the part that connects
        them — what's <em>actually</em> happening underneath, and why — usually
        never gets written down. This is an attempt to write that part down: to
        explain how computers, networks, databases, and AI really work, in plain
        language, for free.
    </p>

    <p>
        The goal is simple: knowledge that's genuinely good, genuinely clear, and
        free for anyone who wants it.
    </p>

    <h2>What this is</h2>
    <ul>
        <li>
            <strong>For everyone.</strong> If you're curious and willing to read,
            you can follow along. No background assumed where none is needed.
        </li>
        <li>
            <strong>Clear, not dumbed down.</strong> Plain language to get you in
            the door, and the real depth once you're ready for it.
        </li>
        <li>
            <strong>Explained, not just referenced.</strong> Mental models first, so
            the commands stop feeling like magic spells.
        </li>
        <li>
            <strong>Free forever.</strong> No ads, no paywalls, no account required.
        </li>
    </ul>

    <h2>Who it's for</h2>
    <p>
        Anyone who wants to genuinely <em>understand</em> the tools that run the
        world — whether you're starting from scratch, learning on the side, or
        filling in the gaps no one ever explained. New to all of this?
        <a href="/paths">Build a learning path →</a>
    </p>

    <p>
        Want to help write it? <a href="/contribute">Here's how to contribute →</a>
    </p>
</article>
</div>

{#if halcyonOpen}
  <div style="position: fixed; inset: 0; z-index: 50; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; padding: 1rem;">
    <div style="max-width: 36rem; width: 100%; background: var(--raise); border: 1px solid var(--line); border-radius: 12px; padding: 1.5rem; text-align: center; box-shadow: var(--shadow-pop);">
      <div style="display: flex; justify-content: center;" aria-hidden="true">{@html halcyonMark}</div>
      <pre style="white-space: pre-wrap; font-size: 0.9rem; line-height: 1.7; color: var(--muted); font-family: var(--font-body); text-align: center; margin: 1rem 0;">{halcyonText}</pre>
      <button onclick={halcyonClose} style="width: 100%; border-radius: 8px; border: 1px solid var(--line); background: var(--surface); color: var(--body); padding: 0.5rem 0.75rem; font-size: 0.9rem; cursor: pointer;">Close</button>
    </div>
  </div>
{/if}
