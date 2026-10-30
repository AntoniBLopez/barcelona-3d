import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

function blocked(o) {
  for (let p = o; p; p = p.parent) if (p.userData.noBatch) return true;
  return false;
}

function signature(geo) {
  const a = geo.attributes;
  const parts = ['p'];
  if (a.normal) parts.push('n');
  if (a.uv) parts.push('u');
  if (a.color) parts.push('c');
  if (a.uv1) parts.push('u1');
  return parts.join('') + (geo.index ? 'i' : '');
}

function cloneWorld(o) {
  let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
  if (g === o.geometry) g = o.geometry.clone();
  if (!g.attributes.normal) g.computeVertexNormals();
  g.applyMatrix4(o.matrixWorld);
  return g;
}

/** Merge static meshes that share a material so the city is a handful of draws. */
export function batchStatic(root) {
  root.updateMatrixWorld(true);
  const buckets = new Map();
  root.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh || blocked(o)) return;
    const mat = o.material;
    if (!o.geometry || !mat || Array.isArray(mat)) return;
    if (mat.transparent || mat.opacity < 1 || mat.depthWrite === false) return;
    const key = `${mat.uuid}|${signature(o.geometry)}|${o.castShadow ? 1 : 0}${o.receiveShadow ? 1 : 0}|${o.renderOrder}`;
    let list = buckets.get(key);
    if (!list) buckets.set(key, list = []);
    list.push(o);
  });

  let removed = 0;
  for (const list of buckets.values()) {
    if (list.length < 2) continue;
    const geos = [];
    try {
      for (const o of list) geos.push(cloneWorld(o));
      const merged = mergeGeometries(geos, false);
      if (!merged) continue;
      const src = list[0];
      const mesh = new THREE.Mesh(merged, src.material);
      mesh.castShadow = src.castShadow;
      mesh.receiveShadow = src.receiveShadow;
      mesh.renderOrder = src.renderOrder;
      mesh.userData.batched = list.length;
      merged.computeBoundingSphere();
      root.add(mesh);
      for (const o of list) {
        o.matrix.copy(o.matrixWorld);
        o.matrixAutoUpdate = false;
        o.removeFromParent();
        removed++;
      }
    } catch {
      /* Leave this bucket as individual draws. */
    }
    for (const g of geos) g.dispose();
  }
  return removed;
}
