// Victoria 28 · live availability v8 (Pheme Growth for VRI)
// The building, courtyard and neighbourhood are a Blender model built from the architect plans
// (blender/build_v28.py), lit like the dusk renders and baked into textures (model/v28.glb).
// Clickable flats come from the traced plans (model.json). Navigation: see the hint in the sidebar.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';
import { GLTFLoader } from 'three/addons/GLTFLoader.js';
import { Sky } from 'three/addons/objects/Sky.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const V = document.currentScript?.src?.split('v=')[1] || Date.now();
const UNITS = window.V28_UNITS;
const FH = 3.4, SLAB = 0.45, WALL_H = FH - SLAB;
const FLOOR_NAMES = ['Ground floor', 'First floor', 'Second floor'];
const PLAN_IMG = ['plans/ground.jpg', 'plans/first.jpg', 'plans/second.jpg'];
const eur = n => '€' + Math.round(n).toLocaleString('en-GB');
const type = u => u.beds === 0 ? 'Studio' : `${u.beds}-bedroom`;
const $ = id => document.getElementById(id);
const MODEL = await fetch('model.json?v=8').then(r => r.json());
const ROOMS = await fetch('rooms.json?v=8').then(r => r.json()).catch(() => ({}));

// ================= renderer / scene =================
const canvas = $('c'), stage = $('stage');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 4000);

// dusk sky like the renders (deep blue above, warm band at the horizon)
const sky = new Sky(); sky.scale.setScalar(3000); scene.add(sky);
const sunDir = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(88.5), THREE.MathUtils.degToRad(-110));
const SU = sky.material.uniforms;
SU.turbidity.value = 4; SU.rayleigh.value = 2.2; SU.mieCoefficient.value = 0.004; SU.mieDirectionalG.value = 0.85; SU.sunPosition.value.copy(sunDir);
{ const pm = new THREE.PMREMGenerator(renderer); const envScene = new THREE.Scene(); const s2 = new Sky(); s2.scale.setScalar(1000);
  for (const k of Object.keys(SU)) s2.material.uniforms[k].value = SU[k].value; envScene.add(s2); scene.environment = pm.fromScene(envScene, 0.04).texture; }
scene.fog = new THREE.FogExp2(0x8e8aa0, 0.0012);
// lights only matter for the plants and furniture (the architecture carries its own baked light)
scene.add(new THREE.HemisphereLight(0xaab4d4, 0x4a3a30, 1.1));
const sun = new THREE.DirectionalLight(0xffb070, 1.0); sun.position.copy(sunDir).multiplyScalar(120).setY(14); scene.add(sun);
const lamp = new THREE.PointLight(0xffd29a, 0, 10, 1.6); scene.add(lamp);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.45, 0.5, 0.9);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// ================= helpers =================
function shapeOf(p) {
  const s = new THREE.Shape(p.outer.map(([x, z]) => new THREE.Vector2(x, z)));
  for (const h of p.holes || []) s.holes.push(new THREE.Path(h.map(([x, z]) => new THREE.Vector2(x, z))));
  return s;
}
function extrude(polys, h, top, mat) {
  if (!polys.length) return null;
  const g = new THREE.ExtrudeGeometry(polys.map(shapeOf), { depth: h, bevelEnabled: false, curveSegments: 4 });
  g.rotateX(Math.PI / 2); const m = new THREE.Mesh(g, mat); m.position.y = top; return m;
}
const centroid = poly => {
  let a = 0, cx = 0, cz = 0; const p = poly.outer;
  for (let i = 0; i < p.length; i++) { const [x0, z0] = p[i], [x1, z1] = p[(i + 1) % p.length], f = x0 * z1 - x1 * z0; a += f; cx += (x0 + x1) * f; cz += (z0 + z1) * f; }
  return a ? [cx / (3 * a), cz / (3 * a), Math.abs(a / 2)] : [p[0][0], p[0][1], 0];
};

