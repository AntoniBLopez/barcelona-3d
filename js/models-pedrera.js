import * as THREE from 'three';
import { add, box, cyl, mat, watchGlow, checkerTexture } from './kit.js';

const cream = () => mat('#e7dcc8', { emissive: '#ffd2a4', emissiveIntensity: 0.4, roughness: 0.86 });
const creamD = () => mat('#d4c6ae', { emissive: '#e8c090', emissiveIntensity: 0.3, roughness: 0.9 });
const creamW = () => mat('#f3ead8', { emissive: '#ffe0b8', emissiveIntensity: 0.42, roughness: 0.82 });
const iron = () => mat('#2a2e34', { roughness: 0.48, metalness: 0.5, emissive: '#3a342e', emissiveIntensity: 0.2 });
const glass = () => mat('#243044', { emissive: '#ffb15a', emissiveIntensity: 2.2, roughness: 0.32 });
const court = () => mat('#1a222c', { emissive: '#ffb15a', emissiveIntensity: 0.25, roughness: 0.8 });
const crossM = () => mat('#f4efe4', { emissive: '#fff0d0', emissiveIntensity: 0.7, roughness: 0.4 });

/** Hand-set swells, one row per floor. Neighbouring floors do not share a wave. */
const BULGE = [
  [0.1, 2.4, 0.5, 3.2, 0.8, 2.1, 0.0, 2.8, 0.6],
  [2.2, 0.2, 2.9, 0.4, 1.6, 0.1, 2.5, 0.7, 1.8],
  [0.4, 1.9, 0.0, 2.3, 3.3, 0.6, 1.1, 2.6, 0.2],
  [2.7, 0.5, 1.8, 0.1, 1.0, 2.4, 0.3, 1.5, 3.0],
  [0.3, 1.6, 2.5, 0.7, 0.0, 1.9, 2.8, 0.4, 0.9],
  [1.7, 0.1, 0.9, 2.6, 0.3, 0.2, 1.4, 2.2, 0.5],
];
const WIN_R = [1.25, 1.05, 0.82, 0.64, 0.5, 0.4];
const STONE = [cream, creamD, creamW];

const wash = new THREE.MeshBasicMaterial({
  color: '#ffc48a', transparent: true, depthWrite: false,
  blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
});
watchGlow(wash, 0.22, true);

/** Casa Milà, metres. The curved chamfer faces +Z, toward the street corner. */
export function pedrera() {
  const g = new THREE.Group();
  const tex = checkerTexture('#f4f7f2', '#2f8f5a', 4);
  const trenca = mat('#ffffff', {
    map: tex, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.55,
    roughness: 0.42, name: 'pedrera-trenca',
  });
  facade(g);
  courts(g);
  roof(g, trenca);
  return g;
}

function facade(g) {
  const n = BULGE[0].length;
  const span = 2.15;
  for (let i = 0; i < n; i++) {
    const a = -span / 2 + (i / (n - 1)) * span;
    const bay = new THREE.Group();
    bay.position.set(Math.sin(a) * 15, 0, Math.cos(a) * 15 + 8);
    bay.rotation.y = a;
    for (let f = 0; f < 6; f++) {
      const bulge = BULGE[f][i];
      const y = 2.15 + f * 4.15 + (i % 3) * 0.28;
      const h = f === 5 ? 2.2 + (i % 3) * 0.6 : 3.9;
      add(bay, box(4.2, h, 2.2 + bulge * 0.35), STONE[(i + f) % 3](), 0, y, bulge);
      const wr = WIN_R[f] * (0.82 + ((i * 3 + f) % 5) * 0.08);
      const win = add(bay, cyl(wr, wr * 0.92, 0.55, 10), glass(), ((i + f) % 3 - 1) * 0.28, y + 0.1, bulge + 1.35);
      win.rotation.x = Math.PI / 2;
      win.scale.set(1.35, 1, 0.82);
      if (f < 5) seaweed(bay, y - h * 0.28, bulge + 2.05, i * 5 + f);
    }
    g.add(bay);
    add(g, box(3.2, 26, 0.35), wash, Math.sin(a) * 17.2, 14, Math.cos(a) * 17.2 + 8);
  }
  add(g, box(22, 22, 8), creamD(), 0, 11, 6);
  add(g, box(10, 18, 6), cream(), -11, 9, 14);
  add(g, box(10, 18, 6), cream(), 11, 9, 14);
}

function seaweed(p, y, z, seed) {
  const m = iron();
  const scrap = [
    [1.8, 0.14, 0.4],
    [0.4, 0.12, 1.5],
    [1.2, 0.1, 0.55],
    [0.7, 0.16, 0.9],
  ];
  scrap.forEach(([w, h, d], k) => {
    const bit = add(p, box(w, h, d), m, ((k % 3) - 1) * 0.55, y + (k - 1.5) * 0.16, z + (k % 2) * 0.25);
    bit.rotation.set(0.4 + (seed % 3) * 0.35, 0.8 * k + seed * 0.15, 0.6 + k * 0.55);
  });
}

function courts(g) {
  for (const x of [-5.2, 5.4]) {
    add(g, box(4.4, 0.35, 5.6), court(), x, 0.4, 13);
    add(g, box(0.45, 22, 5.6), creamD(), x - 2.2, 11, 13);
    add(g, box(0.45, 22, 5.6), creamD(), x + 2.2, 11, 13);
    add(g, box(4.4, 22, 0.45), creamD(), x, 11, 10.2);
    add(g, box(4.4, 22, 0.45), cream(), x, 11, 15.8);
  }
}

function roof(g, trenca) {
  const pads = [
    [-8, 26.4, 4, 9, 6, 1.1],
    [6, 27.6, 8, 8, 5, 0.8],
    [0, 25.5, 16, 7, 4, 1.4],
    [-4, 28.3, 11, 6, 4, 0.7],
  ];
  for (const [x, y, z, w, d, h] of pads) add(g, box(w, h, d), creamW(), x, y, z);
  const stone = cream();
  warrior(g, -7, 27.2, 6, stone, false);
  warrior(g, -2, 28.8, 10, trenca, true);
  warrior(g, 3.5, 26.6, 15, stone, false);
  warrior(g, 8, 28.2, 7, trenca, true);
  warrior(g, -9, 26.2, 14, trenca, true);
  warrior(g, 1, 27.4, 4, stone, false);
  stair(g, -5, 27.6, 16);
  stair(g, 7, 26.8, 12);
}

function warrior(g, x, y, z, material, tile) {
  add(g, cyl(0.85, 1.05, 1.5, 7), material, x, y + 0.75, z);
  add(g, cyl(0.48, 0.62, 1.6, 6), material, x, y + 2.15, z);
  const helm = add(g, new THREE.SphereGeometry(0.85, 7, 6), material, x, y + 3.15, z);
  helm.scale.set(1.05, 1.35, 1.1);
  add(g, box(0.9, 0.2, 0.22), iron(), x, y + 2.95, z + 0.62);
  if (!tile) add(g, box(0.14, 0.55, 0.14), creamD(), x, y + 4.15, z);
}

function stair(g, x, y, z) {
  add(g, box(2.4, 2.6, 2.2), cream(), x, y + 1.3, z);
  add(g, box(0.18, 1.35, 0.18), crossM(), x, y + 3.3, z);
  add(g, box(0.85, 0.18, 0.18), crossM(), x, y + 3.55, z);
}
