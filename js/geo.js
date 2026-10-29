import * as THREE from 'three';

/** Sphere radius of the maquette, in world units. */
export const R = 16.5;

/** Geographic origin: the middle of the city, between the sea and Collserola. */
export const OLAT = 41.401;
export const OLNG = 2.170;

/**
 * How many degrees of the maquette one metre of Barcelona occupies.
 * The built city, from the port to Collserola, fills the visible face
 * and stays short of the pole so the coast does not wrap behind the globe.
 */
export const DEG_PER_M = 0.014;

/** Heights authored in world units at the previous map scale (0.0076). */
export const RELIEF = DEG_PER_M / 0.0076;

const M_LAT = 111320;
const M_LNG = 111320 * Math.cos((OLAT * Math.PI) / 180);

/** World-units along the surface for one real metre. */
export const U_PER_M = DEG_PER_M * (Math.PI / 180) * R;

const D2R = Math.PI / 180;

/** Project a real lat/lng onto the maquette's latitude/longitude, in degrees. */
export function project(lat, lng) {
  return {
    lat: (lat - OLAT) * M_LAT * DEG_PER_M,
    lon: (lng - OLNG) * M_LNG * DEG_PER_M,
  };
}

/** Inverse of project(), from a unit direction on the sphere back to lat/lng. */
export function unprojectDir(n) {
  const latS = Math.asin(Math.max(-1, Math.min(1, n.y))) / D2R;
  const lonS = Math.atan2(n.x, n.z) / D2R;
  return {
    lat: OLAT + latS / (M_LAT * DEG_PER_M),
    lng: OLNG + lonS / (M_LNG * DEG_PER_M),
  };
}

/** Unit vector for a maquette latitude/longitude (degrees). */
export function dirLL(lat, lon) {
  const p = lat * D2R;
  const l = lon * D2R;
  return new THREE.Vector3(Math.cos(p) * Math.sin(l), Math.sin(p), Math.cos(p) * Math.cos(l));
}

/**
 * Sit an object on the sphere. Local +Y points out, local +Z points south,
 * local +X points east. `yaw` turns the object around its own vertical.
 */
export function placeOn(obj, geoLat, geoLng, radius, yaw = 0) {
  const sph = project(geoLat, geoLng);
  const n = dirLL(sph.lat, sph.lon);
  const lon = sph.lon * D2R;
  const east = new THREE.Vector3(Math.cos(lon), 0, -Math.sin(lon));
  east.addScaledVector(n, -east.dot(n)).normalize();
  const south = new THREE.Vector3().crossVectors(east, n).normalize();
  obj.position.copy(n).multiplyScalar(radius);
  obj.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(east, n, south));
  if (yaw) obj.rotateY(yaw);
  obj.userData.normal = n;
  obj.userData.east = east;
  obj.userData.south = south;
  return n;
}

export function metersBetween(a, b) {
  const dy = (a.lat - b.lat) * M_LAT;
  const dx = (a.lng - b.lng) * M_LNG;
  return Math.hypot(dx, dy);
}
