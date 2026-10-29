/** Keep monument names clickable, but let wheel and pinch zoom through them. */
export function bindLabelZoom(zoomBy, pinchBy) {
  const root = document.getElementById('labels');
  root.addEventListener('wheel', (e) => {
    if (!e.target.closest('.lbl, .slbl')) return;
    e.preventDefault();
    zoomBy(e.deltaY, e.clientX, e.clientY);
  }, { passive: false });

  let span = 0;
  root.addEventListener('touchmove', (e) => {
    if (e.touches.length < 2) return;
    e.preventDefault();
    const d = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY,
    );
    if (span) pinchBy(span / d);
    span = d;
  }, { passive: false });
  const reset = () => { span = 0; };
  root.addEventListener('touchend', reset);
  root.addEventListener('touchcancel', reset);
}

/**
 * Hide names that would sit on top of each other. Zooming in spreads them
 * apart, so more names come back. `rank` decides who keeps the spot.
 */
function overlaps(a, b) {
  return !(a.r < b.l || a.l > b.r || a.b < b.t || a.t > b.b);
}

export function declutter(rows) {
  const placed = [];
  const chrome = [...document.querySelectorAll('.tools, #hint, .hero, .credit')].flatMap((el) => {
    const b = el.getBoundingClientRect();
    if (b.width < 2 || b.height < 2 || getComputedStyle(el).opacity === '0') return [];
    return [{ l: b.left - 6, r: b.right + 6, t: b.top - 4, b: b.bottom + 4 }];
  });
  const sorted = rows.filter((r) => r.show).sort((a, b) => b.rank - a.rank);
  for (const r of rows) r.el.classList.toggle('hidden', !r.show);
  for (const r of sorted) {
    r.el.classList.remove('hidden');
    const b = r.el.getBoundingClientRect();
    if (b.width < 2) continue;
    const box = { l: b.left - 12, r: b.right + 12, t: b.top - 8, b: b.bottom + 8 };
    const hit = placed.some((p) => overlaps(box, p)) || chrome.some((z) => overlaps(box, z));
    if (hit && !r.pin) r.el.classList.add('hidden');
    else placed.push(box);
  }
}
