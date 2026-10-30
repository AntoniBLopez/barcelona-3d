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

function overlaps(a, b) {
  return !(a.r < b.l || a.l > b.r || a.b < b.t || a.t > b.b);
}

let chromeEls = null;

function chromeBoxes() {
  if (!chromeEls) chromeEls = [...document.querySelectorAll('.tools, #hint, .hero, .credit')];
  const out = [];
  const panel = document.body.classList.contains('panel-open');
  for (const el of chromeEls) {
    if (el.id === 'hint' && el.style.opacity === '0') continue;
    if (panel && (el.classList.contains('hero') || el.classList.contains('credit'))) continue;
    const b = el.getBoundingClientRect();
    if (b.width < 2 || b.height < 2) continue;
    out.push({ l: b.left - 6, r: b.right + 6, t: b.top - 4, b: b.bottom + 4 });
  }
  return out;
}

function metrics(el) {
  if (el._cls !== el.className) {
    el._cls = el.className;
    el._w = el.offsetWidth;
    el._h = el.offsetHeight;
  }
  return [el._w || 0, el._h || 0];
}

function hide(el, on) {
  if (el.classList.contains('hidden') !== on) el.classList.toggle('hidden', on);
}

/**
 * Hide names that would sit on top of each other. Zooming in spreads them
 * apart, so more names come back. `rank` decides who keeps the spot.
 * Boxes come from the projected anchor plus the label's cached size.
 */
export function declutter(rows) {
  const placed = [];
  const chrome = chromeBoxes();
  const sorted = rows.filter((r) => r.show).sort((a, b) => b.rank - a.rank);
  for (const r of rows) if (!r.show) hide(r.el, true);
  for (const r of sorted) {
    const [w, h] = metrics(r.el);
    if (w < 2) { hide(r.el, true); continue; }
    const left = r.x - w / 2;
    const top = r.y - h * 1.2;
    const box = { l: left - 12, r: left + w + 12, t: top - 8, b: top + h + 8 };
    const hit = placed.some((p) => overlaps(box, p)) || chrome.some((z) => overlaps(box, z));
    if (hit && !r.pin) hide(r.el, true);
    else { hide(r.el, false); placed.push(box); }
  }
}
