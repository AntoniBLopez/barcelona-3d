import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { add, box, cyl, cone, mat } from './kit.js';

const shell = () => mat('#f3f4f6', { roughness: 0.7 });
const roofM = () => mat('#e4e7ec', { roughness: 0.55 });
const blue = () => mat('#004d98', { emissive: '#1a4fad', emissiveIntensity: 0.25 });
const garnet = () => mat('#a50044', { emissive: '#c41858', emissiveIntensity: 0.22 });
const gold = () => mat('#ffd100', { emissive: '#ffd100', emissiveIntensity: 1.1 });
const pitchM = () => mat('#2e8a3c', { emissive: '#d4ff7a', emissiveIntensity: 1.7, roughness: 0.92 });
const lineM = () => mat('#f7f7f7');
const lampM = () => mat('#fff6dc', { emissive: '#fff3c4', emissiveIntensity: 4.4 });

/** Spotify Camp Nou in metres. Oval bowl, +X along the pitch. */
export function campnou() {
  const g = new THREE.Group();
  const bowl = new THREE.Group();
  bowl.scale.set(1, 1, 220 / 250);
  plaza(g);
  shellOf(bowl);
  stands(bowl);
  roof(bowl);
  pitch(g);
  palau(g);
  trees(g);
  const lamps = lights(g);
  g.add(bowl);
  g.userData.animate = (_t, k) => {
    for (const lamp of lamps) lamp.intensity = 0.012 * k;
  };
  return g;
}

function mesh(geos, material, parent) {
  const geo = geos.length === 1 ? geos[0] : mergeGeometries(geos);
  const m = new THREE.Mesh(geo, material);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

function standProfile(r0, r1, y, rise) {
  return [
    new THREE.Vector2(r0, y),
    new THREE.Vector2(r1, y + rise),
    new THREE.Vector2(r1, y + rise + 1.1),
    new THREE.Vector2(r0, y + 0.45),
  ];
}

function shellOf(bowl) {
  const wall = new THREE.CylinderGeometry(124, 112, 30, 32, 1, true);
  wall.translate(0, 15, 0);
  mesh([wall], shell(), bowl);
  const bands = ['#a50044', '#004d98', '#ffd100', '#ed6b2f'].map((c) => mat(c, { roughness: 0.5 }));
  [7, 13, 19, 25].forEach((y, i) => {
    const band = new THREE.CylinderGeometry(125.4, 125.4, 1.5, 32, 1, true);
    band.translate(0, y, 0);
    mesh([band], bands[i], bowl);
  });
}

function stands(bowl) {
  const tiers = [
    standProfile(70, 90, 3, 7),
    standProfile(90, 108, 10, 8),
    standProfile(108, 122, 18, 8),
  ];
  const blueG = [];
  const redG = [];
  for (const pts of tiers) {
    blueG.push(new THREE.LatheGeometry(pts, 18, 0, Math.PI));
    redG.push(new THREE.LatheGeometry(pts, 18, Math.PI, Math.PI));
  }
  mesh(blueG, blue(), bowl);
  mesh(redG, garnet(), bowl);
  const letters = [];
  for (let i = 0; i < 9; i++) {
    const a = -0.7 + i * 0.16;
    const block = new THREE.BoxGeometry(i % 2 ? 6.5 : 4.4, 0.9, 8);
    block.rotateY(a);
    block.translate(Math.cos(a) * 80, 8.2, Math.sin(a) * 80);
    letters.push(block);
  }
  mesh(letters, gold(), bowl);
}

function roof(bowl) {
  const deck = new THREE.RingGeometry(94, 136, 32);
  deck.rotateX(-Math.PI / 2);
  deck.translate(0, 34.5, 0);
  const ribs = [];
  for (let i = 0; i < 16; i++) {
    const rib = new THREE.BoxGeometry(42, 1.3, 1.5);
    rib.translate(115, 0, 0);
    rib.rotateY((i / 16) * Math.PI * 2);
    rib.translate(0, 33.4, 0);
    ribs.push(rib);
  }
  mesh([deck, ...ribs], roofM(), bowl);
  const outer = new THREE.TorusGeometry(132, 1.5, 4, 28);
  outer.rotateX(Math.PI / 2);
  outer.translate(0, 35.2, 0);
  const inner = new THREE.TorusGeometry(96, 1.15, 4, 24);
  inner.rotateX(Math.PI / 2);
  inner.translate(0, 35.2, 0);
  mesh([outer, inner], mat('#f7f8fa'), bowl);
  const lamps = [];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const lamp = new THREE.BoxGeometry(3.2, 1.4, 2.2);
    lamp.translate(Math.cos(a) * 130, 36.6, Math.sin(a) * 130);
    lamps.push(lamp);
  }
  mesh(lamps, lampM(), bowl);
}

function pitch(g) {
  add(g, box(108, 0.4, 70), pitchM(), 0, 1.2, 0);
  const paint = lineM();
  add(g, box(100, 0.15, 0.5), paint, 0, 1.5, 0);
  add(g, box(0.5, 0.15, 64), paint, 0, 1.5, 0);
  add(g, box(100, 0.15, 0.5), paint, 0, 1.5, 32);
  add(g, box(100, 0.15, 0.5), paint, 0, 1.5, -32);
  add(g, box(0.5, 0.15, 64), paint, 50, 1.5, 0);
  add(g, box(0.5, 0.15, 64), paint, -50, 1.5, 0);
  add(g, box(16, 0.15, 0.45), paint, 42, 1.5, 0);
  add(g, box(16, 0.15, 0.45), paint, -42, 1.5, 0);
  add(g, box(0.4, 0.15, 40), paint, 34, 1.5, 0);
  add(g, box(0.4, 0.15, 40), paint, -34, 1.5, 0);
  const circle = new THREE.RingGeometry(8.6, 9.2, 20);
  circle.rotateX(-Math.PI / 2);
  add(g, circle, paint, 0, 1.55, 0);
  for (const x of [-52, 52]) {
    add(g, box(0.4, 3.2, 0.4), paint, x, 2.8, -4);
    add(g, box(0.4, 3.2, 0.4), paint, x, 2.8, 4);
    add(g, box(0.4, 0.4, 8.4), paint, x, 4.2, 0);
  }
}

function plaza(g) {
  add(g, cyl(158, 158, 0.6, 28), mat('#e4ddd2'), 0, 0.3, 0);
}

function palau(g) {
  add(g, box(42, 16, 28), mat('#f2f3f5'), -24, 8, 162);
  add(g, box(44, 2.2, 30), mat('#004d98'), -24, 16, 162);
  add(g, box(44, 1.6, 30), mat('#a50044'), -24, 13.2, 162);
}

function trees(g) {
  const leaf = mat('#3d8a45');
  const trunk = mat('#6b4a32');
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + 0.2;
    const x = Math.cos(a) * 148;
    const z = Math.sin(a) * 132;
    add(g, cyl(0.6, 0.8, 3, 5), trunk, x, 1.8, z);
    add(g, cone(3.2, 7, 6), leaf, x, 6, z);
  }
}

function lights(g) {
  return [0, 1.6, 3.2, 4.8].map((a) => {
    const lamp = new THREE.PointLight('#fff1cc', 0, 0.11, 2);
    lamp.position.set(Math.cos(a) * 40, 30, Math.sin(a) * 30);
    g.add(lamp);
    return lamp;
  });
}
