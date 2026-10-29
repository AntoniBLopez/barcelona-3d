import { MONUMENTS, GAUDI_ROUTE, catColor, text } from './monuments.js';
import { CITY } from '../data/city.js';
import { PHOTOS } from '../data/photos.js';
import { getLang, setLang, t } from './i18n.js';
import { bindLabelZoom, declutter } from './labels.js';

const $ = (id) => document.getElementById(id);
const FLAGS = {
  es: '<svg viewBox="0 0 30 20"><rect width="30" height="20" fill="#c60b1e"/><rect y="5" width="30" height="10" fill="#ffc400"/></svg>',
  en: '<svg viewBox="0 0 60 30"><rect width="60" height="30" fill="#012169"/><path d="M0 0L60 30M60 0L0 30" stroke="#fff" stroke-width="6"/><path d="M0 0L60 30M60 0L0 30" stroke="#c8102e" stroke-width="3"/><path d="M30 0V30M0 15H60" stroke="#fff" stroke-width="10"/><path d="M30 0V30M0 15H60" stroke="#c8102e" stroke-width="6"/></svg>',
};

let sceneApi = null;
let current = null;
let tour = null;
let gaudiOnly = false;
let night = document.documentElement.dataset.theme === 'dark';
let userTheme = false;
let spinOn = true;
let tramOn = true;
let metroOn = false;

const labels = new Map();
const stationLabels = new Map();

export function mount(api) {
  sceneApi = api;
  sceneApi.setNight(night);
  bindLabelZoom((dy) => sceneApi.zoomBy(dy), (f) => sceneApi.pinchBy(f));
  buildLists();
  renderTexts();
  bind();
  try {
    if (localStorage.getItem('bcn-theme')) userTheme = true;
  } catch { /* ignore */ }
  const mq = matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener?.('change', (e) => { if (!userTheme) setNight(e.matches, true); });
}

function cycle() {
  return gaudiOnly ? MONUMENTS.filter((m) => m.gaudi) : MONUMENTS;
}

function buildLists() {
  const labelsEl = $('labels');
  const listEl = $('list-items');
  for (const m of MONUMENTS) {
    const b = document.createElement('button');
    b.className = 'lbl hidden';
    b.style.setProperty('--c', catColor(m.cat));
    b.addEventListener('click', () => select(m.id));
    labelsEl.appendChild(b);
    labels.set(m.id, b);
    const li = document.createElement('button');
    li.className = 'item';
    li.addEventListener('click', () => { toggleList(false); select(m.id); });
    listEl.appendChild(li);
    m.li = li;
  }
  for (const s of CITY.metro.stations) {
    const b = document.createElement('div');
    b.className = 'slbl hidden';
    b.style.setProperty('--c', CITY.metro.colors[s.lines[0]] || '#c8102e');
    b.innerHTML = `<span class="dotline"></span><span></span>`;
    labelsEl.appendChild(b);
    stationLabels.set(s.id, b);
  }
}

function labelTip(id, key) {
  const el = $(id);
  const label = t(key);
  el.dataset.tip = label;
  el.setAttribute('aria-label', label);
}

export function renderTexts() {
  const lang = getLang();
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  $('lang-flag').innerHTML = FLAGS[lang];
  $('lang-name').textContent = t('langName');
  $('list-title').textContent = gaudiOnly ? t('listGaudi', { n: cycle().length }) : t('list', { n: MONUMENTS.length });
  $('scene').setAttribute('aria-label', t('canvas'));
  labelTip('t-keys', 'tipKeys');
  labelTip('t-home', 'tipHome');
  labelTip('t-night', night ? 'tipDay' : 'tipNight');
  labelTip('t-spin', 'tipSpin');
  labelTip('t-tram', 'tipTram');
  labelTip('t-metro', 'tipMetro');
  for (const m of MONUMENTS) {
    const name = text(m, lang, 'name');
    const b = labels.get(m.id);
    b.innerHTML = `<span class="num">${String(m.n).padStart(2, '0')}</span>${name}<em>${text(m, lang, 'sub')}</em>`;
    b.style.setProperty('--c', catColor(m.cat));
    m.li.innerHTML = `<span class="num" style="--c:${catColor(m.cat)}">${String(m.n).padStart(2, '0')}</span><span><div>${name}</div><div class="meta">${text(m, lang, 'style')}</div></span>`;
    m.li.hidden = gaudiOnly && !m.gaudi;
    b.classList.toggle('hidden', gaudiOnly && !m.gaudi);
  }
  for (const s of CITY.metro.stations) {
    stationLabels.get(s.id).querySelector('span:last-child').textContent = lang === 'en' ? s.en : s.es;
  }
  if (current) fill(current);
}

