import * as THREE from 'three';
import { CITY } from '../data/city.js';
import { MONUMENTS } from './monuments.js';
import { SIZE, GAUDI_AVE } from './fit.js';
import { placeOn, U_PER_M } from './geo.js';
import { groundRadius, sampleGround, onLand } from './terrain.js';
import { ribbon } from './transit.js';
import { mat } from './kit.js';
const M_LAT = 111320;
const M_LNG = 111320 * Math.cos((41.3905 * Math.PI) / 180);
const STEP = 133;
const HALF = 54;
const CHAMFER = 16.2;
const gv = CITY.axes.granvia;
const ANG = Math.atan2((gv[gv.length - 1][0] - gv[0][0]) * M_LNG, (gv[gv.length - 1][1] - gv[0][1]) * M_LAT);
const COS = Math.cos(ANG);
const SIN = Math.sin(ANG);
function toEN(lng, lat) {
  const dx = (lng - 2.165) * M_LNG;
  const dy = (lat - 41.391) * M_LAT;
  return [dx * COS - dy * SIN, dx * SIN + dy * COS];
}
function toLL(east, north) {
  const dx = east * COS + north * SIN;
  const dy = -east * SIN + north * COS;
  return [2.165 + dx / M_LNG, 41.391 + dy / M_LAT];
}
function lineEN(pts) {
  return pts.map(([lng, lat]) => toEN(lng, lat));
}
const DIAG = lineEN(CITY.axes.diagonal);
const AVENUES = [
  { line: DIAG, half: 25, pale: 50, asphalt: 0, lift: 0.048 },
  { line: [[332.5, -1600], [332.5, 3600]], half: 21, pale: 42, asphalt: 32, lift: 0.034 },
  { line: [[-66.5, -2000], [-66.5, 2800]], half: 17, pale: 34, asphalt: 26, lift: 0.03 },
  { line: [[-860, 66.5], [780, 66.5]], half: 18, pale: 36, asphalt: 28, lift: 0.032 },
  { line: lineEN([[2.1869, 41.386], [2.1869, 41.432]]), half: 20, pale: 40, asphalt: 30, lift: 0.036 },
];
const mac = toEN(2.14411, 41.39249);
const glo = toEN(2.18735, 41.4035);
const PLAZAS = [
  { e: mac[0], n: mac[1], r: 70, lng: 2.14411, lat: 41.39249, rim: '#d9d0c0', core: '#5f9344', coreR: 26 },
  { e: glo[0], n: glo[1], r: 128, lng: 2.18735, lat: 41.4035, rim: '#cfc6b4', core: '#4f8a3e', coreR: 112 },
];
function area(poly) {
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    a += p[0] * q[1] - q[0] * p[1];
  }
  return a / 2;
}
function clean(poly) {
  const out = [];
  for (const p of poly) {
    const q = out[out.length - 1];
    if (!q || Math.hypot(p[0] - q[0], p[1] - q[1]) > 0.35) out.push(p);
  }
  if (out.length > 2 && Math.hypot(out[0][0] - out.at(-1)[0], out[0][1] - out.at(-1)[1]) < 0.35) out.pop();
  return out;
}
function clipHalf(poly, ax, ay, nx, ny) {
  if (!poly || poly.length < 3) return [];
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const cur = poly[i];
    const prev = poly[(i + poly.length - 1) % poly.length];
    const cs = (cur[0] - ax) * nx + (cur[1] - ay) * ny;
    const ps = (prev[0] - ax) * nx + (prev[1] - ay) * ny;
    const hit = () => {
      const d = ps - cs;
      const t = Math.abs(d) < 1e-9 ? 0 : ps / d;
      return [prev[0] + (cur[0] - prev[0]) * t, prev[1] + (cur[1] - prev[1]) * t];
    };
    if (cs >= -1e-6 && ps >= -1e-6) out.push(cur);
    else if (cs >= -1e-6) { out.push(hit()); out.push(cur); }
    else if (ps >= -1e-6) out.push(hit());
  }
  return clean(out);
}
function distSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2));
  return Math.hypot(px - ax - dx * t, py - ay - dy * t);
}
function subtractRect(poly, ax, ay, bx, by, half) {
  const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
  const before = clipHalf(poly, ax, ay, -ux, -uy);
  const after = clipHalf(poly, bx, by, ux, uy);
  const mid = clipHalf(clipHalf(poly, ax, ay, ux, uy), bx, by, -ux, -uy);
  const left = clipHalf(mid, ax + nx * half, ay + ny * half, nx, ny);
  const right = clipHalf(mid, ax - nx * half, ay - ny * half, -nx, -ny);
  return [before, after, left, right].map(clean).filter((p) => p.length >= 3 && Math.abs(area(p)) > 180);
}
function footprint(cx, cy) {
  const h = HALF;
  const c = CHAMFER;
  return [
    [cx - h + c, cy - h], [cx + h - c, cy - h], [cx + h, cy - h + c], [cx + h, cy + h - c],
    [cx + h - c, cy + h], [cx - h + c, cy + h], [cx - h, cy + h - c], [cx - h, cy - h + c],
  ];
}
function centroid(poly) {
  let x = 0;
  let y = 0;
  for (const p of poly) { x += p[0]; y += p[1]; }
  return [x / poly.length, y / poly.length];
}
function shavePlaza(poly) {
  let parts = [poly];
  for (const plaza of PLAZAS) {
    const next = [];
    for (const part of parts) {
      const [cx, cy] = centroid(part);
      const d = Math.hypot(cx - plaza.e, cy - plaza.n);
      if (d < plaza.r * 0.45) continue;
      const hit = part.some(([x, y]) => Math.hypot(x - plaza.e, y - plaza.n) < plaza.r - 0.4);
      if (!hit) { next.push(part); continue; }
      const nx = (cx - plaza.e) / d;
      const ny = (cy - plaza.n) / d;
      const cut = clipHalf(part, plaza.e + nx * plaza.r, plaza.n + ny * plaza.r, nx, ny);
      if (cut.length >= 3 && Math.abs(area(cut)) > 180) next.push(cut);
    }
    parts = next;
  }
  return parts;
}
const DIAG_MARGIN = 34;

