import * as THREE from 'three';
import { add, box, cyl, cone, mat, mosaic, MOSAIC, WIN, TRENCA, TRENCA_COOL, checkerTexture } from './kit.js';
import { guell } from './models-guell.js';

const stone = () => mat('#e6d5bc');
const bone = () => mat('#f4f0e6');
const sand = () => mat('#e4c49a');
const iron = () => mat('#2c3138', { roughness: 0.45, metalness: 0.35 });

function spire(g, x, y, z, h, colors) {
  const body = cyl(h * 0.09, h * 0.13, h * 0.62, 8);
  add(g, body, stone(), x, y + h * 0.31, z);
  add(g, box(h * 0.16, h * 0.12, h * 0.16), bone(), x, y + h * 0.68, z);
  const tip = new THREE.Mesh(mosaic(cone(h * 0.1, h * 0.28, 7), colors), MOSAIC);
  tip.position.set(x, y + h * 0.86, z);
  tip.castShadow = true;
  g.add(tip);
  add(g, cyl(0.02, 0.02, h * 0.12, 5), bone(), x, y + h * 1.02, z);
}

/** Sagrada Família: forest of spires, mosaic tips, and a crane still on site. */
export function sagrada() {
  const g = new THREE.Group();
  add(g, box(2.7, 0.16, 1.55), stone(), 0, 0.08, 0);
  add(g, box(2.35, 0.85, 1.15), sand(), 0, 0.55, 0);
  add(g, box(2.5, 0.42, 1.4), stone(), 0, 0.32, 0);
  for (let i = 0; i < 7; i++) {
    const x = -1.05 + i * 0.35;
    add(g, cyl(0.045, 0.055, 0.72, 6), bone(), x, 0.5, 0.62);
    add(g, box(0.1, 0.22, 0.03), WIN, x, 0.55, 0.72);
  }
  // Nativity (south) towers are the tall, colourful ones.
  const front = [[-1.15, 0.68, 2.45], [-0.55, 0.68, 2.15], [0.55, 0.68, 2.2], [1.15, 0.68, 2.5]];
  const back = [[-1.15, -0.68, 2.0], [-0.5, -0.68, 1.85], [0.5, -0.68, 1.9], [1.15, -0.68, 2.05]];
  front.forEach(([x, z, h], i) => spire(g, x, 0.7, z, h, i % 2 ? TRENCA : TRENCA_COOL));
  back.forEach(([x, z, h], i) => spire(g, x, 0.55, z, h, TRENCA));
  // Evangelists and the tower of Jesus, still rising.
  add(g, cyl(0.22, 0.32, 2.15, 10), stone(), 0, 1.55, 0);
  const crown = new THREE.Mesh(mosaic(cone(0.28, 0.7, 8), TRENCA), MOSAIC);
  crown.position.set(0, 2.9, 0);
  crown.castShadow = true;
  g.add(crown);
  add(g, box(0.08, 0.42, 0.08), bone(), 0, 3.4, 0);
  add(g, box(0.28, 0.06, 0.06), bone(), 0, 3.52, 0);
  // Crane on the east side.
  const crane = mat('#d7a441', { roughness: 0.5, metalness: 0.2 });
  add(g, cyl(0.025, 0.03, 1.55, 5), crane, 0.55, 2.7, -0.15);
  add(g, box(0.95, 0.035, 0.035), crane, 0.95, 3.45, -0.15);
  add(g, cyl(0.01, 0.01, 0.45, 4), crane, 1.25, 3.2, -0.15);
  return g;
}

