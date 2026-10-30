import * as THREE from 'three';
import { add, box, cyl, cone, mat } from './kit.js';

const stone = () => mat('#e6d7c2');
const gold = () => mat('#e2b84a', { emissive: '#e2b84a', emissiveIntensity: 1.6, metalness: 0.45, roughness: 0.32 });
const red = () => mat('#c0392b');

/**
 * Temple, amusement park and the Collserola tower.
 * The temple group is in metres. The telecom mast is placed on its own
 * hill so it sits on the ridge, not on the church roof.
 */
export function tibidabo() {
  const g = new THREE.Group();
  const st = stone();
  for (let i = 0; i < 6; i++) add(g, box(46 - i * 4, 0.7, 3.4), st, 0, 0.35 + i * 0.7, 24 - i * 3.2);
  add(g, box(42, 12, 30), st, 0, 10, 0);
  for (const x of [-12, 0, 12]) add(g, box(4.2, 6, 0.8), mat('#2c2824'), x, 5.5, 15.2);
  add(g, box(28, 14, 22), st, 0, 22, 0);
  for (const x of [-12, 12]) {
    add(g, box(3.2, 16, 3.2), st, x, 34, 8);
    add(g, cone(2.4, 8, 4), st, x, 46, 8);
    add(g, box(3.2, 16, 3.2), st, x, 34, -8);
    add(g, cone(2.4, 8, 4), st, x, 46, -8);
  }
  add(g, cyl(5.2, 6.2, 18, 8), st, 0, 36, 0);
  add(g, cone(5.2, 9, 8), st, 0, 48, 0);
  const gd = gold();
  add(g, box(1.5, 3.6, 1), gd, 0, 55.2, 0);
  add(g, box(6.4, 0.55, 0.7), gd, 0, 56.2, 0);
  add(g, new THREE.SphereGeometry(0.85, 8, 6), gd, 0, 57.6, 0);
  // Warm flood on the crypt, only at night.
  add(g, box(18, 1.2, 0.4), mat('#f0d2a0', { emissive: '#f0d2a0', emissiveIntensity: 1.4 }), 0, 4, 15.4);

  const wheel = ferris();
  wheel.userData.noBatch = true;
  wheel.position.set(52, 14, 6);
  g.add(wheel);
  add(g, cyl(0.7, 0.9, 14, 6), mat('#9aa3ad'), 52, 7, 6);

  const avio = plane();
  avio.userData.noBatch = true;
  avio.position.set(68, 9, -8);
  g.add(avio);
  add(g, cyl(0.45, 0.55, 9, 6), mat('#dfe3e8'), 68, 4.5, -8);

  const track = mat('#e2b43a');
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const h = 2.2 + Math.sin(a * 2) * 2.4;
    add(g, box(2.2, h, 2.2), track, 34 + Math.cos(a) * 11, h / 2, -16 + Math.sin(a) * 6);
  }
  add(g, cyl(5, 5, 1.2, 8), mat('#3d6fa6', { emissive: '#3d6fa6', emissiveIntensity: 0.8 }), 30, 0.8, 18);
  add(g, cone(3.4, 6, 8), mat('#e07a32', { emissive: '#e07a32', emissiveIntensity: 0.5 }), 30, 4.2, 18);

  // Tramvia Blau heading down toward the city.
  for (let i = 0; i < 7; i++) add(g, box(1.4, 0.25, 7), mat('#6d6454'), 8, 0.15, 32 + i * 8);
  const tram = add(g, box(3.4, 2.4, 6), mat('#1d4e89', { emissive: '#8eb6e0', emissiveIntensity: 1.1 }), 8, 1.5, 40);
  tram.userData.noBatch = true;

  g.userData.animate = (t) => {
    wheel.rotation.z = t * 0.4;
    for (const cab of wheel.userData.cabs) cab.rotation.z = -wheel.rotation.z;
    avio.rotation.y = t * 0.55;
    tram.position.z = 36 + (Math.sin(t * 0.22) * 0.5 + 0.5) * 24;
  };
  return g;
}

function ferris() {
  const w = new THREE.Group();
  w.add(new THREE.Mesh(new THREE.TorusGeometry(12, 0.35, 5, 20), mat('#d5dbe2', { metalness: 0.45, roughness: 0.35 })));
  const cabMat = mat('#f4efe6', { emissive: '#f4efe6', emissiveIntensity: 0.7 });
  w.userData.cabs = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const cab = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.5, 1.5), i % 2 ? red() : cabMat);
    cab.position.set(Math.cos(a) * 12, Math.sin(a) * 12, 0);
    w.add(cab);
    w.userData.cabs.push(cab);
  }
  return w;
}

function plane() {
  const p = new THREE.Group();
  add(p, box(10, 1.1, 2), red(), 7, 0, 0);
  add(p, box(3.2, 0.25, 11), red(), 6, 0.35, 0);
  add(p, box(2.2, 1.3, 1.3), mat('#f7f4ef'), 11, 0.5, 0);
  return p;
}

/** Foster's Torre de Collserola, in metres, sat on the ridge beside Tibidabo. */
export function collserolaTower() {
  const g = new THREE.Group();
  const mast = mat('#e4e8ee', { metalness: 0.35, roughness: 0.4 });
  add(g, cyl(3.5, 6, 18, 6), mat('#b7c0c8'), 0, 9, 0);
  add(g, cyl(1.3, 2.4, 150, 7), mast, 0, 84, 0);
  // Guyed triangular platform.
  add(g, cyl(11, 11, 6, 3), mat('#d5dbe3', { metalness: 0.5, roughness: 0.3 }), 0, 96, 0);
  add(g, cyl(1.15, 1.15, 36, 6), mat('#f4f4f4'), 0, 168, 0);
  add(g, cyl(1.15, 1.15, 22, 6), mat('#c0392b'), 0, 196, 0);
  const beacon = add(g, new THREE.SphereGeometry(1.8, 8, 6), mat('#ff2a2a', {
    emissive: '#ff2a2a', emissiveIntensity: 2.2,
  }), 0, 210, 0);
  g.userData.animate = (t, k) => {
    const blink = Math.sin(t * 3.2) > 0.35 ? 7 : 0.35;
    beacon.material.emissiveIntensity = k * blink;
  };
  return g;
}