function fill(m) {
  const lang = getLang();
  $('p-eyebrow').textContent = `${String(m.n).padStart(2, '0')} — ${text(m, lang, 'sub')}`;
  $('p-title').textContent = text(m, lang, 'name');
  $('p-hero').style.setProperty('--c1', catColor(m.cat));
  $('p-year').textContent = m.year;
  $('p-yearl').textContent = text(m, lang, 'yearl');
  const photo = PHOTOS[m.id];
  const img = $('p-img');
  const fb = $('p-fallback');
  img.classList.remove('on');
  if (photo) {
    fb.hidden = true;
    img.alt = text(m, lang, 'name');
    img.onload = () => img.classList.add('on');
    img.onerror = () => { img.classList.remove('on'); fb.hidden = false; fb.textContent = t('noPhoto'); };
    if (!img.src.endsWith(`img/${m.id}.jpg`)) img.src = `img/${m.id}.jpg`;
    else if (img.complete && img.naturalWidth) img.classList.add('on');
    $('p-credit').innerHTML = `${t('photo')}: ${photo.author} · <a href="${photo.url}" target="_blank" rel="noopener">${photo.license}</a> · Wikimedia Commons`;
  } else {
    img.removeAttribute('src');
    fb.hidden = false;
    fb.textContent = text(m, lang, 'name');
    $('p-credit').textContent = '';
  }
  $('p-route').href = `https://www.google.com/maps/dir/?api=1&destination=${m.lat},${m.lng}&travelmode=walking`;
  const web = $('p-web');
  web.hidden = !m.web;
  if (m.web) {
    web.href = m.web;
    try { $('p-web-host').textContent = new URL(m.web).hostname.replace(/^www\./, ''); } catch { $('p-web-host').textContent = ''; }
  }
  $('p-desc').textContent = text(m, lang, 'desc');
  $('p-stats').innerHTML = text(m, lang, 'stats').map((s) => `<div class="stat"><b>${s[0]}</b><span>${s[1]}</span></div>`).join('');
  $('p-tip').innerHTML = `<strong>${t('look')}</strong> ${text(m, lang, 'tip')}`;
  const list = cycle();
  const i = Math.max(0, list.findIndex((x) => x.id === m.id));
  const prev = list[(i - 1 + list.length) % list.length];
  const next = list[(i + 1) % list.length];
  $('p-prev').querySelector('span').textContent = text(prev, lang, 'name');
  $('p-next').querySelector('span').textContent = text(next, lang, 'name');
}

export function select(id, fromTour = false) {
  const m = MONUMENTS.find((x) => x.id === id);
  if (!m) return;
  if (!fromTour) stopTour();
  current = m;
  labels.forEach((el, key) => el.classList.toggle('sel', key === id));
  sceneApi.focusMonument(m);
  fill(m);
  document.body.classList.add('panel-open');
  $('panel').scrollTop = 0;
  $('hint').style.opacity = '0';
  $('follow').hidden = true;
}

function step(dir) {
  const list = cycle();
  const i = current ? list.findIndex((x) => x.id === current.id) : -1;
  const next = list[(i + dir + list.length) % list.length];
  select(next.id, !!tour);
}

function closePanel() {
  document.body.classList.remove('panel-open');
  labels.forEach((el) => el.classList.remove('sel'));
  sceneApi.clearFocus();
  sceneApi.goHome();
  current = null;
  stopTour();
}

function toggleList(force) {
  const open = force ?? $('list').classList.contains('closed');
  $('list').classList.toggle('closed', !open);
}

function stopTour() {
  if (tour) { clearInterval(tour); tour = null; }
}

function startTour(ids) {
  stopTour();
  toggleList(false);
  let i = 0;
  select(ids[0], true);
  tour = setInterval(() => {
    i = (i + 1) % ids.length;
    select(ids[i], true);
  }, 6800);
}

function setNight(on, instant) {
  night = on;
  document.documentElement.dataset.theme = on ? 'dark' : 'light';
  try { localStorage.setItem('bcn-theme', on ? 'dark' : 'light'); } catch { /* ignore */ }
  sceneApi.setNight(on);
  $('night-ico').innerHTML = on
    ? '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/>'
    : '<path d="M20 14.5A8 8 0 0 1 9.5 4 7.5 7.5 0 1 0 20 14.5z"/>';
  if (!instant) renderTexts();
  else labelTip('t-night', night ? 'tipDay' : 'tipNight');
}

