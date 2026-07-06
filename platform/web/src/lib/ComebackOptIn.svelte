<script>
  import { onMount } from 'svelte';
  import { allCards, loadState, countDue, enrolledStats } from '$lib/srs.js';

  const DISMISS_KEY = 'tmm-push-dismissed';

  let supported = false;
  let subscribed = false;
  let visible = false;
  let busy = false;
  let error = '';

  function urlBase64ToUint8Array(base64) {
    const padding = '='.repeat((4 - (base64.length % 4)) % 4);
    const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(b64);
    return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
  }

  function currentDueInfo() {
    const cards = allCards();
    const state = loadState();
    return { dueCount: countDue(cards, state), nextDue: enrolledStats(cards, state).nextDue };
  }

  async function reportState(subscription) {
    const { dueCount, nextDue } = currentDueInfo();
    try {
      await fetch('/push.subscribe.json', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ subscription: subscription.toJSON(), dueCount, nextDue })
      });
    } catch (e) {}
  }

  async function enable() {
    busy = true;
    error = '';
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') { error = "Reminders need notification permission - you can turn it on later from your browser's site settings."; return; }
      const reg = await navigator.serviceWorker.ready;
      const keyRes = await fetch('/push.vapid.json');
      const { publicKey } = await keyRes.json();
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });
      await reportState(subscription);
      subscribed = true;
    } catch (e) {
      error = "Couldn't turn on reminders - please try again.";
    } finally {
      busy = false;
    }
  }

  async function disable() {
    busy = true;
    try {
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.getSubscription();
      if (subscription) {
        await fetch('/push.unsubscribe.json', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint })
        });
        await subscription.unsubscribe();
      }
      subscribed = false;
    } finally {
      busy = false;
    }
  }

  function dismiss() {
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch (e) {}
    visible = false;
  }

  onMount(async () => {
    supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    if (!supported) return;

    try {
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        subscribed = true;
        visible = true;
        reportState(existing); // opportunistic refresh of the server's due-count snapshot
        return;
      }
    } catch (e) {}

    // Only offer the opt-in once there's something to actually remind about,
    // and not to someone who already said no.
    const dismissed = (() => { try { return localStorage.getItem(DISMISS_KEY) === '1'; } catch (e) { return false; } })();
    if (dismissed || Notification.permission === 'denied') return;
    const { enrolled } = enrolledStats(allCards(), loadState());
    visible = enrolled > 0;
  });
</script>

{#if supported && visible}
  <div class="cbo">
    {#if subscribed}
      <i class="ti ti-bell-ringing" aria-hidden="true"></i>
      <span>Reminders are on - we'll nudge you when cards are due.</span>
      <button type="button" class="cbo-link" on:click={disable} disabled={busy}>Turn off</button>
    {:else}
      <i class="ti ti-bell" aria-hidden="true"></i>
      <span>Want a nudge when cards are due? No account needed.</span>
      <button type="button" class="cbo-btn" on:click={enable} disabled={busy}>{busy ? 'Enabling…' : 'Enable reminders'}</button>
      <button type="button" class="cbo-link" on:click={dismiss}>No thanks</button>
    {/if}
    {#if error}<p class="cbo-err">{error}</p>{/if}
  </div>
{/if}

<style>
  .cbo {
    display: flex; align-items: center; flex-wrap: wrap; gap: 0.6rem;
    margin-top: 1.2rem; padding: 0.85rem 1.1rem;
    border: 1px solid var(--line); border-radius: 12px; background: var(--raise);
    font-size: 0.92rem; color: var(--body);
  }
  .cbo .ti { color: var(--accent); font-size: 18px; flex: none; }
  .cbo-btn {
    cursor: pointer; font: inherit; font-weight: 600; font-size: 0.85rem;
    color: #fff; background: var(--accent); border: 0; border-radius: 8px; padding: 0.45rem 0.9rem;
  }
  .cbo-btn:hover:not(:disabled) { background: var(--accent-strong); }
  .cbo-btn:disabled { opacity: 0.6; cursor: default; }
  .cbo-link { cursor: pointer; font: inherit; font-size: 0.85rem; color: var(--muted); background: none; border: 0; text-decoration: underline; }
  .cbo-err { flex-basis: 100%; margin: 0; color: #c0563c; font-size: 0.85rem; }
</style>
