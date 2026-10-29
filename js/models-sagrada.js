import * as THREE from 'three';
import { add, box, cyl, cone, mat, watchGlow } from './kit.js';

const naveStone = () => mat('#c2b096', { emissive: '#c48a58', emissiveIntensity: 0.18 });
const nativityStone = () => mat('#c98448', { emissive: '#ff9a4a', emissiveIntensity: 0.85 });
const passionStone = () => mat('#f3f0e8', { emissive: '#d5e2ff', emissiveIntensity: 0.55 });
const gloryStone = () => mat('#d5dde6', { emissive: '#ffe0a0', emissiveIntensity: 0.45 });
const evangelistStone = () => mat('#e7d3b0', { emissive: '#ffd7a4', emissiveIntensity: 0.4 });
const craneY = () => mat('#e2b423', { roughness: 0.45, metalness: 0.2 });
const craneW = () => mat('#f7f8f6', { roughness: 0.5 });

const TIPS = [
  mat('#d24a3a', { emissive: '#ff5a40', emissiveIntensity: 2.4 }),
  mat('#e2b423', { emissive: '#ffe06a', emissiveIntensity: 2.2 }),
  mat('#f6f3ec', { emissive: '#fff6e0', emissiveIntensity: 1.8 }),
];
const GLASS = [
  mat('#c4483a', { emissive: '#ff6848', emissiveIntensity: 2.8, roughness: 0.3 }),
  mat('#3a6eb8', { emissive: '#6aa0ff', emissiveIntensity: 2.6, roughness: 0.3 }),
  mat('#d4a03a', { emissive: '#ffd060', emissiveIntensity: 2.4, roughness: 0.3 }),
  mat('#2d8a62', { emissive: '#4ad090', emissiveIntensity: 2.2, roughness: 0.3 }),
];
const STAR = mat('#f4f8ff', { emissive: '#ffffff', emissiveIntensity: 6, roughness: 0.12 });
const CROSS = mat('#fff8ea', { emissive: '#fff4c8', emissiveIntensity: 5.5, roughness: 0.2 });
const SLOT = mat('#2a241c');

function wash(color, amount) {
  const m = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  return watchGlow(m, amount, true);
}
const WASH_WARM = wash('#ffb15a', 0.4);
const WASH_COOL = wash('#e7eeff', 0.28);
const WASH_GOLD = wash('#ffd27a', 0.36);

const SPINDLE = spindle();

/**
 * Sagrada Família, metres. +X east is the Nativity, −X west the Passion,
 * +Z south the Glory façade. The Jesus tower tops out at 172 m.
 */
export function sagrada() {
  const g = new THREE.Group();
  nave(g);
  nativity(g);
  passion(g);
  glory(g);
  apostles(g);
  evangelists(g);
  mary(g);
  jesus(g);
  cranes(g);
  const lamps = [
    light(g, 36, 42, 2, '#ffb06a'),
    light(g, -36, 42, 2, '#d5e4ff'),
    light(g, 0, 36, 40, '#ffd090'),
    light(g, 0, 120, 6, '#fff0c8'),
    light(g, 0, 158, 0, '#fff6d0'),
  ];
  g.userData.animate = (_t, k) => {
    for (const lamp of lamps) lamp.intensity = 0.42 * k;
  };
  return g;
}

function spindle() {
  const pts = [];
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    let r = 1.05;
    if (t < 0.2) r = 0.72 + t * 1.8;
    else if (t > 0.42) r = 1.05 * (1 - (t - 0.42) / 0.72);
    pts.push(new THREE.Vector2(Math.max(0.14, r), t));
  }
  return new THREE.LatheGeometry(pts, 7);
}

function nave(g) {
  const st = naveStone();
  add(g, box(34, 14, 52), st, 0, 7, -2);
  add(g, box(52, 12, 20), st, 0, 6, 2);
  add(g, cyl(12, 12, 14, 8), st, 0, 7, -28);
}

function shaft(g, geo, material, x, y, z) {
  const mesh = add(g, geo, material, x, y, z);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  return mesh;
}

