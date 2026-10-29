import * as THREE from 'three';
import { MONUMENTS } from './monuments.js';
import { SIZE, GAUDI_AVE } from './fit.js';
import { placeOn, U_PER_M, R } from './geo.js';
import { CITY } from '../data/city.js';
import { sampleGround } from './terrain.js';
import { mat } from './kit.js';

const M_LAT = 111320;
const M_LNG = 111320 * Math.cos((41.3905 * Math.PI) / 180);
const dummy = new THREE.Object3D();

function hash(i) {
  let h = Math.imul(i ^ 0x9e3779b9, 0x85ebca6b);
  h ^= h >>> 13;
  return (h >>> 0) / 4294967296;
}

function nearLine(lat, lng, line, limit) {
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
function eixample(lat, lng) {
  const ciutat = lat < 41.383 && lng > 2.16 && lng < 2.182;
  const gracia = lat > 41.4002 && lng > 2.146 && lng < 2.166;
  const classic = lat >= 41.374 && lat <= 41.406 && lng >= 2.144 && lng <= 2.186;
  const corridor = nearLine(lat, lng, CITY.axes.diagonal, 155);
  return (classic || corridor) && !ciutat && !gracia;
}
function ashore(lat, lng, span) {
  const dLat = (span / 2 + 18) / M_LAT;
  const dLng = (span / 2 + 18) / M_LNG;
  for (const la of [lat - dLat, lat, lat + dLat]) {
    for (const ln of [lng - dLng, lng, lng + dLng]) {
      if (sampleGround(la, ln).sea) return false;
    }
  }
  return true;
}
function quarter(lat, lng) {
  return (lat > 41.371 && lat < 41.388 && lng > 2.162 && lng < 2.185)
    || (lat > 41.372 && lat < 41.386 && lng >= 2.183 && lng < 2.199)
    || (lat > 41.399 && lat < 41.413 && lng > 2.145 && lng < 2.167);
}

function blocked(lat, lng) {
  for (const m of MONUMENTS) {
    const span = (SIZE[m.id]?.[0] || 30) / 2 + 36;
    if (Math.hypot((lat - m.lat) * M_LAT, (lng - m.lng) * M_LNG) < span) return true;
  }
  const x = lng * M_LNG;
  const y = lat * M_LAT;
  for (let i = 0; i < GAUDI_AVE.length - 1; i++) {
    const ax = GAUDI_AVE[i][0] * M_LNG;
    const ay = GAUDI_AVE[i][1] * M_LAT;
    const bx = GAUDI_AVE[i + 1][0] * M_LNG;
    const by = GAUDI_AVE[i + 1][1] * M_LAT;
    const dx = bx - ax;
    const dy = by - ay;
    const l2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / l2));
    if (Math.hypot(x - ax - dx * t, y - ay - dy * t) < 48) return true;
  }
  return false;
}

function mesh(color, cap) {
  const m = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat(color), cap);
  m.count = 0;
  m.castShadow = false;
  m.receiveShadow = true;
  m.frustumCulled = false;
  return m;
}

/** Lighter blocks outside the Eixample: coarse from any distance, finer up close. */
export function buildDistricts(world) {
  const coarse = [mesh('#f7f1e4', 5200), mesh('#eadcc8', 5200)];
  const fine = [mesh('#f3eadc', 5200), mesh('#e3d5c2', 5200)];
  const buckets = [...coarse, ...fine];
  let i = 0;
  for (let lat = 41.332; lat <= 41.468; lat += 0.00128) {
    for (let lng = 2.068; lng <= 2.25; lng += 0.00155) {
      i++;
      const h = hash(i);
      if (h > 0.84) continue;
      const gnd = sampleGround(lat, lng);
      if (gnd.sea || gnd.beach || gnd.park || gnd.kind === 'forest' || gnd.kind === 'delta') continue;
      if (gnd.coastM < 80 || eixample(lat, lng) || quarter(lat, lng) || blocked(lat, lng)) continue;
      if (nearLine(lat, lng, CITY.axes.diagonal, 40)) continue;
      const span = 92 + h * 22;
      if (!ashore(lat, lng, span)) continue;
      const depth = span * (0.72 + hash(i + 17) * 0.24);
      const height = 12 + hash(i + 3) * 14;
      const tall = height * U_PER_M;
      const slot = coarse[0].count <= coarse[1].count ? coarse[0] : coarse[1];
      if (slot.count < 5100) {
        dummy.scale.set(span * U_PER_M, tall, depth * U_PER_M);
        placeOn(dummy, lat, lng, gnd.radius + tall / 2, h * 0.4);
        dummy.updateMatrix();
        slot.setMatrixAt(slot.count++, dummy.matrix);
      }
      if (h > 0.48) continue;
      const slotF = fine[0].count <= fine[1].count ? fine[0] : fine[1];
      if (slotF.count >= 5100) continue;
      const fs = 30 + h * 16;
      const flat = lat + 0.00042;
      const flng = lng + 0.00048;
      if (!ashore(flat, flng, fs)) continue;
      const ft = (8 + hash(i + 9) * 10) * U_PER_M;
      dummy.scale.set(fs * U_PER_M, ft, fs * 0.8 * U_PER_M);
      placeOn(dummy, flat, flng, sampleGround(flat, flng).radius + ft / 2, h);
      dummy.updateMatrix();
      slotF.setMatrixAt(slotF.count++, dummy.matrix);
    }
  }
  for (const m of buckets) {
    m.instanceMatrix.needsUpdate = true;
    world.add(m);
  }
  const probe = new THREE.Mesh(
    new THREE.BoxGeometry(0.01, 0.01, 0.01),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
  );
  probe.frustumCulled = false;
  probe.onBeforeRender = (_r, _s, cam) => {
    const show = cam.position.length() < R + 32;
    for (const m of fine) m.visible = show;
  };
  world.add(probe);
}
