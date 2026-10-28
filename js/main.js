import { createScene } from './scene.js';
import { mount, renderTexts, onFrame, onPick } from './ui.js';

const loader = document.getElementById('loader');
const pct = document.getElementById('pct');

const scene = await createScene(document.getElementById('scene'), {
  progress(n) { pct.style.width = `${Math.round(n)}%`; },
  frame: onFrame,
  pick: onPick,
});

mount(scene);
renderTexts();
requestAnimationFrame(() => loader.classList.add('done'));
