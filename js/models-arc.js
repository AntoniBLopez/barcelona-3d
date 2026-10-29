import * as THREE from 'three';
import { add, box, cyl, cone, mat } from './kit.js';

const brick = () => mat('#b34732', { emissive: '#ffb070', emissiveIntensity: 0.85 });
const brickD = () => mat('#8c3424', { emissive: '#e09058', emissiveIntensity: 0.55 });
const stone = () => mat('#f3e6cf', { emissive: '#ffe4c0', emissiveIntensity: 0.22 });
const stoneD = () => mat('#e2d0b0', { emissive: '#ffe4c0', emissiveIntensity: 0.16 });
const bronze = () => mat('#c6a15a', { emissive: '#f0d090', emissiveIntensity: 0.7, metalness: 0.4, roughness: 0.38 });
const lampM = () => mat('#ffe7b8', { emissive: '#ffd48a', emissiveIntensity: 3.6, roughness: 0.28 });
const iron = () => mat('#3e3a36', { metalness: 0.45, roughness: 0.42 });
const pave = () => mat('#f3ead8');
const leaf = () => mat('#2f8a45');
const trunk = () => mat('#8a6244');

const W = 13.6;
const H = 18.7;
const R = 7.4;
const SPRING = 2.3;
const D = 10.6;

/** Arc de Triomf, metres. The opening faces +Z, toward the Ciutadella. */
export function arc() {
  const g = new THREE.Group();
  body(g);
  dress(g);
  turrets(g);
  arms(g);
  promenade(g);
  return g;
}

function body(g) {
  const shape = new THREE.Shape();
  shape.moveTo(-W, 0);
  shape.lineTo(-W, H);
  shape.lineTo(W, H);
  shape.lineTo(W, 0);
  shape.lineTo(R, 0);
  shape.lineTo(R, SPRING);
  for (let i = 0; i <= 14; i++) {
    const a = (i / 14) * Math.PI;
    shape.lineTo(Math.cos(a) * R, SPRING + Math.sin(a) * R);
  }
  shape.lineTo(-R, 0);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: D, bevelEnabled: false });
  geo.translate(0, 0, -D / 2);
  const mesh = new THREE.Mesh(geo, brick());
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  g.add(mesh);
  const voidShape = new THREE.Shape();
  const r = R - 0.45;
  voidShape.moveTo(-r, 0);
  voidShape.lineTo(-r, SPRING);
  for (let i = 14; i >= 0; i--) {
    const a = (i / 14) * Math.PI;
    voidShape.lineTo(Math.cos(a) * r, SPRING + Math.sin(a) * r);
  }
  voidShape.lineTo(r, 0);
  voidShape.closePath();
  const voidGeo = new THREE.ExtrudeGeometry(voidShape, { depth: 0.6, bevelEnabled: false });
  voidGeo.translate(0, 0, -0.3);
  g.add(new THREE.Mesh(voidGeo, mat('#241814')));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(R + 0.2, 0.55, 5, 18, Math.PI), brickD());
  ring.position.set(0, SPRING, D / 2 + 0.08);
  g.add(ring);
}

function dress(g) {
  const face = D / 2 + 0.16;
  for (const y of [2.15, 4.55]) {
    for (const x of [-(W + R) / 2, (W + R) / 2]) {
      add(g, box(W - R - 0.4, 0.55, D + 0.7), stone(), x, y, 0);
    }
  }
  for (const z of [face, -face]) {
    for (const x of [-(W - 0.9), -R - 1.05, R + 1.05, W - 0.9]) {
      add(g, box(0.62, 10.4, 0.36), brickD(), x, 5.2, z);
    }
  }
  add(g, box(W * 2 + 0.9, 2.6, D + 0.9), stone(), 0, 12.9, 0);
  for (let i = 0; i < 11; i++) {
    const tall = i % 2 === 0;
    add(g, box(1.15, tall ? 1.55 : 1.05, 0.28), i % 3 === 0 ? stoneD() : stone(), -9 + i * 1.8, 12.9, face + 0.2);
  }
  for (const x of [-9.4, 9.4]) {
    const gem = add(g, box(1.35, 1.35, 0.22), brickD(), x, 11.15, face);
    gem.rotation.z = Math.PI / 4;
  }
  add(g, box(W * 2 + 1.3, 0.55, D + 1.2), stone(), 0, 18.95, 0);
  for (let i = 0; i < 13; i++) add(g, box(0.7, 0.7, 0.4), brickD(), -11 + i * 1.85, 18.15, face);
}

