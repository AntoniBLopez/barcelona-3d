import * as THREE from 'three';
import { add, box, cyl, cone, mat, mosaic, MOSAIC, WIN, TRENCA } from './kit.js';

const stone = () => mat('#e4d5bc');
const brick = () => mat('#b5644a');
const cream = () => mat('#f3efe4');
const lead = () => mat('#8d93a3');

function windows(g, n, y, z, span, w = 0.1, h = 0.16) {
  for (let i = 0; i < n; i++) {
    const x = -span / 2 + (span * (i + 0.5)) / n;
    add(g, box(w, h, 0.03), WIN, x, y, z);
  }
}

export function catedral() {
  const g = new THREE.Group();
  add(g, box(1.5, 0.7, 0.85), stone(), 0, 0.4, 0);
  add(g, box(1.55, 0.08, 0.9), lead(), 0, 0.78, 0);
  // Neo-gothic façade.
  add(g, box(0.9, 1.15, 0.12), stone(), 0, 0.6, 0.42);
  add(g, cone(0.28, 0.45, 4), stone(), -0.32, 1.3, 0.42);
  add(g, cone(0.28, 0.45, 4), stone(), 0.32, 1.3, 0.42);
  add(g, box(0.16, 0.4, 0.04), WIN, 0, 0.45, 0.5);
  add(g, cyl(0.01, 0.22, 0.04, 12), stone(), 0, 0.85, 0.5);
  // Cloister pond hint and a dome.
  add(g, cyl(0.22, 0.24, 0.35, 10), stone(), 0, 1.0, -0.05);
  add(g, new THREE.SphereGeometry(0.2, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), lead(), 0, 1.18, -0.05);
  return g;
}

export function gotic() {
  const g = new THREE.Group();
  const tones = ['#d9cbb4', '#c9b79a', '#e6dcc8', '#b7a48c'];
  const spots = [[-0.45, 0.2, 0.7], [0.15, -0.15, 0.95], [0.5, 0.25, 0.6], [-0.1, 0.35, 0.8], [0.35, -0.4, 0.55]];
  spots.forEach(([x, z, h], i) => {
    add(g, box(0.38, h, 0.34), mat(tones[i % tones.length]), x, h / 2, z);
    add(g, cone(0.26, 0.22, 4), brick(), x, h + 0.08, z);
    add(g, box(0.08, 0.12, 0.02), WIN, x, h * 0.55, z + 0.18);
  });
  // Sant Jaume: the open square.
  add(g, box(0.7, 0.04, 0.55), mat('#efe6d4'), -0.15, 0.03, -0.15);
  return g;
}

export function rambla() {
  const g = new THREE.Group();
  add(g, box(0.55, 0.06, 2.1), mat('#d7c7a4'), 0, 0.04, 0);
  for (let i = 0; i < 6; i++) {
    const z = -0.9 + i * 0.36;
    add(g, cyl(0.04, 0.05, 0.35, 6), mat('#6b4a32'), -0.12, 0.22, z);
    add(g, new THREE.SphereGeometry(0.12, 7, 6), mat('#3f7a3a'), -0.12, 0.48, z);
    add(g, box(0.22, 0.28, 0.18), mat(i % 2 ? '#e7d7c2' : '#c9b49a'), 0.22, 0.18, z);
  }
  return g;
}

export function catalunya() {
  const g = new THREE.Group();
  add(g, cyl(0.7, 0.7, 0.06, 16), mat('#e7dcc8'), 0, 0.04, 0);
  add(g, cyl(0.28, 0.32, 0.12, 12), stone(), 0, 0.12, 0);
  add(g, cyl(0.08, 0.1, 0.35, 8), stone(), 0, 0.34, 0);
  add(g, new THREE.SphereGeometry(0.1, 8, 6), stone(), 0, 0.56, 0);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    add(g, box(0.08, 0.16, 0.08), mat('#cfd6dc'), Math.cos(a) * 0.48, 0.12, Math.sin(a) * 0.48);
  }
  return g;
}

