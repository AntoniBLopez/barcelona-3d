import * as THREE from 'three';
import { CITY } from '../data/city.js';
import { project, dirLL, placeOn, U_PER_M, RELIEF } from './geo.js';
import { GAUDI_AVE } from './fit.js';
import { groundRadius, onLand } from './terrain.js';
import { add, box, cyl, mat, WIN } from './kit.js';

function framesOf(points, lift) {
  const out = [];
  for (const [lng, lat] of points) {
    const sph = project(lat, lng);
    const n = dirLL(sph.lat, sph.lon);
    const r = groundRadius(lat, lng) + lift;
    out.push({ n, p: n.clone().multiplyScalar(r), lat, lng });
  }
  return out;
}

/** A ribbon lying on the sphere. `points` are [lng, lat] pairs. */
export function ribbon(points, widthM, lift, color, opts = {}) {
  if (!points || points.length < 2) return null;
  const { water, ...look } = opts;
  const frames = framesOf(hug(points), lift);
  const half = (widthM * U_PER_M) / 2;
  const pos = [];
  const idx = [];
  for (let i = 0; i < frames.length; i++) {
    const prev = frames[Math.max(0, i - 1)].p;
    const next = frames[Math.min(frames.length - 1, i + 1)].p;
    const side = new THREE.Vector3().crossVectors(frames[i].n, next.clone().sub(prev));
    if (side.lengthSq() < 1e-8) side.set(1, 0, 0);
    side.normalize();
    const left = frames[i].p.clone().addScaledVector(side, half);
    const right = frames[i].p.clone().addScaledVector(side, -half);
    pos.push(left.x, left.y, left.z, right.x, right.y, right.z);
  }
  for (let i = 0; i < frames.length - 1; i++) {
    if (!water && !spanDry(frames[i], frames[i + 1])) continue;
    const a = i * 2;
    idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, mat(color, look));
  mesh.receiveShadow = true;
  return mesh;
}

function spanDry(a, b) {
  const midLat = (a.lat + b.lat) / 2;
  const midLng = (a.lng + b.lng) / 2;
  return onLand(a.lat, a.lng) && onLand(b.lat, b.lng) && onLand(midLat, midLng);
}

export function buildStreets(world) {
  const group = new THREE.Group();
  const specs = [
    [CITY.axes.rambla, 28, '#c4b08a'],
    [CITY.axes.poblenou, 24, '#c4b08a'],
  ];
  for (const [line, width, color] of specs) {
    // Stop La Rambla short of the Columbus column so the promenade doesn't cut the base.
    const pts = line === CITY.axes.rambla ? [line[0], [2.17481, 41.37933]] : line;
    const mesh = ribbon(pts, width, 0.035, color);
    if (mesh) group.add(mesh);
  }
  const avenue = ribbon(GAUDI_AVE, 34, 0.05, '#e6dcc8');
  const median = ribbon(GAUDI_AVE, 10, 0.062, '#5e8f46');
  if (avenue) group.add(avenue);
  if (median) group.add(median);
  for (const line of [CITY.rivers.besos, CITY.rivers.llobregat]) {
    const mesh = ribbon(line, 90, 0.02, '#3d86a8', { roughness: 0.35, metalness: 0.05, water: true });
    if (mesh) group.add(mesh);
  }
  world.add(group);
  return group;
}

export function buildTramTracks(world) {
  const group = new THREE.Group();
  group.name = 'tram-tracks';
  for (const line of CITY.tram.tracks) {
    const mid = line[Math.floor(line.length / 2)];
    if (onDiagonal(mid[1], mid[0])) continue;
    const mesh = ribbon(line, 7, 0.055, CITY.tram.color, { roughness: 0.7 });
    if (mesh) group.add(mesh);
  }
  world.add(group);
  return group;
}

function makeTram() {
  const g = new THREE.Group();
  const s = U_PER_M;
  add(g, box(4.2 * s, 3.4 * s, 40 * s), mat('#f4f6f4'), 0, 2.4 * s, 0);
  add(g, box(3.8 * s, 1.3 * s, 30 * s), WIN, 0, 3.1 * s, 0);
  add(g, box(4.4 * s, 0.8 * s, 40 * s), mat('#0c7d68'), 0, 0.7 * s, 0);
  add(g, box(0.25 * s, 0.8 * s, 0.25 * s), mat('#2a2e33'), 0, 4.2 * s, -5 * s);
  return g;
}

