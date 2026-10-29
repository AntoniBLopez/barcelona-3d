import * as THREE from 'three';
import { CITY } from '../data/city.js';
import { project, dirLL, placeOn, U_PER_M } from './geo.js';
import { GAUDI_AVE } from './fit.js';
import { groundRadius } from './terrain.js';
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
  const frames = framesOf(points, lift);
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
    const a = i * 2;
    idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, mat(color, opts));
  mesh.receiveShadow = true;
  return mesh;
}

export function buildStreets(world) {
  const group = new THREE.Group();
  const specs = [
    [CITY.axes.granvia, 38, '#4c5158'],
    [CITY.axes.diagonal, 42, '#454a50'],
    [CITY.axes.gracia, 32, '#5a5348'],
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
    const mesh = ribbon(line, 90, 0.02, '#3d86a8', { roughness: 0.35, metalness: 0.05 });
    if (mesh) group.add(mesh);
  }
  world.add(group);
  return group;
}

export function buildTramTracks(world) {
  const group = new THREE.Group();
  group.name = 'tram-tracks';
  for (const line of CITY.tram.tracks) {
    const mesh = ribbon(line, 7, 0.055, CITY.tram.color, { roughness: 0.7 });
    if (mesh) group.add(mesh);
  }
  world.add(group);
  return group;
}

function makeTram() {
  const g = new THREE.Group();
  add(g, box(0.16, 0.09, 0.4), mat('#f7f8f6'), 0, 0.1, 0);
  add(g, box(0.15, 0.05, 0.28), WIN, 0, 0.13, 0);
  add(g, box(0.17, 0.02, 0.4), mat('#0c7d68'), 0, 0.055, 0);
  add(g, cyl(0.012, 0.012, 0.07, 4), mat('#2a2e33'), 0, 0.18, -0.05);
  g.scale.setScalar(0.62);
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

export function buildTrams(world) {
  const trams = [];
  CITY.tram.routes.forEach((route, index) => {
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
    trams.push({ rig, frames: pathFrames(route.path), ref: route.ref, t: index * 0.31 });
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
    placeOn(tram.rig, lat, lng, groundRadius(lat, lng) + 0.07, 0);
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
    placeOn(_dummy, e[1], e[0], gnd + 0.05, 0);
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
    placeOn(_dummy, s.lat, s.lng, groundRadius(s.lat, s.lng) + 0.08, 0);
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
  g.scale.setScalar(1.15);
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
  placeOn(ship, lat, lng, groundRadius(lat, lng) + 0.06, 0);
  const ahead = dirLL(project(b[1], b[0]).lat, project(b[1], b[0]).lon);
  const dir = ahead.sub(ship.userData.normal.clone().multiplyScalar(ahead.dot(ship.userData.normal)));
  ship.rotateY(Math.atan2(dir.dot(ship.userData.east), dir.dot(ship.userData.south)));
}