// ================= the baked model =================
const floors = [new THREE.Group(), new THREE.Group(), new THREE.Group(), new THREE.Group()];
floors.forEach((g, i) => { g.userData.floor = i; scene.add(g); });
const wallMeshes = [[], [], []];
const loading = $('loading');
const gltf = await new GLTFLoader().loadAsync(`model/v28.glb?v=${V}`, e => { if (loading && e.total) loading.textContent = `Loading the building… ${Math.round(e.loaded / e.total * 100)}%`; });
const root = gltf.scene;
const GLASSY = {   // thin shiny parts are not baked: real reflections from the dusk sky
  glass: new THREE.MeshStandardMaterial({ color: 0xc9dfe8, transparent: true, opacity: 0.32, roughness: 0.04, metalness: 0.15, envMapIntensity: 1.4, depthWrite: false, side: THREE.DoubleSide }),
  railglass: new THREE.MeshStandardMaterial({ color: 0xd8e9f0, transparent: true, opacity: 0.2, roughness: 0.02, metalness: 0.1, envMapIntensity: 1.4, depthWrite: false, side: THREE.DoubleSide }),
  water: new THREE.MeshBasicMaterial({ color: 0x7fdcf2, transparent: true, opacity: 0.55, toneMapped: false, depthWrite: false }),
};
root.traverse(o => {
  if (!o.isMesh) return;
  const m = o.material;
  if (m && m.name.startsWith('BAKED_')) {   // lighting already baked in: show the texture as it is
    const tex = m.emissiveMap || m.map; if (tex) { tex.anisotropy = 8; tex.colorSpace = THREE.SRGBColorSpace; }
    const glassy = m.name.endsWith('_glass');
    o.material = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, transparent: glassy, opacity: glassy ? 0.42 : 1, depthWrite: !glassy, side: THREE.FrontSide });
  } else if (m && (o.name.includes('_glass') || o.name.includes('rail') || o.name.includes('pool_water'))) {
    o.material = o.name.includes('pool_water') ? GLASSY.water : o.name.includes('rail') ? GLASSY.railglass : GLASSY.glass; o.renderOrder = 3; }
  else if (m && m.emissive && m.emissiveIntensity > 1) { o.material = new THREE.MeshBasicMaterial({ color: m.emissive.clone().multiplyScalar(Math.min(m.emissiveIntensity, 6)), toneMapped: false }); }
  else if (m) { m.envMapIntensity = 0.5; if (m.transparent || m.alphaTest) { m.alphaTest = Math.max(m.alphaTest, 0.35); m.transparent = false; m.depthWrite = true; } m.side = THREE.DoubleSide; }
  o.frustumCulled = true;
});
// collections exported as groups: F0_ext/F0_int … ROOF, SITE, props, trees
const byName = n => root.getObjectByName(n);
for (let f = 0; f < 3; f++) for (const k of ['ext', 'int']) { const g = byName(`F${f}_${k}`); if (g) floors[f].add(g); }
{ const r = byName('ROOF'); if (r) floors[3].add(r); }
for (const n of ['SITE', 'props', 'trees']) { const g = byName(n); if (g) scene.add(g); }
root.children.slice().forEach(c => scene.add(c));   // anything left (e.g. objects outside collections)
for (let f = 0; f < 3; f++) floors[f].traverse(o => { if (o.isMesh && o.name.startsWith('BAKED_F') && !o.name.endsWith('_int')) wallMeshes[f].push(o); });
if (loading) loading.remove();

// clickable flats (traced outlines), coloured by availability on demand
const flatMeshes = [], flatFloors = {};
for (let f = 0; f <= 2; f++) {
  const d = MODEL[String(f)], base = f * FH;
  for (const [id, polys] of Object.entries(d.flats)) {
    const u = UNITS.find(x => x.id === id); if (!u || !polys.length) continue;
    const vol = extrude(polys, WALL_H + 0.2, base + FH + 0.1, new THREE.MeshStandardMaterial({ transparent: true, opacity: 0.4, roughness: 0.6, depthWrite: false }));
    vol.userData.unit = u; vol.renderOrder = 2; floors[f].add(vol); flatMeshes.push(vol);
    const tint = extrude(polys, 0.02, base + SLAB + 0.07, new THREE.MeshBasicMaterial({ color: 0xF8B808, transparent: true, opacity: 0.18, depthWrite: false }));
    tint.visible = false; floors[f].add(tint); flatFloors[id] = tint;
    const big = polys.reduce((a, b) => centroid(b)[2] > centroid(a)[2] ? b : a), [mx, mz] = centroid(big);
    const lv = ROOMS[String(f)]?.[id]?.rooms?.find(r => r.type === 'living');
    const [cx, cz] = lv ? [lv.box[0] + lv.box[4][0] * 0.8, lv.box[1] + lv.box[4][1] * 0.8] : d.seats?.[id] || [mx, mz];
    if (lv) u._face = lv.box[4];
    u._center = new THREE.Vector3(cx, base + SLAB + 1.55, cz); u._mid = new THREE.Vector3(mx, base + 1.5, mz);
    u._floorY = base; u._mesh = vol;
    u.view = Math.abs(cz) < 13 ? 'Pool & courtyard view' : 'Open outer view';
  }
}

