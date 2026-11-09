// Victoria 28 · render explorer (v7). The main view is the architect's own render: each floor of
// each block is clickable on it, then a key plan of that floor (traced flat outlines from
// model.json) shows every flat green / red. Clicking a flat opens the flat panel (app.js select).
const UNITS = window.V28_UNITS;
const FLOOR_NAMES = ['Ground floor', 'First floor', 'Second floor'];
const eur = n => '€' + Math.round(n).toLocaleString('en-GB');
const type = u => u.beds === 0 ? 'Studio' : `${u.beds}-bedroom`;
const $ = id => document.getElementById(id);
const MODEL = await fetch('model.json?v=7').then(r => r.json());

// Floor bands on street-view.jpg (1600x899), traced by hand. Block B is on the left from the street.
const ZONES = [
  { block: 'B', floor: 2, p: [[55, 155], [380, 160], [440, 150], [446, 108], [585, 108], [592, 160], [645, 215], [645, 342], [55, 342]] },
  { block: 'B', floor: 1, p: [[55, 342], [645, 342], [645, 460], [55, 460]] },
  { block: 'B', floor: 0, p: [[55, 460], [645, 460], [645, 588], [55, 588]] },
  { block: 'A', floor: 2, p: [[832, 215], [842, 178], [895, 155], [899, 110], [1025, 110], [1030, 152], [1200, 162], [1292, 148], [1296, 114], [1435, 114], [1440, 158], [1550, 182], [1550, 340], [832, 340]] },
  { block: 'A', floor: 1, p: [[832, 340], [1550, 340], [1550, 460], [832, 460]] },
  { block: 'A', floor: 0, p: [[832, 460], [1550, 460], [1550, 592], [832, 592]] },
];
const SCENES = [
  { img: 'street-view', label: 'Front', zones: true },
  { img: 'street-view-2', label: 'Front at dusk' },
  { img: 'front-entrance', label: 'Entrance' },
  { img: 'pool-aerial', label: 'Pool from above' },
  { img: 'pool-loungers', label: 'Pool' },
  { img: 'courtyard-aerial', label: 'Roofs' },
];
const flatsOf = (b, f) => UNITS.filter(u => u.block === b && u.floor === f);
const avail = l => l.filter(u => u.status === 'available').length;

const root = $('rview');
root.innerHTML = `
  <div class="rimg"><svg id="rsvg" preserveAspectRatio="xMidYMid meet"></svg></div>
  <div class="rlabel" id="rlabel"></div>
  <div class="rhelp" id="rhelp">Click a floor on the building to see its flats</div>
  <div class="rscenes" id="rscenes">${SCENES.map((s, i) => `<button data-i="${i}" class="${i ? '' : 'on'}"><img src="img/${s.img}.jpg" alt=""><span>${s.label}</span></button>`).join('')}</div>
  <div class="sheet" id="sheet" hidden></div>`;
const svg = $('rsvg'), label = $('rlabel'), sheet = $('sheet');
const NS = 'http://www.w3.org/2000/svg';
const el = (t, a = {}, parent) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); if (parent) parent.appendChild(e); return e; };

function showScene(i) {
  const s = SCENES[i];
  root.querySelectorAll('.rscenes button').forEach(b => b.classList.toggle('on', +b.dataset.i === i));
  svg.innerHTML = '';
  const img = new Image(); img.src = `img/${s.img}.jpg`;
  img.onload = () => {
    svg.setAttribute('viewBox', `0 0 ${img.naturalWidth} ${img.naturalHeight}`);
    el('image', { href: img.src, width: img.naturalWidth, height: img.naturalHeight }, svg);
    if (s.zones) drawZones();
  };
  $('rhelp').textContent = s.zones ? 'Click a floor on the building to see its flats' : 'Pick “Front” to choose a floor, or use the list';
}
function drawZones() {
  for (const z of ZONES) {
    const l = flatsOf(z.block, z.floor), a = avail(l);
    const g = el('g', { class: 'zone' + (a ? '' : ' full') }, svg);
    el('polygon', { points: z.p.map(q => q.join(',')).join(' ') }, g);
    const xs = z.p.map(q => q[0]), ys = z.p.map(q => q[1]);
    const bx = Math.max(...xs) - 18, by = (Math.max(...ys) + Math.min(...ys)) / 2 + (z.floor === 2 ? 40 : 0);
    const badge = el('g', { class: 'badge', transform: `translate(${bx},${by})` }, g);
    el('rect', { x: -96, y: -17, width: 96, height: 34, rx: 17 }, badge);
    el('text', { x: -48, y: 6, 'text-anchor': 'middle' }, badge).textContent = a ? `${a} available` : 'Sold out';
    g.addEventListener('mouseenter', () => { label.innerHTML = `Block ${z.block} · ${FLOOR_NAMES[z.floor]} · <b>${a} of ${l.length}</b> available`; label.style.display = 'block'; });
    g.addEventListener('mouseleave', () => { label.style.display = 'none'; });
    g.addEventListener('click', () => { svg.querySelectorAll('.zone').forEach(x => x.classList.toggle('on', x === g)); openFloor(z.floor, z.block); });
  }
}
root.querySelector('.rscenes').addEventListener('click', e => { const b = e.target.closest('button'); if (b) showScene(+b.dataset.i); });

