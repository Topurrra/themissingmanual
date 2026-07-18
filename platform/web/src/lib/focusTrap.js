// Svelte action for dialog focus management (WCAG 2.4.3 / APG dialog pattern):
// on mount, remembers the opener and moves focus to [data-autofocus] (or the
// first focusable element); while mounted, keeps Tab cycling inside the node;
// on destroy, returns focus to the opener. Use inside an {#if open} block so
// mount/destroy track the dialog's lifecycle.
//
// Usage: <div role="dialog" use:focusTrap> ... <input data-autofocus /> ... </div>

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function focusTrap(node) {
  const opener = document.activeElement;

  // getClientRects filters display:none/hidden elements and works for
  // position:fixed dialogs (where offsetParent is null).
  const focusables = () =>
    [...node.querySelectorAll(FOCUSABLE)].filter((el) => el.getClientRects().length > 0);

  const initial = node.querySelector('[data-autofocus]') || focusables()[0] || node;
  // Deferred so open-animations/portals settle before focus lands.
  const t = setTimeout(() => initial.focus(), 0);

  function onKeydown(e) {
    if (e.key !== 'Tab') return;
    const els = focusables();
    if (!els.length) return;
    const first = els[0];
    const last = els[els.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === node)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  node.addEventListener('keydown', onKeydown);
  return {
    destroy() {
      clearTimeout(t);
      node.removeEventListener('keydown', onKeydown);
      if (opener && typeof opener.focus === 'function' && document.contains(opener)) opener.focus();
    }
  };
}