// ================= state & filters =================
const state = { floor: 'all', beds: 'all', block: 'all', pmax: 260000, onlyAvail: false, hover: null, sel: null, colours: false, mode: 'overview' };
const COL = { available: new THREE.Color(0x2e9d5b), reserved: new THREE.Color(0xc4473a), hover: new THREE.Color(0xF8B808) };
const matches = u => (state.floor === 'all' || u.floor === +state.floor) && (state.beds === 'all' || u.beds === +state.beds)
  && (state.block === 'all' || u.block === state.block) && u.price <= state.pmax && (!state.onlyAvail || u.status === 'available');
function paint() {
  const inside = state.mode !== 'overview';
  const topFloor = state.mode === 'walk' ? state.sel.floor + 1 : inside ? state.sel.floor : state.floor === 'all' ? 3 : +state.floor;
  for (const g of floors) g.visible = g.userData.floor <= topFloor;
  for (const m of flatMeshes) {
    const u = m.userData.unit, on = matches(u), hot = state.hover === u || state.sel === u;
    m.material.color.copy(hot ? COL.hover : COL[u.status]); m.material.opacity = hot ? 0.6 : 0.36;
    m.visible = !inside && (hot || (state.colours && on));
  }
  for (const [id, t] of Object.entries(flatFloors)) t.visible = inside && state.sel.id === id;
  const n = UNITS.filter(matches).length;
  $('counts').innerHTML = `<b>${UNITS.filter(u => u.status === 'available').length}</b> of ${UNITS.length} flats available` + (n !== UNITS.length ? ` · ${n} match` : '');
  $('colours').classList.toggle('on', state.colours);
  $('exit').hidden = !inside; stage.classList.toggle('walking', state.mode === 'walk');
  renderList();
}
document.querySelectorAll('.seg').forEach(seg => seg.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  seg.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
  state[seg.dataset.f] = b.dataset.v; if (b.dataset.v !== 'all' && seg.dataset.f !== 'floor') state.colours = true;
  if (seg.dataset.f === 'floor') leaveInside(false);
  paint();
}));
const pmax = $('pmax'), pmaxv = $('pmaxv');
const setP = () => { state.pmax = +pmax.value; pmaxv.textContent = eur(state.pmax); };
pmax.addEventListener('input', () => { setP(); paint(); }); setP();
$('onlyAvail').addEventListener('change', e => { state.onlyAvail = e.target.checked; if (e.target.checked) state.colours = true; paint(); });

// ================= navigation =================
// Overview: left-drag turns around the point you look at, right-drag moves, scroll zooms.
// Keys and the on-screen pad do the same. Limits keep you above ground and on the site.
const controls = new OrbitControls(camera, canvas);
Object.assign(controls, { enableDamping: false, dampingFactor: 0.15, zoomSpeed: 1.6, rotateSpeed: 0.75, panSpeed: 1.1,
  screenSpacePanning: false, zoomToCursor: true, minDistance: 4, maxDistance: 170, maxPolarAngle: 1.47, autoRotate: false, autoRotateSpeed: 0.35 });
