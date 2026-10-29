import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { CITY } from '../data/city.js';
import { R, unprojectDir, placeOn, RELIEF, OLAT, OLNG, DEG_PER_M } from './geo.js';
import { mat } from './kit.js';
import { buildDistricts } from './districts.js';
import { buildFabric } from './fabric.js';

const M_LAT = 111320;
const M_LNG = 111320 * Math.cos((41.3905 * Math.PI) / 180);

const coastSegs = [];
for (const line of [CITY.coast, ...CITY.coastExtra]) {
  for (let i = 0; i < line.length - 1; i++) coastSegs.push([line[i], line[i + 1]]);
}

// Distance along the main shoreline, so a pier's local tangent doesn't flip the land.
const shore = CITY.coast;
const shoreCum = [0];
for (let i = 1; i < shore.length; i++) {
  const a = shore[i - 1];
  const b = shore[i];
  shoreCum.push(shoreCum[i - 1] + Math.hypot((b[0] - a[0]) * M_LNG, (b[1] - a[1]) * M_LAT));
}

function shoreAt(dist) {
  const target = Math.max(0, Math.min(shoreCum[shoreCum.length - 1], dist));
  let lo = 0;
  let hi = shoreCum.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (shoreCum[mid] < target) lo = mid;
    else hi = mid;
  }
  const span = shoreCum[lo + 1] - shoreCum[lo] || 1;
  const t = (target - shoreCum[lo]) / span;
  const a = shore[lo];
  const b = shore[Math.min(shore.length - 1, lo + 1)];
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

function segDist2(lng, lat, seg) {
  const ax = seg[0][0] * M_LNG;
  const ay = seg[0][1] * M_LAT;
  const bx = seg[1][0] * M_LNG;
  const by = seg[1][1] * M_LAT;
  const px = lng * M_LNG;
  const py = lat * M_LAT;
  const dx = bx - ax;
  const dy = by - ay;
  const len = dx * dx + dy * dy || 1e-6;
  let t = ((px - ax) * dx + (py - ay) * dy) / len;
  t = Math.max(0, Math.min(1, t));
  const qx = ax + dx * t - px;
  const qy = ay + dy * t - py;
  return qx * qx + qy * qy;
}

function inside(lng, lat, ring) {
  let c = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi || 1e-12) + xi) c = !c;
  }
  return c;
}

function inRings(lng, lat, rings) {
  return rings.some((ring) => ring.length > 2 && inside(lng, lat, ring));
}

function gauss(lat, lng, clat, clng, sigma) {
  const dx = (lng - clng) * M_LNG;
  const dy = (lat - clat) * M_LAT;
  return Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
}

/** Land cover and radius at a real-world coordinate. */
export function sampleGround(lat, lng) {
  let best = Infinity;
  let seg = coastSegs[0];
  for (const s of coastSegs) {
    const d = segDist2(lng, lat, s);
    if (d < best) { best = d; seg = s; }
  }
  // Side of a tangent smoothed over ~550 m, so harbour jogs don't swallow the Eixample.
  let nearI = 0;
  let nearD = Infinity;
  for (let i = 0; i < shore.length; i++) {
    const dx = (lng - shore[i][0]) * M_LNG;
    const dy = (lat - shore[i][1]) * M_LAT;
    const d = dx * dx + dy * dy;
    if (d < nearD) { nearD = d; nearI = i; }
  }
  const back = shoreAt(shoreCum[nearI] - 550);
  const fwd = shoreAt(shoreCum[nearI] + 550);
  const anchor = shore[nearI];
  const cross = (fwd[0] - back[0]) * (lat - anchor[1]) - (fwd[1] - back[1]) * (lng - anchor[0]);
  const coastM = Math.sqrt(best);
  // Only a strip of water along the coast. The open sea does not fill the globe.
  let sea = cross < 0 && coastM < 680;
  if (inRings(lng, lat, CITY.port)) sea = true;
  // The port polygon folds back over the beach. Keep the landward shore dry.
  if (sea && cross >= 0 && coastM < 160) sea = false;
  const beach = !sea && coastM < 120 && lng > 2.183 && lat > 41.368 && lat < 41.41;
  const park = !sea && (
    inRings(lng, lat, CITY.parks.ciutadella)
    || inRings(lng, lat, CITY.parks.montjuic)
    || inRings(lng, lat, CITY.parks.guell)
  );
  const mont = gauss(lat, lng, 41.3636, 2.1585, 900);
  const tibi = gauss(lat, lng, 41.4221, 2.1188, 1050);
  const ridgeW = gauss(lat, lng, 41.432, 2.075, 2400);
  const ridgeE = gauss(lat, lng, 41.416, 2.148, 1700);
  const carmel = gauss(lat, lng, 41.4188, 2.157, 700);
  const ridge = Math.max(tibi * 1.18, ridgeW * 0.7, ridgeE * 0.58);
  const hill = mont * 0.42 + ridge + carmel * 0.26;
  const farM = Math.hypot((lng - OLNG) * M_LNG, (lat - OLAT) * M_LAT);
  const rise = 1.4;
  const radius = sea ? R - 0.045 * rise : R + 0.1 * rise + hill * rise + (beach ? -0.04 * rise : 0);
  let kind = 'city';
  if (sea) kind = 'sea';
  else if (beach) kind = 'beach';
  else if (park || mont > 0.35) kind = 'park';
  else if (tibi > 0.34 || ridgeW > 0.4 || (ridgeE > 0.48 && lat > 41.416) || (farM > 8000 && lat > 41.43)) kind = 'forest';
  else if (lat > 41.372 && lat < 41.408 && lng > 2.142 && lng < 2.188) kind = 'eixample';
  else if (lat < 41.342 && lng < 2.15 && lng > 2.05) kind = 'delta';
  return { sea, beach, park, kind, radius, coastM };
}

