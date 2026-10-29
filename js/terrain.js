import * as THREE from 'three';
import { CITY } from '../data/city.js';
import { MONUMENTS } from './monuments.js';
import { SIZE } from './fit.js';
import { R, project, unprojectDir, dirLL, placeOn, U_PER_M } from './geo.js';
import { mat } from './kit.js';

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
  // OSM coastline keeps land on the left of travel.
  let sea = cross < 0;
  if (inRings(lng, lat, CITY.port)) sea = true;
  const coastM = Math.sqrt(best);
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
  const radius = sea ? R - 0.04 : R + 0.1 + hill + (beach ? -0.04 : 0);
  let kind = 'city';
  if (sea) kind = 'sea';
  else if (beach) kind = 'beach';
  else if (park || mont > 0.35) kind = 'park';
  else if (tibi > 0.2 || ridgeW > 0.32 || ridgeE > 0.28) kind = 'forest';
  else if (lat > 41.372 && lat < 41.408 && lng > 2.142 && lng < 2.188) kind = 'eixample';
  return { sea, beach, park, kind, radius, coastM };
}

export function groundRadius(lat, lng) {
  return sampleGround(lat, lng).radius;
}

const PAL = {
  sea: new THREE.Color('#3e8f9c'),
  beach: new THREE.Color('#e7d3a2'),
  city: new THREE.Color('#cbb892'),
  eixample: new THREE.Color('#d8c4a2'),
  park: new THREE.Color('#6a9a48'),
  forest: new THREE.Color('#4f7d3e'),
};

function hash(i) {
  let h = Math.imul(i ^ 0x9e3779b9, 0x85ebca6b);
  h ^= h >>> 13;
  return (h >>> 0) / 4294967296;
}

/** The planet: sea, beach, Eixample plain, Montjuïc and Collserola. */
export function buildPlanet(world) {
  const src = new THREE.IcosahedronGeometry(1, 5).toNonIndexed();
  const pos = src.attributes.position;
  const col = new Float32Array(pos.count * 3);
  const v = new THREE.Vector3();
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i += 3) {
    const acc = new THREE.Vector3();
    for (let k = 0; k < 3; k++) acc.add(v.fromBufferAttribute(pos, i + k).normalize());
    acc.normalize();
    const geo = unprojectDir(acc);
    const info = sampleGround(geo.lat, geo.lng);
    c.copy(PAL[info.kind]).offsetHSL(0, 0, (hash(i) - 0.5) * 0.03);
    for (let k = 0; k < 3; k++) {
      v.fromBufferAttribute(pos, i + k).normalize().multiplyScalar(info.radius);
      pos.setXYZ(i + k, v.x, v.y, v.z);
      c.toArray(col, (i + k) * 3);
    }
  }
  src.setAttribute('color', new THREE.BufferAttribute(col, 3));
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

function nearPoly(lat, lng, line, limit) {
  if (!line) return false;
  const x = lng * M_LNG;
  const y = lat * M_LAT;
  for (let i = 0; i < line.length - 1; i++) {
    const ax = line[i][0] * M_LNG;
    const ay = line[i][1] * M_LAT;
    const bx = line[i + 1][0] * M_LNG;
    const by = line[i + 1][1] * M_LAT;
    const dx = bx - ax;
    const dy = by - ay;
    const l2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / l2));
    if (Math.hypot(x - ax - dx * t, y - ay - dy * t) < limit) return true;
  }
  return false;
}