const BOUNDS = { x: 120, z: 120, y0: 0, y1: 14 };
let camGoal = null, walk = null;
controls.addEventListener('start', () => { controls.autoRotate = false; camGoal = null; });
function flyTo(pos, target) { controls.autoRotate = false; camGoal = { pos: pos.clone(), target: target.clone() }; }
function aim(target, dist, polar = 0.95, dir = null) {
  const d = dir ? dir.clone().setY(0).normalize() : camera.position.clone().sub(controls.target).setY(0).normalize();
  flyTo(target.clone().add(d.multiplyScalar(Math.sin(polar) * dist)).setY(target.y + Math.cos(polar) * dist), target);
}
const HOME = () => flyTo(new THREE.Vector3(-62, 34, 48), new THREE.Vector3(0, 4, 0));
const VIEWS = {
  home: HOME,
  street: () => flyTo(new THREE.Vector3(-31, 1.7, -4), new THREE.Vector3(0, 6, 0)),
  courtyard: () => flyTo(new THREE.Vector3(-21, 1.8, 0.4), new THREE.Vector3(8, 4.5, 0)),
  top: () => flyTo(new THREE.Vector3(0, 100, 0.1), new THREE.Vector3(0, 0, 0)),
};
const sph = new THREE.Spherical();
function orbit(dTheta, dPhi, zoom = 1) {
  camGoal = null; controls.autoRotate = false;
  const off = camera.position.clone().sub(controls.target); sph.setFromVector3(off);
  sph.theta += dTheta; sph.phi = THREE.MathUtils.clamp(sph.phi + dPhi, 0.05, controls.maxPolarAngle);
  sph.radius = THREE.MathUtils.clamp(sph.radius * zoom, controls.minDistance, controls.maxDistance);
  camera.position.copy(controls.target).add(off.setFromSpherical(sph));
}
function pan(fwd, side) {
  camGoal = null; controls.autoRotate = false;
  const f = controls.target.clone().sub(camera.position).setY(0); if (f.lengthSq() < 1e-6) f.set(0, 0, -1); f.normalize();
  const r = new THREE.Vector3(-f.z, 0, f.x);
  const k = Math.max(0.5, camera.position.distanceTo(controls.target) * 0.035);
  const m = f.multiplyScalar(fwd * k).add(r.multiplyScalar(side * k));
  camera.position.add(m); controls.target.add(m);
}
function act(cmd) {
  if (walk) {
    ({ fwd: () => stepWalk(0.12, 0), back: () => stepWalk(-0.12, 0), left: () => stepWalk(0, -0.1), right: () => stepWalk(0, 0.1),
       in: () => stepWalk(0.12, 0), out: () => stepWalk(-0.12, 0),
       turnL: () => { walk.yaw += 0.035; applyWalk(); }, turnR: () => { walk.yaw -= 0.035; applyWalk(); },
       up: () => { walk.pitch = Math.min(1.2, walk.pitch + 0.025); applyWalk(); }, down: () => { walk.pitch = Math.max(-1.2, walk.pitch - 0.025); applyWalk(); },
       home: () => leaveInside(true) })[cmd]?.();
    return;
  }
  ({ fwd: () => pan(1, 0), back: () => pan(-1, 0), left: () => pan(0, -1), right: () => pan(0, 1),
     turnL: () => orbit(0.03, 0), turnR: () => orbit(-0.03, 0), up: () => orbit(0, -0.025), down: () => orbit(0, 0.025),
     in: () => orbit(0, 0, 0.96), out: () => orbit(0, 0, 1.04), home: () => { leaveInside(false); HOME(); } })[cmd]?.();
}
document.querySelectorAll('[data-act]').forEach(b => {   // pad: press and hold to keep moving
  let on = false;
  const go = e => { e.preventDefault(); on = true; held.add(b.dataset.act); if (b.dataset.act === 'home') { act('home'); held.delete('home'); } };
  const stop = () => { if (on) held.delete(b.dataset.act); on = false; };
  b.addEventListener('pointerdown', go); b.addEventListener('pointerup', stop); b.addEventListener('pointerleave', stop); b.addEventListener('pointercancel', stop);
});
const KEYMAP = { KeyW: 'fwd', ArrowUp: 'fwd', KeyS: 'back', ArrowDown: 'back', KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right',
  KeyQ: 'turnL', KeyE: 'turnR', KeyR: 'up', KeyF: 'down', Equal: 'in', NumpadAdd: 'in', Minus: 'out', NumpadSubtract: 'out' };
const held = new Set();
addEventListener('keydown', e => {
  if (e.target.closest?.('input,select,textarea')) return;
  if (e.key === 'Escape') { $('lb').hidden = true; if (state.mode !== 'overview') leaveInside(true); return; }
  if (e.code === 'KeyH') { act('home'); return; }
  if (KEYMAP[e.code]) { held.add(KEYMAP[e.code]); e.preventDefault(); }
});
addEventListener('keyup', e => held.delete(KEYMAP[e.code]));
addEventListener('blur', () => held.clear());
document.querySelector('.camviews').addEventListener('click', e => {
  const b = e.target.closest('button[data-cam]'); if (!b) return;
  leaveInside(false); VIEWS[b.dataset.cam](); paint();
});
$('colours').addEventListener('click', () => { state.colours = !state.colours; paint(); });
camera.position.set(-62, 34, 48); controls.target.set(0, 4, 0);