export function groundRadius(lat, lng) {
  return sampleGround(lat, lng).radius;
}

/** True when the point and a small ring around it are out of the sea. */
export function onLand(lat, lng, margin = 40) {
  const dLat = margin / M_LAT;
  const dLng = margin / M_LNG;
  for (const [la, ln] of [
    [lat, lng],
    [lat + dLat, lng],
    [lat - dLat, lng],
    [lat, lng + dLng],
    [lat, lng - dLng],
  ]) {
    if (sampleGround(la, ln).sea) return false;
  }
  return true;
}

const PAL = {
  sea: new THREE.Color('#3e8f9c'),
  beach: new THREE.Color('#e7d3a2'),
  city: new THREE.Color('#cbb892'),
  eixample: new THREE.Color('#d8c4a2'),
  park: new THREE.Color('#6a9a48'),
  forest: new THREE.Color('#4f7d3e'),
  delta: new THREE.Color('#c5d392'),
};

function hash(i) {
  let h = Math.imul(i ^ 0x9e3779b9, 0x85ebca6b);
  h ^= h >>> 13;
  return (h >>> 0) / 4294967296;
}

function edgeKey(a, b) {
  return a < b ? `${a},${b}` : `${b},${a}`;
}

/** Split a triangle on the edges present in `mark`, keeping the outward winding. */
function splitTri([a, b, c], mark, mid) {
  const ab = mark.has(edgeKey(a, b)) ? mid(a, b) : -1;
  const bc = mark.has(edgeKey(b, c)) ? mid(b, c) : -1;
  const ca = mark.has(edgeKey(c, a)) ? mid(c, a) : -1;
  const n = (ab >= 0) + (bc >= 0) + (ca >= 0);
  if (n === 0) return [[a, b, c]];
  if (n === 3) return [[a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]];
  if (n === 1) {
    if (ab >= 0) return [[a, ab, c], [ab, b, c]];
    if (bc >= 0) return [[a, b, bc], [a, bc, c]];
    return [[a, b, ca], [b, c, ca]];
  }
  if (ab < 0) return [[c, ca, bc], [ca, a, bc], [a, b, bc]];
  if (bc < 0) return [[a, ab, ca], [ab, b, ca], [b, c, ca]];
  return [[b, bc, ab], [bc, c, ab], [c, a, ab]];
}

/**
 * The planet, coarse inland and fine along the OSM coast.
 * A triangle is one colour, so a 700 m face was painting the port over the quays.
 */