// ---------- floor key plan (street at the bottom, Block B left, as seen from the street)
const P = ([x, z]) => [z, -x];
function openFloor(f, block) {
  const d = MODEL[String(f)];
  const all = d.slab.flatMap(s => s.outer.map(P));
  const xs = all.map(q => q[0]), ys = all.map(q => q[1]);
  const x0 = Math.min(...xs) - 1, y0 = Math.min(...ys) - 1, w = Math.max(...xs) - x0 + 1, h = Math.max(...ys) - y0 + 4;
  const pts = poly => poly.map(P).map(q => q.map(v => v.toFixed(2)).join(',')).join(' ');
  let s = `<svg viewBox="${x0} ${y0} ${w} ${h}" class="kplan">`;
  for (const sl of d.slab) s += `<polygon class="slab" points="${pts(sl.outer)}"/>`;
  const labels = [];
  for (const [id, polys] of Object.entries(d.flats)) {
    const u = UNITS.find(x => x.id === id); if (!u) continue;
    const dim = block && u.block !== block ? ' dim' : '';
    for (const p of polys) s += `<polygon class="flat ${u.status}${dim}" data-id="${id}" points="${pts(p.outer)}"/>`;
    const big = polys.reduce((a, b) => (b.outer.length > a.outer.length ? b : a));
    const c = big.outer.map(P).reduce((a, q) => [a[0] + q[0] / big.outer.length, a[1] + q[1] / big.outer.length], [0, 0]);
    labels.push(`<text x="${c[0].toFixed(1)}" y="${(c[1] + 0.5).toFixed(1)}" class="fl${dim}">${u.no}</text>`);
  }
  s += labels.join('');
  const mid = x0 + w / 2;
  s += `<text x="${mid}" y="${y0 + h - 0.8}" class="street">STREET · ENTRANCE</text>`;
  s += `<text x="${x0 + w * 0.22}" y="${y0 + 1.6}" class="blk">BLOCK B</text><text x="${x0 + w * 0.78}" y="${y0 + 1.6}" class="blk">BLOCK A</text></svg>`;
  const l = UNITS.filter(u => u.floor === f && (!block || u.block === block));
  sheet.innerHTML = `
    <div class="sh-head"><div><small>${block ? 'Block ' + block + ' · ' : ''}${FLOOR_NAMES[f]}</small><b>${avail(l)} of ${l.length} available</b></div>
      <div class="seg sh-floors">${[0, 1, 2].map(i => `<button data-f="${i}" class="${i === f ? 'on' : ''}">${['G', '1st', '2nd'][i]}</button>`).join('')}</div>
      <button class="x" id="shx" aria-label="Close">×</button></div>
    ${s}
    <div class="sh-list">${l.sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true })).map(u => `<button data-id="${u.id}" class="${u.status}"><b>${u.id}</b><span>${type(u)} · ${u.total} m²</span><em>${u.status === 'available' ? eur(u.price) : 'Reserved'}</em></button>`).join('')}</div>
    <div class="legend"><span><i class="dot av"></i>Available</span><span><i class="dot rs"></i>Reserved</span></div>`;
  sheet.hidden = false; sheet.dataset.block = block || '';
}
const pickFlat = id => { const u = UNITS.find(x => x.id === id); if (u && window.__v28) window.__v28.select(u, { from: 'renders' }); markSel(id); };
const markSel = id => sheet.querySelectorAll('[data-id]').forEach(e => e.classList.toggle('sel', e.dataset.id === id));
sheet.addEventListener('click', e => {
  if (e.target.id === 'shx') { sheet.hidden = true; svg.querySelectorAll('.zone').forEach(x => x.classList.remove('on')); return; }
  const fb = e.target.closest('.sh-floors button'); if (fb) { openFloor(+fb.dataset.f, sheet.dataset.block || null); return; }
  const t = e.target.closest('[data-id]'); if (t) pickFlat(t.dataset.id);
});
sheet.addEventListener('mousemove', e => {
  const t = e.target.closest('polygon.flat');
  if (!t) { label.style.display = 'none'; return; }
  const u = UNITS.find(x => x.id === t.dataset.id);
  label.innerHTML = `Flat ${u.id} · ${type(u)} · ${u.status === 'available' ? `<b>${eur(u.price)}</b>` : 'Reserved'}`; label.style.display = 'block';
});
sheet.addEventListener('mouseleave', () => { label.style.display = 'none'; });

showScene(0);
window.__renders = { openFloor, showScene };
