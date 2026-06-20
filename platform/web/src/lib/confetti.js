// Tiny self-contained confetti burst. No dependencies, no CDN. Respects
// reduced-motion. Used by the quiz (perfect score) and the brain game (new best).
export function confetti(opts = {}) {
  if (typeof window === 'undefined') return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cv = document.createElement('canvas');
  cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:80';
  document.body.appendChild(cv);
  const ctx = cv.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; ctx.scale(dpr, dpr);
  const colors = opts.colors || ['#0e7c86', '#4d969c', '#e0b341', '#c0563c', '#2e9e6b', '#6fb6bc'];
  const n = opts.count || 150;
  const ox = opts.x != null ? opts.x : innerWidth / 2;
  const oy = opts.y != null ? opts.y : innerHeight / 3;
  const parts = Array.from({ length: n }, () => ({
    x: ox + (Math.random() - 0.5) * 140, y: oy,
    vx: (Math.random() - 0.5) * 9, vy: Math.random() * -9 - 4,
    r: 4 + Math.random() * 5, c: colors[(Math.random() * colors.length) | 0],
    rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.3
  }));
  const start = performance.now();
  function frame(t) {
    const el = t - start;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of parts) {
      p.vy += 0.22; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.globalAlpha = Math.max(0, 1 - el / 2600); ctx.fillStyle = p.c;
      ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.6); ctx.restore();
    }
    if (el < 2600) requestAnimationFrame(frame); else cv.remove();
  }
  requestAnimationFrame(frame);
}