export function buildPlanet(world) {
  const base = mergeVertices(new THREE.IcosahedronGeometry(1, 6).toNonIndexed());
  const basePos = base.attributes.position;
  const baseIdx = base.index.array;
  const verts = [];
  const cache = [];
  for (let i = 0; i < basePos.count; i++) {
    verts.push(new THREE.Vector3().fromBufferAttribute(basePos, i).normalize());
    cache.push(null);
  }
  let tris = [];
  for (let i = 0; i < baseIdx.length; i += 3) tris.push([baseIdx[i], baseIdx[i + 1], baseIdx[i + 2]]);
  const infoAt = (i) => {
    if (!cache[i]) {
      const g = unprojectDir(verts[i]);
      cache[i] = sampleGround(g.lat, g.lng);
    }
    return cache[i];
  };
  // About 22 m. Streets and blocks then sit on the same side of the shore as the mesh.
  const target = 22 * DEG_PER_M * (Math.PI / 180);
  for (let pass = 0; pass < 6 && tris.length < 140000; pass++) {
    const mark = new Set();
    let any = false;
    for (const [a, b, c] of tris) {
      const ang = Math.max(verts[a].angleTo(verts[b]), verts[b].angleTo(verts[c]), verts[c].angleTo(verts[a]));
      if (ang <= target) continue;
      const ia = infoAt(a);
      const ib = infoAt(b);
      const ic = infoAt(c);
      const mixed = ia.sea !== ib.sea || ib.sea !== ic.sea;
      const coastal = Math.min(ia.coastM, ib.coastM, ic.coastM) < 260;
      if (!mixed && !coastal) continue;
      any = true;
      mark.add(edgeKey(a, b));
      mark.add(edgeKey(b, c));
      mark.add(edgeKey(c, a));
    }
    if (!any) break;
    const mids = new Map();
    const mid = (a, b) => {
      const k = edgeKey(a, b);
      if (mids.has(k)) return mids.get(k);
      const id = verts.length;
      verts.push(verts[a].clone().add(verts[b]).normalize());
      cache.push(null);
      mids.set(k, id);
      return id;
    };
    const next = [];
    for (const tri of tris) next.push(...splitTri(tri, mark, mid));
    tris = next;
  }
  base.dispose();

  const positions = new Float32Array(tris.length * 9);
  const colors = new Float32Array(tris.length * 9);
  const c = new THREE.Color();
  let o = 0;
  for (const tri of tris) {
    for (const id of tri) {
      const info = infoAt(id);
      const p = verts[id].clone().multiplyScalar(info.radius);
      positions[o] = p.x;
      positions[o + 1] = p.y;
      positions[o + 2] = p.z;
      c.copy(PAL[info.kind]).offsetHSL(0, 0, (hash(id) - 0.5) * 0.03);
      c.toArray(colors, o);
      o += 3;
    }
  }
  const src = new THREE.BufferGeometry();
  src.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  src.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  src.computeVertexNormals();
  const land = new THREE.Mesh(src, new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.96, metalness: 0, flatShading: true,
  }));
  land.receiveShadow = true;
  land.castShadow = true;
  world.add(land);

  const water = new THREE.Mesh(
    new THREE.SphereGeometry(R + 0.01, 48, 32),
    new THREE.MeshStandardMaterial({
      color: '#4aa8b2', roughness: 0.18, metalness: 0.08, transparent: true, opacity: 0.9,
    }),
  );
  water.receiveShadow = true;
  world.add(water);
  return { land, water };
}

const _treeDummy = new THREE.Object3D();

function scatter(world, rings, count, tint) {
  const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.02, 0.028, 0.16, 5), mat('#6b4a32'), count);
  const crown = new THREE.InstancedMesh(new THREE.SphereGeometry(0.07, 6, 5), mat(tint), count);
  trunk.count = 0;
  crown.count = 0;
  let guard = 0;
  while (trunk.count < count && guard < count * 40) {
    guard++;
    const ring = rings[guard % rings.length];
    if (!ring || ring.length < 3) continue;
    let minX = 180, maxX = -180, minY = 90, maxY = -90;
    ring.forEach(([x, y]) => { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); });
    const lng = minX + Math.random() * (maxX - minX);
    const lat = minY + Math.random() * (maxY - minY);
    if (!inside(lng, lat, ring)) continue;
    const gnd = sampleGround(lat, lng);
    if (gnd.sea) continue;
    placeOn(_treeDummy, lat, lng, gnd.radius + 0.08 * RELIEF, 0);
    _treeDummy.scale.setScalar((0.28 + Math.random() * 0.2) * RELIEF);
    _treeDummy.updateMatrix();
    trunk.setMatrixAt(trunk.count, _treeDummy.matrix);
    _treeDummy.position.addScaledVector(_treeDummy.userData.normal, 0.12 * _treeDummy.scale.x);
    _treeDummy.updateMatrix();
    crown.setMatrixAt(crown.count, _treeDummy.matrix);
    trunk.count++;
    crown.count++;
  }
  trunk.instanceMatrix.needsUpdate = true;
  crown.instanceMatrix.needsUpdate = true;
  world.add(trunk, crown);
}

export function buildTrees(world) {
  scatter(world, CITY.parks.ciutadella, 40, '#3f7a35');
  scatter(world, CITY.parks.montjuic, 70, '#5d8a40');
  scatter(world, CITY.parks.guell, 36, '#6a9a48');
  buildDistricts(world);
  buildFabric(world);
}

export { buildEixample } from './eixample.js';