export function arc() {
  const g = new THREE.Group();
  add(g, box(0.28, 1.15, 0.28), brick(), -0.55, 0.6, 0);
  add(g, box(0.28, 1.15, 0.28), brick(), 0.55, 0.6, 0);
  add(g, box(1.4, 0.28, 0.36), brick(), 0, 1.25, 0);
  add(g, box(0.7, 0.55, 0.08), mat('#1d2430'), 0, 0.55, 0);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.07, 6, 14, Math.PI), brick());
  ring.position.set(0, 0.78, 0);
  g.add(ring);
  add(g, box(0.5, 0.16, 0.2), stone(), 0, 1.48, 0);
  add(g, cone(0.08, 0.18, 4), stone(), -0.55, 1.85, 0);
  add(g, cone(0.08, 0.18, 4), stone(), 0.55, 1.85, 0);
  return g;
}

export function castell() {
  const g = new THREE.Group();
  const wall = mat('#cbb892');
  add(g, cyl(0.85, 0.9, 0.28, 6), wall, 0, 0.16, 0);
  add(g, box(1.15, 0.45, 0.7), wall, 0, 0.4, 0);
  for (const [x, z] of [[-0.55, -0.35], [0.55, -0.35], [-0.55, 0.35], [0.55, 0.35]]) {
    add(g, box(0.22, 0.7, 0.22), wall, x, 0.5, z);
  }
  add(g, box(0.35, 0.25, 0.35), stone(), 0, 0.75, 0);
  add(g, box(0.04, 0.2, 0.04), mat('#f4f1ea'), 0, 0.95, 0);
  return g;
}

export function mnac() {
  const g = new THREE.Group();
  const st = mat('#f0e6d4');
  add(g, box(2.3, 0.45, 0.7), st, 0, 0.28, 0);
  add(g, box(0.7, 0.7, 0.55), st, 0, 0.55, 0.05);
  add(g, cyl(0.28, 0.3, 0.35, 12), st, 0, 1.05, 0.05);
  add(g, new THREE.SphereGeometry(0.26, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), lead(), 0, 1.22, 0.05);
  for (const x of [-0.85, 0.85]) {
    add(g, box(0.4, 0.7, 0.4), st, x, 0.5, 0);
    add(g, cone(0.22, 0.28, 4), mat('#b4533a'), x, 0.95, 0);
  }
  // Steps.
  for (let i = 0; i < 4; i++) add(g, box(1.6 - i * 0.2, 0.05, 0.18), stone(), 0, 0.04 + i * 0.05, 0.5 + i * 0.12);
  return g;
}

export function estadi() {
  const g = new THREE.Group();
  add(g, new THREE.CylinderGeometry(0.85, 0.9, 0.28, 18, 1, true), mat('#e7e1d6'), 0, 0.25, 0);
  add(g, new THREE.CylinderGeometry(0.7, 0.72, 0.08, 18), mat('#3d8f4a'), 0, 0.12, 0);
  add(g, box(0.45, 0.35, 0.2), mat('#d7c4a0'), 0, 0.45, 0.78);
  add(g, box(1.5, 0.06, 0.08), mat('#f2f2f2'), 0, 0.42, 0);
  return g;
}

export function campnou() {
  const g = new THREE.Group();
  const bowl = new THREE.CylinderGeometry(1.15, 1.25, 0.45, 20, 1, true);
  add(g, bowl, mat('#f2f0ea'), 0, 0.28, 0);
  add(g, new THREE.CylinderGeometry(0.95, 0.98, 0.12, 20), mat('#3a8f45'), 0, 0.12, 0);
  // Blaugrana seats as a coloured inner ring.
  const seats = new THREE.CylinderGeometry(1.05, 1.08, 0.28, 20, 1, true);
  add(g, seats, mat('#a11d33'), 0, 0.32, 0);
  add(g, box(0.9, 0.12, 0.18), mat('#12284a'), 0, 0.55, 0.95);
  return g;
}

