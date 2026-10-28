import * as THREE from 'three';
import { add, box, cyl, cone, mat, watchGlow } from './kit.js';

const beige = () => mat('#e4d0b0', { emissive: '#ffc48a', emissiveIntensity: 0.5 });
const ochre = () => mat('#b88858', { emissive: '#e09048', emissiveIntensity: 0.62 });
const bone = () => mat('#f3ecdf');
const craneY = () => mat('#e2b423', { roughness: 0.45, metalness: 0.2 });
const craneW = () => mat('#f7f8f6', { roughness: 0.5 });

const TIPS = [
  mat('#d24a3a', { emissive: '#e85a40', emissiveIntensity: 1.8 }),
  mat('#e2b423', { emissive: '#f0c84a', emissiveIntensity: 1.7 }),
  mat('#f6f3ec', { emissive: '#fff6e0', emissiveIntensity: 1.5 }),
];
const GLASS = [
  mat('#c4483a', { emissive: '#e25848', emissiveIntensity: 2.4, roughness: 0.3 }),
  mat('#3a6eb8', { emissive: '#4a88e8', emissiveIntensity: 2.4, roughness: 0.3 }),
  mat('#d4a03a', { emissive: '#f0c060', emissiveIntensity: 2.0, roughness: 0.3 }),
  mat('#2d8a62', { emissive: '#3cb888', emissiveIntensity: 2.0, roughness: 0.3 }),
];
const STAR = mat('#f4f8ff', { emissive: '#ffffff', emissiveIntensity: 4.6, roughness: 0.15 });
const CROSS = mat('#fff8ea', { emissive: '#fff2cc', emissiveIntensity: 3.8, roughness: 0.25 });
const WASH = new THREE.MeshBasicMaterial({
  color: '#ffb56a',
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  side: THREE.DoubleSide,
});
watchGlow(WASH, 0.62, true);

const SPINDLE = spindle();

/** Sagrada Família in 2026, in metres. +X east (Nativity), −X west (Passion), +Z south (Glory). */
export function sagrada() {
  const g = new THREE.Group();
  nave(g);
  apostles(g);
  evangelists(g);
  mary(g);
  jesus(g);
  cranes(g);
  const lamps = [
    light(g, 0, 8, 58, '#ffc48a'),
    light(g, 48, 10, 2, '#ffd2a4'),
    light(g, -48, 10, 2, '#ffd2a4'),
  ];
  g.userData.animate = (_t, k) => {
    for (const lamp of lamps) lamp.intensity = 0.02 * k;
  };
  return g;
}

function spindle() {
  const pts = [];
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    let r = 1.05;
    if (t < 0.2) r = 0.62 + t * 2.2;
    else if (t > 0.42) r = 1.05 * (1 - (t - 0.42) / 0.7);
    pts.push(new THREE.Vector2(Math.max(0.12, r), t));
  }
  return new THREE.LatheGeometry(pts, 7);
}

function nave(g) {
  const st = beige();
  add(g, box(36, 36, 78), st, 0, 18, -6);
  add(g, box(70, 32, 28), st, 0, 16, 2);
  add(g, cyl(16, 16, 32, 8), st, 0, 16, -42);
  nativity(g);
  passion(g);
  glory(g);
  forest(g);
  glass(g);
  add(g, box(30, 22, 0.6), WASH, 0, 12, 16.4);
  add(g, box(0.6, 24, 30), WASH, 24.2, 14, 2);
  add(g, box(0.6, 24, 30), WASH, -26.4, 14, 2);
}

function nativity(g) {
  const skin = ochre();
  for (const z of [-10, -1, 8, 16]) {
    add(g, new THREE.SphereGeometry(3.4, 6, 5), skin, 30, 16, z);
    add(g, new THREE.SphereGeometry(2.2, 5, 4), skin, 33, 24, z);
    add(g, box(2.4, 14, 4.2), mat('#9a6840'), 34, 8, z);
  }
  add(g, cone(4.2, 26, 7), mat('#1e5a32'), 40, 32, 10);
  add(g, cone(2.8, 16, 6), mat('#2f7a44'), 40, 48, 10);
  add(g, cone(1.5, 9, 5), mat('#49a060'), 40, 58, 10);
}