// ---------- minimap: where you are (dot), where you look (cone), what you orbit (ring)
const mm = $('minimap'), mg = mm.getContext('2d');
const MMS = 3.0, mmW = mm.width, mmH = mm.height;
const toMM = (x, z) => [mmW / 2 + x * MMS, mmH / 2 + z * MMS], fromMM = (px, py) => [(px - mmW / 2) / MMS, (py - mmH / 2) / MMS];
const mmBase = document.createElement('canvas'); mmBase.width = mmW; mmBase.height = mmH;
{
  const g = mmBase.getContext('2d'); g.fillStyle = '#e9e3d8'; g.fillRect(0, 0, mmW, mmH);
  g.fillStyle = '#4a4a4a'; g.beginPath(); MODEL.site.road.forEach(([x, z], i) => { const [u, v] = toMM(x, z); i ? g.lineTo(u, v) : g.moveTo(u, v); }); g.closePath(); g.fill();
  const [[px0, pz0], [px1, pz1]] = MODEL.site.pool; g.fillStyle = '#5cc7ee'; const a = toMM(px0, pz0), b = toMM(px1, pz1); g.fillRect(a[0], a[1], b[0] - a[0], b[1] - a[1]);
  g.fillStyle = '#ffffff'; g.strokeStyle = '#b9ac98';
  for (const s of MODEL['1'].slab) { g.beginPath(); s.outer.forEach(([x, z], i) => { const [u, v] = toMM(x, z); i ? g.lineTo(u, v) : g.moveTo(u, v); }); g.closePath(); g.fill(); g.stroke(); }
  g.fillStyle = '#7a6f62'; g.font = '600 10px "Exo 2", sans-serif'; g.textAlign = 'center';
  g.fillText('BLOCK B', mmW / 2, toMM(0, -13)[1]); g.fillText('BLOCK A', mmW / 2, toMM(0, 14)[1]); g.save(); g.translate(toMM(-29, 0)[0], mmH / 2); g.rotate(-Math.PI / 2); g.fillStyle = '#fff'; g.fillText('STREET', 0, 4); g.restore();
}
function drawMinimap() {
  mg.drawImage(mmBase, 0, 0);
  if (state.sel?._mid) { const [u, v] = toMM(state.sel._mid.x, state.sel._mid.z); mg.fillStyle = '#F8B808'; mg.beginPath(); mg.arc(u, v, 5, 0, 7); mg.fill(); }
  const [cx0, cy0] = toMM(camera.position.x, camera.position.z);
  const cx = THREE.MathUtils.clamp(cx0, 5, mmW - 5), cy = THREE.MathUtils.clamp(cy0, 5, mmH - 5);
  const dir = new THREE.Vector3(); camera.getWorldDirection(dir); const yaw = Math.atan2(dir.z, dir.x), half = THREE.MathUtils.degToRad(camera.fov * camera.aspect / 2);
  mg.fillStyle = 'rgba(248,184,8,.45)'; mg.beginPath(); mg.moveTo(cx, cy); mg.arc(cx, cy, 40, yaw - half, yaw + half); mg.closePath(); mg.fill();
  if (!walk) { const [tx, ty] = toMM(controls.target.x, controls.target.z); mg.strokeStyle = '#1d1d1b'; mg.lineWidth = 1.5; mg.beginPath(); mg.arc(tx, ty, 4, 0, 7); mg.stroke(); }
  mg.fillStyle = '#1d1d1b'; mg.beginPath(); mg.arc(cx, cy, 5, 0, 7); mg.fill();
  $('alt').textContent = walk ? `Inside flat ${state.sel.id}` : `You · height ${Math.max(0, camera.position.y).toFixed(0)} m`;
}
// minimap is a guide only (no click-to-move)