export function glories() {
  const g = new THREE.Group();
  // Bullet: a lathe of an ogive, pixel-ish coloured glass skin.
  const pts = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    const r = Math.sin(t * Math.PI) * 0.34 * (1 - t * 0.35);
    pts.push(new THREE.Vector2(Math.max(0.02, r), t * 2.6));
  }
  const geo = new THREE.LatheGeometry(pts, 12);
  const colors = ['#c4554a', '#d07a3a', '#e6c15a', '#7eb8c9', '#8fd0c2', '#f2f4f2'];
  const mesh = new THREE.Mesh(mosaic(geo, colors), MOSAIC);
  mesh.castShadow = true;
  g.add(mesh);
  add(g, new THREE.SphereGeometry(0.16, 10, 8), mat('#d5e6ee', { transparent: true, opacity: 0.85, roughness: 0.15 }), 0, 2.55, 0);
  return g;
}

export function santpau() {
  const g = new THREE.Group();
  const br = mat('#c46a45');
  // Administration building and a handful of pavilions with tiled domes.
  add(g, box(0.9, 0.7, 0.45), br, 0, 0.4, 0.55);
  add(g, cyl(0.2, 0.22, 0.7, 8), br, 0, 0.7, 0.55);
  add(g, new THREE.SphereGeometry(0.22, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), MOSAIC, 0, 1.15, 0.55).geometry = mosaic(new THREE.SphereGeometry(0.22, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), TRENCA);
  const dome = g.children[g.children.length - 1];
  dome.material = MOSAIC;
  for (const [x, z] of [[-0.7, -0.15], [0.7, -0.15], [-0.35, -0.55], [0.35, -0.55]]) {
    add(g, box(0.38, 0.4, 0.32), br, x, 0.24, z);
    const d = new THREE.Mesh(mosaic(new THREE.SphereGeometry(0.18, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), TRENCA), MOSAIC);
    d.position.set(x, 0.48, z);
    d.castShadow = true;
    g.add(d);
  }
  return g;
}

export function musica() {
  const g = new THREE.Group();
  const br = mat('#b85a42');
  add(g, box(1.05, 0.85, 0.7), br, 0, 0.48, 0);
  // Mosaic columns on the corner.
  for (const x of [-0.4, 0, 0.4]) {
    const col = new THREE.Mesh(mosaic(cyl(0.06, 0.07, 0.7, 8), TRENCA), MOSAIC);
    col.position.set(x, 0.45, 0.38);
    col.castShadow = true;
    g.add(col);
  }
  add(g, box(1.15, 0.1, 0.8), stone(), 0, 0.95, 0);
  // Stained-glass skylight.
  const sky = new THREE.Mesh(mosaic(new THREE.SphereGeometry(0.28, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), TRENCA_SAFE()), MOSAIC);
  sky.position.set(0, 1.05, 0);
  g.add(sky);
  add(g, box(0.7, 0.35, 0.08), brick(), 0, 1.2, 0.28);
  return g;
}

function TRENCA_SAFE() { return TRENCA; }

export function ciutadella() {
  const g = new THREE.Group();
  add(g, box(1.8, 0.05, 1.3), mat('#7ea84f'), 0, 0.03, 0);
  add(g, cyl(0.45, 0.45, 0.06, 16), mat('#4f98a4'), 0, 0.08, 0.1);
  // Cascade monument.
  add(g, box(0.4, 0.35, 0.25), stone(), 0, 0.22, -0.45);
  add(g, cone(0.12, 0.35, 6), stone(), 0, 0.55, -0.45);
  // Parliament in the old arsenal.
  add(g, box(0.7, 0.4, 0.35), mat('#e7d8c0'), 0.7, 0.25, -0.35);
  add(g, cone(0.22, 0.2, 4), brick(), 0.7, 0.52, -0.35);
  return g;
}

export function boqueria() {
  const g = new THREE.Group();
  add(g, box(1.15, 0.45, 0.7), mat('#d9c7a6'), 0, 0.28, 0);
  // Iron-and-glass roof.
  add(g, box(1.2, 0.06, 0.75), mat('#8aa0a8', { metalness: 0.3, roughness: 0.35 }), 0, 0.55, 0);
  for (let i = 0; i < 5; i++) add(g, cyl(0.02, 0.02, 0.5, 5), mat('#5c656c'), -0.45 + i * 0.22, 0.28, 0.32);
  add(g, box(0.7, 0.35, 0.06), brick(), 0, 0.7, 0.36);
  add(g, box(0.28, 0.22, 0.03), WIN, 0, 0.28, 0.37);
  return g;
}