function nearestOn(px, py, line) {
  let best = Infinity;
  let sd = 0;
  let nx = 0;
  let ny = 1;
  let fx = px;
  let fy = py;
  for (let i = 0; i < line.length - 1; i++) {
    const ax = line[i][0];
    const ay = line[i][1];
    const bx = line[i + 1][0];
    const by = line[i + 1][1];
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy || 1;
    const len = Math.sqrt(len2);
    let t = ((px - ax) * dx + (py - ay) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const qx = ax + dx * t;
    const qy = ay + dy * t;
    const d = Math.hypot(px - qx, py - qy);
    if (d < best) {
      best = d;
      nx = -dy / len;
      ny = dx / len;
      sd = (px - ax) * nx + (py - ay) * ny;
      fx = qx;
      fy = qy;
    }
  }
  return { d: best, sd, nx, ny, fx, fy };
}

function keepBlock(poly) {
  if (!poly || poly.length < 4) return false;
  const a = Math.abs(area(poly));
  if (a < 1400) return false;
  let per = 0;
  for (let i = 0; i < poly.length; i++) {
    const q = poly[(i + 1) % poly.length];
    per += Math.hypot(poly[i][0] - q[0], poly[i][1] - q[1]);
  }
  return per > 0 && (2 * a) / per > 18;
}

/** Chamfer the two corners where a block was cut parallel to the avenue. */
function chamferAvenue(poly, ox, oy, nx, ny) {
  const on = poly.map(([x, y]) => Math.abs((x - ox) * nx + (y - oy) * ny) < 2.5);
  if (!on.some(Boolean)) return poly;
  const out = [];
  const n = poly.length;
  for (let i = 0; i < n; i++) {
    const cur = poly[i];
    const prev = poly[(i + n - 1) % n];
    const next = poly[(i + 1) % n];
    const prevOn = on[(i + n - 1) % n];
    const nextOn = on[(i + 1) % n];
    if (!(on[i] && prevOn !== nextOn)) { out.push(cur); continue; }
    const pull = (to) => {
      const dx = to[0] - cur[0];
      const dy = to[1] - cur[1];
      const len = Math.hypot(dx, dy) || 1;
      const d = Math.min(12, len * 0.42);
      return [cur[0] + (dx / len) * d, cur[1] + (dy / len) * d];
    };
    out.push(pull(prev), pull(next));
  }
  return clean(out);
}

/**
 * Blocks beside the Diagonal become one trapezoid, offset to the sidewalk.
 * The side the centroid sits on is kept; the avenue itself is left empty.
 */
function clipDiagonal(poly) {
  const [cx, cy] = centroid(poly);
  const info = nearestOn(cx, cy, DIAG);
  if (info.d > 100) return [poly];
  if (Math.abs(info.sd) < 16) return [];
  let near = false;
  for (const p of poly) {
    if (nearestOn(p[0], p[1], DIAG).d < DIAG_MARGIN) { near = true; break; }
  }
  if (!near) return [poly];
  const sign = info.sd >= 0 ? 1 : -1;
  const ox = info.fx + info.nx * sign * DIAG_MARGIN;
  const oy = info.fy + info.ny * sign * DIAG_MARGIN;
  const cut = chamferAvenue(
    clipHalf(poly, ox, oy, info.nx * sign, info.ny * sign),
    ox, oy, info.nx * sign, info.ny * sign,
  );
  return keepBlock(cut) ? [cut] : [];
}

function carve(poly) {
  let parts = clipDiagonal(poly);
  for (const ave of AVENUES) {
    if (ave.line === DIAG) continue;
    for (let i = 0; i < ave.line.length - 1; i++) {
      const [ax, ay] = ave.line[i];
      const [bx, by] = ave.line[i + 1];
      const next = [];
      for (const part of parts) {
        const [cx, cy] = centroid(part);
        if (distSeg(cx, cy, ax, ay, bx, by) > 76 + ave.half) next.push(part);
        else next.push(...subtractRect(part, ax, ay, bx, by, ave.half).filter(keepBlock));
      }
      parts = next;
    }
  }
  return parts.flatMap(shavePlaza).filter(keepBlock);
}

/** The Cerdà grid, rotated with Gran Via: Eixample proper, not a lat/lng square. */
export function inEixampleGrid(lat, lng) {
  const [e, n] = toEN(lng, lat);
  return e >= -960 && e <= 1040 && n >= -2280 && n <= 2420;
}
function nearPoly(lat, lng, line, limit) {
  const x = lng * M_LNG;
  const y = lat * M_LAT;
  for (let i = 0; i < line.length - 1; i++) {
    if (distSeg(x, y, line[i][0] * M_LNG, line[i][1] * M_LAT, line[i + 1][0] * M_LNG, line[i + 1][1] * M_LAT) < limit) return true;
  }
  return false;
}
function reserved(lat, lng) {
  for (const m of MONUMENTS) {
    const span = (SIZE[m.id]?.[0] || 30) / 2 + 14;
    if (Math.hypot((lat - m.lat) * M_LAT, (lng - m.lng) * M_LNG) < span) return true;
  }
  return nearPoly(lat, lng, GAUDI_AVE, 36);
}
function inPlaza(east, north) {
  return PLAZAS.some((p) => Math.hypot(east - p.e, north - p.n) < p.r);
}
function merge(geos) {
  const parts = geos.map((g) => (g.index ? g.toNonIndexed() : g));
  let vc = 0;
  for (const g of parts) vc += g.attributes.position.count;
  const pos = new Float32Array(vc * 3);
  let vo = 0;
  for (const g of parts) {
    pos.set(g.attributes.position.array, vo);
    vo += g.attributes.position.count * 3;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.computeVertexNormals();
  return geo;
}
const dummy = new THREE.Object3D();
function bake(poly, height, bucket) {
  if (area(poly) < 0) poly.reverse();
  const [cx, cy] = centroid(poly);
  const [lng, lat] = toLL(cx, cy);
  const gnd = sampleGround(lat, lng);
  if (gnd.sea || gnd.park || gnd.beach || !onLand(lat, lng)) return;
  if (poly.some(([e, n]) => !onLand(toLL(e, n)[1], toLL(e, n)[0], 8))) return;
  if (poly.some(([e, n]) => nearestOn(e, n, DIAG).d < 31)) return;
  const pts = poly.map(([e, n]) => new THREE.Vector2((e - cx) * U_PER_M, -(n - cy) * U_PER_M));
  const geo = new THREE.ExtrudeGeometry(new THREE.Shape(pts), { depth: height, bevelEnabled: false, curveSegments: 1 });
  geo.rotateX(-Math.PI / 2);
  dummy.scale.set(1, 1, 1);
  placeOn(dummy, lat, lng, gnd.radius, ANG);
  dummy.updateMatrix();
  geo.applyMatrix4(dummy.matrix);
  bucket.push(geo);
}
function band(group, pts, width, lift, color) {
  const mesh = ribbon(pts, width, lift, color);
  if (mesh) group.add(mesh);
}
function shiftLL(line, meters) {
  return line.map((p, i) => {
    const a = line[Math.max(0, i - 1)];
    const b = line[Math.min(line.length - 1, i + 1)];
    const dx = (b[0] - a[0]) * M_LNG;
    const dy = (b[1] - a[1]) * M_LAT;
    const len = Math.hypot(dx, dy) || 1;
    return [p[0] + (-dy / len) * meters / M_LNG, p[1] + (dx / len) * meters / M_LAT];
  });
}
function disc(group, lat, lng, radius, color, lift) {
  const geo = new THREE.CircleGeometry(radius * U_PER_M, 22);
  geo.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(geo, mat(color));
  mesh.receiveShadow = true;
  placeOn(mesh, lat, lng, groundRadius(lat, lng) + lift, 0);
  group.add(mesh);
}
export function buildEixample(world) {
  const colors = ['#e7d7c0', '#d9c3a4', '#f1e6d4', '#c9b294', '#efe4d2'];
  const buckets = colors.map(() => []);
  const inside = (lat, lng) => inEixampleGrid(lat, lng);
  for (let ix = -24; ix <= 14; ix++) {
    for (let iy = -34; iy <= 38; iy++) {
      const east = ix * STEP;
      const north = iy * STEP;
      const [lng, lat] = toLL(east, north);
      if (!inside(lat, lng)) continue;
      const gnd = sampleGround(lat, lng);
      if (gnd.sea || gnd.park || gnd.beach) continue;
      if (reserved(lat, lng)) continue;
      const h = (16 + (Math.abs(ix * 7 + iy * 3) % 5) * 3) * U_PER_M;
      for (const part of carve(footprint(east, north))) bake(part, h, buckets[Math.abs(ix + iy * 3) % colors.length]);
    }
  }
  buckets.forEach((geos, i) => {
    if (!geos.length) return;
    const mesh = new THREE.Mesh(merge(geos), mat(colors[i]));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    world.add(mesh);
  });
  layStreets(world, inside);
  layAvenues(world);
  return buckets.reduce((n, b) => n + b.length, 0);
}
function layStreets(world, inside) {
  const group = new THREE.Group();
  const runs = [];
  const push = (east, north, run) => {
    const [lng, lat] = toLL(east, north);
    const dry = inside(lat, lng) && onLand(lat, lng) && !inPlaza(east, north)
      && !nearPoly(lat, lng, CITY.axes.diagonal, 27);
    if (!dry) {
      if (run.length > 1) runs.push(run.splice(0));
      else run.length = 0;
      return;
    }
    run.push([lng, lat]);
  };
  for (let iy = -34; iy <= 38; iy++) {
    const run = [];
    const north = iy * STEP + STEP / 2;
    for (let east = -24 * STEP; east <= 14 * STEP; east += 36) push(east, north, run);
    if (run.length > 1) runs.push(run);
  }
  for (let ix = -24; ix <= 14; ix++) {
    const run = [];
    const east = ix * STEP + STEP / 2;
    for (let north = -34 * STEP; north <= 38 * STEP; north += 36) push(east, north, run);
    if (run.length > 1) runs.push(run);
  }
  for (const run of runs) {
    band(group, run, 16, 0.018, '#c2b6a6');
    band(group, run, 8, 0.026, '#2e343c');
  }
  world.add(group);
}
function layAvenues(world) {
  const group = new THREE.Group();
  group.name = 'avenues';
  for (const ave of AVENUES) {
    if (!ave.asphalt) continue;
    const pts = ave.line.map(([e, n]) => toLL(e, n));
    band(group, pts, ave.pale, ave.lift, '#c9bba4');
    band(group, pts, ave.asphalt, ave.lift + 0.006, '#3a4048');
  }
  const diagonal = CITY.axes.diagonal;
  band(group, diagonal, 52, 0.05, '#f3eadc');
  band(group, shiftLL(diagonal, 16), 12, 0.058, '#2a3038');
  band(group, shiftLL(diagonal, -16), 12, 0.058, '#2a3038');
  band(group, diagonal, 11, 0.066, '#3d7a3a');
  band(group, shiftLL(diagonal, 1.7), 0.9, 0.07, '#1a1e24');
  band(group, shiftLL(diagonal, -1.7), 0.9, 0.07, '#1a1e24');
  for (const plaza of PLAZAS) {
    disc(group, plaza.lat, plaza.lng, plaza.r, plaza.rim, 0.07);
    disc(group, plaza.lat, plaza.lng, plaza.coreR, plaza.core, 0.078);
  }
  world.add(group);
  plantPlanes(world, diagonal);
}
function plantPlanes(world, line) {
  const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.45, 0.7, 1, 5), mat('#6b4a32'), 2800);
  const crown = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 6, 4), mat('#3c7a38'), 2800);
  trunk.count = 0;
  crown.count = 0;
  let carry = 0;
  const step = 18;
  for (let i = 1; i < line.length && trunk.count < 2760; i++) {
    const dx = (line[i][0] - line[i - 1][0]) * M_LNG;
    const dy = (line[i][1] - line[i - 1][1]) * M_LAT;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    let dist = carry;
    for (; dist <= len && trunk.count < 2760; dist += step) {
      const t = dist / len;
      const lng = line[i - 1][0] + (line[i][0] - line[i - 1][0]) * t;
      const lat = line[i - 1][1] + (line[i][1] - line[i - 1][1]) * t;
      if (!onLand(lat, lng, 8)) continue;
      for (const off of [-23, -6, 6, 23]) {
        if (trunk.count >= 2790) break;
        const olng = lng + nx * off / M_LNG;
        const olat = lat + ny * off / M_LAT;
        const [oe, on] = toEN(olng, olat);
        if (inPlaza(oe, on) || !onLand(olat, olng, 8)) continue;
        const gnd = groundRadius(olat, olng);
        const sit = (sx, sy, sz, lift) => {
          placeOn(dummy, olat, olng, gnd, 0);
          dummy.scale.set(sx, sy, sz);
          dummy.position.addScaledVector(dummy.userData.normal, lift);
          dummy.updateMatrix();
        };
        sit(0.55 * U_PER_M, 6.5 * U_PER_M, 0.55 * U_PER_M, 3.2 * U_PER_M);
        trunk.setMatrixAt(trunk.count, dummy.matrix);
        sit(4.2 * U_PER_M, 4.2 * U_PER_M, 4.2 * U_PER_M, 8.2 * U_PER_M);
        crown.setMatrixAt(crown.count, dummy.matrix);
        trunk.count++;
        crown.count++;
      }
    }
    carry = dist - len;
  }
  trunk.instanceMatrix.needsUpdate = true;
  crown.instanceMatrix.needsUpdate = true;
  world.add(trunk, crown);
}
