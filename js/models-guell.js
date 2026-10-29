import * as THREE from 'three';
import { add, box, cyl, cone, mat, mosaic, MOSAIC, WIN, TRENCA } from './kit.js';

const bone = () => mat('#f3efe6');
const stone = () => mat('#e4d6c0');
const sand = () => mat('#d7c4a2');
const moss = () => mat('#4f8a3c');
const LIZARD = ['#2f9a45', '#e6c04a', '#e36a22', '#3c78c2', '#9ed24a', '#f6f1e4'];
const WHITE = ['#f7f4ee', '#f7f4ee', '#f3efe6', '#e7c04f', '#3d6fa6', '#f7f4ee'];

/** A trencadís patch. */
function tile(parent, geo, x, y, z, colors = TRENCA) {
  const mesh = new THREE.Mesh(mosaic(geo, colors), MOSAIC);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

/**
 * Park Güell entrance, in metres. The salamander lies head-down the stairs,
 * toward the south (+Z), between the two flights.
 */
export function guell() {
  const g = new THREE.Group();
  add(g, box(72, 1.2, 58), sand(), 0, 0.4, -2);
  add(g, box(64, 3.2, 22), moss(), 0, 1.4, -24);

  pavilion(g, -20, false);
  pavilion(g, 20, true);
  stairs(g);
  salamander(g);
  hall(g);
  bench(g);
  portico(g, -1);
  portico(g, 1);
  museum(g);
  pines(g);
  return g;
}

function pavilion(g, x, tower) {
  add(g, box(16, 6.5, 13), stone(), x, 3.4, 18);
  add(g, box(3.2, 3, 0.35), WIN, x - 3, 3.2, 24.6);
  add(g, box(3.2, 3, 0.35), WIN, x + 3, 3.2, 24.6);
  const roof = tile(g, new THREE.SphereGeometry(8, 10, 7, 0, Math.PI * 2, 0, Math.PI / 2), x, 6.6, 18, WHITE);
  roof.scale.set(1, 0.72, 0.9);
  if (!tower) return;
  add(g, cyl(1.2, 1.5, 6.5, 8), mat('#f7f4ee'), x + 2, 11.2, 16);
  add(g, cyl(1.6, 1.6, 1.1, 8), mat('#1f4f8a'), x + 2, 9.2, 16);
  add(g, cyl(1.45, 1.45, 1.1, 8), mat('#1f4f8a'), x + 2, 11.6, 16);
  add(g, cyl(1.3, 1.3, 0.9, 8), mat('#1f4f8a'), x + 2, 13.8, 16);
  add(g, box(0.4, 2.6, 0.4), mat('#f7f4ee'), x + 2, 15.6, 16);
  add(g, box(2.4, 0.35, 0.35), mat('#f7f4ee'), x + 2, 16.6, 16);
  add(g, box(0.35, 0.35, 2.4), mat('#f7f4ee'), x + 2, 16.6, 16);
}

function stairs(g) {
  const step = bone();
  for (let i = 0; i < 7; i++) {
    const z = 12 - i * 2.1;
    const y = 0.7 + i * 0.85;
    add(g, box(8, 0.7, 1.9), step, -7.2, y, z);
    add(g, box(8, 0.7, 1.9), step, 7.2, y, z);
  }
}

function salamander(g) {
  const part = (w, h, d, x, y, z) => tile(g, box(w, h, d), x, y, z, LIZARD);
  part(1.6, 1, 3.4, 0.6, 1.5, 2.4);
  part(3.1, 1.6, 4.4, 0, 1.75, 5.6);
  part(3.3, 1.7, 3.4, 0, 1.95, 8.8);
  part(3.6, 1.9, 3, 0, 2.2, 11.6);
  part(2.3, 1.05, 1.8, 0, 1.95, 13.6);
  add(g, box(1.7, 0.5, 1.1), mat('#1c2822'), 0, 1.75, 14.1);
  add(g, box(0.9, 0.25, 0.85), mat('#d24a3a'), 0, 1.62, 14.3);
  add(g, new THREE.SphereGeometry(0.36, 6, 5), mat('#f7f4ee'), -0.9, 2.9, 12.2);
  add(g, new THREE.SphereGeometry(0.36, 6, 5), mat('#f7f4ee'), 0.9, 2.9, 12.2);
  const leg = (x, z, rz) => {
    const mesh = part(2.8, 0.5, 0.85, x, 1.05, z);
    mesh.rotation.z = rz;
  };
  leg(-2.3, 9.6, 0.5);
  leg(2.3, 9.6, -0.5);
  leg(-2.1, 5.6, 0.65);
  leg(2.1, 5.6, -0.65);
  const tip = tile(g, cone(0.85, 3.2, 5), 1, 1.45, 0.4, LIZARD);
  tip.rotation.x = -Math.PI / 2;
}

function hall(g) {
  for (let ix = -3; ix <= 3; ix++) {
    for (let iz = 0; iz < 4; iz++) {
      if (Math.abs(ix) === 3 && iz === 0) continue;
      add(g, cyl(0.55, 0.75, 5.2, 7), bone(), ix * 3.3, 7.2, -4.5 - iz * 3.1);
    }
  }
  add(g, box(28, 0.9, 15), stone(), 0, 10.1, -8.5);
}

function bench(g) {
  for (let i = 0; i < 16; i++) {
    const t = i / 15;
    const x = -13 + t * 26;
    const wave = Math.sin(t * Math.PI * 3);
    const seg = tile(g, box(1.9, 1.15, 1.5), x, 11, -2.2 + wave * 1.5);
    seg.rotation.y = Math.cos(t * Math.PI * 3) * 0.45;
  }
}

function portico(g, side) {
  for (let i = 0; i < 5; i++) {
    const col = add(g, cyl(0.5, 0.62, 5.5, 6), stone(), side * 22, 3.2 + i * 0.35, -6 - i * 2.4);
    col.rotation.z = side * -0.38;
  }
  add(g, box(6, 0.8, 14), stone(), side * 24, 6.4, -11);
}

function museum(g) {
  const pink = mat('#e7a0b4');
  const roof = mat('#c4526a');
  add(g, box(9, 6, 7), pink, 14, 6.5, -22);
  add(g, cone(5.2, 4, 4), roof, 14, 11, -22);
  add(g, box(2.2, 5, 2.2), pink, 17.2, 8, -22);
  add(g, cone(1.6, 3, 4), roof, 17.2, 12, -22);
  add(g, box(1.4, 1.6, 0.2), WIN, 14, 6.2, -18.4);
}

function pines(g) {
  const spots = [[-28, -8], [-30, -18], [28, -16], [-16, -28], [6, -30], [24, -28], [-8, -26]];
  for (const [x, z] of spots) {
    add(g, cyl(0.3, 0.4, 2.2, 5), mat('#6b4a32'), x, 2.2, z);
    add(g, cone(1.8, 3.4, 6), moss(), x, 4.6, z);
  }
}
