import * as THREE from 'three';
import { R, dirLL } from './geo.js';

const D2R = Math.PI / 180;

/**
 * Drag to spin the planet, wheel / pinch to zoom, and a flight that ends
 * in an orbit around the chosen landmark. Auto-spin pauses after a gesture.
 */
export function createCamera(camera, canvas) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const state = {
    target: new THREE.Vector3(),
    spin: !reduced,
    lastInteract: performance.now(),
    dist: 0,
    distTo: 0,
    min: R + 5,
    max: 90,
    flight: null,
    focus: null,
    pointers: new Map(),
    keys: new Set(),
  };

  function homeDist() {
    const fov = (camera.fov * D2R) / 2;
    const fit = (R * 2.55) / (2 * Math.tan(fov) * Math.min(1, camera.aspect));
    return fit;
  }

  function limits() {
    state.max = Math.max(homeDist() * 1.25, 70);
    if (!state.dist) {
      state.dist = homeDist();
      state.distTo = state.dist;
      // Over Collserola, looking down across the city toward the sea.
      const home = dirLL(18, -16);
      camera.position.copy(home).setLength(state.dist);
      camera.up.set(0, 1, 0);
      camera.lookAt(0, 0, 0);
    }
  }

  function rotateFree(ax, ay) {
    const dir = camera.position.clone().normalize();
    const up = camera.up.clone().addScaledVector(dir, -camera.up.dot(dir)).normalize();
    const right = new THREE.Vector3().crossVectors(up, dir).normalize();
    const q = new THREE.Quaternion().setFromAxisAngle(up, -ax)
      .multiply(new THREE.Quaternion().setFromAxisAngle(right, ay));
    camera.position.applyQuaternion(q);
    camera.up.copy(up.applyQuaternion(q));
    camera.lookAt(state.target);
  }

  function flyTo(dir, dist, target, ms = 1600) {
    state.focus = null;
    const fromUp = camera.up.clone();
    const toUp = target.lengthSq() > 1 ? target.clone().normalize() : new THREE.Vector3(0, 1, 0);
    state.flight = {
      t: 0,
      dur: reduced ? 0.01 : ms / 1000,
      fromPos: camera.position.clone(),
      toPos: target.clone().add(dir.clone().normalize().multiplyScalar(dist)),
      fromTarget: state.target.clone(),
      toTarget: target.clone(),
      fromUp,
      toUp,
    };
  }

  function enterFocus() {
    const t = state.target.clone();
    const n = t.clone().normalize();
    const off = camera.position.clone().sub(t);
    const east = new THREE.Vector3(1, 0, 0).cross(n);
    if (east.lengthSq() < 1e-6) east.set(0, 0, 1);
    east.normalize();
    const south = new THREE.Vector3().crossVectors(east, n).normalize();
    const d = off.length();
    state.focus = {
      t, n, east, south,
      d, dTo: d,
      th: Math.atan2(off.dot(east), off.dot(south)),
      thTo: Math.atan2(off.dot(east), off.dot(south)),
      ph: Math.acos(Math.min(1, Math.max(-1, off.dot(n) / d))),
      phTo: Math.acos(Math.min(1, Math.max(-1, off.dot(n) / d))),
    };
  }

  function stepFocus(dt) {
    const f = state.focus;
    if (state.spin && performance.now() - state.lastInteract > 4500) f.thTo += dt * 0.18;
    const sp = 1.2 * dt;
    if (state.keys.has('a')) f.thTo -= sp;
    if (state.keys.has('d')) f.thTo += sp;
    if (state.keys.has('w')) f.phTo -= sp;
    if (state.keys.has('s')) f.phTo += sp;
    f.phTo = Math.min(1.35, Math.max(0.18, f.phTo));
    const k = 1 - Math.pow(0.0015, dt);
    f.th += (f.thTo - f.th) * k;
    f.ph += (f.phTo - f.ph) * k;
    f.d += (f.dTo - f.d) * k;
    const s = Math.sin(f.ph);
    camera.position.copy(f.t)
      .addScaledVector(f.n, Math.cos(f.ph) * f.d)
      .addScaledVector(f.east, s * Math.sin(f.th) * f.d)
      .addScaledVector(f.south, s * Math.cos(f.th) * f.d);
    camera.up.copy(f.n);
    camera.lookAt(f.t);
    state.target.copy(f.t);
  }

  function step(dt) {
    if (state.flight) {
      const f = state.flight;
      f.t += dt / f.dur;
      const t = Math.min(1, f.t);
      const e = t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2;
      camera.position.lerpVectors(f.fromPos, f.toPos, e);
      const lift = Math.sin(Math.PI * e) * 1.6;
      if (f.toTarget.lengthSq() > 1) camera.position.addScaledVector(f.toTarget.clone().normalize(), lift);
      state.target.lerpVectors(f.fromTarget, f.toTarget, e);
      camera.up.copy(f.fromUp).lerp(f.toUp, e).normalize();
      camera.lookAt(state.target);
      if (t >= 1) {
        const home = f.toTarget.lengthSq() < 1;
        state.flight = null;
        if (home) {
          state.dist = camera.position.length();
          state.distTo = state.dist;
        } else enterFocus();
      }
      return;
    }
    if (state.focus) { stepFocus(dt); return; }
    const sp = 1.05 * dt;
    if (state.keys.has('a')) rotateFree(sp, 0);
    if (state.keys.has('d')) rotateFree(-sp, 0);
    if (state.keys.has('w')) rotateFree(0, sp);
    if (state.keys.has('s')) rotateFree(0, -sp);
    if (state.spin && state.pointers.size === 0 && performance.now() - state.lastInteract > 2800) {
      rotateFree(-dt * 0.08, 0);
    }
    const len = camera.position.length();
    const next = len + (state.distTo - len) * (1 - Math.pow(0.002, dt));
    camera.position.setLength(next);
    camera.lookAt(state.target);
  }

  function busy() { return !!state.flight; }

  canvas.addEventListener('pointerdown', (e) => {
    state.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try { canvas.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    state.lastInteract = performance.now();
    canvas.style.cursor = 'grabbing';
  });
  canvas.addEventListener('pointermove', (e) => {
    const p = state.pointers.get(e.pointerId);
    if (!p || busy()) return;
    state.lastInteract = performance.now();
    if (state.focus) {
      if (state.pointers.size === 1) {
        state.focus.thTo -= (e.clientX - p.x) * 0.007;
        state.focus.phTo -= (e.clientY - p.y) * 0.006;
      } else {
        pinch(e, p);
      }
    } else if (state.pointers.size === 1) {
      const k = 0.0045 * Math.max(0.35, (camera.position.length() - R) / (homeDist() - R));
      rotateFree((e.clientX - p.x) * k, -(e.clientY - p.y) * k);
    } else pinch(e, p);
    p.x = e.clientX;
    p.y = e.clientY;
  });
  function pinch(e, p) {
    const other = [...state.pointers.entries()].find(([id]) => id !== e.pointerId);
    if (!other) return;
    const o = other[1];
    const d0 = Math.hypot(p.x - o.x, p.y - o.y);
    const d1 = Math.hypot(e.clientX - o.x, e.clientY - o.y);
    if (d0 < 4 || d1 < 4) return;
    zoomFactor(d0 / d1);
  }
  function zoomFactor(f) {
    state.lastInteract = performance.now();
    if (state.flight) {
      state.flight = null;
      if (state.target.lengthSq() > 1) enterFocus();
      else {
        state.dist = camera.position.length();
        state.distTo = state.dist;
      }
    }
    if (state.focus) state.focus.dTo = Math.min(28, Math.max(2.4, state.focus.dTo * f));
    else state.distTo = Math.min(state.max, Math.max(state.min, state.distTo * f));
  }
  const up = (e) => {
    state.pointers.delete(e.pointerId);
    if (!state.pointers.size) canvas.style.cursor = 'grab';
  };
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    zoomFactor(1 + e.deltaY * 0.001);
  }, { passive: false });

  addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('input,textarea')) return;
    const k = e.key.toLowerCase();
    if ('wasd'.includes(k) && k.length === 1) state.keys.add(k);
  });
  addEventListener('keyup', (e) => state.keys.delete(e.key.toLowerCase()));

  limits();
  return {
    state,
    step,
    limits,
    homeDist,
    flyTo,
    goHome() {
      state.focus = null;
      const dir = camera.position.clone().normalize();
      flyTo(dir, homeDist(), new THREE.Vector3(), 1400);
    },
    nudge() { state.lastInteract = performance.now(); },
    zoomBy(deltaY) { zoomFactor(1 + deltaY * 0.001); },
    pinchBy(factor) { zoomFactor(factor); },
  };
}