/** Casa Batlló: bone balconies, a dragon-scale roof and the four-armed cross. */
export function batllo() {
  const g = new THREE.Group();
  add(g, box(1.35, 0.12, 0.7), stone(), 0, 0.06, 0);
  for (let i = 0; i < 5; i++) {
    const y = 0.28 + i * 0.28;
    const wave = Math.sin(i * 0.9) * 0.06;
    add(g, box(1.22, 0.24, 0.58), i === 0 ? mat('#c9b59a') : bone(), 0, y, wave);
    for (const x of [-0.42, 0, 0.42]) {
      add(g, box(0.16, 0.12, 0.03), WIN, x, y, 0.31 + wave);
      const mask = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.028, 5, 8), bone());
      mask.position.set(x, y - 0.02, 0.34 + wave);
      mask.castShadow = true;
      g.add(mask);
    }
  }
  const roof = new THREE.Mesh(
    mosaic(new THREE.SphereGeometry(0.78, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), TRENCA_COOL),
    MOSAIC,
  );
  roof.scale.set(1.15, 0.55, 0.85);
  roof.position.set(0.05, 1.85, 0);
  roof.castShadow = true;
  g.add(roof);
  // Tower and cross of the roof.
  add(g, cyl(0.1, 0.12, 0.55, 8), mat('#d7c4a4'), 0.48, 1.9, 0.05);
  const bulb = new THREE.Mesh(mosaic(new THREE.SphereGeometry(0.14, 8, 6), TRENCA), MOSAIC);
  bulb.position.set(0.48, 2.28, 0.05);
  g.add(bulb);
  add(g, box(0.05, 0.28, 0.05), bone(), 0.48, 2.55, 0.05);
  add(g, box(0.22, 0.045, 0.045), bone(), 0.48, 2.62, 0.05);
  return g;
}

/** La Pedrera: an undulating stone cliff and the rooftop warriors. */
export function pedrera() {
  const g = new THREE.Group();
  const rock = mat('#ddd2c2');
  const rockD = mat('#cfc3b0');
  for (let i = 0; i < 8; i++) {
    const x = -1.15 + i * 0.32;
    const z = Math.sin(i * 0.85) * 0.12;
    const h = 1.15 + Math.sin(i * 1.3) * 0.12;
    add(g, box(0.34, h, 0.62), i % 2 ? rock : rockD, x, h / 2, z);
    add(g, box(0.2, 0.1, 0.03), WIN, x, h * 0.45, z + 0.33);
    add(g, box(0.22, 0.035, 0.08), iron(), x, h * 0.62, z + 0.36);
  }
  add(g, box(2.5, 0.08, 0.9), rock, 0, 1.28, 0);
  const helmets = [[-0.9, 0.2], [-0.4, -0.15], [0.05, 0.18], [0.5, -0.1], [0.95, 0.12], [0.2, 0.28]];
  helmets.forEach(([x, z], i) => {
    add(g, cyl(0.1, 0.13, 0.28, 6), stone(), x, 1.5, z);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 7, 5), i % 2 ? bone() : stone());
    head.scale.y = 1.35;
    head.position.set(x, 1.74, z);
    head.castShadow = true;
    g.add(head);
    add(g, cyl(0.02, 0.02, 0.16, 4), stone(), x, 1.95, z);
  });
  return g;
}

/** Casa Vicens: green-and-cream checker tile and little turrets. */
export function vicens() {
  const g = new THREE.Group();
  const tex = checkerTexture('#1f7a4a', '#f3edd8', 8);
  const tile = mat('#ffffff', { map: tex, flatShading: false, roughness: 0.7 });
  add(g, box(1.15, 0.95, 0.75), tile, 0, 0.55, 0);
  add(g, box(1.25, 0.08, 0.85), mat('#c4492a'), 0, 1.06, 0);
  for (const [x, z] of [[-0.5, 0.32], [0.5, 0.32], [-0.5, -0.32], [0.5, -0.32]]) {
    add(g, box(0.18, 0.45, 0.18), tile, x, 1.28, z);
    add(g, cone(0.14, 0.22, 4), mat('#c4492a'), x, 1.6, z);
  }
  for (let i = 0; i < 4; i++) add(g, box(0.1, 0.16, 0.03), WIN, -0.4 + i * 0.26, 0.55, 0.39);
  // Iron palm fence, very simplified.
  for (let i = 0; i < 6; i++) add(g, cyl(0.02, 0.02, 0.35, 5), iron(), -0.7 + i * 0.28, 0.2, 0.7);
  return g;
}

