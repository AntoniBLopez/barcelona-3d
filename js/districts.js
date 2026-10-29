import * as THREE from 'three';
import { placeOn, U_PER_M } from './geo.js';
import { sampleGround } from './terrain.js';
import { mat } from './kit.js';
import { inCity, cityDistance } from './fabric.js';

const dummy = new THREE.Object3D();

function hash(i) {
  let h = Math.imul(i ^ 0x9e3779b9, 0x85ebca6b);
  h ^= h >>> 13;
  return (h >>> 0) / 4294967296;
}

function wooded(lat, lng) {
  const g = sampleGround(lat, lng);
  if (g.kind === 'forest' || g.kind === 'park' || g.sea || g.beach || g.kind === 'delta') return true;
  if (sampleGround(lat + 0.004, lng).kind === 'forest') return true;
  if (sampleGround(lat, lng - 0.004).kind === 'forest') return true;
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

/**
 * Sparse blocks outside Barcelona. Positions are jittered off the cell
 * so the fringe does not read as a tiled carpet, and density falls with
 * distance from the city.
 */
export function buildDistricts(world) {
  const buckets = [mesh('#efe4d2', 2800), mesh('#e5d4bc', 2800), mesh('#f7f1e6', 2800)];
  let i = 0;
  const cell = 0.0026;
  for (let lat = 41.30; lat <= 41.50; lat += cell) {
    for (let lng = 2.04; lng <= 2.27; lng += cell) {
      i++;
      const h = hash(i);
      const h2 = hash(i + 91);
      const la = lat + (h - 0.5) * cell * 0.95;
      const ln = lng + (h2 - 0.5) * cell * 0.95;
      if (inCity(la, ln) || wooded(la, ln)) continue;
      const away = cityDistance(la, ln);
      if (away < 40 || away > 2800) continue;
      const keep = 0.62 * (1 - away / 2800) + 0.06;
      if (h2 > keep) continue;
      const gnd = sampleGround(la, ln);
      const span = 18 + hash(i + 3) * 56 * (1 - away / 3600);
      const depth = span * (0.42 + hash(i + 7) * 0.9);
      const height = (5 + hash(i + 11) * 14) * (1 - away / 4000);
      const tall = Math.max(4, height) * U_PER_M;
      const slot = buckets[i % buckets.length];
      if (slot.count >= 2700) continue;
      dummy.scale.set(span * U_PER_M, tall, depth * U_PER_M);
      placeOn(dummy, la, ln, gnd.radius + tall / 2, h * Math.PI * 2);
      dummy.updateMatrix();
      slot.setMatrixAt(slot.count++, dummy.matrix);
    }
  }
  for (const m of buckets) {
    m.instanceMatrix.needsUpdate = true;
    world.add(m);
  }
}
