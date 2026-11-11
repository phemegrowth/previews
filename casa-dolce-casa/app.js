(() => {
  const d = document, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* header: shrink + hide on scroll down */
  const hd = d.querySelector('.hd'); let lastY = 0, hdQ = false;
  const onScroll = () => {
    hdQ = false;
    const y = scrollY;
    if (Math.abs(y - lastY) < 6 && y > 30) return; /* ignore trackpad jitter so the header doesn't flicker */
    hd.classList.toggle('is-scrolled', y > 30);
    hd.classList.toggle('is-hidden', y > 400 && y > lastY && !d.body.classList.contains('menu-open'));
    lastY = y;
  };
  addEventListener('scroll', () => { if (!hdQ) { hdQ = true; requestAnimationFrame(onScroll); } }, { passive: true }); onScroll();

  /* mobile menu */
  const burger = d.querySelector('.burger'), menu = d.getElementById('menu');
  const setMenu = open => {
    burger.setAttribute('aria-expanded', open); burger.setAttribute('aria-label', open ? 'Chiudi il menu' : 'Apri il menu');
    hd.classList.toggle('menu-on', open); d.body.classList.toggle('menu-open', open);
    if (open) { menu.hidden = false; requestAnimationFrame(() => menu.classList.add('is-open')); }
    else { menu.classList.remove('is-open'); setTimeout(() => { if (!menu.classList.contains('is-open')) menu.hidden = true; }, 700); }
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  /* reveals */
  const words = d.querySelectorAll('.display');
  if (reduce || !('IntersectionObserver' in window)) {
    d.querySelectorAll('.reveal,.clip').forEach(el => el.classList.add('in'));
    words.forEach(el => el.classList.add('words-in'));
  } else {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      if (el.classList.contains('display')) {
        el.querySelectorAll('.w>span').forEach((s, i) => s.style.transitionDelay = (i * 70) + 'ms');
        el.classList.add('words-in');
      } else el.classList.add('in');
      io.unobserve(el);
    }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    d.querySelectorAll('.reveal,.clip,.display').forEach(el => io.observe(el));
  }

  /* count-up */
  const cio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; cio.unobserve(e.target);
    const el = e.target, end = +el.dataset.count; if (reduce) return;
    const t0 = performance.now(), dur = 1600;
    const tick = t => { const p = Math.min(1, (t - t0) / dur); el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(tick); };
    el.textContent = '0'; requestAnimationFrame(tick);
  }), { threshold: .6 });
  d.querySelectorAll('[data-count]').forEach(el => cio.observe(el));

  /* parallax + process line */
  const par = [...d.querySelectorAll('[data-parallax]')], steps = d.querySelector('[data-steps]');
  /* runs only when the page scrolls or resizes, one frame at most; all reads first, then all writes (no layout thrash) */
  if (!reduce && (par.length || steps)) {
    let queued = false;
    const update = () => {
      queued = false;
      const vh = innerHeight;
      const pr = par.map(img => img.parentElement.getBoundingClientRect());
      const sr = steps && steps.getBoundingClientRect();
      par.forEach((img, i) => {
        const r = pr[i];
        if (r.bottom < -50 || r.top > vh + 50) return;
        const k = +img.dataset.parallax, p = (r.top + r.height / 2 - vh / 2) / vh;
        img.style.translate = `0 ${(-p * k * 100 - k * 50).toFixed(2)}%`;
      });
      if (sr) steps.style.setProperty('--p', Math.min(1, Math.max(0, (vh * .85 - sr.top) / (sr.height + vh * .3))).toFixed(3));
    };
    const ask = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
    addEventListener('scroll', ask, { passive: true }); addEventListener('resize', ask); ask();
  }

  /* magnetic buttons */
  if (!reduce && matchMedia('(hover:hover)').matches) {
    d.querySelectorAll('.mag').forEach(b => {
      b.addEventListener('mousemove', e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .18}px,${(e.clientY - r.top - r.height / 2) * .3}px)`; });
      b.addEventListener('mouseleave', () => b.style.transform = '');
    });
    /* cursor badge over project images */
    const imgs = d.querySelectorAll('.pcard__img,.prow__img,.lcard__img,.hcard__img');
    if (imgs.length) {
      const peek = d.createElement('div'); peek.className = 'peek'; peek.textContent = 'Scopri'; peek.setAttribute('aria-hidden', 'true'); d.body.appendChild(peek);
      addEventListener('mousemove', e => { peek.style.setProperty('--x', e.clientX + 'px'); peek.style.setProperty('--y', e.clientY + 'px'); }, { passive: true });
      imgs.forEach(el => { el.addEventListener('mouseenter', () => peek.classList.add('on')); el.addEventListener('mouseleave', () => peek.classList.remove('on')); });
    }
  }

  /* project status filter */
  const plist = d.querySelector('[data-plist]');
  if (plist) d.querySelectorAll('.chip').forEach(c => c.addEventListener('click', () => {
    d.querySelectorAll('.chip').forEach(x => x.setAttribute('aria-pressed', x === c));
    let n = 0; plist.querySelectorAll('.prow').forEach(r => { const on = c.dataset.f === 'all' || r.dataset.s === c.dataset.f; r.classList.toggle('out', !on); if (on) { n++; r.classList.add('in'); } });
    plist.querySelector('.empty').hidden = n > 0;
  }));

  /* listings search */
  const S = d.querySelector('[data-search]');
  if (S && window.LISTINGS) {
    const q = S.querySelector('[data-q]'), price = S.querySelector('[data-price]'), size = S.querySelector('[data-size]'),
      deal = S.querySelector('[data-deal]'), cat = S.querySelector('[data-cat]'), feat = S.querySelector('[data-feat]'), sort = S.querySelector('[data-sort]'),
      list = S.querySelector('[data-list]'), out = S.querySelector('[data-count-out]'), empty = S.querySelector('[data-empty]');
    const fmt = n => n.toLocaleString('de-CH').replace(/’/g, '.').replace(/'/g, '.');
    const by = Object.fromEntries(LISTINGS.map((l, i) => [l.slug, { ...l, i }]));
    const run = () => {
      S.querySelector('[data-price-out]').textContent = fmt(+price.value) + ' CHF';
      S.querySelector('[data-size-out]').textContent = size.value + ' m²';
      const text = q.value.trim().toLowerCase(); let n = 0;
      const cards = [...list.children];
      cards.forEach(c => {
        const l = by[c.dataset.slug];
        const ok = (!text || c.textContent.toLowerCase().includes(text)) && (l.deal === 'Affitto' || l.price <= +price.value) &&
          l.size >= +size.value && (!deal.value || l.deal === deal.value) && (!cat.value || l.cat === cat.value) && (!feat.value || l.feats.includes(feat.value));
        c.classList.toggle('out', !ok); if (ok) { n++; c.classList.add('in'); }
      });
      const key = { new: l => l.i, asc: l => l.price, desc: l => -l.price, size: l => -l.size }[sort.value];
      cards.sort((a, b) => key(by[a.dataset.slug]) - key(by[b.dataset.slug])).forEach(c => list.appendChild(c));
      out.textContent = n; empty.hidden = n > 0;
    };
    S.addEventListener('input', run); S.addEventListener('change', run);
    S.querySelector('[data-filters]').addEventListener('submit', e => { e.preventDefault(); run(); list.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); });
    S.querySelector('[data-reset]').addEventListener('click', () => { S.querySelector('[data-filters]').reset(); q.value = ''; run(); });
    const tg = S.querySelector('[data-toggle]'), fl = S.querySelector('[data-filters]');
    if (innerWidth < 860) { tg.setAttribute('aria-expanded', 'false'); fl.hidden = true; }
    tg.addEventListener('click', () => { const o = tg.getAttribute('aria-expanded') !== 'true'; tg.setAttribute('aria-expanded', o); fl.hidden = !o; });
    run();
  }
  d.querySelectorAll('.fav').forEach(b => b.addEventListener('click', () => b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true')));

  /* gallery lightbox */
  const lb = d.querySelector('[data-lb]');
  if (lb && window.GALLERY) {
    const img = lb.querySelector('[data-lb-img]'), cnt = lb.querySelector('[data-lb-c]'); let i = 0, opener;
    const show = k => { i = (k + GALLERY.length) % GALLERY.length; img.src = GALLERY[i]; cnt.textContent = `${i + 1} / ${GALLERY.length}`; d.querySelectorAll('.thumbs button').forEach((b, j) => b.classList.toggle('on', j === i)); };
    const open = k => { opener = d.activeElement; lb.hidden = false; show(k); lb.querySelector('[data-lb-x]').focus(); d.body.style.overflow = 'hidden'; };
    const close = () => { lb.hidden = true; d.body.style.overflow = ''; opener && opener.focus(); };
    d.querySelectorAll('[data-open]').forEach(b => b.addEventListener('click', () => open(+b.dataset.open)));
    lb.querySelector('[data-lb-x]').addEventListener('click', close);
    lb.querySelector('[data-lb-p]').addEventListener('click', () => show(i - 1));
    lb.querySelector('[data-lb-n]').addEventListener('click', () => show(i + 1));
    lb.addEventListener('click', e => { if (e.target === lb) close(); });
    addEventListener('keydown', e => { if (lb.hidden) return; if (e.key === 'Escape') close(); if (e.key === 'ArrowLeft') show(i - 1); if (e.key === 'ArrowRight') show(i + 1); });
  }

  /* form validation */
  d.querySelectorAll('.form').forEach(f => f.addEventListener('submit', e => {
    let ok = true;
    f.querySelectorAll('[required]').forEach(el => {
      const wrap = el.closest('.f') || el.closest('.chk'), msg = wrap && wrap.querySelector('.err');
      let m = '';
      if (el.type === 'checkbox' ? !el.checked : !el.value.trim()) m = el.type === 'checkbox' ? '' : 'Campo obbligatorio';
      else if (el.type === 'email' && !/^\S+@\S+\.\S+$/.test(el.value)) m = 'Inserisci un indirizzo email valido';
      else if (el.type === 'tel' && el.value.replace(/\D/g, '').length < 7) m = 'Inserisci un numero di telefono valido';
      const bad = el.type === 'checkbox' ? !el.checked : !!m;
      if (wrap) wrap.classList.toggle('bad', bad); if (msg) msg.textContent = m;
      if (bad && ok) { ok = false; el.focus(); }
    });
    if (!ok) e.preventDefault();
  }));

  /* ===== v2 scenes ===== */
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const done = () => d.documentElement.classList.add('loaded');
  if (reduce) done(); else { addEventListener('load', () => setTimeout(done, 650)); setTimeout(done, 2600); }

  /* hero video: lighter file on phones */
  const vid = d.querySelector('.vhero__vid');
  if (vid) {
    vid.src = innerWidth < 860 ? vid.dataset.srcSm : vid.dataset.src;
    if (reduce) { vid.removeAttribute('autoplay'); vid.pause(); } else vid.play().catch(() => {});
  }

  /* statement: split into words that light up while scrolling */
  const say = d.querySelector('[data-say]');
  let sws = [];
  if (say) { say.innerHTML = say.textContent.trim().split(/\s+/).map(w => `<span class="sw">${w}</span>`).join(' '); sws = [...say.querySelectorAll('.sw')]; }

  const vhero = d.querySelector('[data-vhero]'), hpin = d.querySelector('[data-hpin]'), track = d.querySelector('[data-track]'),
    grow = d.querySelector('[data-grow]'), bar = d.querySelector('.progress'), mq = d.querySelector('[data-marquee]'),
    scards = [...d.querySelectorAll('.scard')];
  const wide = () => innerWidth >= 860;
  if (hpin && track) {
    const size = () => { if (!wide()) { hpin.style.removeProperty('--hlen'); return; } const extra = track.scrollWidth - innerWidth; hpin.style.setProperty('--hlen', (1 + extra / innerHeight).toFixed(3)); };
    size(); addEventListener('resize', size); addEventListener('load', size);
  }
  let lastS = scrollY, vel = 0;
  const scene = () => {
    const vh = innerHeight, sy = scrollY, maxS = d.documentElement.scrollHeight - vh;
    bar && bar.style.setProperty('--p', (sy / maxS).toFixed(4));
    if (vhero) vhero.style.setProperty('--hp', clamp(sy / vh).toFixed(3));
    if (mq) { vel += ((sy - lastS) - vel) * .12; mq.style.setProperty('--skew', clamp(vel * -.15, -6, 6).toFixed(2)); }
    lastS = sy;
    if (sws.length) {
      const r = say.getBoundingClientRect(), p = clamp((vh * .82 - r.top) / (r.height + vh * .35));
      const n = Math.round(p * sws.length); sws.forEach((w, i) => w.classList.toggle('on', i < n));
    }
    if (hpin && track && wide()) {
      const r = hpin.getBoundingClientRect(), len = hpin.offsetHeight - vh, p = clamp(-r.top / len);
      const extra = track.scrollWidth - innerWidth;
      track.style.transform = `translate3d(${(-p * extra).toFixed(1)}px,0,0)`;
      hpin.style.setProperty('--hp2', p.toFixed(3));
      track.querySelectorAll('.hcard__img img').forEach((im, i) => im.style.setProperty('--px', ((p * 4 - i) * -14).toFixed(1) + 'px'));
    }
    if (grow && wide()) {
      const r = grow.getBoundingClientRect(), p = clamp(-r.top / (grow.offsetHeight - vh));
      grow.style.setProperty('--g', (1 - clamp(p * 1.6)).toFixed(3));
    }
    if (wide()) scards.forEach((c, i) => {
      const nx = scards[i + 1]; if (!nx) return;
      const t = clamp((c.getBoundingClientRect().bottom - nx.getBoundingClientRect().top) / c.offsetHeight);
      c.style.setProperty('--sc', (1 - t * .06).toFixed(3));
    });
    requestAnimationFrame(scene);
  };
  if (!reduce) requestAnimationFrame(scene);
  else if (say) sws.forEach(w => w.classList.add('on'));

  /* team cards tilt */
  if (!reduce && matchMedia('(hover:hover)').matches) d.querySelectorAll('.tcard').forEach(c => {
    c.addEventListener('mousemove', e => { const r = c.getBoundingClientRect(); c.style.setProperty('--ry', ((e.clientX - r.left) / r.width - .5) * 8 + 'deg'); c.style.setProperty('--rx', ((e.clientY - r.top) / r.height - .5) * -8 + 'deg'); });
    c.addEventListener('mouseleave', () => { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); });
  });
})();
