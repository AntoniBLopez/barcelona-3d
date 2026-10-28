import * as THREE from 'three';
import { U_PER_M } from './geo.js';

/** Real footprint diameter and height, in metres. The mesh is scaled to these. */
export const SIZE = {
  sagrada: [78, 102],
  guell: [64, 14],
  batllo: [26, 32],
  pedrera: [42, 30],
  vicens: [22, 18],
  palauguell: [26, 26],
  bellesguard: [18, 32],
  pavellons: [26, 11],
  catedral: [56, 64],
  gotic: [44, 20],
  rambla: [26, 12],
  catalunya: [42, 14],
  arc: [30, 30],
  castell: [64, 20],
  mnac: [100, 40],
  estadi: [86, 26],
  campnou: [190, 46],
  portvell: [54, 18],
  barceloneta: [36, 5],
  glories: [34, 144],
  santpau: [80, 34],
  musica: [34, 30],
  ciutadella: [64, 16],
  boqueria: [32, 15],
  tibidabo: [120, 64],
  santamaria: [36, 33],
  hotelw: [34, 99],
  colon: [16, 60],
  fontmagica: [50, 8],
  bunkers: [32, 7],
  espanya: [72, 26],
  poblenou: [22, 10],
};

/** Local +Z is south, so the sail's face looks out over the port. */
export const YAW = {};

const box = new THREE.Box3();
const size = new THREE.Vector3();

/** Scale a model so it matches its real footprint on the map. One metre is U_PER_M. */
export function fitModel(model, id) {
  const [spanM, heightM] = SIZE[id] || [30, 16];
  box.setFromObject(model);
  box.getSize(size);
  const sH = (heightM * U_PER_M) / (size.y || 1);
  const sW = (spanM * U_PER_M) / (Math.max(size.x, size.z) || 1);
  const s = Math.min(sH, sW);
  model.scale.setScalar(s);
  box.setFromObject(model);
  model.position.y -= box.min.y;
  box.setFromObject(model);
  box.getSize(size);
  return { span: Math.max(size.x, size.z), height: size.y };
}
