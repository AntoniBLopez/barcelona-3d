import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';

function attachDepth(rt) {
  if (rt.depthTexture) return;
  const depth = new THREE.DepthTexture(rt.width, rt.height);
  depth.format = THREE.DepthFormat;
  depth.type = THREE.UnsignedIntType;
  rt.depthTexture = depth;
}

function syncDepth(rt) {
  const d = rt.depthTexture;
  if (!d) return;
  d.image.width = rt.width;
  d.image.height = rt.height;
  d.needsUpdate = true;
}

/**
 * Colour pass keeps its depth texture. The bokeh shader already reads `.x`,
 * so it can sample that depth and skip a second full-scene render.
 */
export function createPipeline(renderer, scene, camera) {
  const composer = new EffectComposer(renderer);
  attachDepth(composer.renderTarget1);
  attachDepth(composer.renderTarget2);
  composer.addPass(new RenderPass(scene, camera));

  const bokeh = new BokehPass(scene, camera, { focus: 40, aperture: 0.00012, maxblur: 0.008 });
  bokeh.materialBokeh.fragmentShader = bokeh.materialBokeh.fragmentShader.replace(
    'gl_FragColor.a = 1.0;',
    'gl_FragColor.a = clamp(col.a / 41.0, 0.0, 1.0);',
  );
  bokeh.materialBokeh.defines.DEPTH_PACKING = 0;
  bokeh.materialBokeh.needsUpdate = true;
  let depthTex = null;
  bokeh.render = function (rend, writeBuffer, readBuffer) {
    depthTex = readBuffer.depthTexture;
    const u = this.uniforms;
    u.tDepth.value = depthTex;
    u.tColor.value = readBuffer.texture;
    u.nearClip.value = camera.near;
    u.farClip.value = camera.far;
    rend.setRenderTarget(this.renderToScreen ? null : writeBuffer);
    if (!this.renderToScreen) rend.clear();
    this.fsQuad.render(rend);
  };
  composer.addPass(bokeh);
  composer.addPass(new OutputPass());

  const occluder = createOccluder(renderer, camera, () => depthTex);
  return {
    composer,
    bokeh,
    occluder,
    setSize(w, h) {
      composer.setSize(w, h);
      syncDepth(composer.renderTarget1);
      syncDepth(composer.renderTarget2);
      occluder.resize();
    },
  };
}

function createOccluder(renderer, camera, depthOf) {
  const mat = new THREE.ShaderMaterial({
    uniforms: { tDepth: { value: null } },
    depthTest: false,
    depthWrite: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: 'uniform sampler2D tDepth; varying vec2 vUv; void main(){ gl_FragColor = vec4(texture2D(tDepth, vUv).x, 0.0, 0.0, 1.0); }',
  });
  const fs = new FullScreenQuad(mat);
  const target = new THREE.WebGLRenderTarget(4, 4, {
    type: THREE.FloatType,
    format: THREE.RGBAFormat,
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    depthBuffer: false,
    stencilBuffer: false,
  });
  let buf = new Float32Array(16);
  let ready = false;
  const size = new THREE.Vector2();

  function resize() {
    renderer.getDrawingBufferSize(size);
    const w = Math.max(2, Math.min(360, size.x));
    const h = Math.max(2, Math.round(w * (size.y / Math.max(1, size.x))));
    if (target.width === w && target.height === h) return;
    target.setSize(w, h);
    buf = new Float32Array(w * h * 4);
    ready = false;
  }

  function viewZ(depth) {
    const n = camera.near;
    const f = camera.far;
    return (n * f) / ((f - n) * depth - f);
  }

  return {
    resize,
    capture() {
      const depth = depthOf();
      if (!depth) return;
      resize();
      mat.uniforms.tDepth.value = depth;
      const prev = renderer.getRenderTarget();
      renderer.setRenderTarget(target);
      fs.render(renderer);
      renderer.readRenderTargetPixels(target, 0, 0, target.width, target.height, buf);
      renderer.setRenderTarget(prev);
      ready = true;
    },
    /** A surface at least `slack` world units in front of the anchor. */
    gap(ndcX, ndcY, ndcZ) {
      if (!ready) return null;
      const w = target.width;
      const h = target.height;
      const x = Math.min(w - 1, Math.max(0, (ndcX * 0.5 + 0.5) * w)) | 0;
      const y = Math.min(h - 1, Math.max(0, (ndcY * 0.5 + 0.5) * h)) | 0;
      const labelZ = viewZ(ndcZ * 0.5 + 0.5);
      let best = Infinity;
      for (let dy = -1; dy <= 1; dy++) {
        const yy = Math.min(h - 1, Math.max(0, y + dy));
        for (let dx = -1; dx <= 1; dx++) {
          const xx = Math.min(w - 1, Math.max(0, x + dx));
          const sceneZ = viewZ(buf[(yy * w + xx) * 4]);
          const gap = sceneZ - labelZ;
          if (gap < best) best = gap;
        }
      }
      return best;
    },
  };
}