function turrets(g) {
  for (const x of [-W + 1.5, W - 1.5]) {
    for (const z of [-3.7, 3.7]) {
      const ox = Math.sign(x) * (z < 0 ? 2.6 : 0);
      add(g, box(2.5, 6.5, 2.5), brick(), x + ox, 22.45, z);
      add(g, cyl(1.35, 1.5, 0.7, 8), stone(), x + ox, 25.9, z);
      add(g, new THREE.SphereGeometry(1.4, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), bronze(), x + ox, 26.2, z);
      add(g, cyl(0.72, 0.95, 0.4, 7), bronze(), x + ox, 27.7, z);
      for (let k = 0; k < 4; k++) {
        const a = (k / 4) * Math.PI * 2 + 0.4;
        add(g, cone(0.14, 0.7, 4), bronze(), x + ox + Math.cos(a) * 0.48, 28.15, z + Math.sin(a) * 0.48);
      }
      add(g, cone(0.2, 1.55, 5), bronze(), x + ox, 28.85, z);
    }
  }
}

function arms(g) {
  add(g, box(3.4, 0.8, 1.4), stone(), 0, 19.7, 1.1);
  const paper = mat('#f7f1e6', { emissive: '#fff6e8', emissiveIntensity: 0.45 });
  const cross = mat('#c8102e', { emissive: '#e23a42', emissiveIntensity: 0.55 });
  add(g, box(2.5, 3.1, 0.4), paper, 0, 21.7, 1.45);
  add(g, box(1.7, 0.32, 0.5), cross, 0, 21.7, 1.7);
  add(g, box(0.32, 1.9, 0.5), cross, 0, 21.6, 1.7);
  add(g, cyl(0.85, 1.05, 0.35, 6), bronze(), 0, 23.45, 1.45);
  bat(g, 0, 25.4, 1.6, 1.7);
  bat(g, -4.2, 23.4, 1.7, 1);
  bat(g, 4.2, 23.4, 1.7, 1);
}

function bat(g, x, y, z, s) {
  const hide = mat('#2a2622');
  add(g, box(2.1 * s, 0.14 * s, 0.28 * s), hide, x, y, z);
  add(g, box(0.7 * s, 0.16 * s, 0.28 * s), hide, x - 0.55 * s, y - 0.22 * s, z).rotation.z = 0.5;
  add(g, box(0.7 * s, 0.16 * s, 0.28 * s), hide, x + 0.55 * s, y - 0.22 * s, z).rotation.z = -0.5;
  add(g, box(0.28 * s, 0.42 * s, 0.3 * s), hide, x, y, z);
}

function promenade(g) {
  add(g, box(42, 0.24, 64), mat('#c9b89a'), 0, 0.1, 36);
  add(g, box(38, 0.28, 60), pave(), 0, 0.22, 36);
  add(g, box(10.4, 0.26, 18), pave(), 0, 0.14, -1.5);
  add(g, box(8, 0.08, 56), mat('#e7d7b8'), 0, 0.4, 36);
  for (let i = 0; i < 5; i++) {
    const z = 14 + i * 9;
    palm(g, -14.2, z);
    palm(g, 14.2, z);
  }
  for (let i = 0; i < 4; i++) {
    const z = 18 + i * 9;
    lamp(g, -7.6, z);
    lamp(g, 7.6, z);
  }
}

function palm(g, x, z) {
  add(g, cyl(0.2, 0.32, 6.4, 5), trunk(), x, 3.4, z);
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2;
    const frond = add(g, box(2.3, 0.12, 0.38), leaf(), x + Math.cos(a) * 1.05, 6.7, z + Math.sin(a) * 1.05);
    frond.rotation.y = -a;
    frond.rotation.z = -0.62;
  }
}

function lamp(g, x, z) {
  add(g, cyl(0.28, 0.4, 0.5, 6), iron(), x, 0.55, z);
  add(g, cyl(0.09, 0.14, 8.2, 6), iron(), x, 4.6, z);
  add(g, cyl(0.32, 0.16, 0.45, 6), bronze(), x, 8.7, z);
  for (const [dx, dz] of [[0.85, 0], [-0.85, 0], [0, 0.85], [0, -0.85]]) {
    add(g, box(Math.abs(dx) || 0.08, 0.08, Math.abs(dz) || 0.08), iron(), x + dx * 0.5, 8.85, z + dz * 0.5);
    add(g, new THREE.SphereGeometry(0.26, 6, 5), lampM(), x + dx, 8.45, z + dz);
  }
  add(g, cone(0.18, 0.85, 5), bronze(), x, 9.4, z);
}
