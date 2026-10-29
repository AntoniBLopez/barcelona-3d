import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { CITY } from '../data/city.js';
import { MONUMENTS } from './monuments.js';
import { GAUDI_BUILDERS } from './models-gaudi.js';
import { CITY_BUILDERS, mapfreArts } from './models-city.js';
import { glories } from './models-glories.js';
import { tibidabo, collserolaTower } from './models-tibidabo.js';
import { fitModel, YAW } from './fit.js';
import { buildPlanet, buildEixample, buildTrees, groundRadius } from './terrain.js';
import { buildStreets, buildTramTracks, buildTrams, stepTrams, buildMetro, buildShip, stepShip } from './transit.js';
import { createCamera } from './camera.js';
import { placeOn, project, dirLL, R, U_PER_M } from './geo.js';
import { setGlow } from './kit.js';

const coarse = matchMedia('(pointer:coarse)').matches;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

export async function createScene(canvas, hooks) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !coarse, alpha: true, premultipliedAlpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, coarse ? 1.5 : 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = !coarse;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, innerWidth / innerHeight, 0.15, 400);
  const world = new THREE.Group();
  scene.add(world);

  const hemi = new THREE.HemisphereLight('#e7f4ff', '#c2a888', 1.15);
  const sun = new THREE.DirectionalLight('#ffe6c4', 2.05);
  sun.castShadow = !coarse;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 26, bottom: -26, near: 2, far: 80 });
  sun.shadow.bias = -0.0004;
  const rim = new THREE.DirectionalLight('#d5e7ff', 0.7);
  scene.add(hemi, sun, sun.target, rim);

  const stars = new THREE.Points(
    new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(starPositions(400), 3)),
    new THREE.PointsMaterial({ color: '#fff', size: 0.08, transparent: true, opacity: 0, depthWrite: false }),
  );
  scene.add(stars);

  hooks.progress(8);
  await tick();
  const planet = buildPlanet(world);
  hooks.progress(28);
  await tick();
  buildEixample(world);
  buildTrees(world);
  hooks.progress(48);
  await tick();
  buildStreets(world);
  const tracks = buildTramTracks(world);
  const trams = buildTrams(world);
  const metro = buildMetro(world);
  const ship = buildShip(world);
  hooks.progress(64);
  await tick();

  const pickables = [];
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.92, 1.05, 32).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: '#c45c26', transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide }),
  );
  ring.visible = false;

  const builders = { ...GAUDI_BUILDERS, ...CITY_BUILDERS, glories, tibidabo };
  for (const m of MONUMENTS) {
    const builder = builders[m.id];
    const model = builder ? builder() : new THREE.Group();
    const metrics = builder ? fitModel(model, m.id) : { span: 0.2, height: 0.2 };
    const wrap = new THREE.Group();
    const base = groundRadius(m.lat, m.lng);
    placeOn(wrap, m.lat, m.lng, base, YAW[m.id] || 0);
    wrap.add(model);
    if (model.userData.animate) wrap.userData.animate = model.userData.animate;
    m.worldH = metrics.height;
    m.worldSpan = metrics.span;
    wrap.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = !coarse;
        o.receiveShadow = true;
        o.userData.id = m.id;
        pickables.push(o);
      }
    });
    world.add(wrap);
    m.obj = wrap;
    m.base = base;
  }
  const tower = collserolaTower();
  tower.scale.setScalar(U_PER_M);
  placeOn(tower, 41.4173, 2.1141, groundRadius(41.4173, 2.1141), 0);
  world.add(tower);
  const twins = mapfreArts();
  twins.scale.setScalar(U_PER_M);
  placeOn(twins, 41.3874, 2.1968, groundRadius(41.3874, 2.1968), 0.55);
  world.add(twins);
  trams.forEach((tram) => tram.rig.traverse((o) => { if (o.isMesh) pickables.push(o); }));
  hooks.progress(88);
  await tick();

  const stationWorld = CITY.metro.stations.map((s) => {
    const sph = project(s.lat, s.lng);
    return dirLL(sph.lat, sph.lon).multiplyScalar(groundRadius(s.lat, s.lng) + 0.16);
  });

  const rig = createCamera(camera, canvas);
  let composer = null;
  let bokeh = null;
  const useDof = !coarse && !reduced;
  if (useDof) {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    bokeh = new BokehPass(scene, camera, { focus: 40, aperture: 0.00012, maxblur: 0.008 });
    // Keep the CSS sky: the stock shader forces an opaque alpha.
    bokeh.materialBokeh.fragmentShader = bokeh.materialBokeh.fragmentShader.replace(
      'gl_FragColor.a = 1.0;',
      'gl_FragColor.a = clamp(col.a / 41.0, 0.0, 1.0);',
    );
    bokeh.materialBokeh.needsUpdate = true;
    composer.addPass(bokeh);
    composer.addPass(new OutputPass());
  }

  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let down = null;
  let nightK = 0;
  let nightTo = 0;
  let showTram = true;
  let showMetro = false;
  let followIdx = -1;
  let clock = 0;
  const proj = new THREE.Vector3();
  const tmp = new THREE.Color();

  function resize() {
    renderer.setSize(innerWidth, innerHeight);
    if (composer) composer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    rig.limits();
  }
  addEventListener('resize', resize);

  function applyLook(k) {
    const dusk = Math.sin(Math.PI * k);
    hemi.color.set('#e7f4ff').lerp(tmp.set('#5c6c98'), k);
    hemi.groundColor.set('#c2a888').lerp(tmp.set('#1c1a22'), k);
    hemi.intensity = 1.15 - 0.5 * k;
    sun.color.set('#ffe6c4').lerp(tmp.set('#9eb4ee'), k).lerp(tmp.set('#ff8a4a'), dusk * 0.65);
    sun.intensity = 2.05 - 1.25 * k;
    rim.color.set('#d5e7ff').lerp(tmp.set('#ffb08a'), dusk * 0.5);
    rim.intensity = 0.7 - 0.2 * k;
    planet.water.material.color.set('#4aa8b2').lerp(tmp.set('#1d4e5c'), k).lerp(tmp.set('#c98462'), dusk * 0.25);
    stars.material.opacity = 0.85 * Math.max(0, k - 0.45) / 0.55;
    setGlow(Math.min(1, Math.max(0, (k - 0.35) / 0.5)));
    ring.material.color.set(k > 0.5 ? '#e7a07a' : '#c45c26');
  }

  function pick(ev) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(pickables, false)[0];
    if (!hit) return null;
    if (hit.object.userData.kind === 'tram') return { kind: 'tram', index: hit.object.userData.tram };
    if (hit.object.userData.id) return { kind: 'monument', id: hit.object.userData.id };
    return null;
  }

  canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; });
  canvas.addEventListener('pointerup', (e) => {
    if (!down) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    down = null;
    if (moved > 6) return;
    const hit = pick(e);
    if (hit) hooks.pick(hit);
  });

  function focusMonument(m) {
    followIdx = -1;
    const n = m.obj.userData.normal;
    const south = m.obj.userData.south;
    const east = m.obj.userData.east;
    const overhead = m.id === 'guell';
    const basilica = m.id === 'sagrada';
    const bowl = m.id === 'campnou';
    const street = m.id === 'batllo' || m.id === 'arc' || m.id === 'santpau';
    const front = new THREE.Vector3(0, 0, 1).applyQuaternion(m.obj.quaternion);
    const view = street
      ? n.clone().multiplyScalar(m.id === 'arc' ? 0.18 : m.id === 'santpau' ? 0.28 : 0.42).add(front.multiplyScalar(m.id === 'arc' ? 1 : m.id === 'santpau' ? 1 : 0.9))
        .add(east.clone().multiplyScalar(m.id === 'arc' ? 0.72 : m.id === 'santpau' ? 0.34 : 0)).normalize()
      : n.clone().multiplyScalar(basilica ? 0.36 : bowl ? 0.8 : overhead ? 0.92 : 0.55)
        .add(south.clone().multiplyScalar(basilica ? 0.84 : bowl ? 0.5 : overhead ? 0.4 : 0.78))
        .add(east.clone().multiplyScalar(basilica ? 0.42 : bowl ? 0.28 : 0.2))
        .normalize();
    const h = m.worldH || 0.08;
    const lift = basilica ? 0.52 : bowl ? 0.25 : m.id === 'arc' ? 0.34 : m.id === 'santpau' ? 0.36 : street ? 0.55 : 0.45;
    const shift = street ? 0.08 : Math.min(0.55, h * 1.2);
    const focus = n.clone().multiplyScalar(m.base + h * lift).add(east.clone().multiplyScalar(shift));
    const dist = m.id === 'sagrada'
      ? 2.6
      : bowl
        ? 2.55
        : street
          ? 2.5
          : Math.min(9, Math.max(2.5, h * 7 + (m.worldSpan || h) * 3.2));
    rig.flyTo(view, dist * (innerWidth > 860 ? 1 : 1.25), focus, 1700);
    ring.position.set(m.id === 'santpau' ? 0.02 : 0, m.id === 'arc' || m.id === 'santpau' ? 0.003 : 0.02, m.id === 'santpau' ? 0.2 : 0);
    const halo = m.id === 'arc' ? m.worldH * 0.5 : m.id === 'santpau' ? m.worldH * 0.28 : (m.worldSpan || 0.2);
    ring.scale.setScalar(Math.max(0.05, halo * 0.62));
    m.obj.add(ring);
    ring.visible = true;
  }

  function followTram(index) {
    const tram = trams[index];
    if (!tram || !showTram) return;
    followIdx = index;
    ring.visible = false;
    const n = tram.rig.position.clone().normalize();
    const side = tram.rig.userData.east || new THREE.Vector3(1, 0, 0);
    const view = n.clone().multiplyScalar(0.75).add(side.clone().multiplyScalar(0.45)).normalize();
    rig.flyTo(view, innerWidth > 860 ? 4.2 : 6, tram.rig.position.clone(), 1400);
    return tram.ref;
  }

  let running = true;
  const t0 = performance.now();
  function frame(now) {
    if (!running) return;
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - (frame.prev || now)) / 1000);
    frame.prev = now;
    clock = (now - t0) / 1000;
    nightK += Math.sign(nightTo - nightK) * Math.min(Math.abs(nightTo - nightK), dt / 1.6);
    applyLook(nightK);
    stepTrams(trams, dt);
    stepShip(ship, clock);
    for (const m of MONUMENTS) m.obj.userData.animate?.(clock, nightK);
    tower.userData.animate?.(clock, nightK);
    if (followIdx >= 0 && rig.state.focus && trams[followIdx]) {
      const f = rig.state.focus;
      const p = trams[followIdx].rig.position.clone();
      const n = p.clone().normalize();
      const q = new THREE.Quaternion().setFromUnitVectors(f.n, n);
      f.east.applyQuaternion(q);
      f.south.applyQuaternion(q);
      f.n.copy(n);
      f.t.copy(p);
    }
    // Keep the sun on the visible face.
    sun.position.copy(camera.position).normalize().multiplyScalar(40);
    sun.target.position.set(0, 0, 0);
    rim.position.copy(sun.position).multiplyScalar(-0.4).add(new THREE.Vector3(0, 20, 0));
    rig.step(dt || 0.016);
      if (composer) {
      const focus = bokeh && (bokeh.uniforms || bokeh.materialBokeh?.uniforms);
      if (focus && focus.focus) focus.focus.value = camera.position.distanceTo(rig.state.target);
      composer.render();
    } else renderer.render(scene, camera);
    hooks.frame(projectLabels());
  }

  function projectLabels() {
    const out = [];
    const dist = camera.position.length();
    const zoomedOut = dist > R + 28;
    for (const m of MONUMENTS) {
      const p = m.obj.position;
      proj.copy(p).project(camera);
      const facing = p.clone().normalize().dot(camera.position.clone().normalize());
      const visible = facing > (zoomedOut ? 0.72 : 0.4) && proj.z < 1;
      out.push({
        id: m.id,
        x: (proj.x * 0.5 + 0.5) * innerWidth,
        y: (-proj.y * 0.5 + 0.5) * innerHeight,
        visible,
        major: m.major,
      });
    }
    const stations = CITY.metro.stations.map((s, i) => {
      const sph = stationWorld[i];
      proj.copy(sph).project(camera);
      const facing = sph.clone().normalize().dot(camera.position.clone().normalize());
      return {
        id: s.id,
        x: (proj.x * 0.5 + 0.5) * innerWidth,
        y: (-proj.y * 0.5 + 0.5) * innerHeight,
        visible: showMetro && facing > 0.45 && proj.z < 1,
      };
    });
    return { monuments: out, stations };
  }

  hooks.progress(100);
  await tick();
  requestAnimationFrame(frame);

  return {
    resize,
    focusMonument,
    clearFocus() { ring.visible = false; },
    goHome() { followIdx = -1; ring.visible = false; rig.goHome(); },
    followTram,
    stopFollow() { followIdx = -1; rig.goHome(); },
    setNight(on) { nightTo = on ? 1 : 0; },
    nightTarget: () => nightTo,
    setSpin(on) { rig.state.spin = on; },
    setTram(on) {
      showTram = on;
      tracks.visible = on;
      trams.forEach((t) => { t.rig.visible = on; });
      if (!on) followIdx = -1;
    },
    setMetro(on) { showMetro = on; metro.entrances.visible = on; metro.stations.visible = on; },
    zoomBy: (dy) => rig.zoomBy(dy),
    pinchBy: (f) => rig.pinchBy(f),
    tramVisible: () => showTram,
    nudge: () => rig.nudge(),
  };
}

function starPositions(n) {
  const arr = [];
  for (let i = 0; i < n; i++) {
    const u = Math.random() * 2 - 1;
    const t = Math.random() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    const r = 80 + Math.random() * 30;
    arr.push(s * Math.cos(t) * r, u * r, s * Math.sin(t) * r);
  }
  return arr;
}

function tick() { return new Promise((res) => setTimeout(res, 16)); }