function passion(g) {
  for (const z of [-14, -5, 4, 13]) {
    const col = add(g, box(2.2, 36, 2.2), bone(), -46, 18, z);
    col.rotation.z = 0.16;
    const rib = add(g, box(0.8, 30, 4.2), bone(), -42, 20, z);
    rib.rotation.z = -0.34;
  }
}

function glory(g) {
  add(g, box(26, 20, 1.2), mat('#d5dbe2'), 0, 12, 37);
  for (const x of [-10, -4, 2, 8]) add(g, box(0.5, 26, 0.5), mat('#c5ced6'), x, 13, 38);
  for (const y of [6, 14, 22]) add(g, box(24, 0.35, 0.35), mat('#c5ced6'), 0, y, 38.2);
}

function forest(g) {
  const branch = mat('#f4ecdf');
  for (let i = 0; i < 5; i++) {
    const z = -24 + i * 9;
    for (const x of [-8, 8]) {
      add(g, cyl(0.7, 1.05, 12, 5), branch, x, 40, z);
      add(g, cyl(0.35, 0.5, 7, 4), branch, x - 2.4, 46, z);
      add(g, cyl(0.35, 0.5, 7, 4), branch, x + 2.4, 46, z);
    }
  }
}

function glass(g) {
  let n = 0;
  for (const z of [-28, -16, -4, 8]) {
    add(g, box(0.6, 10, 3.2), GLASS[n % 4], 18.2, 20, z);
    add(g, box(0.6, 10, 3.2), GLASS[(n + 2) % 4], -18.2, 20, z);
    n += 1;
  }
  for (const x of [-18, -6, 6, 18]) add(g, box(3.4, 11, 0.7), GLASS[n++ % 4], x, 17, 16.6);
  rose(g, 0, 18, 17.2, 0);
  rose(g, 35.5, 16, 4, Math.PI / 2);
}

function rose(g, x, y, z, ry) {
  for (let i = 0; i < 6; i++) {
    const pane = add(g, box(2.2, 3.4, 0.45), GLASS[i % 4], x, y, z);
    pane.rotation.y = ry;
    pane.position.x += Math.cos(ry) * Math.cos(i) * 2.4;
    pane.position.z += -Math.sin(ry) * Math.cos(i) * 2.4;
    pane.position.y += Math.sin(i) * 2.2;
  }
}

function apostles(g) {
  const zs = [-8, 0, 8, 16];
  const heights = [104, 116, 116, 104];
  zs.forEach((z, i) => tower(g, 38, z, heights[i], ochre(), i));
  zs.forEach((z, i) => tower(g, -38, z, heights[i], beige(), i + 1));
  [-16, -6, 6, 16].forEach((x, i) => tower(g, x, 44, heights[i], beige(), i + 2));
}

function tower(g, x, z, h, skin, tip) {
  const mesh = new THREE.Mesh(SPINDLE, skin);
  mesh.scale.set(4.1, h, 4.1);
  mesh.position.set(x, 0, z);
  g.add(mesh);
  for (const a of [0.3, 1.6, 2.8, 4.2, 5.4]) {
    add(g, box(0.7, h * 0.18, 0.45), mat('#241e1a'), x + Math.cos(a) * 3.8, h * 0.42, z + Math.sin(a) * 3.8);
  }
  const ph = 12;
  const color = TIPS[tip % 3];
  add(g, cone(2.6, ph, 6), color, x, h + ph / 2, z);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    add(g, box(1.1, 1.3, 1.1), TIPS[(tip + i) % 3], x + Math.cos(a) * 1.8, h + 1.2, z + Math.sin(a) * 1.8);
  }
  add(g, box(0.55, 4.2, 0.55), color, x, h + ph + 1.6, z);
  add(g, box(2.4, 0.45, 0.45), color, x, h + ph + 2.8, z);
}

function evangelists(g) {
  const spots = [[14, 12, 'bull'], [14, -10, 'angel'], [-14, 12, 'eagle'], [-14, -10, 'lion']];
  for (const [x, z, kind] of spots) {
    const h = 132;
    add(g, cyl(4.2, 5.2, h, 8), beige(), x, h / 2, z);
    add(g, box(10, 3.2, 10), mat(kind === 'lion' ? '#e2b423' : kind === 'bull' ? '#8a5a32' : '#f7f4ee'), x, h + 2, z);
    symbol(g, kind, x, h + 9, z);
  }
}