function nativity(g) {
  const skin = nativityStone();
  add(g, box(4, 36, 40), skin, 24, 18, 0);
  for (const z of [-14, -4, 6, 16]) {
    add(g, new THREE.SphereGeometry(3.2, 6, 5), skin, 28, 16, z);
    add(g, new THREE.SphereGeometry(2.1, 5, 4), skin, 30, 24, z);
    add(g, box(1.6, 18, 2.4), SLOT, 26.2, 14, z);
  }
  add(g, cone(3.6, 22, 7), mat('#1e5a32'), 33, 28, 8);
  add(g, cone(2.4, 14, 6), mat('#2f7a44'), 33, 44, 8);
  add(g, cone(1.3, 8, 5), mat('#49a060'), 33, 54, 8);
  shaft(g, cone(3.2, 36, 5), WASH_WARM, 34, 28, -12);
  shaft(g, cone(3.2, 36, 5), WASH_WARM, 34, 28, 12);
}

function passion(g) {
  const skin = passionStone();
  add(g, box(3.2, 40, 40), skin, -24, 20, 0);
  for (const z of [-14, -4, 6, 16]) {
    const col = add(g, box(1.6, 38, 1.6), skin, -32, 19, z);
    col.rotation.z = 0.18;
    const rib = add(g, box(0.7, 32, 3.4), skin, -29, 20, z);
    rib.rotation.z = -0.38;
    add(g, box(1.4, 16, 1.2), SLOT, -25.6, 16, z);
  }
  shaft(g, cone(2.8, 40, 5), WASH_COOL, -36, 30, -12);
  shaft(g, cone(2.8, 40, 5), WASH_COOL, -36, 30, 12);
}

function glory(g) {
  const skin = gloryStone();
  add(g, box(40, 34, 3.4), skin, 0, 17, 22);
  for (const x of [-14, -5, 4, 13]) add(g, box(1.5, 22, 1.2), SLOT, x, 14, 23.6);
  for (const x of [-12, -4, 4, 12]) add(g, box(0.45, 28, 0.45), mat('#b7c2cc'), x, 16, 24.2);
  for (const y of [8, 16, 24]) add(g, box(32, 0.4, 0.4), mat('#b7c2cc'), 0, y, 24.4);
  for (const x of [-10, 0, 10]) add(g, box(3.2, 8, 0.6), GLASS[Math.abs(x) % 4], x, 18, 24.2);
  shaft(g, cone(3.4, 44, 5), WASH_GOLD, -14, 32, 32);
  shaft(g, cone(3.4, 44, 5), WASH_GOLD, 14, 32, 32);
}

function apostles(g) {
  const zs = [-22, -8, 8, 22];
  const heights = [98, 112, 112, 98];
  zs.forEach((z, i) => tower(g, 46, z, heights[i], nativityStone(), i, WASH_WARM));
  zs.forEach((z, i) => tower(g, -46, z, heights[i], passionStone(), i + 1, WASH_COOL));
  [-22, -8, 8, 22].forEach((x, i) => tower(g, x, 44, heights[i], gloryStone(), i + 2, WASH_GOLD));
}

function tower(g, x, z, h, skin, tip, glow) {
  const mesh = new THREE.Mesh(SPINDLE, skin);
  mesh.scale.set(4.3, h, 4.3);
  mesh.position.set(x, 0, z);
  mesh.castShadow = true;
  g.add(mesh);
  for (const a of [0.4, 2.0, 3.5, 5.0]) {
    add(g, box(0.7, h * 0.16, 0.4), SLOT, x + Math.cos(a) * 3.6, h * 0.45, z + Math.sin(a) * 3.6);
  }
  const ph = 11;
  const color = TIPS[tip % 3];
  add(g, cone(2.4, ph, 6), color, x, h + ph / 2, z);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.4;
    add(g, box(1.15, 1.4, 1.15), TIPS[(tip + i) % 3], x + Math.cos(a) * 1.7, h + 1.4, z + Math.sin(a) * 1.7);
  }
  add(g, box(0.5, 4, 0.5), color, x, h + ph + 1.4, z);
  add(g, box(2.2, 0.42, 0.42), color, x, h + ph + 2.6, z);
  shaft(g, box(1.1, h * 0.72, 1.1), glow, x + (x > 0 ? 3.2 : x < 0 ? -3.2 : 0), h * 0.4, z + (x === 0 ? 3.2 : 0));
}

function evangelists(g) {
  const spots = [[16, 12, 'bull'], [16, -14, 'angel'], [-16, 12, 'eagle'], [-16, -14, 'lion']];
  for (const [x, z, kind] of spots) {
    const h = 128;
    add(g, cyl(3.8, 4.8, h, 8), evangelistStone(), x, h / 2, z);
    add(g, box(9, 2.8, 9), mat(kind === 'lion' ? '#e2b423' : kind === 'bull' ? '#8a5a32' : '#f4efe4'), x, h + 1.6, z);
    for (const a of [0.6, 2.2, 3.8, 5.2]) {
      add(g, box(0.55, 10, 0.4), SLOT, x + Math.cos(a) * 4.4, h * 0.55, z + Math.sin(a) * 4.4);
    }
    symbol(g, kind, x, h + 8, z);
  }
}

