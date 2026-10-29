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
export function declutter(rows) {
  const placed = [];
  const sorted = rows.filter((r) => r.show).sort((a, b) => b.rank - a.rank);
  for (const r of rows) r.el.classList.toggle('hidden', !r.show);
  for (const r of sorted) {
    r.el.classList.remove('hidden');
    const b = r.el.getBoundingClientRect();
    if (b.width < 2) continue;
    const box = { l: b.left - 4, r: b.right + 4, t: b.top - 3, b: b.bottom + 3 };
    const hit = placed.some((p) => !(box.r < p.l || box.l > p.r || box.b < p.t || box.t > p.b));
    if (hit && !r.pin) r.el.classList.add('hidden');
    else placed.push(box);
  }
}