/** Chamfered Cerdà blocks with a street and a sidewalk between them. */
export function buildEixample(world) {
  const axis = CITY.axes.granvia;
  const a = axis[0];
  const b = axis[axis.length - 1];
  const ang = Math.atan2((b[0] - a[0]) * M_LNG, (b[1] - a[1]) * M_LAT);
  const cos = Math.cos(ang);
  const sin = Math.sin(ang);
  const shape = new THREE.Shape();
  const c = 0.15;
  const pts = [[-0.5 + c, -0.5], [0.5 - c, -0.5], [0.5, -0.5 + c], [0.5, 0.5 - c], [0.5 - c, 0.5], [-0.5 + c, 0.5], [-0.5, 0.5 - c], [-0.5, -0.5 + c]];
  shape.moveTo(pts[0][0], pts[0][1]);
  pts.slice(1).forEach(([x, y]) => shape.lineTo(x, y));
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 1, bevelEnabled: false, curveSegments: 1 });
  geo.rotateX(-Math.PI / 2);
  geo.computeVertexNormals();
  const colors = ['#e7d7c0', '#d9c3a4', '#f1e6d4', '#c9b294', '#efe4d2'];
  const meshes = colors.map((color) => {
    const mesh = new THREE.InstancedMesh(geo, mat(color), 900);
    mesh.count = 0;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    world.add(mesh);
    return mesh;
  });
  const walk = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat('#8a8174'), 2200);
  const road = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat('#3c424c'), 2200);
  walk.count = 0;
  road.count = 0;
  world.add(walk, road);
  const step = 133;
  const block = 108 * U_PER_M;
  const dummy = new THREE.Object3D();
  const avenues = [CITY.axes.granvia, CITY.axes.diagonal, CITY.axes.gracia, CITY.axes.rambla];
  const cell = (east, north) => {
    const dx = east * cos + north * sin;
    const dy = -east * sin + north * cos;
    return { lat: 41.391 + dy / M_LAT, lng: 2.165 + dx / M_LNG };
  };
  const inside = (lat, lng) => lat >= 41.374 && lat <= 41.406 && lng >= 2.144 && lng <= 2.186
    && !(lat < 41.383 && lng > 2.16 && lng < 2.182);
  const arc = MONUMENTS.find((m) => m.id === 'arc');
  const arcKeep = (SIZE.arc?.[0] || 200) / 2 + 70;
  let n = 0;
  for (let ix = -16; ix <= 16; ix++) {
    for (let iy = -14; iy <= 14; iy++) {
      const { lat, lng } = cell(ix * step, iy * step);
      if (!inside(lat, lng)) continue;
      const gnd = sampleGround(lat, lng);
      if (gnd.sea || gnd.park || gnd.beach) continue;
      const byArch = Math.hypot((lat - arc.lat) * M_LAT, (lng - arc.lng) * M_LNG) < arcKeep;
      if (!byArch) pave(dummy, walk, road, cell, ix, iy, step, ang);
      if (blocked(lat, lng, avenues)) continue;
      const h = (16 + (Math.abs(ix * 7 + iy * 3) % 5) * 3) * U_PER_M;
      placeOn(dummy, lat, lng, gnd.radius, ang);
      dummy.scale.set(block, h, block);
      dummy.updateMatrix();
      const mesh = meshes[Math.abs(ix + iy * 3) % meshes.length];
      mesh.setMatrixAt(mesh.count++, dummy.matrix);
      n++;
    }
  }
  meshes.forEach((m) => { m.instanceMatrix.needsUpdate = true; });
  walk.instanceMatrix.needsUpdate = true;
  road.instanceMatrix.needsUpdate = true;
  return n;
}

function blocked(lat, lng, avenues) {
  for (const m of MONUMENTS) {
    const span = (SIZE[m.id]?.[0] || 30) / 2 + 14;
    if (Math.hypot((lat - m.lat) * M_LAT, (lng - m.lng) * M_LNG) < span) return true;
  }
  for (const line of avenues) if (nearPoly(lat, lng, line, 78)) return true;
  for (const line of CITY.tram.tracks) if (nearPoly(lat, lng, line, 16)) return true;
  return false;
}

function pave(dummy, walk, road, cell, ix, iy, step, ang) {
  const segs = [
    [ix * step, iy * step - step / 2, step, 22],
    [ix * step + step / 2, iy * step, 22, step],
  ];
  for (const [east, north, len, wid] of segs) {
    const { lat, lng } = cell(east, north);
    const gnd = sampleGround(lat, lng);
    if (gnd.sea || gnd.park || !lat) continue;
    placeOn(dummy, lat, lng, gnd.radius + 0.012, ang);
    dummy.scale.set(len * U_PER_M, 0.012, wid * U_PER_M);
    dummy.updateMatrix();
    walk.setMatrixAt(walk.count++, dummy.matrix);
    dummy.scale.set((len - 2) * U_PER_M, 0.02, (wid - 6) * U_PER_M);
    dummy.position.addScaledVector(dummy.userData.normal, 0.008);
    dummy.updateMatrix();
    road.setMatrixAt(road.count++, dummy.matrix);
  }
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
    placeOn(_treeDummy, lat, lng, gnd.radius + 0.08, 0);
    _treeDummy.scale.setScalar(0.28 + Math.random() * 0.2);
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
}