// ---------- inside a flat
function enterFlat(u, mode) {
  state.sel = u; state.mode = mode; camGoal = null;
  if (mode === 'dollhouse') {
    controls.enabled = true; walk = null; camera.fov = 38; camera.updateProjectionMatrix();
    const c = u._mid.clone(); c.y = u._floorY + 0.8;
    const front = u.view.startsWith('Pool');
    aim(c, 20, 0.6, new THREE.Vector3(0.4, 0, (c.z > 0 ? 1 : -1) * (front ? -1 : 1)));
  } else {
    controls.enabled = false;
    camera.position.copy(u._center); camera.fov = 70; camera.updateProjectionMatrix();
    const front = u.view.startsWith('Pool');
    walk = { yaw: u._face ? Math.atan2(u._face[0], u._face[1]) : ((u._center.z > 0) === front) ? Math.PI : 0, pitch: -0.06 };
    applyWalk();
  }
  paint();
}
function leaveInside(fly = true) {
  if (state.mode === 'overview') return;
  state.mode = 'overview'; controls.enabled = true; walk = null;
  camera.fov = 38; camera.updateProjectionMatrix();
  if (fly && state.sel) aim(state.sel._mid, 42, 1.0);
  paint();
}
function applyWalk() {
  const dir = new THREE.Vector3(Math.sin(walk.yaw) * Math.cos(walk.pitch), Math.sin(walk.pitch), Math.cos(walk.yaw) * Math.cos(walk.pitch));
  camera.lookAt(camera.position.clone().add(dir));
  controls.target.copy(camera.position.clone().add(dir.multiplyScalar(2)));
}
const wallRay = new THREE.Raycaster();
function stepWalk(fwd, side) {   // stop at walls
  const v = new THREE.Vector3(Math.sin(walk.yaw) * fwd + Math.sin(walk.yaw - Math.PI / 2) * side, 0, Math.cos(walk.yaw) * fwd + Math.cos(walk.yaw - Math.PI / 2) * side);
  const len = v.length(); if (!len) return;
  wallRay.set(camera.position, v.clone().normalize()); wallRay.far = len + 0.35;
  const walls = wallMeshes[state.sel.floor];
  if (wallRay.intersectObjects(walls, false).length) return;
  camera.position.add(v); applyWalk();
}
$('exit').addEventListener('click', () => leaveInside(true));
canvas.addEventListener('wheel', e => { if (!walk) return; e.preventDefault(); stepWalk(-Math.sign(e.deltaY) * 0.4, 0); }, { passive: false });

// ---------- picking & dragging
const ray = new THREE.Raycaster(), mouse = new THREE.Vector2(), tip = $('tip');
function pick(ev) {
  if (state.mode !== 'overview') return null;
  const r = canvas.getBoundingClientRect();
  mouse.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(mouse, camera);
  const cands = flatMeshes.filter(m => m.parent.visible && (state.colours ? matches(m.userData.unit) : true));
  const hit = ray.intersectObjects(cands, false)[0];   // raycasting ignores .visible: hidden volumes stay clickable
  return hit ? hit.object.userData.unit : null;
}
let down = null, last = null;
canvas.addEventListener('pointerdown', ev => { down = [ev.clientX, ev.clientY]; last = [ev.clientX, ev.clientY]; if (walk) canvas.setPointerCapture(ev.pointerId); });
canvas.addEventListener('pointermove', ev => {
  if (walk) {
    if (down && (ev.buttons & 1)) { walk.yaw -= (ev.clientX - last[0]) * 0.0035; walk.pitch = THREE.MathUtils.clamp(walk.pitch + (ev.clientY - last[1]) * 0.0035, -1.2, 1.2); applyWalk(); }
    last = [ev.clientX, ev.clientY]; return;
  }
  if (down && Math.hypot(ev.clientX - down[0], ev.clientY - down[1]) > 4) { tip.style.display = 'none'; return; }
  const u = pick(ev);
  if (u !== state.hover) { state.hover = u; paint(); }
  canvas.style.cursor = u ? 'pointer' : 'grab';
  if (u) {
    const r = stage.getBoundingClientRect();
    tip.style.display = 'block'; tip.style.left = ev.clientX - r.left + 'px'; tip.style.top = ev.clientY - r.top + 'px';
    tip.innerHTML = `Flat ${u.id} · ${type(u)} · ${u.status === 'available' ? `<b>${eur(u.price)}</b>` : 'Reserved'}`;
  } else tip.style.display = 'none';
});
addEventListener('pointerup', () => { down = null; });
addEventListener('visibilitychange', () => held.clear());
canvas.addEventListener('pointerleave', () => { tip.style.display = 'none'; if (state.hover) { state.hover = null; paint(); } });
canvas.addEventListener('pointerup', ev => {
  const moved = down && Math.hypot(ev.clientX - down[0], ev.clientY - down[1]) > 5; down = null;
  if (moved || walk) return;
  const u = pick(ev); if (u) select(u);
});
canvas.addEventListener('contextmenu', e => e.preventDefault());
// (no double-click flying: the view only moves while a button is held)

