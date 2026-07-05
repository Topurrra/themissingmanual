<script>
  import { onMount, onDestroy } from 'svelte';

  let currentLang = '';
  let bodyObserver;

  function readCookieLang() {
    const m = document.cookie.match(/googtrans=\/en\/([a-zA-Z-]+)/);
    return m ? m[1] : '';
  }

  function clearTranslation() {
    document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
    window.location.reload();
  }

  // Google's own trigger stays in the DOM (invisible) so its click handler keeps
  // working - our button just forwards a real click onto it. A plain .click()
  // doesn't reach Google's Closure-bound listener; a dispatched MouseEvent does.
  function openMenu() {
    const link = document.querySelector('.goog-te-gadget-simple a');
    if (link) link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    // Google reuses the same <iframe> across opens and rewrites its document
    // each time (no new node ever gets added to <body>), so the "watch for a
    // freshly-added iframe" observer only ever fires once. Re-theme on every
    // open too, since a rewrite silently wipes our earlier <style> tag.
    const frame = document.querySelector('iframe.tmm-te-frame');
    if (frame) themeMenuFrame(frame);
  }

  // The language list Google shows on click renders inside an <iframe> it
  // appends to <body> - turns out to be same-origin (Google writes into it
  // directly, it doesn't navigate to a translate.google.com document), so we
  // can reach into it and reskin it to match the site instead of leaving
  // Google's default white/blue table. Read colors from the live theme rather
  // than hardcoding them, since :root custom properties don't cross into the
  // iframe's own document.
  function injectMenuStyle(doc) {
    if (doc.getElementById('tmm-te-style')) return;
    const cs = getComputedStyle(document.documentElement);
    const v = (name) => cs.getPropertyValue(name).trim();
    const style = doc.createElement('style');
    style.id = 'tmm-te-style';
    style.textContent = `
      body, [class*="VIpgJd"] { background:${v('--raise')} !important; }
      table, tr, td, a, a div, a span { background:transparent !important; }
      a, a div, .text, .indicator {
        color:${v('--ink')} !important;
        font-family:${v('--font-body')} !important;
        font-size:0.86rem !important;
      }
      a:hover, a:hover div { background:${v('--accent-tint')} !important; color:${v('--accent')} !important; }
      a { display:block; border-radius:6px; }
      .indicator { color:${v('--faint')} !important; }
    `;
    doc.head.appendChild(style);
  }

  // Google creates the iframe empty and writes its actual language table into
  // it a beat later (own async render), and may re-render the content more
  // than once - keep re-checking/re-injecting for a few seconds rather than
  // stopping at the first success, so a later Google re-render can't silently
  // wipe our <style> tag out from under us.
  function themeMenuFrame(frame) {
    let tries = 0;
    const tick = () => {
      try {
        const doc = frame.contentDocument;
        if (doc?.body?.childElementCount) injectMenuStyle(doc);
      } catch (e) { return; } // unexpectedly cross-origin - leave Google's default look alone
      if (++tries < 30) setTimeout(tick, 150);
    };
    tick();
  }

  function watchForMenuFrame() {
    bodyObserver = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node.nodeType === 1 && node.tagName === 'IFRAME' && /skiptranslate|VIpgJd/.test(node.className)) {
            node.classList.add('tmm-te-frame');
            themeMenuFrame(node);
          }
        }
      }
    });
    bodyObserver.observe(document.body, { childList: true });
  }

  onMount(() => {
    currentLang = readCookieLang();
    watchForMenuFrame();

    if (window.google?.translate) return; // already loaded (e.g. client-side nav back to this layout)

    window.googleTranslateElementInit = () => {
      // eslint-disable-next-line no-undef
      new google.translate.TranslateElement(
      { pageLanguage: 'en', 
        autoDisplay: false,
        //RESTRICT VISIBLE LANGUAGES HERE (comma-separated ISO codes)
        includedLanguages: 'ka,ru,es,fr,it,de,ja', 
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE 
      },
        'google_translate_element'
      );
    };

    const script = document.createElement('script');
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    document.head.appendChild(script);
  });

  onDestroy(() => { if (bodyObserver) bodyObserver.disconnect(); });
</script>

<div class="translate-widget">
  <button type="button" class="icon-btn" on:click={openMenu} aria-label="Translate this page" title="Translate this page">
    <i class="ti ti-language" aria-hidden="true"></i>
  </button>
  {#if currentLang}
    <button type="button" class="te-active" on:click={clearTranslation} title="Show original (English)" aria-label="Show original language">
      <span>{currentLang.toUpperCase()}</span>
      <i class="ti ti-x" aria-hidden="true"></i>
    </button>
  {/if}
  <div id="google_translate_element" class="te-gadget-hidden" translate="no"></div>
</div>

<style>
  .translate-widget { display: flex; align-items: center; gap: 4px; }

  /* Google's gadget stays functional but invisible - clipped, not display:none,
     so its own layout math (and our forwarded click) still works. */
  .te-gadget-hidden {
    position: absolute; width: 1px; height: 1px; overflow: hidden;
    clip: rect(0 0 0 0); white-space: nowrap;
  }

  .te-active {
    display: flex; align-items: center; gap: 5px;
    background: var(--accent-tint); color: var(--accent); border: 1px solid transparent;
    border-radius: 9px; height: 34px; padding: 0 0.55rem;
    font: inherit; font-size: 0.78rem; font-weight: 600; letter-spacing: 0.02em;
    cursor: pointer;
  }
  .te-active .ti { font-size: 14px; }
  .te-active:hover { background: var(--surface); color: var(--ink); border-color: var(--line); }

  /* The language-list iframe itself (not its contents) - this part of the DOM
     is ours, so a real border/radius/shadow is fair game even though the
     content inside is reskinned separately via JS. */
  :global(iframe.tmm-te-frame) {
    border: 1px solid var(--line) !important;
    border-radius: 12px !important;
    box-shadow: var(--shadow-pop) !important;
    max-height: 70vh !important;
  }

  /* Google injects a full-width top banner + shifts <body> down when a
     translation is active - both clash with a sticky header. Suppress them;
     the language stays selectable regardless. */
  :global(.goog-te-banner-frame) { display: none !important; }
  :global(body) { top: 0 !important; }
</style>
