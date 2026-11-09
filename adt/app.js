// ADT Empire — menu, hero film, and all scroll motion.
// Motion uses GSAP + ScrollTrigger + SplitText + Lenis (loaded in <head>). If they fail to load, or the
// visitor asks for reduced motion, the page stays fully readable and static.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const narrow = matchMedia('(max-width: 980px)');
  let lenis = null;

  // ---------- menu ----------
  const toggle = document.querySelector('.nav-toggle');
  const list = document.getElementById('nav-list');
  if (toggle && list) {
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', open);
      list.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
      if (lenis) open ? lenis.stop() : lenis.start();
    });
    list.addEventListener('click', e => { if (e.target.closest('a') && list.classList.contains('open')) toggle.click(); });
  }
  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

  // ---------- hero film ----------
  // Desktop computers get the live 3D logo (assets/hero3d.js); everyone else the video, played once.
  // With reduced motion the poster (the finished logo) stays as a still.
  const playFilm = () => {
    const film = document.querySelector(narrow.matches ? '.hv-square' : '.hv-wide');
    if (!film || reduce || film.src) return; // each file loads once
    film.muted = true; // required for autoplay on phones
    film.src = film.dataset.src;
    film.play().catch(() => {});
  };
  if (document.querySelector('.hero-video')) {
    (window.__adtHero3d || Promise.resolve(false)).then(live => {
      if (live) return document.querySelector('.hero').classList.add('is-live');
      playFilm();
      narrow.addEventListener('change', playFilm);
    });
  }

  const stepsFallback = () => {
    const steps = document.querySelector('.steps');
    if (steps) steps.style.setProperty('--fill', '100%'), steps.querySelectorAll('li').forEach(li => li.classList.add('lit'));
  };

  const { gsap, ScrollTrigger, SplitText, Lenis } = window;
  if (reduce || !gsap || !ScrollTrigger) { document.documentElement.classList.remove('motion-pending'); stepsFallback(); return; }
  // split text into lines only once the fonts are in (line breaks depend on them), at most 1.2 s wait
  Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise(r => setTimeout(r, 1200))]).then(motion);

  function motion() {
  document.documentElement.classList.remove('motion-pending');
  gsap.registerPlugin(ScrollTrigger);
  if (SplitText) gsap.registerPlugin(SplitText);

  // ---------- smooth, weighted scrolling ----------
  if (Lenis) {
    lenis = new Lenis({ lerp: 0.09, anchors: { offset: 0 } });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(time => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // ---------- titles rise in line by line ----------
  const split = (el, type) => (SplitText ? SplitText.create(el, { type, mask: type === 'lines' ? 'lines' : undefined, linesClass: 'ln', wordsClass: 'wd' }) : null);
  // autoSplit re-measures the lines if the width or fonts change, and rebuilds the animation
  const riseLines = (el, vars) => SplitText && SplitText.create(el, {
    type: 'lines', mask: 'lines', linesClass: 'ln', autoSplit: true,
    onSplit: self => gsap.from(self.lines, { yPercent: 105, ease: 'power4.out', ...vars }),
  });
  document.querySelectorAll('.hero h1, .page-hero h1').forEach(el => riseLines(el, { duration: 1.2, stagger: 0.09, delay: 0.15 }));
  gsap.from('.hero .eyebrow, .hero-lede, .hero-actions, .page-hero .eyebrow, .page-lede, .page-hero .link-back, .post-meta-dark', {
    y: 18, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.08, delay: 0.45,
  });
  document.querySelectorAll('.why-head h2, .band-title, .trust-head h2, .deeper h2, .cta h2, .post-more h2, .statement, .why-lead, .letter-big, .service h2, .svc h2, .yonder-includes h2, .yonder-fit h2, .chat-intro, .contact-name, .empty-title').forEach(el => {
    riseLines(el, { duration: 1.1, stagger: 0.08, scrollTrigger: { trigger: el, start: 'top 86%', once: true } });
  });

  // ---------- blocks fade up as they arrive ----------
  const ups = '.why-body p:not(.why-lead), .report, .how-side, .card, .cta p, .cta-actions, .cta-inner > img, .fact, .about-text > p:not(.statement), .about-text .btn, .letter p:not(.letter-big), .ticks li, .service p, .includes li, .fit-lede, .contact-list div, .map, .form, .note, .empty, .post-card, .post-figure, .consult-copy p, .next-link, .chat-outro';
  ScrollTrigger.batch(ups, {
    start: 'top 88%',
    once: true,
    onEnter: els => gsap.fromTo(els, { y: 34, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out', stagger: 0.09, overwrite: true }),
  });
  gsap.set(ups, { opacity: 0 });

  // the faint logo watermark behind some page titles: fade in to its own (low) opacity, never to full
  gsap.from('.page-hero-mark', { opacity: 0, y: 40, duration: 1.6, ease: 'power3.out', delay: 0.3 });

  // ---------- "zero conflict of interest": an emerald underline sweeps in ----------
  document.querySelectorAll('.why-body strong').forEach(el => {
    el.classList.add('sweep');
    gsap.fromTo(el, { backgroundSize: '0% 100%' }, { backgroundSize: '100% 100%', ease: 'none', scrollTrigger: { trigger: el, start: 'top 80%', end: 'top 50%', scrub: true } });
  });

  // ---------- testimonials light up word by word as you scroll ----------
  document.querySelectorAll('.quotes blockquote').forEach(q => {
    const s = split(q, 'words');
    if (s) gsap.fromTo(s.words, { opacity: 0.18 }, { opacity: 1, stagger: 0.04, ease: 'none', scrollTrigger: { trigger: q, start: 'top 82%', end: 'bottom 55%', scrub: true } });
  });

  // ---------- photos: slow parallax and a gentle zoom ----------
  document.querySelectorAll('.band').forEach(b => {
    const img = b.querySelector('img');
    gsap.fromTo(img, { yPercent: -12, scale: 1.18 }, { yPercent: 12, scale: 1.05, ease: 'none', scrollTrigger: { trigger: b, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  document.querySelectorAll('.card img, .post-card-img img').forEach(img => {
    gsap.fromTo(img, { scale: 1.16 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: img, start: 'top bottom', end: 'center 45%', scrub: true } });
  });
  gsap.to('.hero-inner', { yPercent: 18, opacity: 0.2, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  // ---------- numbers count up (Yonder) ----------
  document.querySelectorAll('.stats dd').forEach(dd => {
    const m = dd.textContent.trim().match(/^([+]?)(\d+)(.*)$/);
    if (!m) return;
    const [, pre, num, post] = m;
    const o = { v: 0 };
    gsap.to(o, { v: +num, duration: 1.8, ease: 'power2.out', scrollTrigger: { trigger: dd, start: 'top 88%', once: true },
      onUpdate: () => { dd.textContent = pre + Math.round(o.v) + post; } });
  });

  // ---------- About you: the 2 AM chat types itself in ----------
  const chat = document.querySelector('.chat');
  if (chat) {
    const bubbles = [...chat.querySelectorAll('.bubble')];
    const ands = [...chat.querySelectorAll('.chat-and')];
    const typing = document.createElement('p');
    typing.className = 'typing';
    typing.setAttribute('aria-hidden', 'true');
    typing.innerHTML = '<span></span><span></span><span></span>';
    gsap.set([...bubbles, ...ands], { opacity: 0, y: 12, scale: 0.96, transformOrigin: '100% 100%' });
    const tl = gsap.timeline({ scrollTrigger: { trigger: chat, start: 'top 72%', once: true } });
    bubbles.forEach((b, i) => {
      tl.call(() => b.before(typing))
        .fromTo(typing, { opacity: 0 }, { opacity: 1, duration: 0.2 })
        .to({}, { duration: i === 2 ? 1.1 : 0.8 }) // a longer pause before the World Cup question
        .to(typing, { opacity: 0, duration: 0.15 })
        .call(() => typing.remove())
        .to(b, { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'back.out(1.6)' });
      if (ands[i]) tl.to(ands[i], { opacity: 1, y: 0, scale: 1, duration: 0.4 }, '+=0.35');
    });
  }

  // ---------- the 8 steps: a pinned journey on desktop ----------
  const how = document.querySelector('.how');
  const steps = how && how.querySelector('.steps');
  if (steps) {
    const items = [...steps.children];
    steps.style.setProperty('--end', (items[items.length - 1].offsetHeight - 24) + 'px');
    const mm = gsap.matchMedia();
    mm.add('(min-width: 981px)', () => buildJourney(how, items));
    mm.add('(max-width: 980px)', () => {
      // phones: the line fills as you read; each step lights up when the line reaches it
      const st = ScrollTrigger.create({
        trigger: steps, start: 'top 60%', end: 'bottom 60%', scrub: true,
        onUpdate: self => {
          steps.style.setProperty('--fill', self.progress * 100 + '%');
          items.forEach((li, i) => li.classList.toggle('lit', self.progress >= i / (items.length - 1) - 0.001));
        },
      });
      return () => st.kill();
    });
  }

  function buildJourney(section, items) {
    const n = items.length;
    const W = 320, H = 760, X = 160, top = 30, gap = (H - top * 2) / (n - 1);
    const ys = items.map((_, i) => top + i * gap);
    // step 7 branches out like the logo: legal, construction, relocation, finance
    const b7 = ys[6];
    const branches = [
      { x: 66, y: b7 + 36, label: 'Legal', side: 'l' },
      { x: 92, y: b7 + 66, label: 'Construction', side: 'l' },
      { x: 254, y: b7 + 36, label: 'Relocation', side: 'r' },
      { x: 228, y: b7 + 66, label: 'Finance', side: 'r' },
    ];
    const wrap = document.createElement('div');
    wrap.className = 'journey';
    wrap.setAttribute('aria-hidden', 'true'); // the list stays for screen readers
    wrap.innerHTML = `
      <div class="j-copy">
        <p class="eyebrow">Your investment journey</p>
        <p class="j-count"><span class="j-num">1</span><span class="j-of">/ ${n}</span></p>
        <div class="j-texts">${items.map(li => `<p class="j-text">${li.querySelector('p').innerHTML}</p>`).join('')}</div>
        <a class="btn btn-emerald" href="/services/#consultation" tabindex="-1">Start with step 2</a>
      </div>
      <svg class="j-spine" viewBox="0 0 ${W} ${H}" fill="none">
        <path class="j-track" d="M${X} ${ys[0]}V${ys[n - 1]}"/>
        <path class="j-fill" d="M${X} ${ys[0]}V${ys[n - 1]}"/>
        ${branches.map(b => `<path class="j-branch" d="M${X} ${b7}L${b.x} ${b.y}"/>`).join('')}
        ${branches.map(b => `<text class="j-label" x="${b.side === 'l' ? b.x - 10 : b.x + 10}" y="${b.y + 4}" text-anchor="${b.side === 'l' ? 'end' : 'start'}">${b.label}</text>`).join('')}
        ${ys.map((y, i) => `<g class="j-node" data-i="${i}"><circle cx="${X}" cy="${y}" r="15"/><text x="${X}" y="${y + 5}" text-anchor="middle">${i + 1}</text></g>`).join('')}
      </svg>`;
    section.querySelector('.how-grid').after(wrap);
    section.classList.add('has-journey');

    const fill = wrap.querySelector('.j-fill');
    const len = ys[n - 1] - ys[0];
    gsap.set(fill, { strokeDasharray: len, strokeDashoffset: len });
    const texts = [...wrap.querySelectorAll('.j-text')];
    const nodes = [...wrap.querySelectorAll('.j-node')];
    const brs = [...wrap.querySelectorAll('.j-branch')];
    const labels = [...wrap.querySelectorAll('.j-label')];
    brs.forEach(b => { const l = b.getTotalLength(); gsap.set(b, { strokeDasharray: l, strokeDashoffset: l }); });
    gsap.set(labels, { opacity: 0 });
    gsap.set(texts, { opacity: 0, y: 30 });
    gsap.set(texts[0], { opacity: 1, y: 0 });
    const num = wrap.querySelector('.j-num');
    let cur = 0;
    const show = i => {
      if (i === cur) return;
      const dir = i > cur ? 1 : -1;
      gsap.to(texts[cur], { opacity: 0, y: -30 * dir, duration: 0.45, ease: 'power2.in', overwrite: true });
      gsap.fromTo(texts[i], { opacity: 0, y: 30 * dir }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', delay: 0.15, overwrite: true });
      gsap.fromTo(num, { yPercent: 40 * dir, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.6, ease: 'power3.out' });
      num.textContent = i + 1;
      cur = i;
    };
    const st = ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: () => '+=' + innerHeight * 0.55 * n,
      pin: true,
      scrub: 0.6,
      onUpdate: self => {
        const p = self.progress;
        gsap.set(fill, { strokeDashoffset: len * (1 - p) });
        const i = Math.min(n - 1, Math.floor(p * n * 0.999 + 0.0001));
        nodes.forEach((g, k) => g.classList.toggle('lit', k <= i));
        show(i);
        const bp = gsap.utils.clamp(0, 1, (p - 6 / n) * n * 1.4); // branches grow during step 7
        brs.forEach(b => gsap.set(b, { strokeDashoffset: b.getTotalLength() * (1 - bp) }));
        labels.forEach((l, k) => gsap.set(l, { opacity: gsap.utils.clamp(0, 1, bp * 2 - k * 0.25) }));
      },
    });
    return () => { st.kill(); wrap.remove(); section.classList.remove('has-journey'); };
  }

  // ---------- Services: cards stack, icons draw themselves, parameters fill up ----------
  const cards = gsap.utils.toArray('.svc');
  cards.forEach((card, i) => {
    const lines = card.querySelectorAll('.svc-icon path, .svc-icon circle:not(.dot)');
    lines.forEach(el => { const l = el.getTotalLength(); gsap.set(el, { strokeDasharray: l, strokeDashoffset: l }); });
    const tl = gsap.timeline({ scrollTrigger: { trigger: card, start: 'top 72%', once: true } });
    tl.to(lines, { strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut', stagger: 0.12 })
      .from(card.querySelectorAll('.svc-icon .dot'), { scale: 0, transformOrigin: '50% 50%', duration: 0.45, ease: 'back.out(3)' }, '-=0.35');
    card.querySelectorAll('.params span').forEach((c, k) => tl.call(() => c.classList.add('on'), null, 0.5 + k * 0.055));
    if (i < cards.length - 1) {
      // desktop only (cards stack there): the card underneath settles back (slightly smaller, a touch darker)
      // in the last stretch, while the next card is actually covering it. Phones get a plain list.
      gsap.matchMedia().add('(min-width: 761px)', () => {
        const stackTop = () => 96 + (i + 1) * 26;
        gsap.to(card, { scale: 0.96, filter: 'brightness(0.8)', ease: 'none',
          scrollTrigger: { trigger: cards[i + 1], start: () => 'top ' + (stackTop() + card.offsetHeight * 0.45) + 'px', end: () => 'top ' + stackTop() + 'px', scrub: true } });
      });
    }
  });

  // ---------- Yonder: a live data network in the hero ----------
  const net = document.querySelector('.net');
  if (net) {
    const ctx = net.getContext('2d');
    const host = net.parentElement;
    let w = 0, h = 0, dpr = Math.min(devicePixelRatio || 1, 2), visible = true;
    const mouse = { x: -9999, y: -9999 };
    let nodes = [];
    const resize = () => {
      w = host.clientWidth; h = host.clientHeight;
      net.width = w * dpr; net.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(110, (w * h) / 10500));
      let seed = 7;
      const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      nodes = Array.from({ length: count }, () => ({ x: rnd() * w, y: rnd() * h, vx: (rnd() - 0.5) * 0.35, vy: (rnd() - 0.5) * 0.35, r: 1 + rnd() * 1.8 }));
    };
    resize();
    addEventListener('resize', resize);
    host.addEventListener('pointermove', e => { const r = host.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
    host.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(host);
    const link = 150;
    const draw = () => {
      requestAnimationFrame(draw);
      if (!visible) return;
      ctx.clearRect(0, 0, w, h);
      for (const n of nodes) {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
        const dx = mouse.x - n.x, dy = mouse.y - n.y, d = Math.hypot(dx, dy);
        if (d < 180) { n.x += dx * 0.004; n.y += dy * 0.004; } // nodes lean toward the cursor
      }
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j], d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < link) { ctx.strokeStyle = `rgba(132,192,180,${0.32 * (1 - d / link)})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
        }
        const dm = Math.hypot(mouse.x - a.x, mouse.y - a.y);
        if (dm < 200) { ctx.strokeStyle = `rgba(0,179,138,${0.5 * (1 - dm / 200)})`; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke(); }
        ctx.fillStyle = dm < 200 ? '#5fe0bd' : 'rgba(132,192,180,.75)';
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill();
      }
    };
    draw();
  }

  // ---------- Yonder: cards follow the cursor with light and a slight tilt ----------
  document.querySelectorAll('.includes li').forEach(card => {
    if (!fine) return;
    const rx = gsap.quickTo(card, 'rotationX', { duration: 0.6, ease: 'power3.out' });
    const ry = gsap.quickTo(card, 'rotationY', { duration: 0.6, ease: 'power3.out' });
    gsap.set(card, { transformPerspective: 900 });
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      card.style.setProperty('--mx', x + 'px'); card.style.setProperty('--my', y + 'px');
      ry((x / r.width - 0.5) * 10); rx(-(y / r.height - 0.5) * 10);
    });
    card.addEventListener('pointerleave', () => { rx(0); ry(0); card.style.setProperty('--mx', '-400px'); });
  });

  // ---------- Yonder: the capabilities band runs, faster while you scroll ----------
  const track = document.querySelector('.mq-track');
  if (track) {
    const loop = gsap.to(track, { xPercent: -50, repeat: -1, duration: 30, ease: 'none' });
    ScrollTrigger.create({ trigger: track, start: 'top bottom', end: 'bottom top', onUpdate: self => {
      gsap.to(loop, { timeScale: 1 + Math.min(5, Math.abs(self.getVelocity()) / 300), duration: 0.25, overwrite: true });
      gsap.to(loop, { timeScale: 1, duration: 1, delay: 0.3 });
    } });
  }

  // ---------- Yonder: one message, five languages ----------
  const demo = document.querySelector('.lang-demo');
  if (demo) {
    const code = demo.querySelector('.lang-code'), line = demo.querySelector('.lang-line');
    const langs = [
      ['EN', 'Your business, just better', 'ltr'],
      ['ΕΛ', 'Η επιχείρησή σας, απλά καλύτερη', 'ltr'],
      ['HE', 'העסק שלך, פשוט טוב יותר', 'rtl'],
      ['RU', 'Ваш бизнес, просто лучше', 'ltr'],
      ['DE', 'Ihr Unternehmen, einfach besser', 'ltr'],
    ];
    let k = 0, timer = null;
    const next = () => {
      k = (k + 1) % langs.length;
      gsap.timeline()
        .to([code, line], { opacity: 0, y: -10, duration: 0.3, ease: 'power2.in' })
        .call(() => { code.textContent = langs[k][0]; line.textContent = langs[k][1]; line.dir = langs[k][2]; })
        .fromTo([code, line], { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', stagger: 0.05 });
    };
    ScrollTrigger.create({ trigger: demo, start: 'top 90%', end: 'bottom top',
      onToggle: self => { clearInterval(timer); if (self.isActive) timer = setInterval(next, 2400); } });
  }
  document.querySelectorAll('.stats div').forEach((d, i) => {
    gsap.to(d, { '--grow': 1, duration: 1.4, ease: 'power3.inOut', delay: i * 0.12, scrollTrigger: { trigger: d, start: 'top 88%', once: true } });
  });

  // ---------- buttons lean toward the cursor ----------
  if (fine) {
    document.querySelectorAll('.btn').forEach(btn => {
      const xTo = gsap.quickTo(btn, 'x', { duration: 0.5, ease: 'power3.out' });
      const yTo = gsap.quickTo(btn, 'y', { duration: 0.5, ease: 'power3.out' });
      btn.addEventListener('pointermove', e => {
        const r = btn.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.28);
        yTo((e.clientY - r.top - r.height / 2) * 0.35);
      });
      btn.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
  }

  ScrollTrigger.refresh();
  }
})();
