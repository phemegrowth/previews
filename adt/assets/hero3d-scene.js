// ADT Empire — live 3D logo for the homepage hero (desktop). Ported from the HyperFrames film
// (video-edits/ADT/logo-3d/assets/scene.js): same rods, light and camera path, plus a resizable canvas,
// light pulses that keep running after the intro, and mouse + scroll reactions once the logo has landed.
//
// Original film notes: The mark becomes glass rods with light running through them,
// lying on a dark reflective floor. The camera starts low along the rods (like the old Wix video),
// sweeps round and rises until it looks straight down on the finished logo.
// Everything is a pure function of time t (seconds); HyperFrames drives it through hf-seek.
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

export function createScene({ canvas, width, height, duration, layout, pixelRatio = 1 }) {
  let W = width;
  let H = height;
  const DUR = duration;

  // ---------- helpers ----------
  const clamp01 = (x) => Math.min(1, Math.max(0, x));
  const smooth = (a, b, t) => {
    const x = clamp01((t - a) / (b - a));
    return x * x * x * (x * (x * 6 - 15) + 10);
  };
  const lerp = (a, b, k) => a + (b - a) * k;
  function mulberry32(seed) {
    return () => {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let r = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rand = mulberry32(20261023);
  // Hermite spline through [time, value] keys; a key next to a hold eases to a stop
  function track(keys) {
    return (t) => {
      if (t <= keys[0][0]) return keys[0][1];
      const n = keys.length;
      if (t >= keys[n - 1][0]) return keys[n - 1][1];
      let i = 0;
      while (t > keys[i + 1][0]) i++;
      const [t0, p0] = keys[i];
      const [t1, p1] = keys[i + 1];
      const dt = t1 - t0;
      const m = (j) => {
        if (j <= 0 || j >= n - 1) return 0;
        if (keys[j + 1][1] === keys[j][1] || keys[j - 1][1] === keys[j][1]) return 0;
        return (keys[j + 1][1] - keys[j - 1][1]) / (keys[j + 1][0] - keys[j - 1][0]);
      };
      const m0 = m(i) * dt;
      const m1 = m(i + 1) * dt;
      const s = (t - t0) / dt;
      const s2 = s * s;
      const s3 = s2 * s;
      return (2 * s3 - 3 * s2 + 1) * p0 + (s3 - 2 * s2 + s) * m0 + (-2 * s3 + 3 * s2) * p1 + (s3 - s2) * m1;
    };
  }

  // ---------- renderer ----------
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(W, H, false);
  renderer.setPixelRatio(pixelRatio);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const INK = 0x120d0a;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(INK);
  scene.fog = new THREE.FogExp2(INK, 0.11);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.45;

  const camera = new THREE.PerspectiveCamera(32, W / H, 0.05, 60);

  // ---------- the mark (SVG units, from adt-mark.svg) ----------
  const S = 0.02; // world units per SVG unit
  const CX = 112;
  const CY = 97;
  const R = 4.6 * S; // rod radius (stroke 10 in the SVG)
  const toW = ([x, y]) => new THREE.Vector3((x - CX) * S, R, (y - CY) * S);
  const CORE = 0xffffff;
  const GREEN = 0xd9cbbd;
  const MINT = 0xc25b3a;
  // [points, colour, grow start, grow end]
  const RODS = [
    [[[112, 17.5], [112, 125]], CORE, 0.0, 1.25],
    [[[112, 125], [20, 175.6]], CORE, 1.05, 2.1],
    [[[112, 125], [204, 175.6]], CORE, 1.05, 2.1],
    [[[94.5, 44.5], [94.5, 117.3], [35, 150]], GREEN, 0.3, 2.0],
    [[[129.5, 44.5], [129.5, 117.3], [189, 150]], GREEN, 0.3, 2.0],
    [[[51, 177], [112, 143.5], [173, 177]], GREEN, 1.4, 2.6],
    [[[78.8, 72.5], [78.8, 106.6], [47.5, 123.8]], MINT, 0.7, 2.4],
    [[[145.2, 72.5], [145.2, 106.6], [176.5, 123.8]], MINT, 0.7, 2.4],
    [[[83, 177], [112, 161], [141, 177]], MINT, 1.8, 2.95],
  ];

  // Polyline with softly rounded corners, as a curve
  function rodCurve(pts) {
    const v = pts.map(toW);
    const path = new THREE.CurvePath();
    const round = 0.07;
    let start = v[0].clone();
    for (let i = 1; i < v.length; i++) {
      const a = v[i];
      if (i < v.length - 1) {
        const inDir = a.clone().sub(v[i - 1]).normalize();
        const outDir = v[i + 1].clone().sub(a).normalize();
        const p1 = a.clone().addScaledVector(inDir, -round);
        const p2 = a.clone().addScaledVector(outDir, round);
        path.add(new THREE.LineCurve3(start, p1));
        path.add(new THREE.QuadraticBezierCurve3(p1, a.clone(), p2));
        start = p2;
      } else {
        path.add(new THREE.LineCurve3(start, a.clone()));
      }
    }
    return path;
  }

  const coreVert = /* glsl */ `
    varying vec2 vUv;
    #include <fog_pars_vertex>
    void main() {
      vUv = uv;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      #include <fog_vertex>
    }`;
  const coreFrag = /* glsl */ `
    uniform vec3 uColor;
    uniform float uGrow;
    uniform float uBase;
    uniform float uPulse;
    uniform float uPulse2;
    uniform float uLen;
    varying vec2 vUv;
    #include <fog_pars_fragment>
    void main() {
      if (vUv.x > uGrow) discard;
      float w = 0.22 / uLen;               // pulse length ~0.22 world units
      float p = exp(-pow((vUv.x - uPulse) / w, 2.0)) + 0.7 * exp(-pow((vUv.x - uPulse2) / w, 2.0));
      float tip = exp(-pow((vUv.x - uGrow) / (0.12 / uLen), 2.0)) * step(uGrow, 0.999);
      vec3 c = uColor * (uBase + 2.0 * p + 3.4 * tip);
      gl_FragColor = vec4(c, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      #include <fog_fragment>
    }`;

  const rods = RODS.map(([pts, color, g0, g1], idx) => {
    const curve = rodCurve(pts);
    const len = curve.getLength();
    const segs = Math.max(40, Math.round(len * 90));
    const tint = new THREE.Color(color);

    const shellGeo = new THREE.TubeGeometry(curve, segs, R, 28, false);
    const shellMat = new THREE.MeshPhysicalMaterial({
      color: tint.clone().lerp(new THREE.Color(0xffffff), 0.55),
      metalness: 0,
      roughness: 0.06,
      transmission: 1,
      thickness: R * 1.6,
      ior: 1.48,
      attenuationColor: tint,
      attenuationDistance: 0.35,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      specularIntensity: 1,
      envMapIntensity: 1.4,
    });
    const shell = new THREE.Mesh(shellGeo, shellMat);
    scene.add(shell);

    const coreGeo = new THREE.TubeGeometry(curve, segs, R * 0.38, 12, false);
    const coreMat = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.merge([
        THREE.UniformsLib.fog,
        {
          uColor: { value: tint },
          uGrow: { value: 0 },
          uBase: { value: 0.55 },
          uPulse: { value: -1 },
          uPulse2: { value: -1 },
          uLen: { value: len },
        },
      ]),
      vertexShader: coreVert,
      fragmentShader: coreFrag,
      fog: true,
    });
    coreMat.uniforms.uColor.value = tint;
    const core = new THREE.Mesh(coreGeo, coreMat);
    scene.add(core);

    // Rounded glass ends: one fixed at the start, one riding the growing tip
    const capGeo = new THREE.SphereGeometry(R, 28, 18);
    const capA = new THREE.Mesh(capGeo, shellMat);
    const capB = new THREE.Mesh(capGeo, shellMat);
    const glowMat = new THREE.MeshBasicMaterial({ color: tint.clone().multiplyScalar(0.55) });
    const glowGeo = new THREE.SphereGeometry(R * 0.38, 12, 8);
    capA.add(new THREE.Mesh(glowGeo, glowMat));
    capB.add(new THREE.Mesh(glowGeo, glowMat));
    capA.position.copy(curve.getPointAt(0));
    scene.add(capA, capB);

    const ringIndexCount = shellGeo.index.count / segs; // indices per tube segment
    return { curve, len, segs, shell, shellGeo, core, coreMat, capA, capB, g0, g1, ringIndexCount, idx };
  });

  // ---------- floor: dark glossy stone with a faint data grid ----------
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 60),
    new THREE.MeshStandardMaterial({ color: 0x0d0907, metalness: 0.0, roughness: 0.42, envMapIntensity: 0.05 })
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  const grid = new THREE.GridHelper(40, 160, 0x4a3328, 0x4a3328);
  grid.position.y = 0.001;
  grid.material.transparent = true;
  grid.material.depthWrite = false;
  scene.add(grid);

  // Soft emerald light pool under the mark
  const poolTex = (() => {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const g = c.getContext("2d");
    const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    grd.addColorStop(0, "rgba(214,120,80,0.28)");
    grd.addColorStop(0.45, "rgba(194,91,58,0.14)");
    grd.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, 256, 256);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  })();
  const pool = new THREE.Mesh(
    new THREE.PlaneGeometry(7.5, 6.5),
    new THREE.MeshBasicMaterial({ map: poolTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })
  );
  pool.rotation.x = -Math.PI / 2;
  pool.position.y = 0.002;
  scene.add(pool);

  // ---------- floating light particles ----------
  const P = 260;
  const pSeed = [];
  for (let i = 0; i < P; i++) pSeed.push([(rand() - 0.5) * 9, rand() * 2.2, (rand() - 0.5) * 7, 0.05 + rand() * 0.12, rand() * 6.28]);
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(P * 3);
  pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
  const dotTex = (() => {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d");
    const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, "rgba(255,255,255,1)");
    grd.addColorStop(0.3, "rgba(255,255,255,0.6)");
    grd.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  })();
  const pMat = new THREE.PointsMaterial({ color: 0xffd2bd, size: 0.035, map: dotTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.8 });
  const points = new THREE.Points(pGeo, pMat);
  scene.add(points);

  // ---------- lights: a key that sweeps across the glass ----------
  const key = new THREE.DirectionalLight(0xfff0e2, 2.2);
  scene.add(key);
  const rim = new THREE.PointLight(0xff8a5c, 2, 5, 2);
  rim.position.set(0, 1.4, -2.2);
  scene.add(rim);
  scene.add(new THREE.HemisphereLight(0xffe9d8, 0x0d0907, 0.25));

  // ---------- post: bloom for the light inside the rods ----------
  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(pixelRatio);
  composer.setSize(W, H);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.42, 0.45, 0.78);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // ---------- camera path ----------
  // positions in world units; the final shot looks straight down on the logo
  const camX = track([[0, -1.45], [2.9, -1.35], [4.7, 2.1], [6.2, 1.0], [7.6, 0], [DUR, 0]]);
  const camY = track([[0, 1.3], [2.9, 0.62], [4.7, 1.55], [6.2, 4.6], [7.6, 9.4], [DUR, 8.95]]);
  const camZ = track([[0, 2.05], [2.9, 2.55], [4.7, 2.9], [6.2, 2.6], [7.6, 2.05], [DUR, 1.95]]);
  const tgtX = track([[0, 0.15], [2.9, 0.2], [4.7, -0.1], [6.2, 0], [7.6, 0], [DUR, 0]]);
  const tgtZ = track([[0, -0.3], [2.9, -0.1], [4.7, 0.15], [6.2, 0.05], [7.6, 0], [DUR, 0]]);
  // where the logo lands on screen at the end (px offset of the view): site = right side, brand = centred and raised for the wordmark
  // site = logo lands right of centre (website hero); center = centred, no wordmark (phone crop); brand = centred, raised for the wordmark
  const shiftX = () => (layout === "site" ? -W * 0.2 : 0);
  const shiftY = () => (layout === "brand" ? H * 0.115 : 0);

  // ix = { mx, my } mouse in -1..1 and scroll 0..1 (how far the hero has scrolled away)
  function renderAt(time, ix = { mx: 0, my: 0, scroll: 0 }) {
    const tr = Math.max(0, time || 0); // keeps running: pulses, particles
    const t = Math.min(DUR, tr); // the intro: growth and camera path
    const live = smooth(DUR - 1.2, DUR, tr); // mouse/scroll take over as the intro lands

    // rods grow, then light runs through them on a slow rhythm
    for (const r of rods) {
      const g = smooth(r.g0, r.g1, t);
      const gs = g;
      const segsShown = Math.ceil(gs * r.segs);
      r.shellGeo.setDrawRange(0, segsShown * r.ringIndexCount);
      r.shell.visible = gs > 0.001;
      r.capA.visible = gs > 0.001;
      r.capB.visible = gs > 0.001;
      r.capB.position.copy(r.curve.getPointAt(Math.max(0.0001, gs)));
      const u = r.coreMat.uniforms;
      u.uGrow.value = g;
      u.uBase.value = 0.45 + 0.2 * smooth(3.2, 5, t) + 0.45 * smooth(6.6, 8.2, t);
      const period = 2.6;
      const phase = (tr - r.g1 - (r.idx % 3) * 0.35) / period;
      u.uPulse.value = tr > r.g1 ? (phase - Math.floor(phase)) * 1.6 - 0.3 : -1;
      const phase2 = phase + 0.5;
      u.uPulse2.value = tr > r.g1 + period * 0.5 ? (phase2 - Math.floor(phase2)) * 1.6 - 0.3 : -1;
    }

    // light sweep across the glass
    const sweep = lerp(-1.2, 1.4, smooth(0.5, 8.5, t)) + live * ix.mx * 0.9; // the light follows the mouse
    key.position.set(Math.sin(sweep) * 5, 3.2 + live * ix.my * 1.2, Math.cos(sweep) * 3.5);
    key.intensity = 1.1 + 1.0 * Math.exp(-Math.pow((t - 5.2) / 0.9, 2));

    // floor details
    grid.material.opacity = 0.07 + 0.05 * smooth(0, 2, t) - 0.05 * smooth(6.5, 8, t);
    pool.material.opacity = 0.15 + 0.55 * smooth(1.5, 4.5, t);
    rim.intensity = 0.8 + 1.6 * smooth(1, 3.5, t);

    // particles drift upward and fade near the end of the move
    for (let i = 0; i < P; i++) {
      const [x, y0, z, sp, ph] = pSeed[i];
      const y = (((y0 + tr * sp) % 2.2) + 2.2) % 2.2;
      pPos[i * 3] = x + 0.08 * Math.sin(tr * 0.5 + ph);
      pPos[i * 3 + 1] = y;
      pPos[i * 3 + 2] = z + 0.08 * Math.cos(tr * 0.4 + ph);
    }
    pGeo.getAttribute("position").needsUpdate = true;
    pMat.opacity = 0.75 - 0.45 * smooth(6.5, 8, t);

    // camera
    // after the intro: the mouse tilts the view a little; scrolling lifts and turns the camera away
    const sc = ix.scroll * live;
    const mx = ix.mx * live;
    const my = ix.my * live;
    const ang = mx * 0.1 + sc * 0.55;
    const bx = camX(t), bz = camZ(t);
    camera.position.set(
      bx * Math.cos(ang) + bz * Math.sin(ang),
      camY(t) * (1 + sc * 0.35) - my * 0.45,
      -bx * Math.sin(ang) + bz * Math.cos(ang) + my * 0.25
    );
    camera.up.set(0, 1, 0); // the end view keeps a slight tilt, so up never lines up with the view
    const fit = Math.max(1.12, 1.95 / camera.aspect);
    camera.position.set(tgtX(t) + (camera.position.x - tgtX(t)) * fit, camera.position.y * fit, tgtZ(t) + (camera.position.z - tgtZ(t)) * fit);
    camera.lookAt(tgtX(t), 0, tgtZ(t));
    const f = smooth(5.8, 7.8, t);
    camera.setViewOffset(W, H, shiftX() * f, shiftY() * f, W, H);

    composer.render();
  }

  function setSize(w, h) {
    W = w;
    H = h;
    renderer.setSize(W, H, false);
    composer.setSize(W, H);
    bloom.resolution.set(W, H);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
  }

  return { renderAt, setSize };
}
