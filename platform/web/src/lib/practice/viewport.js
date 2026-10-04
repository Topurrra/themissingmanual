export function practiceViewport(node) {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const update = () => {
    node.style.setProperty('--practice-header-offset', `${Math.max(0, header.getBoundingClientRect().bottom)}px`);
  };
  const observer = new ResizeObserver(update);

  observer.observe(header);
  window.addEventListener('resize', update);
  window.addEventListener('scroll', update, { passive: true });
  update();

  return {
    destroy() {
      observer.disconnect();
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update);
    }
  };
}
