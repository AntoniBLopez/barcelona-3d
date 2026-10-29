import * as THREE from 'three';
import { add, box, cyl, cone, mat, checkerTexture, WIN } from './kit.js';

const brick = () => mat('#b34732', { emissive: '#ffb070', emissiveIntensity: 0.5 });
const brickD = () => mat('#8c3424', { emissive: '#e09058', emissiveIntensity: 0.4 });
const stone = () => mat('#f3e6cf', { emissive: '#ffe4c0', emissiveIntensity: 0.22 });
const bronze = () => mat('#c6a15a', { emissive: '#f0d090', emissiveIntensity: 0.55, metalness: 0.35, roughness: 0.4 });
const lawn = () => mat('#5d8a46');
const path = () => mat('#f3ead8');
const clock = () => mat('#f7f1e4', { emissive: '#fff4dc', emissiveIntensity: 0.55 });
const hand = () => mat('#2a2622');

const TILES = ['#1f8a78', '#e7c04f', '#3d6fa6', '#d35a3a', '#f4efe4', '#7d6bb5', '#2f8f6a', '#e07a3a'];
const tile = (hex) => mat(hex, { emissive: hex, emissiveIntensity: 0.45, roughness: 0.42 });

const BODY = box(16, 10, 28);
const BAND = box(16.7, 0.7, 28.7);
const DOME = new THREE.SphereGeometry(5.1, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
const FINIAL = new THREE.ConeGeometry(0.55, 2.4, 5);
const WINBOX = box(0.35, 2.2, 1.5);

/** Recinte Modernista. +Z faces Avinguda de Gaudí, toward the Sagrada Família. Metres. */
export function santpau() {
  const g = new THREE.Group();
  grounds(g);
  admin(g);
  wards(g);
  salvador(g, -42, 52);
  montserrat(g, 42, -26);
  trees(g);
  return g;
}

function grounds(g) {
  add(g, box(168, 0.3, 250), lawn(), 0, 0.12, -8);
  add(g, box(9, 0.16, 230), path(), 0, 0.28, -4);
  add(g, box(40, 0.22, 78), path(), 0, 0.24, 148);
  for (const z of [52, 16, -20, -56, -92]) add(g, box(96, 0.12, 5), path(), 0, 0.32, z);
}

function admin(g) {
  add(g, box(78, 15, 24), brick(), 0, 7.5, 98);
  add(g, box(80, 0.7, 25.2), stone(), 0, 6.2, 98);
  add(g, box(80, 0.7, 25.2), stone(), 0, 12.4, 98);
  for (let i = 0; i < 8; i++) add(g, box(4.2, 1.3, 0.5), tile(TILES[i]), -29 + i * 8.2, 10.6, 110.4);
  add(g, box(16, 12, 6), brick(), 0, 6, 110);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(5.2, 0.7, 5, 14, Math.PI), brickD());
  ring.position.set(0, 5.4, 113.2);
  g.add(ring);
  add(g, box(7.2, 6.4, 0.5), mat('#241814'), 0, 3.6, 113.4);
  add(g, box(8.2, 32, 8.2), brick(), 0, 30, 102);
  add(g, box(9, 1.1, 9), stone(), 0, 16.2, 102);
  add(g, box(9, 1.1, 9), stone(), 0, 38, 102);
  const face = add(g, cyl(2.3, 2.3, 0.35, 12), clock(), 0, 34, 106.5);
  face.rotation.x = Math.PI / 2;
  add(g, box(0.18, 1.5, 0.2), hand(), 0, 34.3, 106.7);
  add(g, box(1.15, 0.16, 0.2), hand(), 0.2, 34, 106.7);
  add(g, cone(3.4, 16, 8), bronze(), 0, 52, 102);
  for (const x of [-34, 34]) {
    for (const z of [90, 106]) {
      add(g, box(4.2, 8, 4.2), brick(), x, 18, z);
      add(g, new THREE.SphereGeometry(2.3, 7, 5, 0, Math.PI * 2, 0, Math.PI / 2), tile('#e7c04f'), x, 22, z);
      add(g, cone(0.4, 2.2, 5), bronze(), x, 24.6, z);
    }
  }
}