// ================= flat panel =================
const panel = $('panel'), unitEl = $('unit');
const INTERIORS = {
  0: ['int-living', 'int-kitchen-dining', 'int-bathroom'],
  1: ['int-living-dining', 'int-bedroom', 'int-kitchen-dining', 'int-bathroom', 'int-living'],
  2: ['int-living-2', 'int-living-dining', 'int-bedroom', 'int-kitchen-dining', 'int-bathroom', 'int-living'],
};
function select(u) {
  state.sel = u; state.mode = 'overview'; walk = null; controls.enabled = true; camera.fov = 38; camera.updateProjectionMatrix();
  panel.hidden = false; history.replaceState(null, '', '#' + u.id);
  paint();
  const spec = (k, v) => v ? `<div><span>${k}</span><b>${v}</b></div>` : '';
  unitEl.innerHTML = `
    <div class="u-head"><small>Block ${u.block} · ${FLOOR_NAMES[u.floor]}</small>
      <h2>Flat ${u.id}</h2><span class="chip ${u.status}">${u.status === 'available' ? 'Available' : 'Reserved'}</span></div>
    ${u.status === 'available' ? `<div class="price">${eur(u.price)} <small>+ VAT</small></div>` : ''}
    <div class="specs">
      ${spec('Type', type(u))}${spec('Bathrooms', u.baths)}${spec('Internal', u.internal + ' m²')}${spec('Covered veranda', u.veranda + ' m²')}
      ${spec('Private roof garden', u.roofGarden ? u.roofGarden + ' m²' : '')}${spec('Total', u.total + ' m²')}${spec('View', u.view)}${spec('Included', 'Parking + storage')}
    </div>
    <h4>Floor plan · ${FLOOR_NAMES[u.floor]}</h4>
    <img class="plan" src="${PLAN_IMG[u.floor]}" alt="${FLOOR_NAMES[u.floor]} plan" data-zoom>
    ${u.roofGarden ? `<img class="plan" style="margin-top:6px" src="plans/roof.jpg" alt="Roof gardens plan" data-zoom>` : ''}
    <h4>Interior renders</h4>
    <div class="thumbs">${INTERIORS[u.beds].map(n => `<img src="img/${n}.jpg" alt="" data-zoom>`).join('')}</div>
    <p class="note">Interior images show the design style. Areas and prices are subject to change; prices exclude VAT.</p>
    <h4>${u.status === 'available' ? 'Book a viewing' : 'Ask about similar flats'}</h4>
    <form class="lead" id="lead">
      <input name="name" placeholder="Full name" required><input name="phone" placeholder="Phone / WhatsApp" required><input name="email" type="email" placeholder="Email">
      <select name="lang"><option>English</option><option>Ελληνικά</option><option>Русский</option><option>Srpski</option><option>Deutsch</option><option>Հայերեն</option><option>العربية</option></select>
      <button>Send enquiry</button>
    </form>
    <button class="share" id="share">Copy link to this flat</button>`;
  $('lead').addEventListener('submit', e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    const lead = { ...d, project: 'Victoria 28', flat: u.id, block: u.block, floor: FLOOR_NAMES[u.floor], price: u.price, at: new Date().toISOString() };
    try { const all = JSON.parse(localStorage.getItem('v28-leads') || '[]'); all.push(lead); localStorage.setItem('v28-leads', JSON.stringify(all)); } catch {}
    e.target.outerHTML = `<div class="sent">Thank you ${d.name.split(' ')[0]}. Our sales team will contact you about Flat ${u.id}.<br><small>Arrives in the CRM tagged: V28 · Flat ${u.id} · Block ${u.block} · ${FLOOR_NAMES[u.floor]}</small></div>`;
  });
  $('share').addEventListener('click', e => { navigator.clipboard?.writeText(location.href); e.target.textContent = 'Link copied'; });
  panel.scrollTop = 0;
}
$('close').addEventListener('click', () => { leaveInside(false); panel.hidden = true; state.sel = null; paint(); history.replaceState(null, '', location.pathname); });

