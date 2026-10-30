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

const _n = new THREE.Vector3();
const _e = new THREE.Vector3();
const _s = new THREE.Vector3();
const _basis = new THREE.Matrix4();
const _aim = new THREE.Vector3();

function dirInto(lat, lon, out) {
  const p = lat * D2R;
  const l = lon * D2R;
  return out.set(Math.cos(p) * Math.sin(l), Math.sin(p), Math.cos(p) * Math.cos(l));
}

/** Unit vector for a maquette latitude/longitude (degrees). */
export function dirLL(lat, lon) {
  return dirInto(lat, lon, new THREE.Vector3());
}

/** Yaw that points +Z toward a lat/lng. Call after placeOn so east/south exist. */
export function yawToward(obj, geoLat, geoLng) {
  dirInto((geoLat - OLAT) * M_LAT * DEG_PER_M, (geoLng - OLNG) * M_LNG * DEG_PER_M, _aim);
  _aim.addScaledVector(obj.userData.normal, -_aim.dot(obj.userData.normal));
  return Math.atan2(_aim.dot(obj.userData.east), _aim.dot(obj.userData.south));
}

/**
 * Sit an object on the sphere. Local +Y points out, local +Z points south,
 * local +X points east. `yaw` turns the object around its own vertical.
 */
export function placeOn(obj, geoLat, geoLng, radius, yaw = 0) {
  const lat = (geoLat - OLAT) * M_LAT * DEG_PER_M;
  const lon = (geoLng - OLNG) * M_LNG * DEG_PER_M;
  dirInto(lat, lon, _n);
  _e.set(Math.cos(lon * D2R), 0, -Math.sin(lon * D2R));
  _e.addScaledVector(_n, -_e.dot(_n)).normalize();
  _s.crossVectors(_e, _n).normalize();
  let n = obj.userData.normal;
  if (!n) {
    n = obj.userData.normal = new THREE.Vector3();
    obj.userData.east = new THREE.Vector3();
    obj.userData.south = new THREE.Vector3();
  }
  n.copy(_n);
  obj.userData.east.copy(_e);
  obj.userData.south.copy(_s);
  obj.position.copy(n).multiplyScalar(radius);
  obj.quaternion.setFromRotationMatrix(_basis.makeBasis(obj.userData.east, n, obj.userData.south));
  if (yaw) obj.rotateY(yaw);
  return n;
}

export function metersBetween(a, b) {
  const dy = (a.lat - b.lat) * M_LAT;
  const dx = (a.lng - b.lng) * M_LNG;
  return Math.hypot(dx, dy);
}
