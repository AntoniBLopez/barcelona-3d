import * as THREE from 'three';
import { add, box, cyl, cone, mat, watchGlow } from './kit.js';

const bone = () => mat('#f4efe4', { roughness: 0.62 });
const iron = () => mat('#f7f4ee', { roughness: 0.38, metalness: 0.28 });
const DISCS = ['#2f7eb8', '#e07aa0', '#e0a24a', '#49c4c8', '#3cb88a', '#7a68c8', '#f2e2c4'];
const SCALES = ['#1f8f4e', '#2f9a78', '#3aa0c4', '#3d6fd0', '#8a68c8', '#e07aa8', '#d24a58'];

const wallMat = DISCS.map((c) => mat(c, { roughness: 0.34, metalness: 0.14, emissive: c, emissiveIntensity: 0.75 }));
const scaleMat = SCALES.map((c) => mat(c, { roughness: 0.28, metalness: 0.22, emissive: c, emissiveIntensity: 0.9 }));
const wash = new THREE.MeshBasicMaterial({
  color: '#ffc48a', transparent: true, depthWrite: false,
  blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
});
watchGlow(wash, 0.16, true);

const glass = mat('#243044', { emissive: '#ffb15a', emissiveIntensity: 2.2, roughness: 0.35 });
const crossM = mat('#f7f1e4', { emissive: '#fff2cc', emissiveIntensity: 2.4, roughness: 0.3 });

/** Casa Batlló in metres. The facade is +Z, toward Passeig de Gràcia. Amatller is +X. */
export function batllo() {
  const g = new THREE.Group();
  wall(g);
  bones(g);
  floors(g);
  roof(g);
  tower(g);
  amatller(g);
  add(g, box(17, 30, 0.3), wash, 0, 16, 6.4);
  return g;
}

function wall(g) {
  for (let i = 0; i < 8; i++) {
    const x = -7 + i * 2;
    const wave = Math.sin(i * 0.85) * 0.85;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(2.15, 22, 1.15), wallMat[i % wallMat.length]);
    mesh.position.set(x, 20, 4.2 + wave);
    mesh.castShadow = true;
    g.add(mesh);
  }
  add(g, box(16.5, 28, 7), mat('#d9cbb6'), 0, 15, 0);
}

function bones(g) {
  const cols = [-6.2, -3.1, 0, 3.1, 6.2];
  for (const x of cols) {
    const z = 5.5 + Math.sin(x * 0.4) * 0.35;
    add(g, cyl(0.28, 0.5, 5.2, 6), bone(), x, 2.7, z);
    add(g, new THREE.SphereGeometry(0.72, 6, 5), bone(), x, 5.5, z + 0.15);
  }
  add(g, box(14.5, 3.4, 0.35), glass, 0, 3.2, 5.9);
  add(g, box(14.8, 0.35, 0.5), bone(), 0, 5.1, 5.95);
  add(g, box(14.8, 0.35, 0.5), bone(), 0, 1.3, 5.95);
  add(g, box(13.5, 3.6, 0.3), glass, 0, 8.6, 5.7);
  for (const x of cols) add(g, box(0.28, 3.8, 0.45), bone(), x, 8.6, 5.9);
  add(g, box(15, 0.4, 0.7), bone(), 0, 10.6, 5.8);
}

function floors(g) {
  for (let row = 0; row < 4; row++) {
    const y = 13.2 + row * 3.6;
    for (let i = 0; i < 5; i++) {
      const x = -6 + i * 3;
      const z = 5.15 + Math.sin(i + row) * 0.35;
      add(g, box(1.5, 2.1, 0.25), glass, x, y, z);
      mask(g, x, y - 0.85, z + 0.35);
    }
  }
  for (let i = 0; i < 8; i++) {
    add(g, box(0.55, 1.6, 0.2), glass, -6.2 + i * 1.8, 28.2, 5.3);
  }
}

function mask(g, x, y, z) {
  const head = add(g, new THREE.SphereGeometry(0.72, 6, 5), iron(), x, y, z);
  head.scale.set(1.15, 0.8, 0.42);
  const eye = mat('#2a2420');
  add(g, box(0.16, 0.16, 0.16), eye, x - 0.26, y + 0.1, z + 0.22);
  add(g, box(0.16, 0.16, 0.16), eye, x + 0.26, y + 0.1, z + 0.22);
}

function roof(g) {
  for (let i = 0; i < 11; i++) {
    const t = i / 10;
    const x = -6.2 + t * 13;
    const y = 32.2 + Math.sin(t * Math.PI) * 4.6;
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1.45 - t * 0.25, 6, 5), scaleMat[i % scaleMat.length]);
    mesh.scale.set(1.15, 0.85, 0.7);
    mesh.position.set(x, y, 4.4);
    mesh.castShadow = true;
    g.add(mesh);
  }
}

function tower(g) {
  add(g, cyl(1.15, 1.45, 7, 8), bone(), -7.4, 34, 3.8);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(1.35, 7, 6), wallMat[0]);
  bulb.position.set(-7.4, 38.2, 3.8);
  g.add(bulb);
  add(g, box(0.4, 3.4, 0.4), crossM, -7.4, 41.2, 3.8);
  add(g, box(2.6, 0.4, 0.4), crossM, -7.4, 41.8, 3.8);
  add(g, box(0.4, 0.4, 2.6), crossM, -7.4, 41.8, 3.8);
}

function amatller(g) {
  const stone = mat('#c9b48a');
  const step = mat('#a68455');
  add(g, box(12, 24, 8), stone, 15.5, 12, 1.2);
  for (let i = 0; i < 5; i++) {
    add(g, box(11 - i * 1.7, 2.1, 7.2), i % 2 ? step : stone, 15.5, 24.5 + i * 2.1, 1.2);
  }
  add(g, cone(0.9, 3.2, 4), mat('#6e4030'), 15.5, 36.5, 1.2);
  for (const y of [8, 14, 20]) add(g, box(7, 1.6, 0.2), glass, 15.5, y, 5.3);
}