// ================= list + gallery =================
let sortKey = 'id', sortDir = 1;
function renderList() {
  const el = $('list'); if (el.hidden) return;
  const cols = [['id', 'Flat'], ['block', 'Block'], ['floor', 'Floor'], ['beds', 'Type'], ['internal', 'Internal m²'], ['total', 'Total m²'], ['price', 'Price'], ['status', 'Status']];
  const rows = UNITS.filter(matches).sort((a, b) => (a[sortKey] > b[sortKey] ? 1 : a[sortKey] < b[sortKey] ? -1 : 0) * sortDir);
  el.innerHTML = `<table><tr>${cols.map(([k, l]) => `<th data-k="${k}">${l}${sortKey === k ? (sortDir > 0 ? ' ↑' : ' ↓') : ''}</th>`).join('')}</tr>
    ${rows.map(u => `<tr class="row" data-id="${u.id}"><td><b>${u.id}</b></td><td>${u.block}</td><td>${FLOOR_NAMES[u.floor].replace(' floor', '')}</td><td>${type(u)}</td><td>${u.internal}</td><td>${u.total}</td><td>${u.status === 'available' ? eur(u.price) : '—'}</td><td><span class="chip ${u.status}">${u.status}</span></td></tr>`).join('')}</table>`;
}
$('list').addEventListener('click', e => {
  const th = e.target.closest('th'); if (th) { sortDir = sortKey === th.dataset.k ? -sortDir : 1; sortKey = th.dataset.k; renderList(); return; }
  const tr = e.target.closest('tr.row'); if (tr) { select(UNITS.find(u => u.id === tr.dataset.id)); }
});
const GALLERY = ['front-entrance', 'front-entrance-2', 'street-view', 'street-view-2', 'pool-loungers', 'courtyard-aerial', 'pool-aerial', 'pool-detail',
  'int-living-dining', 'int-living', 'int-living-2', 'int-kitchen-dining', 'int-bedroom', 'int-bathroom'];
$('gallery').innerHTML = GALLERY.map(n => `<img src="img/${n}.jpg" alt="" loading="lazy" data-zoom>`).join('');
function showView(v) {
  document.querySelectorAll('.views button').forEach(x => x.classList.toggle('on', x.dataset.view === v));
  $('list').hidden = v !== 'list'; $('gallery').hidden = v !== 'gallery'; $('rview').hidden = v !== 'building'; renderList();
  view = v;
}
document.querySelector('.views').addEventListener('click', e => { const b = e.target.closest('button'); if (b) showView(b.dataset.view); });
const lb = $('lb');
document.addEventListener('click', e => {
  if (e.target.matches('[data-zoom]')) { lb.querySelector('img').src = e.target.src; lb.hidden = false; }
  else if (e.target.closest('#lb')) lb.hidden = true;
});

// ================= loop =================
function resize() {
  const w = stage.clientWidth, h = stage.clientHeight;
  renderer.setSize(w, h, false); composer.setSize(w, h); bloom.setSize(w / 2, h / 2); camera.aspect = w / h; camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(stage);
let frame = 0, view = '3d';
function loop() {
  for (const c of held) act(c);
  if (!walk) {
    if (camGoal) {
      controls.target.lerp(camGoal.target, 0.12); camera.position.lerp(camGoal.pos, 0.12);
      if (camera.position.distanceTo(camGoal.pos) < 0.05) camGoal = null;
    }
    controls.update();
    const t = controls.target;   // keep the view on site and above ground
    const cl = new THREE.Vector3(THREE.MathUtils.clamp(t.x, -BOUNDS.x, BOUNDS.x), THREE.MathUtils.clamp(t.y, BOUNDS.y0, BOUNDS.y1), THREE.MathUtils.clamp(t.z, -BOUNDS.z, BOUNDS.z));
    if (!cl.equals(t)) { camera.position.add(cl.clone().sub(t)); t.copy(cl); }
    if (camera.position.y < 1.2) camera.position.y = 1.2;
  }
  lamp.intensity = state.mode === 'overview' ? 0 : 8;
  if (state.sel) lamp.position.copy(walk ? camera.position : state.sel._mid).setY(state.sel._floorY + 2.7);
  if (view === '3d') { composer.render(); if (++frame % 3 === 0) drawMinimap(); }
  requestAnimationFrame(loop);
}
resize(); paint(); loop();
const deep = UNITS.find(u => u.id.toLowerCase() === location.hash.slice(1).toLowerCase());
if (deep && deep._center) select(deep);
window.__v28 = { scene, camera, controls, UNITS, select, enterFlat, VIEWS, state, act,
  finish: () => { if (camGoal) { camera.position.copy(camGoal.pos); controls.target.copy(camGoal.target); camGoal = null; controls.update(); } } };