export function tibidabo() {
  const g = new THREE.Group();
  add(g, box(0.7, 0.45, 0.5), stone(), 0, 0.28, 0);
  add(g, cyl(0.16, 0.2, 0.7, 8), stone(), 0, 0.75, 0);
  add(g, new THREE.SphereGeometry(0.18, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), lead(), 0, 1.15, 0);
  add(g, box(0.05, 0.35, 0.05), mat('#d7c15a'), 0, 1.45, 0);
  // Ferris wheel of the amusement park.
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.02, 5, 16), mat('#cfd5dc', { metalness: 0.4, roughness: 0.4 }));
  wheel.position.set(0.55, 0.45, 0);
  g.add(wheel);
  add(g, cyl(0.02, 0.02, 0.55, 5), mat('#8d93a0'), 0.55, 0.3, 0);
  return g;
}

export function santamaria() {
  const g = new THREE.Group();
  add(g, box(1.25, 0.7, 0.7), stone(), 0, 0.4, 0);
  add(g, box(1.3, 0.08, 0.75), lead(), 0, 0.78, 0);
  // Buttresses.
  for (const x of [-0.7, -0.35, 0, 0.35, 0.7]) add(g, box(0.06, 0.55, 0.12), stone(), x, 0.35, 0.38);
  add(g, cyl(0.18, 0.2, 0.45, 10), stone(), 0, 0.95, 0);
  add(g, cone(0.2, 0.28, 10), lead(), 0, 1.28, 0);
  // Rose window.
  add(g, cyl(0.12, 0.12, 0.04, 12), WIN, 0, 0.55, 0.37);
  return g;
}

export function hotelw() {
  const g = new THREE.Group();
  // A sail: a curved wall leaning over the quay.
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(0.15, 0);
  shape.quadraticCurveTo(0.85, 0.8, 0.35, 1.9);
  shape.lineTo(0.12, 1.9);
  shape.quadraticCurveTo(0.55, 0.8, 0, 0);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.42, bevelEnabled: false });
  geo.translate(-0.2, 0, -0.21);
  add(g, geo, mat('#f7f4ef'));
  add(g, box(0.5, 0.08, 0.55), mat('#d9cbb8'), 0.05, 0.04, 0);
  // A band of lit windows.
  for (let i = 0; i < 5; i++) add(g, box(0.06, 0.08, 0.02), WIN, 0.15, 0.35 + i * 0.26, 0.22);
  return g;
}

export function colon() {
  const g = new THREE.Group();
  add(g, cyl(0.28, 0.32, 0.18, 8), stone(), 0, 0.1, 0);
  add(g, cyl(0.1, 0.14, 1.15, 10), stone(), 0, 0.72, 0);
  add(g, cyl(0.16, 0.16, 0.08, 8), stone(), 0, 1.32, 0);
  add(g, box(0.08, 0.22, 0.06), mat('#6a542c'), 0, 1.5, 0);
  add(g, box(0.16, 0.04, 0.04), mat('#6a542c'), 0, 1.58, 0);
  // Lions, very small.
  for (const [x, z] of [[0.22, 0], [-0.22, 0], [0, 0.22], [0, -0.22]]) {
    add(g, box(0.08, 0.06, 0.12), mat('#8a7048'), x, 0.08, z);
  }
  return g;
}

export function fontmagica() {
  const g = new THREE.Group();
  const water = mat('#7ec4d4', { roughness: 0.25, metalness: 0.1, transparent: true, opacity: 0.9 });
  for (let i = 0; i < 4; i++) {
    const w = 1.3 - i * 0.28;
    add(g, box(w, 0.08, w * 0.55), i % 2 ? water : stone(), 0, 0.06 + i * 0.1, 0);
  }
  add(g, cyl(0.04, 0.04, 0.45, 6), water, 0, 0.55, 0);
  return g;
}

