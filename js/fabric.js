import * as THREE from 'three';
import { FABRIC } from '../data/fabric.js';
import { MONUMENTS } from './monuments.js';
import { SIZE, BOOST } from './fit.js';
import { CITY } from '../data/city.js';
import { inEixampleGrid } from './eixample.js';
import { placeOn, U_PER_M } from './geo.js';
import { groundRadius, sampleGround, onLand } from './terrain.js';
import { mat } from './kit.js';

const M_LAT = 111320;
const M_LNG = 111320 * Math.cos((41.3905 * Math.PI) / 180);
const DIAG_MARGIN = 34;
const dummy = new THREE.Object3D();
const side = new THREE.Vector3();

const DIAG = CITY.axes.diagonal.map(([lng, lat]) => [lng * M_LNG, lat * M_LAT]);

function insideRing(lng, lat, ring) {
  let c = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / ((yj - yi) || 1e-12) + xi) c = !c;
  }
  return c;
}

export function inCity(lat, lng) {
  return insideRing(lng, lat, FABRIC.city);
}

/** Metres outside the municipal outline. Zero on the city side. */
export function cityDistance(lat, lng) {
  if (inCity(lat, lng)) return 0;
  const x = lng * M_LNG;
  const y = lat * M_LAT;
  const ring = FABRIC.city;
  let best = Infinity;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    const ax = a[0] * M_LNG;
    const ay = a[1] * M_LAT;
    const bx = b[0] * M_LNG;
    const by = b[1] * M_LAT;
    const dx = bx - ax;
    const dy = by - ay;
    const l2 = dx * dx + dy * dy || 1;
    let t = ((x - ax) * dx + (y - ay) * dy) / l2;
    t = Math.max(0, Math.min(1, t));
    best = Math.min(best, Math.hypot(x - ax - dx * t, y - ay - dy * t));
  }
  return best;
}

