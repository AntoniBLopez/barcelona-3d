import * as THREE from 'three';
import { add, cyl, mat, watchGlow } from './kit.js';

/**
 * Torre Glòries: a bullet of coloured glass. Built in metres.
 * Wider through the middle, then an ogive dome. Panels run red at the
 * base and blue-green toward the tip.
 */
export function glories() {
  const g = new THREE.Group();
  const H = 144;
  const R0 = 16.2;
  const steps = 26;
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    let r = R0 * (0.9 + 0.1 * Math.sin(t * Math.PI));
    if (t > 0.74) r = R0 * Math.cos(((t - 0.74) / 0.26) * Math.PI / 2);
    pts.push(new THREE.Vector2(Math.max(0.8, r), t * H));
  }
  const lathe = new THREE.LatheGeometry(pts, 28).toNonIndexed();
  paint(lathe);
  const skin = new THREE.MeshStandardMaterial({
    vertexColors: true,
    metalness: 0.12,
    roughness: 0.48,
    flatShading: true,
  });
  skin.emissive = new THREE.Color('#ffc090');
  watchGlow(skin, 0.45);
  const mesh = new THREE.Mesh(lathe, skin);
  mesh.castShadow = true;
  g.add(mesh);

  const leds = new THREE.Mesh(lathe, new THREE.MeshBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    toneMapped: false,
    blending: THREE.AdditiveBlending,
  }));
  leds.scale.setScalar(1.02);
  watchGlow(leds.material, 0.7, true);
  g.add(leds);

  add(g, new THREE.SphereGeometry(3.2, 10, 8), mat('#d5e8ef', {
    roughness: 0.08, metalness: 0.15, transparent: true, opacity: 0.85,
  }), 0, H - 1.2, 0);
  add(g, cyl(18, 19, 4, 16), mat('#c5cdd2'), 0, 2, 0);
  return g;
}

function paint(geo) {
  const p = geo.attributes.position;
  const col = new Float32Array(p.count * 3);
  const c = new THREE.Color();
  const red = new THREE.Color('#e23b32');
  const orange = new THREE.Color('#f09438');
  const blue = new THREE.Color('#7ec4dc');
  const sage = new THREE.Color('#b7d0c4');
  const cream = new THREE.Color('#f7f1e6');
  for (let i = 0; i < p.count; i += 3) {
    let y = 0;
    let ang = 0;
    for (let k = 0; k < 3; k++) {
      y += p.getY(i + k);
      ang += Math.atan2(p.getZ(i + k), p.getX(i + k));
    }
    y /= 3 * 144;
    ang /= 3;
    c.copy(red).lerp(orange, Math.min(1, y * 1.6));
    if (y > 0.42) c.lerp(blue, (y - 0.42) / 0.58);
    if (y > 0.62) c.lerp(sage, (y - 0.62) * 0.8);
    const pane = (Math.floor(ang * 9 + 8) + Math.floor(y * 42)) % 2 === 0;
    if (pane) c.multiplyScalar(0.78);
    else c.lerp(cream, 0.22);
    for (let k = 0; k < 3; k++) c.toArray(col, (i + k) * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.computeVertexNormals();
}