export function bunkers() {
  const g = new THREE.Group();
  const conc = mat('#c5c1b6');
  add(g, box(1.3, 0.12, 0.8), conc, 0, 0.1, 0);
  add(g, box(0.7, 0.22, 0.4), conc, -0.2, 0.22, -0.1);
  add(g, box(0.35, 0.35, 0.3), conc, 0.35, 0.28, 0.15);
  add(g, cyl(0.08, 0.1, 0.2, 8), conc, 0.35, 0.5, 0.15);
  add(g, box(0.9, 0.05, 0.35), mat('#b7b2a6'), 0.1, 0.2, 0.35);
  return g;
}

export function espanya() {
  const g = new THREE.Group();
  // Arenas: a circular brick bullring turned into a shopping hall.
  add(g, new THREE.CylinderGeometry(0.72, 0.75, 0.4, 16, 1, true), brick(), 0, 0.28, 0);
  add(g, new THREE.CylinderGeometry(0.7, 0.7, 0.06, 16), mat('#f3efe6'), 0, 0.5, 0);
  add(g, cyl(0.08, 0.08, 0.55, 6), brick(), 0, 0.55, 0);
  // Venetian towers, tiny, in front of the square.
  for (const x of [-0.95, 0.95]) {
    add(g, box(0.12, 0.7, 0.12), brick(), x, 0.38, 0.7);
    add(g, cone(0.1, 0.18, 4), stone(), x, 0.8, 0.7);
  }
  return g;
}

export function poblenou() {
  const g = new THREE.Group();
  add(g, box(0.4, 0.05, 1.8), mat('#d9c7a2'), 0, 0.03, 0);
  for (let i = 0; i < 5; i++) {
    const z = -0.7 + i * 0.35;
    add(g, cyl(0.035, 0.04, 0.4, 6), mat('#8a5a32'), 0, 0.24, z);
    add(g, new THREE.SphereGeometry(0.1, 6, 5), mat('#2f7a45'), 0, 0.5, z);
    // Palm crown.
    add(g, cone(0.12, 0.16, 5), mat('#1f6a3c'), 0, 0.62, z);
  }
  return g;
}

export function portvell() {
  const g = new THREE.Group();
  add(g, box(1.4, 0.08, 0.55), mat('#d8c7a6'), 0, 0.06, 0);
  // Maremagnum shed and a couple of masts.
  add(g, box(0.7, 0.35, 0.4), mat('#e7e2d8'), -0.25, 0.26, 0);
  add(g, cone(0.4, 0.2, 4), mat('#c5d5de'), -0.25, 0.5, 0);
  add(g, cyl(0.02, 0.02, 0.7, 4), mat('#f4f7f8'), 0.4, 0.4, 0.05);
  add(g, box(0.28, 0.18, 0.02), mat('#f7f7f7'), 0.52, 0.55, 0.05);
  add(g, box(0.9, 0.05, 0.12), mat('#8d6a45'), 0.15, 0.1, 0.4);
  return g;
}

export function barceloneta() {
  const g = new THREE.Group();
  add(g, box(1.5, 0.06, 0.8), mat('#e7d3a4'), 0, 0.04, 0);
  const colors = ['#d35a3a', '#3d6fa6', '#e7c04f', '#1f8a78', '#f4efe4'];
  for (let i = 0; i < 5; i++) {
    add(g, cone(0.1, 0.16, 6), mat(colors[i]), -0.6 + i * 0.3, 0.14, (i % 2) * 0.15);
  }
  add(g, box(0.45, 0.22, 0.2), mat('#f4efe6'), 0.15, 0.16, -0.28);
  return g;
}

export const CITY_BUILDERS = {
  catedral, gotic, rambla, catalunya, arc, castell, mnac, estadi, campnou, glories,
  santpau, musica, ciutadella, boqueria, tibidabo, santamaria, hotelw, colon,
  fontmagica, bunkers, espanya, poblenou, portvell, barceloneta,
};

export function buildMonument(id) {
  const fn = CITY_BUILDERS[id];
  if (!fn) return new THREE.Group();
  return fn();
}