function bind() {
  $('lang-btn').onclick = (e) => {
    e.stopPropagation();
    const menu = $('lang-menu');
    menu.hidden = !menu.hidden;
    $('lang-btn').setAttribute('aria-expanded', String(!menu.hidden));
  };
  document.querySelectorAll('#lang-menu button').forEach((b) => {
    b.onclick = () => {
      setLang(b.dataset.lang);
      $('lang-menu').hidden = true;
      renderTexts();
    };
  });
  $('menu-btn').onclick = () => toggleList();
  $('cta').onclick = () => startTour(MONUMENTS.map((m) => m.id));
  $('gaudi-btn').onclick = () => startTour(GAUDI_ROUTE);
  $('more-btn').onclick = (e) => {
    e.stopPropagation();
    const menu = $('more-menu');
    menu.hidden = !menu.hidden;
  };
  $('more-list').onclick = () => { $('more-menu').hidden = true; toggleList(true); };
  $('more-tour').onclick = () => { $('more-menu').hidden = true; startTour(MONUMENTS.map((m) => m.id)); };
  $('more-gaudi').onclick = () => { $('more-menu').hidden = true; startTour(GAUDI_ROUTE); };
  $('f-all').onclick = () => { gaudiOnly = false; $('f-all').setAttribute('aria-pressed', 'true'); $('f-gaudi').setAttribute('aria-pressed', 'false'); renderTexts(); };
  $('f-gaudi').onclick = () => { gaudiOnly = true; $('f-gaudi').setAttribute('aria-pressed', 'true'); $('f-all').setAttribute('aria-pressed', 'false'); renderTexts(); };
  $('p-close').onclick = closePanel;
  $('p-min').onclick = () => {
    document.body.classList.toggle('panel-min');
    $('p-min').textContent = document.body.classList.contains('panel-min') ? '+' : '–';
  };
  $('p-prev').onclick = () => step(-1);
  $('p-next').onclick = () => step(1);
  $('t-home').onclick = () => { stopTour(); closePanel(); };
  $('t-night').onclick = () => { userTheme = true; setNight(!night); };
  $('t-spin').onclick = () => {
    spinOn = !spinOn;
    sceneApi.setSpin(spinOn);
    $('t-spin').setAttribute('aria-pressed', String(spinOn));
    $('spin-ico').innerHTML = spinOn ? '<path d="M9 6v12M15 6v12"/>' : '<path d="M8 5l11 7-11 7z"/>';
    renderTexts();
  };
  $('t-tram').onclick = () => {
    tramOn = !tramOn;
    sceneApi.setTram(tramOn);
    $('t-tram').setAttribute('aria-pressed', String(tramOn));
    if (!tramOn) $('follow').hidden = true;
  };
  $('t-metro').onclick = () => {
    metroOn = !metroOn;
    sceneApi.setMetro(metroOn);
    $('t-metro').setAttribute('aria-pressed', String(metroOn));
    if (!metroOn) stationLabels.forEach((el) => el.classList.add('hidden'));
  };
  $('t-keys').onclick = () => {
    const k = $('keys');
    k.hidden = !k.hidden;
    $('t-keys').setAttribute('aria-pressed', String(!k.hidden));
  };
  $('follow').onclick = () => { sceneApi.stopFollow(); $('follow').hidden = true; };
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.lang')) $('lang-menu').hidden = true;
    if (!e.target.closest('.more')) $('more-menu').hidden = true;
    if (!e.target.closest('#list, #menu-btn, #more-list')) toggleList(false);
  });
  addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('input, textarea')) return;
    const k = e.key.toLowerCase();
    if (e.key === 'ArrowRight') step(1);
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'Escape') { toggleList(false); if (current) closePanel(); sceneApi.stopFollow(); $('follow').hidden = true; }
    else if (k === 'n') $('t-night').click();
    else if (k === 'l') { setLang(getLang() === 'es' ? 'en' : 'es'); renderTexts(); }
    else if (k === 'm') $('t-metro').click();
    else if (k === 't') $('t-tram').click();
    else if (k === 'h') $('t-home').click();
    else if (k === 'g') $('gaudi-btn').click();
    else if (k === '+' || k === '=') sceneApi.zoomBy(-160);
    else if (k === '-' || k === '_') sceneApi.zoomBy(160);
  });
}

export function onFrame(payload) {
  const lang = getLang();
  const rows = [];
  for (const item of payload.monuments) {
    const el = labels.get(item.id);
    if (!el) continue;
    const mon = MONUMENTS.find((m) => m.id === item.id);
    const show = item.visible && !(gaudiOnly && !mon.gaudi);
    el.style.transform = `translate(${item.x}px, ${item.y}px) translate(-50%, -120%)`;
    const pin = current && current.id === item.id;
    rows.push({ el, show, pin, rank: (pin ? 100 : 0) + (item.major ? 8 : 0) });
  }
  declutter(rows);
  for (const s of payload.stations) {
    const el = stationLabels.get(s.id);
    if (!el) continue;
    el.classList.toggle('hidden', !s.visible);
    el.style.transform = `translate(${s.x}px, ${s.y}px) translate(-50%, -130%)`;
    el.querySelector('span:last-child').textContent = (lang === 'en' ? CITY.metro.stations.find((x) => x.id === s.id).en : CITY.metro.stations.find((x) => x.id === s.id).es);
  }
}

export function onPick(hit) {
  if (hit.kind === 'monument') select(hit.id);
  if (hit.kind === 'tram') {
    const ref = sceneApi.followTram(hit.index);
    if (!ref) return;
    current = null;
    document.body.classList.remove('panel-open');
    labels.forEach((el) => el.classList.remove('sel'));
    $('follow').hidden = false;
    $('hint').style.opacity = '0';
    $('follow').querySelector('[data-i18n]').textContent = `${t('following')} ${ref}`;
  }
}