function symbol(g, kind, x, y, z) {
  if (kind === 'bull') {
    const c = mat('#8a5a32');
    add(g, box(8, 3.2, 3.4), c, x, y, z);
    add(g, box(3.2, 2.4, 3), c, x, y + 1.6, z + 2.8);
    add(g, box(0.55, 3.4, 0.55), c, x - 1, y + 4.4, z + 3.6);
    add(g, box(0.55, 3.4, 0.55), c, x + 1, y + 4.4, z + 3.6);
  } else if (kind === 'lion') {
    const c = mat('#e2b423', { emissive: '#e2b423', emissiveIntensity: 0.55 });
    add(g, box(8, 3, 3.2), c, x, y, z);
    add(g, new THREE.SphereGeometry(2.4, 6, 5), c, x, y + 2.6, z + 2);
  } else if (kind === 'eagle') {
    const c = bone();
    add(g, box(2.2, 2.6, 4.2), c, x, y, z);
    add(g, box(12, 0.7, 3.4), c, x, y + 1.1, z);
    add(g, box(1.6, 1.1, 2.2), c, x, y + 2, z + 2.6);
  } else {
    const c = mat('#f7f1e4', { emissive: '#fff6e0', emissiveIntensity: 0.45 });
    add(g, box(1.8, 5.4, 1.4), c, x, y, z);
    add(g, new THREE.SphereGeometry(1.3, 6, 5), c, x, y + 3.4, z);
    add(g, box(9, 0.5, 2.4), c, x, y + 1.6, z);
  }
}

function mary(g) {
  add(g, cyl(4.2, 5.4, 122, 8), beige(), 0, 61, -30);
  add(g, cyl(2.8, 3.6, 16, 8), beige(), 0, 128, -30);
  const y = 146;
  add(g, new THREE.SphereGeometry(2.6, 8, 6), STAR, 0, y, -30);
  for (let i = 0; i < 12; i++) {
    const ray = add(g, box(0.7, 14, 1.15), STAR, 0, y, -30);
    ray.rotation.z = (i / 12) * Math.PI;
    ray.rotation.y = i % 2 ? 0.6 : 0;
  }
}

function jesus(g) {
  add(g, cyl(7, 9, 150, 10), beige(), 0, 75, 0);
  add(g, cyl(4.6, 6.2, 16, 8), beige(), 0, 156, 0);
  for (let i = 0; i < 5; i++) {
    const y = 36 + i * 22;
    add(g, box(0.7, 9, 3.2), GLASS[i % 4], 8.6, y, 0);
    add(g, box(3.2, 9, 0.7), GLASS[(i + 2) % 4], 0, y + 8, 8.6);
  }
  add(g, box(2.6, 24, 2.6), CROSS, 0, 170, 0);
  add(g, box(18, 2.4, 2.4), CROSS, 0, 176, 0);
  add(g, box(2.4, 2.4, 18), CROSS, 0, 176, 0);
}

function cranes(g) {
  boom(g, 8, 52, 78, 30);
  boom(g, -18, 54, 92, 34);
  boom(g, 22, 46, 64, 22);
}

function boom(g, x, z, h, reach) {
  add(g, cyl(0.85, 1.05, h, 5), craneY(), x, h / 2, z);
  add(g, box(reach, 0.7, 0.7), craneY(), x + reach * 0.28, h, z);
  add(g, box(0.45, 0.45, 8), craneW(), x + reach * 0.12, h + 0.9, z);
  add(g, box(2.6, 1.8, 2), craneW(), x, h - 2.4, z);
  add(g, cyl(0.14, 0.14, 16, 4), mat('#3a3a3a'), x + reach * 0.55, h - 8, z);
}

function light(g, x, y, z, color) {
  const lamp = new THREE.PointLight(color, 0, 0.16, 2);
  lamp.position.set(x, y, z);
  g.add(lamp);
  return lamp;
}