function symbol(g, kind, x, y, z) {
  if (kind === 'bull') {
    const c = mat('#8a5a32', { emissive: '#c4844a', emissiveIntensity: 0.4 });
    add(g, box(7, 2.8, 3), c, x, y, z);
    add(g, box(2.8, 2.2, 2.6), c, x, y + 1.4, z + 2.4);
    add(g, box(0.5, 3, 0.5), c, x - 0.8, y + 3.8, z + 3.2);
    add(g, box(0.5, 3, 0.5), c, x + 0.8, y + 3.8, z + 3.2);
  } else if (kind === 'lion') {
    const c = mat('#e2b423', { emissive: '#ffd060', emissiveIntensity: 0.8 });
    add(g, box(7, 2.6, 2.8), c, x, y, z);
    add(g, new THREE.SphereGeometry(2.1, 6, 5), c, x, y + 2.2, z + 1.8);
  } else if (kind === 'eagle') {
    const c = mat('#f7f4ee', { emissive: '#fff6e8', emissiveIntensity: 0.45 });
    add(g, box(2, 2.4, 3.6), c, x, y, z);
    add(g, box(11, 0.6, 3), c, x, y + 1, z);
    add(g, box(1.4, 1, 2), c, x, y + 1.8, z + 2.2);
  } else {
    const c = mat('#f7f1e4', { emissive: '#fff6e0', emissiveIntensity: 0.7 });
    add(g, box(1.6, 4.8, 1.2), c, x, y, z);
    add(g, new THREE.SphereGeometry(1.2, 6, 5), c, x, y + 3, z);
    add(g, box(8, 0.45, 2.2), c, x, y + 1.4, z);
  }
}

function mary(g) {
  const skin = nativityStone();
  add(g, cyl(3.6, 4.6, 116, 8), skin, 0, 58, -32);
  add(g, cyl(2.2, 3.1, 14, 8), skin, 0, 123, -32);
  const y = 138;
  add(g, new THREE.SphereGeometry(2.4, 8, 6), STAR, 0, y, -32);
  for (let i = 0; i < 12; i++) {
    const ray = add(g, box(0.55, 13, 1.05), STAR, 0, y, -32);
    ray.rotation.z = (i / 12) * Math.PI;
    ray.rotation.y = i % 2 ? 0.55 : 0;
  }
  shaft(g, cone(3.2, 36, 6), WASH_WARM, 0, 120, -26);
}

function jesus(g) {
  const skin = evangelistStone();
  add(g, cyl(5.4, 7.4, 140, 10), skin, 0, 70, 0);
  add(g, cyl(3.4, 4.8, 16, 8), skin, 0, 148, 0);
  for (let i = 0; i < 6; i++) {
    const y = 28 + i * 18;
    add(g, box(0.7, 8, 2.6), GLASS[i % 4], 6.6, y, 0);
    add(g, box(2.6, 8, 0.7), GLASS[(i + 1) % 4], 0, y + 6, 6.6);
  }
  add(g, box(2.4, 18, 2.4), CROSS, 0, 163, 0);
  add(g, box(16, 2.3, 2.3), CROSS, 0, 166, 0);
  add(g, box(2.3, 2.3, 14), CROSS, 0, 166, 0);
  shaft(g, cone(2.6, 64, 6), WASH_GOLD, 0, 108, 8);
}

function cranes(g) {
  boom(g, 10, 58, 46, 18);
  boom(g, -14, 56, 52, 20);
}

function boom(g, x, z, h, reach) {
  add(g, cyl(0.7, 0.9, h, 5), craneY(), x, h / 2, z);
  add(g, box(reach, 0.6, 0.6), craneY(), x + reach * 0.28, h, z);
  add(g, box(0.4, 0.4, 6), craneW(), x + reach * 0.1, h + 0.7, z);
  add(g, box(2.2, 1.5, 1.6), craneW(), x, h - 2, z);
}

function light(g, x, y, z, color) {
  const lamp = new THREE.PointLight(color, 0, 0.2, 2);
  lamp.position.set(x, y, z);
  g.add(lamp);
  return lamp;
}
