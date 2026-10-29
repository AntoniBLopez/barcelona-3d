import * as THREE from 'three';
import { add, box, cyl, cone, mat, mosaic, MOSAIC, WIN, TRENCA, checkerTexture } from './kit.js';
import { guell } from './models-guell.js';
import { sagrada } from './models-sagrada.js';
import { batllo } from './models-batllo.js';
import { pedrera } from './models-pedrera.js';

const stone = () => mat('#e6d5bc');
const bone = () => mat('#f4f0e6');
const iron = () => mat('#2c3138', { roughness: 0.45, metalness: 0.35 });

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