function pathFrames(points) {
  const frames = [];
  for (let i = 0; i < points.length; i++) {
    const [lng, lat] = points[i];
    const nxt = points[Math.min(points.length - 1, i + 1)];
    const prv = points[Math.max(0, i - 1)];
    frames.push({ lat, lng, nlat: nxt[1], nlng: nxt[0], plat: prv[1], plng: prv[0] });
  }
  return frames;
}

const M_LAT = 111320;
const M_LNG = 111320 * Math.cos((41.3905 * Math.PI) / 180);

function onDiagonal(lat, lng) {
  const x = lng * M_LNG;
  const y = lat * M_LAT;
  const line = CITY.axes.diagonal;
  for (let i = 0; i < line.length - 1; i++) {
    const ax = line[i][0] * M_LNG;
    const ay = line[i][1] * M_LAT;
    const bx = line[i + 1][0] * M_LNG;
    const by = line[i + 1][1] * M_LAT;
    const dx = bx - ax;
    const dy = by - ay;
    const l2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / l2));
    if (Math.hypot(x - ax - dx * t, y - ay - dy * t) < 28) return true;
  }
  return false;
}

function shiftLine(line, meters) {
  return line.map((p, i) => {
    const a = line[Math.max(0, i - 1)];
    const b = line[Math.min(line.length - 1, i + 1)];
    const dx = (b[0] - a[0]) * M_LNG;
    const dy = (b[1] - a[1]) * M_LAT;
    const len = Math.hypot(dx, dy) || 1;
    return [p[0] + (-dy / len) * meters / M_LNG, p[1] + (dx / len) * meters / M_LAT];
  });
}

function hug(points) {
  const out = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const n = Math.max(1, Math.ceil(Math.hypot((b[0] - a[0]) * M_LNG, (b[1] - a[1]) * M_LAT) / 160));
    for (let k = 1; k <= n; k++) out.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]);
  }
  return out;
}

function resample(line, step) {
  const out = [line[0]];
  let carry = step;
  for (let i = 1; i < line.length; i++) {
    const dx = (line[i][0] - line[i - 1][0]) * M_LNG;
    const dy = (line[i][1] - line[i - 1][1]) * M_LAT;
    const len = Math.hypot(dx, dy) || 1;
    let dist = carry;
    while (dist <= len) {
      const t = dist / len;
      out.push([
        line[i - 1][0] + (line[i][0] - line[i - 1][0]) * t,
        line[i - 1][1] + (line[i][1] - line[i - 1][1]) * t,
      ]);
      dist += step;
    }
    carry = dist - len;
  }
  out.push(line[line.length - 1]);
  return out;
}

export function buildTrams(world) {
  const forward = resample(CITY.axes.diagonal, 80);
  const back = forward.slice().reverse();
  const plan = [
    ['T1', shiftLine(forward, -2), 0.04],
    ['T1', shiftLine(forward, -2), 0.28],
    ['T1', shiftLine(forward, -2), 0.55],
    ['T1', shiftLine(forward, -2), 0.82],
    ['T2', shiftLine(back, 2), 0.16],
    ['T2', shiftLine(back, 2), 0.46],
    ['T2', shiftLine(back, 2), 0.73],
    ['T4', shiftLine(forward, 2), 0.1],
    ['T4', shiftLine(forward, 2), 0.37],
    ['T4', shiftLine(forward, 2), 0.64],
    ['T4', shiftLine(forward, 2), 0.9],
  ];
  const trams = [];
  plan.forEach(([ref, path, t], index) => {
    const rig = makeTram();
    rig.userData.kind = 'tram';
    rig.userData.tram = index;
    rig.traverse((o) => {
      if (o.isMesh) {
        o.userData.kind = 'tram';
        o.userData.tram = index;
      }
    });
    world.add(rig);
    trams.push({ rig, frames: pathFrames(path), ref, t });
  });
  return trams;
}

const _dummy = new THREE.Object3D();