/** Palau Güell: the twin parabolic arches and the spire over the roof. */
export function palauGuell() {
  const g = new THREE.Group();
  const st = mat('#cbbba4');
  add(g, box(1.15, 1.15, 0.7), st, 0, 0.62, 0);
  add(g, box(1.25, 0.08, 0.8), mat('#6e5a48'), 0, 1.22, 0);
  for (const x of [-0.28, 0.28]) {
    add(g, box(0.28, 0.55, 0.06), mat('#1b1e24'), x, 0.32, 0.36);
    const arch = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.035, 5, 10, Math.PI), st);
    arch.position.set(x, 0.55, 0.38);
    arch.rotation.y = Math.PI;
    g.add(arch);
  }
  for (let row = 0; row < 3; row++) {
    for (const x of [-0.38, 0, 0.38]) add(g, box(0.1, 0.14, 0.03), WIN, x, 0.72 + row * 0.18, 0.37);
  }
  add(g, cyl(0.16, 0.2, 0.45, 8), st, 0, 1.48, 0);
  const cap = new THREE.Mesh(mosaic(cone(0.22, 0.4, 8), TRENCA), MOSAIC);
  cap.position.set(0, 1.88, 0);
  cap.castShadow = true;
  g.add(cap);
  add(g, cyl(0.02, 0.02, 0.22, 4), bone(), 0, 2.16, 0);
  return g;
}

/** Bellesguard: a gothic castle-house with a needle tower. */
export function bellesguard() {
  const g = new THREE.Group();
  const st = mat('#d9d0c2');
  const brick = mat('#a3543c');
  add(g, box(0.85, 1.05, 0.7), st, 0, 0.55, 0);
  add(g, box(0.95, 0.1, 0.78), brick, 0, 1.1, 0);
  add(g, box(0.55, 1.15, 0.5), st, 0, 1.15, 0);
  add(g, cone(0.4, 0.7, 4), brick, 0, 2.05, 0);
  add(g, box(0.06, 0.35, 0.06), bone(), 0, 2.5, 0);
  add(g, box(0.2, 0.05, 0.05), bone(), 0, 2.58, 0);
  for (const y of [0.4, 0.7, 1.05]) add(g, box(0.12, 0.22, 0.03), WIN, 0, y, 0.36);
  add(g, box(0.1, 0.28, 0.03), WIN, 0, 1.45, 0.27);
  return g;
}

/** Pavellons Güell: the gate lodge and the iron dragon across the entrance. */
export function pavellons() {
  const g = new THREE.Group();
  add(g, box(0.7, 0.55, 0.5), stone(), -0.45, 0.32, 0);
  const dome = new THREE.Mesh(mosaic(new THREE.SphereGeometry(0.32, 10, 7, 0, Math.PI * 2, 0, Math.PI / 2), TRENCA), MOSAIC);
  dome.position.set(-0.45, 0.6, 0);
  dome.castShadow = true;
  g.add(dome);
  add(g, cyl(0.04, 0.05, 0.28, 6), bone(), -0.45, 0.95, 0);
  add(g, box(0.16, 0.22, 0.03), WIN, -0.45, 0.32, 0.27);
  // Gate posts and a dragon of wrought iron.
  add(g, box(0.08, 0.7, 0.08), iron(), 0.15, 0.35, 0.15);
  add(g, box(0.08, 0.7, 0.08), iron(), 0.15, 0.35, -0.15);
  const curve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(0.15, 0.35, 0.15),
    new THREE.Vector3(0.55, 0.85, 0),
    new THREE.Vector3(0.15, 0.35, -0.15),
  );
  const dragon = new THREE.Mesh(new THREE.TubeGeometry(curve, 10, 0.035, 5, false), iron());
  dragon.castShadow = true;
  g.add(dragon);
  add(g, cone(0.06, 0.14, 5), iron(), 0.42, 0.78, 0);
  return g;
}

export const GAUDI_BUILDERS = {
  sagrada, batllo, pedrera, guell, vicens, palauguell: palauGuell, bellesguard, pavellons,
};
