import * as THREE from 'three';
import { add, box, cyl, cone, mat } from './kit.js';

const stone = () => mat('#e7d8c4', { emissive: '#ffd8a8', emissiveIntensity: 0.42 });
const stoneD = () => mat('#cbb89a', { emissive: '#e8c49a', emissiveIntensity: 0.28 });
const iron = () => mat('#6e675e', { emissive: '#ffc48a', emissiveIntensity: 0.38, metalness: 0.55, roughness: 0.38 });
const bronze = () => mat('#a87c3e', { emissive: '#ffb85a', emissiveIntensity: 0.7, metalness: 0.42, roughness: 0.4 });
const mane = () => mat('#7a5428', { emissive: '#e09848', emissiveIntensity: 0.55, metalness: 0.35, roughness: 0.48 });

/** Monument a Colom, metres. The statue's right arm points along +Z, out to sea. */
export function colon() {
  const g = new THREE.Group();
  steps(g);
  pedestal(g);
  column(g);
  admiral(g);
  return g;
}

function steps(g) {
  add(g, cyl(11.2, 11.2, 0.45, 24), stone(), 0, 0.22, 0);
  add(g, cyl(9.4, 9.4, 0.42, 24), stoneD(), 0, 0.62, 0);
  add(g, cyl(7.9, 7.9, 0.4, 24), stone(), 0, 1.0, 0);
  add(g, cyl(5.7, 5.7, 3.1, 8), stone(), 0, 2.7, 0);
  add(g, cyl(6.05, 6.05, 0.35, 8), stoneD(), 0, 4.15, 0);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    lion(g, Math.sin(a) * 7.15, Math.cos(a) * 7.15, a);
  }
}

function lion(g, x, z, yaw) {
  const p = new THREE.Group();
  const b = bronze();
  const m = mane();
  add(p, box(0.82, 0.72, 1.85), b, 0, 0.92, -0.05);
  for (const [lx, lz] of [[-0.28, 0.58], [0.28, 0.58], [-0.26, -0.62], [0.26, -0.62]]) {
    add(p, box(0.22, 0.72, 0.24), b, lx, 0.4, lz);
  }
  add(p, box(0.38, 0.16, 0.46), b, -0.28, 0.1, 0.86);
  add(p, box(0.38, 0.16, 0.46), b, 0.28, 0.1, 0.86);
  add(p, box(0.32, 0.14, 0.36), b, -0.26, 0.1, -0.7);
  add(p, box(0.32, 0.14, 0.36), b, 0.26, 0.1, -0.7);
  add(p, box(0.48, 0.42, 0.5), b, 0, 1.22, 1.02);
  add(p, new THREE.SphereGeometry(0.5, 7, 6), m, 0, 1.24, 0.42);
  add(p, new THREE.SphereGeometry(0.32, 6, 5), m, 0, 0.82, 0.82);
  add(p, box(0.26, 0.18, 0.4), b, 0, 1.08, 1.38);
  add(p, cone(0.1, 0.22, 4), b, -0.18, 1.58, 0.95);
  add(p, cone(0.1, 0.22, 4), b, 0.18, 1.58, 0.95);
  const tail = add(p, box(0.1, 1.05, 0.1), b, 0, 1.45, -1.05);
  tail.rotation.x = 0.85;
  add(p, new THREE.SphereGeometry(0.16, 5, 4), m, 0, 1.82, -0.62);
  p.position.set(x, 1.05, z);
  p.rotation.y = yaw;
  g.add(p);
}

function pedestal(g) {
  add(g, cyl(4.3, 4.6, 7.4, 8), stone(), 0, 8.1, 0);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const c = Math.cos(a);
    const s = Math.sin(a);
    add(g, box(2.4, 3.2, 0.28), stoneD(), s * 4.15, 8.2, c * 4.15).rotation.y = a;
    add(g, box(1.7, 2.2, 0.16), mat('#a89878', { emissive: '#e8c49a', emissiveIntensity: 0.2 }), s * 4.35, 8.2, c * 4.35).rotation.y = a;
  }
  for (const [x, z] of [[3.1, 3.1], [-3.1, 3.1], [3.1, -3.1], [-3.1, -3.1]]) group(g, x, z);
}

function group(g, x, z) {
  const b = bronze();
  for (const dx of [-0.42, 0.42]) {
    add(g, box(0.38, 1.7, 0.32), b, x + dx, 12.5, z);
    add(g, new THREE.SphereGeometry(0.22, 5, 4), b, x + dx, 13.5, z);
  }
}

function column(g) {
  add(g, cyl(2.15, 2.45, 1.6, 12), iron(), 0, 12.6, 0);
  add(g, cyl(1.28, 1.55, 32.5, 16), iron(), 0, 29.6, 0);
  add(g, cyl(2.15, 1.7, 1.5, 12), iron(), 0, 46.4, 0);
  add(g, cyl(2.5, 2.5, 0.45, 12), bronze(), 0, 47.3, 0);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const leaf = add(g, cone(0.28, 1.35, 5), bronze(), Math.sin(a) * 1.65, 47.85, Math.cos(a) * 1.65);
    leaf.rotation.order = 'YXZ';
    leaf.rotation.y = a;
    leaf.rotation.x = 0.65;
  }
  add(g, new THREE.SphereGeometry(1.45, 10, 8), bronze(), 0, 50.15, 0);
  add(g, cyl(1.5, 1.5, 0.08, 12), stoneD(), 0, 50.15, 0);
}

function admiral(g) {
  const b = bronze();
  const y = 51.7;
  add(g, box(0.38, 2.3, 0.42), b, -0.24, y + 1.15, 0);
  add(g, box(0.38, 2.3, 0.42), b, 0.24, y + 1.15, 0);
  add(g, box(1.25, 2.15, 0.72), b, 0, y + 3.15, 0);
  add(g, box(1.7, 2.5, 0.28), b, 0, y + 3.2, -0.38);
  add(g, new THREE.SphereGeometry(0.42, 6, 5), b, 0, y + 4.55, 0.05);
  add(g, box(0.55, 0.22, 0.48), b, 0, y + 4.9, 0);
  add(g, box(0.28, 1.55, 0.28), b, 0.78, y + 2.9, 0.05);
  const arm = new THREE.Group();
  arm.position.set(-0.72, y + 3.95, 0.2);
  arm.rotation.x = -0.5;
  add(arm, box(0.28, 0.28, 2.35), b, 0, 0, 1.15);
  add(arm, box(0.16, 0.12, 0.48), b, 0, 0.02, 2.4);
  g.add(arm);
}
