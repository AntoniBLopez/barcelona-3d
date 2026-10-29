import * as THREE from 'three';
import { U_PER_M } from './geo.js';

/** Real footprint diameter and height, in metres. The mesh is scaled to these. */
export const SIZE = {
  sagrada: [140, 172],
  guell: [150, 42],
  batllo: [38, 46],
  pedrera: [40, 36],
  vicens: [22, 18],
  palauguell: [26, 26],
  bellesguard: [18, 32],
  pavellons: [26, 11],
  catedral: [56, 64],
  gotic: [44, 20],
  rambla: [26, 12],
  catalunya: [42, 14],
  arc: [220, 32],
  castell: [64, 20],
  mnac: [100, 40],
  estadi: [86, 26],
  campnou: [320, 50],
  portvell: [54, 18],
  barceloneta: [36, 5],
  glories: [34, 144],
  santpau: [300, 62],
  musica: [34, 30],
  ciutadella: [64, 16],
  boqueria: [32, 15],
  tibidabo: [120, 64],
  santamaria: [36, 33],
  hotelw: [34, 99],
  colon: [28, 60],
  fontmagica: [50, 8],
  bunkers: [32, 7],
  espanya: [72, 26],
  poblenou: [22, 10],
};

/**
 * Extra scale on top of the real-metre fit. Thin towers and houses need a
 * strong factor before they read bigger than an Eixample block (~108 × 22 m).
 */
export const BOOST = {
  sagrada: 3.3, campnou: 1.45, tibidabo: 2.35, glories: 3.3, hotelw: 2.7,
  colon: 3.5, batllo: 7.2, pedrera: 6.8, vicens: 5.4, catedral: 3.1,
  arc: 2.7, guell: 2.05, mnac: 2.35, santpau: 1.8, musica: 3.7,
  santamaria: 3.6, castell: 2.4, estadi: 2.0, palauguell: 3.4, bellesguard: 4.2,
  pavellons: 3.6, gotic: 2.6, catalunya: 1.8, portvell: 2.1, boqueria: 2.3,
  ciutadella: 2.0, espanya: 2.2, poblenou: 2.8, bunkers: 4.0, fontmagica: 3.0,
  rambla: 1.35, barceloneta: 1.6,
};

/** Local +Z is south, so the sail's face looks out over the port. */
/** Casa Batlló's facade looks northeast, onto Passeig de Gràcia. */
export const YAW = { batllo: 2.32, arc: 0.82, santpau: -0.08, colon: 0.54, pedrera: 3.01 };

/** [lng, lat] of Avinguda de Gaudí, from the Sagrada Família to Sant Pau. */
export const GAUDI_AVE = [[2.17455, 41.40435], [2.17542, 41.41315]];

const box = new THREE.Box3();
const size = new THREE.Vector3();

/** Scale a model so it matches its real footprint on the map. One metre is U_PER_M. */
export function fitModel(model, id) {
  const [spanM, heightM] = SIZE[id] || [30, 16];
  box.setFromObject(model);
  box.getSize(size);
  const sH = (heightM * U_PER_M) / (size.y || 1);
  const sW = (spanM * U_PER_M) / (Math.max(size.x, size.z) || 1);
  const s = Math.min(sH, sW) * (BOOST[id] || 1.5);
  model.scale.setScalar(s);
  box.setFromObject(model);
  model.position.y -= box.min.y;
  box.setFromObject(model);
  box.getSize(size);
  return { span: Math.max(size.x, size.z), height: size.y };
}