function wards(g) {
  const spots = [];
  for (const z of [52, 16, -20, -56, -92]) {
    for (const x of [-42, 42]) {
      if (x < 0 && z === 52) continue;
      if (x > 0 && z === -20) continue;
      spots.push({ x, z, tile: TILES[spots.length % TILES.length], dome: spots.length % 2 });
    }
  }
  const bodies = new THREE.InstancedMesh(BODY, mat('#ffffff', { emissive: '#ffb070', emissiveIntensity: 0.42 }), spots.length);
  const bands = new THREE.InstancedMesh(BAND, mat('#ffffff', { emissive: '#ffe0b0', emissiveIntensity: 0.35, roughness: 0.4 }), spots.length);
  const gy = domeMat('#2f8a45', '#e7c04f');
  const bo = domeMat('#2a6fbf', '#e0a24a');
  const domes = [new THREE.InstancedMesh(DOME, gy, spots.length), new THREE.InstancedMesh(DOME, bo, spots.length)];
  const fins = new THREE.InstancedMesh(FINIAL, bronze(), spots.length * 2);
  const wins = new THREE.InstancedMesh(WINBOX, WIN, spots.length * 4);
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  const domeN = [0, 0];
  spots.forEach((s, i) => {
    dummy.position.set(s.x, 5, s.z);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    bodies.setMatrixAt(i, dummy.matrix);
    bodies.setColorAt(i, color.set(i % 2 ? '#a33d2e' : '#c4563a'));
    dummy.position.y = 8.1;
    dummy.updateMatrix();
    bands.setMatrixAt(i, dummy.matrix);
    bands.setColorAt(i, color.set(s.tile));
    dummy.position.y = 10;
    dummy.updateMatrix();
    domes[s.dome].setMatrixAt(domeN[s.dome]++, dummy.matrix);
    dummy.scale.set(1, 1, 1);
    for (const dz of [-12, 12]) {
      dummy.position.set(s.x, 12.4, s.z + dz);
      dummy.updateMatrix();
      fins.setMatrixAt(i * 2 + (dz > 0 ? 1 : 0), dummy.matrix);
    }
    const face = s.x > 0 ? s.x - 8.1 : s.x + 8.1;
    for (let k = 0; k < 4; k++) {
      dummy.position.set(face, 4.2, s.z - 9 + k * 6);
      dummy.updateMatrix();
      wins.setMatrixAt(i * 4 + k, dummy.matrix);
    }
  });
  domes[0].count = domeN[0];
  domes[1].count = domeN[1];
  for (const mesh of [bodies, bands, ...domes, fins, wins]) {
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.computeBoundingSphere();
    g.add(mesh);
  }
}

function domeMat(a, b) {
  const map = checkerTexture(a, b, 6);
  return mat('#ffffff', {
    name: `dome-${a}-${b}`,
    map,
    emissive: '#ffffff',
    emissiveMap: map,
    emissiveIntensity: 0.75,
    roughness: 0.45,
  });
}

/** Sant Salvador: the large green-and-yellow scaled dome. */
function salvador(g, x, z) {
  add(g, box(20, 12, 32), brick(), x, 6, z);
  add(g, box(20.8, 0.8, 32.8), tile('#1f8a78'), x, 9.2, z);
  add(g, box(20.4, 0.5, 32.4), tile('#e7c04f'), x, 4.2, z);
  add(g, new THREE.SphereGeometry(7.2, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), domeMat('#2f8a45', '#e7c04f'), x, 12, z);
  for (const dz of [-14, 14]) {
    add(g, cyl(1.1, 1.3, 6, 6), brick(), x, 15, z + dz);
    add(g, cone(1.3, 4.2, 6), tile('#e7c04f'), x, 19.2, z + dz);
  }
  const arch = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.45, 4, 10, Math.PI), brickD());
  arch.rotation.y = x > 0 ? Math.PI / 2 : -Math.PI / 2;
  arch.position.set(x + Math.sign(-x) * 10.2, 4.2, z);
  g.add(arch);
}

/** A ward with a Mudéjar pointed spire. */
function montserrat(g, x, z) {
  add(g, box(16, 11, 28), brick(), x, 5.5, z);
  add(g, box(16.6, 0.7, 28.6), tile('#3d6fa6'), x, 8.4, z);
  add(g, box(16.3, 0.45, 28.3), tile('#f4efe4'), x, 3.4, z);
  add(g, cyl(2.4, 3.2, 8, 8), brickD(), x, 15, z);
  add(g, cone(3.2, 9, 8), tile('#d35a3a'), x, 22, z);
  add(g, cone(0.4, 2.6, 5), bronze(), x, 27.2, z);
}

function trees(g) {
  const spots = [];
  for (const z of [30, -4, -40, -76]) spots.push([0, z], [-18, z], [18, z]);
  for (const z of [124, 140, 156, 172]) spots.push([-14, z], [14, z]);
  const trunk = new THREE.InstancedMesh(cyl(0.35, 0.5, 4.2, 5), mat('#8a6244'), spots.length);
  const crown = new THREE.InstancedMesh(new THREE.ConeGeometry(2.4, 4.2, 5), mat('#ffffff'), spots.length);
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  const greens = ['#2f7a3a', '#3d8a48', '#246636'];
  spots.forEach(([x, z], i) => {
    dummy.position.set(x, 2.3, z);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    trunk.setMatrixAt(i, dummy.matrix);
    dummy.position.y = 5.4;
    dummy.updateMatrix();
    crown.setMatrixAt(i, dummy.matrix);
    crown.setColorAt(i, color.set(greens[i % 3]));
  });
  for (const mesh of [trunk, crown]) {
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.castShadow = true;
    mesh.computeBoundingSphere();
    g.add(mesh);
  }
}