function nearestDiag(x, y) {
  let best = Infinity;
  let sd = 0;
  let nx = 0;
  let ny = 1;
  let fx = x;
  let fy = y;
  for (let i = 0; i < DIAG.length - 1; i++) {
    const ax = DIAG[i][0];
    const ay = DIAG[i][1];
    const bx = DIAG[i + 1][0];
    const by = DIAG[i + 1][1];
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy || 1;
    const len = Math.sqrt(len2);
    let t = ((x - ax) * dx + (y - ay) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const qx = ax + dx * t;
    const qy = ay + dy * t;
    const d = Math.hypot(x - qx, y - qy);
    if (d < best) {
      best = d;
      nx = -dy / len;
      ny = dx / len;
      sd = (x - ax) * nx + (y - ay) * ny;
      fx = qx;
      fy = qy;
    }
  }
  return { d: best, sd, nx, ny, fx, fy };
}

export function nearDiagonal(lat, lng, limit) {
  return nearestDiag(lng * M_LNG, lat * M_LAT).d < limit;
}

/**
 * Buildings that meet the Diagonal become one trapezoid: the long edge sits
 * on the sidewalk, the corners are chamfered, and nothing crosses the median.
 */
function clipDiagonal(flat) {
  const poly = [];
  for (let i = 0; i < flat.length; i += 2) poly.push([flat[i] * M_LNG, flat[i + 1] * M_LAT]);
  let cx = 0;
  let cy = 0;
  for (const p of poly) { cx += p[0]; cy += p[1]; }
  cx /= poly.length;
  cy /= poly.length;
  const info = nearestDiag(cx, cy);
  let minD = info.d;
  for (const p of poly) minD = Math.min(minD, nearestDiag(p[0], p[1]).d);
  if (minD > 72) return flat;
  if (Math.abs(info.sd) < 16 || minD < 12) return null;
  const sign = info.sd >= 0 ? 1 : -1;
  const nx = info.nx * sign;
  const ny = info.ny * sign;
  const ux = ny;
  const uy = -nx;
  const base = info.fx * nx + info.fy * ny + DIAG_MARGIN;
  let minU = Infinity;
  let maxU = -Infinity;
  let far = base;
  for (const [x, y] of poly) {
    const n = x * nx + y * ny;
    if (n < base - 0.5) continue;
    const u = x * ux + y * uy;
    minU = Math.min(minU, u);
    maxU = Math.max(maxU, u);
    far = Math.max(far, n);
  }
  const depth = Math.min(48, far - base);
  let u0 = minU + 2.5;
  let u1 = maxU - 2.5;
  if (!(depth >= 14) || !(u1 - u0 >= 14)) return null;
  if (u1 - u0 > 78) {
    const mid = (u0 + u1) / 2;
    u0 = mid - 39;
    u1 = mid + 39;
  }
  const cham = Math.min(9, (u1 - u0) * 0.16, depth * 0.28);
  const n0 = base;
  const n1 = base + depth;
  const local = [
    [u0 + cham, n0],
    [u1 - cham, n0],
    [u1, n0 + cham],
    [u1, n1],
    [u0, n1],
    [u0, n0 + cham],
  ];
  const out = [];
  for (const [u, n] of local) {
    const x = ux * u + nx * n;
    const y = uy * u + ny * n;
    out.push(x / M_LNG, y / M_LAT);
  }
  return out;
}

function centroid(flat) {
  let lng = 0;
  let lat = 0;
  const n = flat.length / 2;
  for (let i = 0; i < flat.length; i += 2) { lng += flat[i]; lat += flat[i + 1]; }
  return [lng / n, lat / n];
}

function reserved(lat, lng) {
  for (const m of MONUMENTS) {
    const span = ((SIZE[m.id]?.[0] || 30) * (BOOST[m.id] || 1.5)) / 2 + 22;
    if (Math.hypot((lat - m.lat) * M_LAT, (lng - m.lng) * M_LNG) < span) return true;
  }
  return false;
}

function footprint(flat) {
  let a = 0;
  for (let i = 0; i < flat.length; i += 2) {
    const j = (i + 2) % flat.length;
    a += flat[i] * flat[j + 1] - flat[j] * flat[i + 1];
  }
  return Math.abs(a) * 0.5 * M_LNG * M_LAT;
}

function wetFoot(flat, coastM) {
  if (coastM > 90) return false;
  for (let i = 0; i < flat.length; i += 2) {
    if (sampleGround(flat[i + 1], flat[i]).sea) return true;
  }
  return false;
}

function prism(flat, height) {
  const [clng, clat] = centroid(flat);
  const contour = [];
  for (let i = 0; i < flat.length; i += 2) {
    const east = (flat[i] - clng) * M_LNG * U_PER_M;
    const north = (flat[i + 1] - clat) * M_LAT * U_PER_M;
    contour.push(new THREE.Vector2(east, -north));
  }
  let faces;
  try { faces = THREE.ShapeUtils.triangulateShape(contour, []); }
  catch { return null; }
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
    pos.push(
      ...frames[i].p.clone().addScaledVector(side, half).toArray(),
      ...frames[i].p.clone().addScaledVector(side, -half).toArray(),
    );
  }
  for (let i = 0; i < frames.length - 1; i++) {
    const aPt = line[i];
    const bPt = line[i + 1];
    const midLat = (aPt[1] + bPt[1]) / 2;
    const midLng = (aPt[0] + bPt[0]) / 2;
    const gnd = sampleGround(midLat, midLng);
    if (gnd.sea || gnd.kind === 'forest') continue;
    if (gnd.coastM < 80 && (!onLand(aPt[1], aPt[0], 12) || !onLand(bPt[1], bPt[0], 12) || !onLand(midLat, midLng, 12))) continue;
    if (inEixampleGrid(midLat, midLng)) continue;
    if (nearDiagonal(midLat, midLng, 30)) continue;
    if (!inCity(midLat, midLng) && cityDistance(midLat, midLng) > 70) continue;
    const a = base + i * 2;
    idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
}
const TINT = ['#e6d3ba', '#dcc6a4', '#f1e3cc', '#cbb496'];
function inQuarter(lat, lng) {
  const grid = lat >= 41.374 && lat <= 41.406 && lng >= 2.144 && lng <= 2.186 && !(lat < 41.383 && lng > 2.16 && lng < 2.182) && !(lat > 41.4002 && lng > 2.146 && lng < 2.166);
  if (grid) return false;
  return (lat > 41.371 && lat < 41.389 && lng > 2.162 && lng < 2.185) || (lat > 41.372 && lat < 41.386 && lng > 2.181 && lng < 2.196) || (lat > 41.397 && lat < 41.413 && lng > 2.144 && lng < 2.168);
}

export function buildFabric(world) {
  const buckets = [[], [], [], []];
  let kept = 0;
  for (const row of FABRIC.buildings) {
    const h = row[0];
    let flat = row.slice(1);
    if (flat.length < 6 || footprint(flat) < 900) continue;
    let [lng, lat] = centroid(flat);
    if (!inCity(lat, lng) || inEixampleGrid(lat, lng) || inQuarter(lat, lng) || reserved(lat, lng)) continue;
    const gnd = sampleGround(lat, lng);
    if (gnd.sea || gnd.park || gnd.beach || gnd.kind === 'forest' || gnd.kind === 'delta') continue;
    if (wetFoot(flat, gnd.coastM)) continue;
    flat = clipDiagonal(flat);
    if (!flat) continue;
    [lng, lat] = centroid(flat);
    if (reserved(lat, lng)) continue;
    const geo = prism(flat, h);
    if (!geo) continue;
    buckets[kept % 4].push(geo);
    kept++;
  }
  TINT.forEach((color, i) => {
    if (!buckets[i].length) return;
    const mesh = new THREE.Mesh(merge(buckets[i]), mat(color));
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    world.add(mesh);
  });

  const roads = [];
  const roadIdx = [];
  for (const row of FABRIC.streets) {
    const width = row[0];
    const line = [];
    for (let i = 1; i < row.length; i += 2) line.push([row[i], row[i + 1]]);
    if (line.length < 2) continue;
    const mid = line[line.length >> 1];
    if (!inCity(mid[1], mid[0]) && cityDistance(mid[1], mid[0]) > 90) continue;
    if (width < 14) continue;
    addRibbon(roads, roadIdx, line, Math.max(width * 1.8, 26), 0.03);
  }
  const pave = (pos, idx, color) => {
    if (!idx.length) return;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, mat(color));
    mesh.receiveShadow = true;
    world.add(mesh);
  };
  pave(roads, roadIdx, '#efe6d4');
}