export function stepTrams(trams, dt) {
  for (const tram of trams) {
    const frames = tram.frames;
    if (frames.length < 2) continue;
    tram.t = (tram.t + dt * 0.045) % 1;
    const f = tram.t * (frames.length - 1);
    const i = Math.floor(f);
    const k = f - i;
    const a = frames[i];
    const b = frames[Math.min(frames.length - 1, i + 1)];
    const lat = a.lat + (b.lat - a.lat) * k;
    const lng = a.lng + (b.lng - a.lng) * k;
    placeOn(tram.rig, lat, lng, groundRadius(lat, lng) + 0.09, 0);
    const ahead = dirLL(project(b.lat, b.lng).lat, project(b.lat, b.lng).lon);
    const dir = ahead.sub(tram.rig.userData.normal.clone().multiplyScalar(ahead.dot(tram.rig.userData.normal)));
    const yaw = Math.atan2(dir.dot(tram.rig.userData.east), dir.dot(tram.rig.userData.south));
    tram.rig.rotateY(yaw);
    tram.rig.userData.lat = lat;
    tram.rig.userData.lng = lng;
  }
}

export function buildMetro(world) {
  const n = CITY.metro.entrances.length;
  const geo = new THREE.CylinderGeometry(0.028, 0.028, 0.07, 6);
  const mesh = new THREE.InstancedMesh(geo, mat('#ffffff', { roughness: 0.5 }), Math.max(1, n));
  mesh.count = n;
  mesh.visible = false;
  const color = new THREE.Color();
  CITY.metro.entrances.forEach((e, i) => {
    const gnd = groundRadius(e[1], e[0]);
    placeOn(_dummy, e[1], e[0], gnd + 0.05 * RELIEF, 0);
    _dummy.scale.setScalar(RELIEF);
    _dummy.updateMatrix();
    mesh.setMatrixAt(i, _dummy.matrix);
    color.set(CITY.metro.colors[e[2]] || '#9aa3ad');
    mesh.setColorAt(i, color);
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  world.add(mesh);

  const stations = new THREE.InstancedMesh(
    new THREE.OctahedronGeometry(0.055, 0),
    mat('#ffffff', { roughness: 0.4 }),
    Math.max(1, CITY.metro.stations.length),
  );
  stations.count = CITY.metro.stations.length;
  stations.visible = false;
  CITY.metro.stations.forEach((s, i) => {
    placeOn(_dummy, s.lat, s.lng, groundRadius(s.lat, s.lng) + 0.08 * RELIEF, 0);
    _dummy.scale.setScalar(RELIEF);
    _dummy.updateMatrix();
    stations.setMatrixAt(i, _dummy.matrix);
    color.set(CITY.metro.colors[s.lines[0]] || '#c8102e');
    stations.setColorAt(i, color);
  });
  stations.instanceMatrix.needsUpdate = true;
  if (stations.instanceColor) stations.instanceColor.needsUpdate = true;
  world.add(stations);
  return { entrances: mesh, stations };
}

/** A small cruise ship looping the port mouth, just for life on the water. */
export function buildShip(world) {
  const g = new THREE.Group();
  add(g, box(0.16, 0.05, 0.55), mat('#f4f7f8'), 0, 0.06, 0);
  add(g, box(0.1, 0.06, 0.16), mat('#f7f4ef'), 0, 0.11, -0.05);
  add(g, box(0.08, 0.04, 0.12), WIN, 0, 0.12, -0.05);
  add(g, box(0.16, 0.02, 0.2), mat('#a11d33'), 0.02, 0.08, 0.16);
  g.scale.setScalar(1.15 * RELIEF);
  world.add(g);
  return g;
}

export function stepShip(ship, t) {
  const path = CITY.ship;
  if (!path || path.length < 2) return;
  const f = (t * 0.012) % 1;
  const x = f * (path.length - 1);
  const i = Math.floor(x);
  const k = x - i;
  const a = path[i];
  const b = path[Math.min(path.length - 1, i + 1)];
  const lat = a[1] + (b[1] - a[1]) * k;
  const lng = a[0] + (b[0] - a[0]) * k;
  placeOn(ship, lat, lng, groundRadius(lat, lng) + 0.1, 0);
  const ahead = dirLL(project(b[1], b[0]).lat, project(b[1], b[0]).lon);
  const dir = ahead.sub(ship.userData.normal.clone().multiplyScalar(ahead.dot(ship.userData.normal)));
  ship.rotateY(Math.atan2(dir.dot(ship.userData.east), dir.dot(ship.userData.south)));
}
