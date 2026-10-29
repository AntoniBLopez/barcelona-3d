import * as THREE from 'three';
import { QUARTERS } from '../data/quarters.js';
import { MONUMENTS } from './monuments.js';
import { SIZE } from './fit.js';
import { placeOn, U_PER_M } from './geo.js';
import { groundRadius, sampleGround } from './terrain.js';
import { mat } from './kit.js';

const M_LAT = 111320;
const M_LNG = 111320 * Math.cos((41.3905 * Math.PI) / 180);
const dummy = new THREE.Object3D();
const side = new THREE.Vector3();

function inEixample(lat, lng) {
  return lat >= 41.374 && lat <= 41.406 && lng >= 2.144 && lng <= 2.186
    && !(lat < 41.383 && lng > 2.16 && lng < 2.182)
    && !(lat > 41.4002 && lng > 2.146 && lng < 2.166);
}

function reserved(lat, lng) {
  for (const m of MONUMENTS) {
    const span = (SIZE[m.id]?.[0] || 30) / 2 + 16;
    if (Math.hypot((lat - m.lat) * M_LAT, (lng - m.lng) * M_LNG) < span) return true;
  }
  return false;
}

function centroid(flat) {
  let lng = 0;
  let lat = 0;
  const n = flat.length / 2;
  for (let i = 0; i < flat.length; i += 2) { lng += flat[i]; lat += flat[i + 1]; }
  return [lng / n, lat / n];
}

/** Prism from an OSM footprint. Local +Y is up, +X east, +Z south. */
function prism(flat, height) {
  const [clng, clat] = centroid(flat);
  const contour = [];
  for (let i = 0; i < flat.length; i += 2) {
    const east = (flat[i] - clng) * M_LNG * U_PER_M;
    const north = (flat[i + 1] - clat) * M_LAT * U_PER_M;
    contour.push(new THREE.Vector2(east, -north));
  }
  const faces = THREE.ShapeUtils.triangulateShape(contour, []);
  if (!faces.length) return null;
  const n = contour.length;
  const h = height * U_PER_M;
  const pos = new Float32Array(n * 2 * 3);
  for (let i = 0; i < n; i++) {
    pos[i * 3] = contour[i].x;
    pos[i * 3 + 1] = 0;
    pos[i * 3 + 2] = contour[i].y;
    pos[(n + i) * 3] = contour[i].x;
    pos[(n + i) * 3 + 1] = h;
    pos[(n + i) * 3 + 2] = contour[i].y;
  }
  const idx = [];
  for (const f of faces) idx.push(f[0], f[2], f[1], n + f[0], n + f[1], n + f[2]);
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    idx.push(i, j, n + i, j, n + j, n + i);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setIndex(idx);
  dummy.scale.set(1, 1, 1);
  placeOn(dummy, clat, clng, groundRadius(clat, clng), 0);
  dummy.updateMatrix();
  geo.applyMatrix4(dummy.matrix);
  return geo;
}

function merge(geos) {
  let vc = 0;
  let ic = 0;
  for (const g of geos) {
    vc += g.attributes.position.count;
    ic += g.index.count;
  }
  const pos = new Float32Array(vc * 3);
  const idx = new Uint32Array(ic);
  let vo = 0;
  let io = 0;
  let base = 0;
  for (const g of geos) {
    pos.set(g.attributes.position.array, vo);
    const src = g.index.array;
    for (let k = 0; k < src.length; k++) idx[io + k] = src[k] + base;
    vo += g.attributes.position.count * 3;
    io += src.length;
    base += g.attributes.position.count;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  geo.computeVertexNormals();
  return geo;
}

function addRibbon(pos, idx, line, widthM, lift) {
  const half = (widthM * U_PER_M) / 2;
  const base = pos.length / 3;
  const frames = [];
  for (const [lng, lat] of line) {
    placeOn(dummy, lat, lng, groundRadius(lat, lng) + lift, 0);
    frames.push({ p: dummy.position.clone(), n: dummy.userData.normal.clone() });
  }
  for (let i = 0; i < frames.length; i++) {
    const prev = frames[Math.max(0, i - 1)].p;
    const next = frames[Math.min(frames.length - 1, i + 1)].p;
    side.crossVectors(frames[i].n, next.clone().sub(prev));
    if (side.lengthSq() < 1e-10) side.set(1, 0, 0);
    side.normalize();
    const left = frames[i].p.clone().addScaledVector(side, half);
    const right = frames[i].p.clone().addScaledVector(side, -half);
    pos.push(left.x, left.y, left.z, right.x, right.y, right.z);
  }
  for (let i = 0; i < frames.length - 1; i++) {
    const a = base + i * 2;
    idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
}

const TINT = {
  ciutat: ['#e7d4ba', '#dcc7a8'],
  barceloneta: ['#f4e7d0', '#ead9b8'],
  gracia: ['#efe0c8', '#e4d2b6'],
};

/** Real OSM blocks and streets for Ciutat Vella, Barceloneta and Gràcia. */
export function buildQuarters(world) {
  const roads = [];
  const roadIdx = [];
  for (const [name, data] of Object.entries(QUARTERS)) {
    const buckets = [[], []];
    for (const [h, flat] of data.buildings) {
      const [lng, lat] = centroid(flat);
      const gnd = sampleGround(lat, lng);
      if (gnd.sea || gnd.park || gnd.beach || inEixample(lat, lng) || reserved(lat, lng)) continue;
      const geo = prism(flat, h);
      if (geo) buckets[h % 2].push(geo);
    }
    TINT[name].forEach((color, i) => {
      if (!buckets[i].length) return;
      const mesh = new THREE.Mesh(merge(buckets[i]), mat(color));
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      world.add(mesh);
    });
    for (const [width, lines] of Object.entries(data.streets)) {
      for (const line of lines) {
        const mid = line[line.length >> 1];
        if (inEixample(mid[1], mid[0])) continue;
        addRibbon(roads, roadIdx, line, Number(width) * 0.72, 0.028);
      }
    }
  }
  if (!roads.length) return;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(roads, 3));
  geo.setIndex(roadIdx);
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, mat('#3e4450'));
  mesh.receiveShadow = true;
  world.add(mesh);
}
