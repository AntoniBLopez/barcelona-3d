import * as THREE from 'three';

const mats = new Map();
const boxes = new Map();
const cyls = new Map();
/** Materials whose emissiveIntensity tracks day/night (windows, trencadís glow). */
const glow = [];

export function mat(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  let m = mats.get(key);
  if (m) return m;
  m = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.88,
    metalness: 0,
    flatShading: true,
    ...opts,
  });
  if (opts.emissive) {
    m.userData.glow = opts.emissiveIntensity ?? 1;
    glow.push(m);
    m.emissiveIntensity = 0;
  }
  mats.set(key, m);
  return m;
}

export const WIN = mat('#243044', {
  emissive: '#ffb15a',
  emissiveIntensity: 2.3,
  roughness: 0.4,
  flatShading: false,
});

export const MOSAIC = new THREE.MeshStandardMaterial({
  vertexColors: true,
  roughness: 0.62,
  metalness: 0.04,
  flatShading: true,
});

/** A material whose opacity (LEDs) or emissive tracks the night amount. */
export function watchGlow(material, amount, asOpacity = false) {
  material.userData.glow = amount;
  material.userData.asOpacity = asOpacity;
  if (asOpacity) material.opacity = 0;
  else material.emissiveIntensity = 0;
  glow.push(material);
  return material;
}

/** Night amount from 0 (day) to 1. Window lights fade in with it. */
export function setGlow(k) {
  WIN.emissiveIntensity = 2.3 * k;
  for (const m of glow) {
    const v = m.userData.glow * k;
    if (m.userData.asOpacity) m.opacity = v;
    else m.emissiveIntensity = v;
  }
}

export function add(parent, geo, material, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.set(x, y, z);
  mesh.rotation.set(rx, ry, rz);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

export function box(w, h, d) {
  const k = `${w}|${h}|${d}`;
  if (!boxes.has(k)) boxes.set(k, new THREE.BoxGeometry(w, h, d));
  return boxes.get(k);
}

export function cyl(rt, rb, h, s = 8) {
  const k = `${rt}|${rb}|${h}|${s}`;
  if (!cyls.has(k)) {
    const g = new THREE.CylinderGeometry(rt, rb, h, s);
    if (s <= 8) {
      const n = g.toNonIndexed();
      n.computeVertexNormals();
      cyls.set(k, n);
    } else cyls.set(k, g);
  }
  return cyls.get(k);
}

export function cone(r, h, s = 7) {
  const g = new THREE.ConeGeometry(r, h, s).toNonIndexed();
  g.computeVertexNormals();
  return g;
}

/** Paint each triangle a colour from the list, trencadís-style. */
export function mosaic(geo, colors) {
  const g = geo.index ? geo.toNonIndexed() : geo.clone();
  const p = g.attributes.position;
  const col = new Float32Array(p.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < p.count; i += 3) {
    c.set(colors[(i / 3) % colors.length]);
    for (let k = 0; k < 3; k++) c.toArray(col, (i + k) * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}

export const TRENCA = ['#1f8a78', '#e7c04f', '#f4efe4', '#3d6fa6', '#d35a3a', '#7d6bb5', '#f2f6f4'];
export const TRENCA_COOL = ['#1f6fad', '#49b3c7', '#e7d15a', '#f4f7f2', '#2f8f6a', '#d9ecf2'];

export function checkerTexture(c1, c2, n = 8) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const s = 128 / n;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      ctx.fillStyle = (x + y) % 2 ? c1 : c2;
      ctx.fillRect(x * s, y * s, s, s);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
